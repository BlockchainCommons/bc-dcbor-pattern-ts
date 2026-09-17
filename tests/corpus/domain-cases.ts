/**
 * JavaScript-only inputs: values the reference's types cannot express, and
 * the runtime shape of what the surface returns. Each case calls the current
 * surface with one such value; the recipe kind `domain` names a key of this
 * table. Outcomes are recorded in the golden vectors only (the frozen surface
 * cannot run them) and classified `js-only` by the reference harness.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CurrentDeps } from "../vectors/recipes";

const deep = (n: number): string => "[".repeat(n) + "]".repeat(n);
const nested = (deps: CurrentDeps, n: number): unknown => {
  let h: unknown = 1;
  for (let i = 0; i < n; i++) h = [h];
  return deps.decodeCbor(deps.encodeCbor(h));
};

export const DOMAIN_CASES: Record<string, (m: any, deps: CurrentDeps) => unknown> = {
  // arguments of the wrong type
  "src-undefined": (m) => m.parsePattern(undefined),
  "src-null": (m) => m.parsePattern(null),
  "src-number": (m) => m.parsePattern(123),
  "try-src-undefined": (m) => m.tryParsePattern(undefined),
  "partial-src-undefined": (m) => m.parsePatternPartial(undefined),
  "try-partial-src-number": (m) => m.tryParsePatternPartial(1),
  "haystack-undefined": (m) => m.paths(m.parsePattern("number"), undefined),
  "haystack-null": (m) => m.paths(m.parsePattern("number"), null),
  "haystack-plain-object": (m) => m.paths(m.parsePattern("number"), {}),
  "haystack-string": (m) => m.paths(m.parsePattern("number"), "text"),
  "matches-haystack-number": (m) => m.matches(m.parsePattern("number"), 1),
  "captures-haystack-array": (m) => m.pathsWithCaptures(m.parsePattern("@a(*)"), [1]),
  "pattern-undefined": (m, deps) => m.paths(undefined, deps.decodeCbor(deps.encodeCbor(1))),
  "pattern-plain-object": (m, deps) => m.paths({}, deps.decodeCbor(deps.encodeCbor(1))),
  "display-undefined": (m) => m.display(undefined),
  // constructor arguments
  "interval-min-above-max": (m) => new m.Interval(3, 1).toString(),
  "interval-negative": (m) => new m.Interval(-1).toString(),
  "interval-fraction": (m) => new m.Interval(1.5).toString(),
  "interval-string": (m) => new m.Interval("1").toString(),
  "quantifier-min-above-max": (m) => m.Quantifier.from(2, 1).toString(),
  "quantifier-between-negative": (m) => m.Quantifier.between(-1, 2).toString(),
  "capture-name-space": (m) => m.display(m.capture("a b", m.any())),
  "capture-name-empty": (m) => m.display(m.capture("", m.any())),
  "capture-name-digit-first": (m) => m.display(m.capture("1a", m.any())),
  "tagged-name-space": (m) => m.display(m.taggedName("a b", m.any())),
  "tagged-name-empty": (m) => m.display(m.taggedName("", m.any())),
  "and-empty": (m) => m.display(m.and()),
  "or-empty": (m) => m.display(m.or()),
  "sequence-empty": (m) => m.display(m.sequence()),
  "number-nan": (m) => m.display(m.number(Number.NaN)),
  "number-negative-zero": (m) => m.display(m.number(-0)),
  "number-1e21": (m) => m.display(m.number(1e21)),
  "number-string": (m) => m.display(m.number("1")),
  "number-range-min-above-max": (m) => m.display(m.numberRange(3, 1)),
  "text-regex-global-flag": (m, deps) => {
    const p = m.textRegex(/x/g);
    const h = deps.decodeCbor(deps.encodeCbor("x"));
    return [m.matches(p, h), m.matches(p, h), m.matches(p, h)];
  },
  "text-regex-sticky-flag": (m) => m.display(m.textRegex(/x/y)),
  "text-regex-i-flag-display": (m) => m.display(m.textRegex(/X/i)),
  "text-regex-empty-display": (m) => m.display(m.textRegex(new RegExp(""))),
  "text-regex-string": (m) => m.display(m.textRegex("x")),
  "byte-regex-i-flag-display": (m) => m.display(m.byteStringRegex(/\xff/i)),
  "date-iso-invalid": (m) => m.display(m.dateIso8601("nope")),
  "digest-prefix-33-bytes": (m) => m.display(m.digestPrefix(new Uint8Array(33))),
  "digest-prefix-string": (m) => m.display(m.digestPrefix("00")),
  "text-newline-round-trip": (m) => {
    const d = m.display(m.text("a\nb"));
    return [d, m.display(m.parsePattern(d))];
  },
  // mutability and identity
  "mutate-parsed-pattern": (m) => {
    const p = m.parsePattern("1");
    try {
      p.pattern.pattern.value = 2;
    } catch (e) {
      return `throw:${(e as Error).name}`;
    }
    return m.display(p);
  },
  "frozen-parsed-pattern": (m) => {
    const p = m.parsePattern("[@a(1)]");
    return [Object.isFrozen(p), Object.isFrozen(p.pattern), Object.isFrozen(p.pattern.pattern)];
  },
  "frozen-constructed-pattern": (m) => Object.isFrozen(m.and(m.number(1), m.text("x"))),
  "frozen-error-details": (m) => {
    try {
      m.parsePattern("(1");
    } catch (e) {
      const d = (e as { details: { span: object } }).details;
      return [Object.isFrozen(d), Object.isFrozen(d.span)];
    }
    return "no throw";
  },
  "frozen-match-result": (m, deps) => {
    const r = m.pathsWithCaptures(m.parsePattern("@a(1)"), deps.decodeCbor(deps.encodeCbor(1)));
    return [Object.isFrozen(r), Object.isFrozen(r.paths)];
  },
  "frozen-partial-result": (m) => Object.isFrozen(m.parsePatternPartial("1 2")),
  "frozen-code-tables": (m) => [
    Object.isFrozen(m.DcborPatternErrorCode),
    Object.isFrozen(m.Reluctance),
  ],
  "path-shares-haystack": (m, deps) => {
    const h = deps.decodeCbor(deps.encodeCbor(1));
    return m.paths(m.parsePattern("1"), h)[0][0] === h;
  },
  // nesting depth
  "nest-400-balanced": (m) => m.display(m.parsePattern(deep(400))).length,
  "nest-501-balanced": (m) => m.display(m.parsePattern(deep(501))).length,
  "nest-1000-balanced": (m) => m.display(m.parsePattern(deep(1000))).length,
  "try-nest-501-balanced": (m) => {
    const r = m.tryParsePattern(deep(501));
    return r.ok ? "ok" : `${r.error.code}`;
  },
  "max-depth-option-two": (m) => m.display(m.parsePattern("[[1]]", { maxDepth: 2 })),
  "max-depth-option-exceeded": (m) => m.display(m.parsePattern("[[[1]]]", { maxDepth: 2 })),
  "max-depth-option-zero": (m) => m.display(m.parsePattern("1", { maxDepth: 0 })),
  "search-over-1000-nested-arrays": (m, deps) =>
    m.paths(m.parsePattern("search(1)"), nested(deps, 1000)).length,
  // error shape
  "error-message-close-paren": (m) => {
    try {
      m.parsePattern("(1");
    } catch (e) {
      return (e as Error).message;
    }
    return "no throw";
  },
  "error-full-message": (m) => {
    try {
      m.parsePattern("(1");
    } catch (e) {
      const err = e as { fullMessage?: (s: string) => string };
      return typeof err.fullMessage === "function" ? err.fullMessage("(1") : "no fullMessage";
    }
    return "no throw";
  },
  "error-unexpected-token-details": (m) => {
    try {
      m.parsePattern("& 1");
    } catch (e) {
      const x = e as { code: string; details: Record<string, unknown> };
      return [x.code, Object.keys(x.details).sort(), x.details["kind"] ?? x.details["token"]];
    }
    return "no throw";
  },
  "error-own-keys": (m) => {
    try {
      m.parsePattern("");
    } catch (e) {
      return Object.keys(e as object).sort();
    }
    return "no throw";
  },
  "error-is-code": (m) => {
    try {
      m.parsePattern("");
    } catch (e) {
      const x = e as { is?: (c: string) => boolean; code: string };
      return typeof x.is === "function" ? x.is(x.code) : "no is";
    }
    return "no throw";
  },
  "error-from-another-copy": (m) => {
    const e = Object.assign(new Error("m"), { code: "EmptyInput" });
    e.name = "DcborPatternError";
    return m.DcborPatternError.isDcborPatternError(e);
  },
  "error-codes": (m) => Object.keys(m.DcborPatternErrorCode).sort(),
  "interval-accessors": (m) => {
    const i = m.Interval.from(1, 3);
    return [typeof i.min, typeof i.max, typeof i.isUnbounded];
  },
  "quantifier-accessors": (m) => {
    const q = m.Quantifier.exactly(1);
    return [typeof q.min, typeof q.max, typeof q.interval, typeof q.reluctance];
  },
  "pattern-equals": (m) => {
    if (typeof m.patternEquals !== "function") return "no patternEquals";
    return [
      m.patternEquals(m.parsePattern("[@a(1) | 2]"), m.parsePattern("[@a(1) | 2]")),
      m.patternEquals(m.parsePattern("/a/"), m.parsePattern("/b/")),
    ];
  },
};
