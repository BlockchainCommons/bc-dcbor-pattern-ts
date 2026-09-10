/**
 * Vector recipes: pattern text to parse and display, the prefix of a longer
 * text, a pattern matched against a CBOR haystack (given as hex), a match
 * formatted, or a JavaScript-only call from the domain table. `materialize`
 * runs a recipe through a `VectorApi` and returns one outcome string, so the
 * same recipe drives the golden file, the differential and the reference harness.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DOMAIN_CASES } from "../corpus/domain-cases";

export interface FormatOpts {
  indent?: boolean;
  flat?: boolean;
  maxLength?: number;
  lastElementOnly?: boolean;
}
export type Recipe =
  | { k: "parse"; src: string }
  | { k: "prefix"; src: string }
  | { k: "match"; pattern: string; hex: string }
  | { k: "format"; pattern: string; hex: string; opts?: FormatOpts }
  | { k: "domain"; s: string };
export type Outcome = string;

/** A match: paths as arrays of encoded elements, captures by name. */
export interface Match {
  paths: Uint8Array[][];
  captures: [string, Uint8Array[][]][];
}

export interface VectorApi {
  /** Parses and returns the canonical display, or throws. */
  display(src: string): string;
  /** Parses the prefix and returns `display@length`, or throws. */
  prefix(src: string): string;
  match(pattern: string, haystack: Uint8Array): Match;
  format(pattern: string, haystack: Uint8Array, opts: FormatOpts): string;
  /** Runs a domain case against the surface. */
  domain(name: string): unknown;
  /** `Variant`, `Variant(TokenType)`, with `@start-end` when the error has a span. */
  errorCode(e: unknown): string | undefined;
}

export const hex = (u: Uint8Array): string => Buffer.from(u).toString("hex");
export const unhex = (h: string): Uint8Array => Uint8Array.from(Buffer.from(h, "hex"));

export function recipeName(r: Recipe): string {
  if (r.k === "parse") return `parse ${JSON.stringify(r.src).slice(0, 60)}`;
  if (r.k === "prefix") return `prefix ${JSON.stringify(r.src).slice(0, 60)}`;
  if (r.k === "domain") return `domain ${r.s}`;
  const opts = r.k === "format" && r.opts !== undefined ? ` ${JSON.stringify(r.opts)}` : "";
  return `${r.k} ${JSON.stringify(r.pattern).slice(0, 40)} on ${r.hex.slice(0, 24)}${opts}`;
}

const renderPaths = (paths: Uint8Array[][]): string =>
  paths.map((p) => p.map(hex).join(",")).join("|");

const renderMatch = (m: Match): string => {
  const caps = [...m.captures]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, paths]) => `${name}=[${renderPaths(paths)}]`)
    .join(";");
  return `paths=[${renderPaths(m.paths)}]${caps === "" ? "" : ` captures{${caps}}`}`;
};

/** The outcome of a domain case: a plain value as JSON, a string as itself. */
const valueOutcome = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v === undefined) return "undefined";
  return JSON.stringify(v, (_k, x: unknown) => (typeof x === "bigint" ? `${x}n` : x));
};

export function materialize(api: VectorApi, r: Recipe): Outcome {
  try {
    switch (r.k) {
      case "parse":
        return api.display(r.src);
      case "prefix":
        return api.prefix(r.src);
      case "match":
        return renderMatch(api.match(r.pattern, unhex(r.hex)));
      case "format":
        return api.format(r.pattern, unhex(r.hex), r.opts ?? {});
      case "domain":
        return valueOutcome(api.domain(r.s));
    }
  } catch (e) {
    const code = api.errorCode(e);
    if (code !== undefined) return `throw:${code}`;
    // A foreign error is recorded by its class only: engines word their messages differently.
    return `throw:${e instanceof Error ? e.name : String(e)}`;
  }
}

const describeError = (err: any): string => {
  if (err === undefined || err === null || typeof err !== "object") return String(err);
  const type: string = err.type ?? err.code ?? "?";
  const token = err.token?.type ?? err.kind;
  const tokenPart = token !== undefined ? `(${token})` : "";
  const span = err.span ?? err.details?.span;
  return `${type}${tokenPart}${span !== undefined ? `@${span.start}-${span.end}` : ""}`;
};

export interface CurrentDeps {
  registerTags: () => void;
  decodeCbor: (bytes: Uint8Array) => unknown;
  encodeCbor: (value: unknown) => Uint8Array;
}

/** The frozen bundle, over its own inlined dcbor. */
export function frozenAdapterFor(m: any): VectorApi {
  return adapterFor(m, {
    registerTags: () => m.baselineRegisterTags(),
    decodeCbor: (bytes) => m.baselineDecodeCbor(bytes),
    encodeCbor: (value) => m.baselineEncodeCbor(value),
  });
}

/**
 * A surface with throwing `parsePattern`, `display`, `pathsWithCaptures`,
 * `formatPaths(paths, { captures, ...opts })`, plus the domain table, over
 * the given dcbor.
 */
export function adapterFor(m: any, deps: CurrentDeps): VectorApi {
  deps.registerTags();
  const encode = (paths: any[][]): Uint8Array[][] =>
    paths.map((p) => p.map((c) => deps.encodeCbor(c)));
  const renderValue = (v: unknown): unknown => {
    if (v !== null && typeof v === "object" && "paths" in v && "captures" in v) {
      const r = v as { paths: any[][]; captures: Map<string, any[][]> };
      return renderMatch({
        paths: encode(r.paths),
        captures: [...r.captures].map(([n, p]) => [n, encode(p)]),
      });
    }
    if (Array.isArray(v) && v.every((x) => Array.isArray(x))) {
      return `paths=[${renderPaths(encode(v as any[][]))}]`;
    }
    return v;
  };
  return {
    display: (src) => m.display(m.parsePattern(src)),
    prefix: (src) => {
      const r = m.parsePatternPrefix(src);
      return `${m.display(r.pattern)}@${r.length}`;
    },
    match: (pattern, haystack) => {
      const r = m.pathsWithCaptures(m.parsePattern(pattern), deps.decodeCbor(haystack));
      return {
        paths: encode(r.paths),
        captures: [...r.captures].map(([n, p]: [string, any[][]]) => [n, encode(p)]),
      };
    },
    format: (pattern, haystack, o) => {
      const r = m.pathsWithCaptures(m.parsePattern(pattern), deps.decodeCbor(haystack));
      return m.formatPaths(r.paths, {
        captures: r.captures,
        indent: o.indent,
        elementFormat: o.flat === true ? "flat" : undefined,
        maxLength: o.maxLength,
        lastElementOnly: o.lastElementOnly,
      });
    },
    domain(name) {
      const c = DOMAIN_CASES[name];
      if (c === undefined) throw new Error(`unknown domain case ${name}`);
      return renderValue(c(m, deps));
    },
    errorCode: (e) => {
      const x: any = e;
      if (x?.name !== "DcborPatternError") return undefined;
      return describeError({
        type: x.code,
        token: x.details?.token,
        kind: x.details?.kind,
        span: x.details?.span,
      });
    },
  };
}
