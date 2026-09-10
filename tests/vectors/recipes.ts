/**
 * Vector recipes (Phase 1.1): pattern text to parse and display, a pattern
 * matched against a CBOR haystack (given as hex), or a match formatted.
 * `materialize` runs a recipe through a `VectorApi` and returns one outcome
 * string, so the same recipe drives the golden file, the differential and
 * the Rust harness.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ALL_TAGS } from "@blockchaincommons/tags";
import {
  TAG_DATE,
  TAG_NAME_DATE,
  TAG_POSITIVE_BIGNUM,
  TAG_NAME_POSITIVE_BIGNUM,
  TAG_NEGATIVE_BIGNUM,
  TAG_NAME_NEGATIVE_BIGNUM,
} from "@blockchaincommons/dcbor";

export interface FormatOpts {
  indent?: boolean;
  flat?: boolean;
  maxLength?: number;
  lastElementOnly?: boolean;
}
export type Recipe =
  | { k: "parse"; src: string }
  | { k: "match"; pattern: string; hex: string }
  | { k: "format"; pattern: string; hex: string; opts?: FormatOpts };
export type Outcome = string;

/** A match: paths as arrays of encoded elements, captures by name. */
export interface Match {
  paths: Uint8Array[][];
  captures: [string, Uint8Array[][]][];
}

export interface VectorApi {
  /** Parses and returns the canonical display, or throws. */
  display(src: string): string;
  match(pattern: string, haystack: Uint8Array): Match;
  format(pattern: string, haystack: Uint8Array, opts: FormatOpts): string;
  /** `Variant`, `Variant(TokenType)`, with `@start-end` when the error has a span. */
  errorCode(e: unknown): string | undefined;
}

export const hex = (u: Uint8Array): string => Buffer.from(u).toString("hex");
export const unhex = (h: string): Uint8Array => Uint8Array.from(Buffer.from(h, "hex"));

export function recipeName(r: Recipe): string {
  if (r.k === "parse") return `parse ${JSON.stringify(r.src).slice(0, 60)}`;
  const opts = r.k === "format" && r.opts !== undefined ? ` ${JSON.stringify(r.opts)}` : "";
  return `${r.k} ${JSON.stringify(r.pattern).slice(0, 40)} on ${r.hex.slice(0, 24)}${opts}`;
}

const renderPaths = (paths: Uint8Array[][]): string =>
  paths.map((p) => p.map(hex).join(",")).join("|");

export function materialize(api: VectorApi, r: Recipe): Outcome {
  try {
    switch (r.k) {
      case "parse":
        return api.display(r.src);
      case "match": {
        const m = api.match(r.pattern, unhex(r.hex));
        const caps = [...m.captures]
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([name, paths]) => `${name}=[${renderPaths(paths)}]`)
          .join(";");
        return `paths=[${renderPaths(m.paths)}]${caps === "" ? "" : ` captures{${caps}}`}`;
      }
      case "format":
        return api.format(r.pattern, unhex(r.hex), r.opts ?? {});
    }
  } catch (e) {
    return `throw:${api.errorCode(e) ?? (e as Error).message}`;
  }
}

/** The tag names both worlds register: dcbor's standard tags and every BC tag. */
export const TAG_NAMES: readonly { value: number | bigint; name: string }[] = [
  { value: TAG_DATE, name: TAG_NAME_DATE },
  { value: TAG_POSITIVE_BIGNUM, name: TAG_NAME_POSITIVE_BIGNUM },
  { value: TAG_NEGATIVE_BIGNUM, name: TAG_NAME_NEGATIVE_BIGNUM },
  ...ALL_TAGS.flatMap((t) => (t.name === undefined ? [] : [{ value: t.value, name: t.name }])),
];

const describeError = (err: any): string => {
  if (err === undefined || err === null || typeof err !== "object") return String(err);
  const type: string = err.type ?? err.code ?? "?";
  const token = err.token?.type !== undefined ? `(${err.token.type})` : "";
  const span = err.span ?? err.details?.span;
  return `${type}${token}${span !== undefined ? `@${span.start}-${span.end}` : ""}`;
};

class ResultError extends Error {
  constructor(readonly inner: unknown) {
    super("result error");
  }
}

/** Pre-redesign surface: `Result` objects, builder-style format options, `dcbor-compat` values. */
export function baselineAdapterFor(m: any): VectorApi {
  m.baselineRegisterTags(TAG_NAMES);
  const parse = (src: string): any => {
    const r = m.parse(src);
    if (!r.ok) throw new ResultError(r.error);
    return r.value;
  };
  const opts = (o: FormatOpts): any => {
    let b = m.FormatPathsOptsBuilder.new();
    if (o.indent !== undefined) b = b.indent(o.indent);
    if (o.flat === true) b = b.elementFormat(m.PathElementFormat.DiagnosticFlat);
    if (o.maxLength !== undefined) b = b.maxLength(o.maxLength);
    if (o.lastElementOnly !== undefined) b = b.lastElementOnly(o.lastElementOnly);
    return b.build();
  };
  const encode = (paths: any[][]): Uint8Array[][] =>
    paths.map((p) => p.map((c) => m.baselineEncodeCbor(c)));
  return {
    display: (src) => m.patternDisplay(parse(src)),
    match: (pattern, haystack) => {
      const r = m.patternPathsWithCaptures(parse(pattern), m.baselineDecodeCbor(haystack));
      return {
        paths: encode(r.paths),
        captures: [...r.captures].map(([n, p]: [string, any[][]]) => [n, encode(p)]),
      };
    },
    format: (pattern, haystack, o) => {
      const r = m.patternPathsWithCaptures(parse(pattern), m.baselineDecodeCbor(haystack));
      return m.formatPathsWithCaptures(r.paths, r.captures, opts(o));
    },
    errorCode: (e) => (e instanceof ResultError ? describeError(e.inner) : undefined),
  };
}

export interface CurrentDeps {
  registerTags: () => void;
  decodeCbor: (bytes: Uint8Array) => unknown;
  encodeCbor: (value: unknown) => Uint8Array;
}

/**
 * Redesigned surface (Phase 3): throwing `parsePattern`, `display`,
 * `pathsWithCaptures`, `formatPaths(paths, { captures, ...opts })`. Until it
 * lands, the working tree speaks the baseline surface over canonical dcbor.
 */
export function redesignedAdapterFor(m: any, deps: CurrentDeps): VectorApi {
  deps.registerTags();
  const encode = (paths: any[][]): Uint8Array[][] =>
    paths.map((p) => p.map((c) => deps.encodeCbor(c)));
  if (typeof m.parsePattern !== "function") {
    const b = baselineAdapterFor({
      ...m,
      baselineRegisterTags: () => undefined,
      baselineDecodeCbor: deps.decodeCbor,
      baselineEncodeCbor: deps.encodeCbor,
    });
    return b;
  }
  return {
    display: (src) => m.display(m.parsePattern(src)),
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
    errorCode: (e) => {
      const x: any = e;
      if (x?.name !== "DcborPatternError") return undefined;
      return describeError({ type: x.code, token: x.details?.token, span: x.details?.span });
    },
  };
}
