/**
 * Argument-domain and edge snapshot: the outcome of every input where the
 * port is known to differ from the reference (search duplicates, captures
 * inside quantified array elements, group paths, trailing whitespace and
 * prefix lengths, large integers, regex dialects, quoted dates, number
 * display, capture depth, duplicate captures, `+1`, nesting depth), every
 * input only JavaScript can express (wrong argument types, mutation), and
 * the runtime shape of the exported tables, errors and results. Reviewable;
 * a change here is a deliberate behaviour or API change.
 */
import { describe, it, expect, vi } from "vitest";
import {
  encodeCbor,
  getGlobalTagsStore,
  cbor as makeCbor,
  type Cbor,
} from "@blockchaincommons/dcbor";
import { parseDcbor } from "@blockchaincommons/dcbor-parse";
import * as P from "../src";
import * as F from "../src/format";
import * as I from "../src/patterns";

const hex = (u: Uint8Array): string => Buffer.from(u).toString("hex");
const H = (diagnostic: string): Cbor => parseDcbor(diagnostic, { tags: getGlobalTagsStore() });

const renderPaths = (paths: readonly (readonly Cbor[])[]): string =>
  paths.map((p) => p.map((c) => hex(encodeCbor(c))).join(",")).join("|");

/** `display`, `paths=[…] captures{…}`, `throw Name(code)@span: message`, or the JSON of a plain value. */
export const outcome = (f: () => unknown): string => {
  try {
    const v = f();
    if (v !== null && typeof v === "object" && "paths" in v && "captures" in v) {
      const m = v as { paths: Cbor[][]; captures: Map<string, Cbor[][]> };
      const caps = [...m.captures]
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([name, paths]) => `${name}=[${renderPaths(paths)}]`)
        .join(";");
      return `paths=[${renderPaths(m.paths)}]${caps === "" ? "" : ` captures{${caps}}`}`;
    }
    if (Array.isArray(v) && v.every((x) => Array.isArray(x))) {
      return `paths=[${renderPaths(v as Cbor[][])}]`;
    }
    return JSON.stringify(v) ?? String(v);
  } catch (e) {
    if (e instanceof RangeError) return "throw RangeError";
    if (e instanceof Error) {
      const { code, details } = e as {
        code?: unknown;
        details?: { span?: { start: number; end: number } };
      };
      const span = details?.span;
      return `throw ${e.name}${typeof code === "string" ? `(${code})` : ""}${span ? `@${span.start}-${span.end}` : ""}: ${e.message.slice(0, 80)}`;
    }
    return `throw ${String(e)}`;
  }
};

type AnyFn = (...args: unknown[]) => unknown;
const parse = P.parsePattern as unknown as AnyFn;
const tryParse = P.tryParsePattern as unknown as AnyFn;
const pathsOf = P.paths as unknown as AnyFn;

const match = (pattern: string, haystack: string) => () =>
  P.pathsWithCaptures(P.parsePattern(pattern), H(haystack));
const matches = (pattern: string, haystack: string) => () =>
  P.matches(P.parsePattern(pattern), H(haystack));
const plain = (pattern: string, haystack: string) => () =>
  P.paths(P.parsePattern(pattern), H(haystack));
const display = (src: string) => () => P.display(P.parsePattern(src));
const prefix = (src: string) => () => {
  const r = P.parsePatternPrefix(src);
  return `${P.display(r.pattern)}@${r.length}`;
};
const formatted = (pattern: string, haystack: string) => () => {
  const r = P.pathsWithCaptures(P.parsePattern(pattern), H(haystack));
  return F.formatPaths(r.paths, { captures: r.captures });
};

const rows: Record<string, () => unknown> = {
  // search duplicates
  "search(1) on [1, 1, 1]": match("search(1)", "[1, 1, 1]"),
  "search(1) on {1: 1}": match("search(1)", "{1: 1}"),
  "search(*) on [1, 2, 1, 2]": match("search(*)", "[1, 2, 1, 2]"),
  "search([*]) on [[1], [1]]": match("search([*])", "[[1], [1]]"),
  'search(text) on {"k": "v", "x": "v"}': match("search(text)", '{"k": "v", "x": "v"}'),
  "search(!1) on [1, 1, 1]": match("search(!1)", "[1, 1, 1]"),
  "@a(search(1)) on [1, 1, 1]": match("@a(search(1))", "[1, 1, 1]"),
  "search(@x(search(1))) on [1, 1, 1]": match("search(@x(search(1)))", "[1, 1, 1]"),
  "formatPaths(search(*)) on [1, 2, 1, 2]": formatted("search(*)", "[1, 2, 1, 2]"),
  // captures inside quantified array elements
  "[(@a(1))*] on [2]: matches": matches("[(@a(1))*]", "[2]"),
  "[(@a(1))*] on [2]": match("[(@a(1))*]", "[2]"),
  "[(@a(1))*] on [1, 2]": match("[(@a(1))*]", "[1, 2]"),
  "[(@a(1))*] on [1, 2, 3]": match("[(@a(1))*]", "[1, 2, 3]"),
  "[(@a(1 | 2))*] on [1, 2, 3]": match("[(@a(1 | 2))*]", "[1, 2, 3]"),
  '[(@a(number))*] on ["x"]': match("[(@a(number))*]", '["x"]'),
  "[(@a(1))*, (@b(2))*] on []": match("[(@a(1))*, (@b(2))*]", "[]"),
  "[(@a(1))*, (@b(2))*] on [1]": match("[(@a(1))*, (@b(2))*]", "[1]"),
  "[(@a(1))*, 3] on [3]": match("[(@a(1))*, 3]", "[3]"),
  "[(@a(1))+] on [1, 1]": match("[(@a(1))+]", "[1, 1]"),
  "[@a((1)*)] on [1, 1]": match("[@a((1)*)]", "[1, 1]"),
  // group and repeat paths outside arrays
  "(search(1))* on [1, 2]": plain("(search(1))*", "[1, 2]"),
  "(search(1)) on [1, 2]": plain("(search(1))", "[1, 2]"),
  "(search(1))? on [1, 2]": plain("(search(1))?", "[1, 2]"),
  "@a((search(1))*) on [1, 2]": match("@a((search(1))*)", "[1, 2]"),
  "([@a(*)]) on [1, 2]": match("([@a(*)])", "[1, 2]"),
  "(1)* on 1": plain("(1)*", "1"),
  "(1)+ on 2": plain("(1)+", "2"),
  // trailing whitespace and prefix lengths
  'parsePattern("1 ")': display("1 "),
  'parsePattern(" 1 ")': display(" 1 "),
  'parsePattern("\\t1\\n")': display("\t1\n"),
  'prefix "true rest"': prefix("true rest"),
  'prefix "true "': prefix("true "),
  'prefix "42    "': prefix("42    "),
  'prefix "42    more stuff"': prefix("42    more stuff"),
  'prefix "[1] ]"': prefix("[1] ]"),
  'prefix "@a(1) )"': prefix("@a(1) )"),
  'prefix "1 | 2 3"': prefix("1 | 2 3"),
  'prefix "tagged(1, *) x"': prefix("tagged(1, *) x"),
  'prefix "{1: 2} 3"': prefix("{1: 2} 3"),
  'prefix "\\t 1 \\t"': prefix("\t 1 \t"),
  'prefix "1 #"': prefix("1 #"),
  'prefix "1 ... 2 3"': prefix("1 ... 2 3"),
  'prefix "true"': prefix("true"),
  // integers at or above 2^53
  "1152921504606846976 on 2^60": match("1152921504606846976", "1152921504606846976"),
  "9007199254740993 on 2^53": match("9007199254740993", "9007199254740992"),
  "18446744073709551615 on 2^64-1": match("18446744073709551615", "18446744073709551615"),
  ">1 on 2^60": match(">1", "1152921504606846976"),
  "1...18446744073709551615 on 2^64-1": match("1...18446744073709551615", "18446744073709551615"),
  "<0 on -2^53-1": match("<0", "-9007199254740993"),
  // regex dialect: syntax
  "/(?i)abc/": display("/(?i)abc/"),
  "/(?P<n>a)/": display("/(?P<n>a)/"),
  "/(?s)./": display("/(?s)./"),
  "/(?m)^a$/": display("/(?m)^a$/"),
  "/a++/": display("/a++/"),
  "/a**/": display("/a**/"),
  "h'/(?-u)\\xff/'": display("h'/(?-u)\\xff/'"),
  "h'/(?s)./'": display("h'/(?s)./'"),
  "'/(?i)isa/'": display("'/(?i)isa/'"),
  "date'/(?i)t/'": display("date'/(?i)t/'"),
  "tagged(/(?i)DATE/, *)": display("tagged(/(?i)DATE/, *)"),
  "/(?=a)/": display("/(?=a)/"),
  "/(?!a)/": display("/(?!a)/"),
  "/(?<=a)b/": display("/(?<=a)b/"),
  "/a{,3}/": display("/a{,3}/"),
  "/\\k<n>/": display("/\\k<n>/"),
  "/(?<n>a)\\k<n>/": display("/(?<n>a)\\k<n>/"),
  "/\\1/": display("/\\1/"),
  "/(a)\\1/": display("/(a)\\1/"),
  "/\\c/": display("/\\c/"),
  "/\\Z/": display("/\\Z/"),
  "/\\A/": display("/\\A/"),
  "/\\x{1F600}/": display("/\\x{1F600}/"),
  "/[[:alpha:]]+/": display("/[[:alpha:]]+/"),
  "/\\pL/": display("/\\pL/"),
  "//": display("//"),
  // regex dialect: semantics on shared syntax
  '/^.$/ on "😀"': match("/^.$/", '"😀"'),
  '/^.{2}$/ on "😀"': match("/^.{2}$/", '"😀"'),
  '/^\\S$/ on "😀"': match("/^\\S$/", '"😀"'),
  '/^[^a]$/ on "😀"': match("/^[^a]$/", '"😀"'),
  '/\\w+/ on "é"': match("/\\w+/", '"é"'),
  '/^\\d$/ on "٣"': match("/^\\d$/", '"٣"'),
  '/^\\p{L}$/ on "é"': match("/^\\p{L}$/", '"é"'),
  '/\\bé/ on "é"': match("/\\bé/", '"é"'),
  '/^\\W$/ on "é"': match("/^\\W$/", '"é"'),
  // byte regexes
  "h'/\\xff/' on h'ff'": match("h'/\\xff/'", "h'ff'"),
  "h'/^.$/' on h'ff'": match("h'/^.$/'", "h'ff'"),
  "h'/^.$/' on h'c3a9'": match("h'/^.$/'", "h'c3a9'"),
  "h'/é/' on h'c3a9'": match("h'/é/'", "h'c3a9'"),
  "h'/^..$/' on h'c3a9'": match("h'/^..$/'", "h'c3a9'"),
  "h'/^\\xc3\\xa9$/' on h'c3a9'": match("h'/^\\xc3\\xa9$/'", "h'c3a9'"),
  "h'/[^\\x00]/' on h'0aff'": match("h'/[^\\x00]/'", "h'0aff'"),
  // quoted dates
  "date'2023-06-15T12:30:60Z'": display("date'2023-06-15T12:30:60Z'"),
  "date'2023-06-15t12:30:00z'": display("date'2023-06-15t12:30:00z'"),
  "date'0050-01-01'": display("date'0050-01-01'"),
  "date'0000-01-01'": display("date'0000-01-01'"),
  "date'2023-06-15 '": display("date'2023-06-15 '"),
  "date' 2023-06-15'": display("date' 2023-06-15'"),
  "date'2023-06-15T24:00:00Z'": display("date'2023-06-15T24:00:00Z'"),
  "date'2023-06-15T12:30:00.123456Z' on the microsecond date": match(
    "date'2023-06-15T12:30:00.123456Z'",
    "2023-06-15T12:30:00.123456Z",
  ),
  "date'1969-12-31T23:59:59.5Z'": display("date'1969-12-31T23:59:59.5Z'"),
  "date'2023-06-15...2023-06-16'": display("date'2023-06-15...2023-06-16'"),
  // number display
  "1e21": display("1e21"),
  "1e-7": display("1e-7"),
  "0.0000001": display("0.0000001"),
  "1e100": display("1e100"),
  "1e308": display("1e308"),
  "5e-324": display("5e-324"),
  ">1e21": display(">1e21"),
  "1...1e21": display("1...1e21"),
  "-0": display("-0"),
  "1.0": display("1.0"),
  "1.50": display("1.50"),
  "1e400": display("1e400"),
  "9007199254740993": display("9007199254740993"),
  // regex objects
  "display(textRegex(/X/i))": () => P.display(P.textRegex(/X/i)),
  "textRegex(/x/g) three times": () => {
    const p = P.textRegex(/x/g);
    const h = makeCbor("x");
    return [P.matches(p, h), P.matches(p, h), P.matches(p, h)];
  },
  'display(textRegex(new RegExp("")))': () => P.display(P.textRegex(new RegExp(""))),
  "display(byteStringRegex(/\\xff/i))": () => P.display(P.byteStringRegex(/\xff/i)),
  // capture depth under maps and tagged values
  '{"a": [@x(1)]} on {"a": [1]}': match('{"a": [@x(1)]}', '{"a": [1]}'),
  '{"a": {"b": @x(1)}} on {"a": {"b": 1}}': match('{"a": {"b": @x(1)}}', '{"a": {"b": 1}}'),
  '{@k("a"): {"b": @v(1)}} on {"a": {"b": 1}}': match('{@k("a"): {"b": @v(1)}}', '{"a": {"b": 1}}'),
  '{"a": [{"b": @x(1)}, {"b": @y(2)}]} on {"a": [{"b": 1}, {"b": 2}]}': match(
    '{"a": [{"b": @x(1)}, {"b": @y(2)}]}',
    '{"a": [{"b": 1}, {"b": 2}]}',
  ),
  "@t(tagged(100, @c([@e(*)]))) on 100([1, [2]])": match(
    "@t(tagged(100, @c([@e(*)])))",
    "100([1, [2]])",
  ),
  'tagged(100, {"a": @v(1)}) on 100({"a": 1})': match('tagged(100, {"a": @v(1)})', '100({"a": 1})'),
  '{"a": @v(number), "b": @v(number)} on {"a": 1}': match(
    '{"a": @v(number), "b": @v(number)}',
    '{"a": 1}',
  ),
  // duplicate capture entries
  "[@a(*), @a(*)] on [1, 1]": match("[@a(*), @a(*)]", "[1, 1]"),
  "{@a(*): @a(*)} on {1: 1}": match("{@a(*): @a(*)}", "{1: 1}"),
  '{"a": @v(number), "b": @v(number)} on {"a": 1, "b": 1}': match(
    '{"a": @v(number), "b": @v(number)}',
    '{"a": 1, "b": 1}',
  ),
  // the signed tag value
  "tagged(+1, *)": display("tagged(+1, *)"),
  "tagged(+1, *) on 1(1)": match("tagged(+1, *)", "1(1)"),
  // named tags and known values on decoded data
  "tagged(date, *) on 1(1)": match("tagged(date, *)", "1(1)"),
  "tagged(/^d/, *) on 1(1)": match("tagged(/^d/, *)", "1(1)"),
  "tagged(known-value, *) on 40000(1)": match("tagged(known-value, *)", "40000(1)"),
  "'value' on 40000(25)": match("'value'", "40000(25)"),
  "'Self' on 40000(706)": match("'Self'", "40000(706)"),
  "'/^\\d+$/' on 40000(25)": match("'/^\\d+$/'", "40000(25)"),
  // nesting depth
  "[ x 500": () => outcome(display("[".repeat(500))),
  "[ x 1000": () => outcome(display("[".repeat(1000))),
  "[ x 3000": () => outcome(display("[".repeat(3000))),
  "balanced [ x 400": display("[".repeat(400) + "]".repeat(400)),
  "search( x 2000": () => outcome(display("search(".repeat(2000))),
  "( x 2500": () => outcome(display("(".repeat(2500))),
  "search(1) over 1000 nested arrays": () => {
    let h: unknown = 1;
    for (let i = 0; i < 1000; i++) h = [h];
    return P.paths(P.parsePattern("search(1)"), makeCbor(h as never)).length;
  },
  // argument domain
  "parsePattern(undefined)": () => parse(undefined),
  "parsePattern(123)": () => parse(123),
  "tryParsePattern(undefined)": () => tryParse(undefined),
  "paths(p, undefined)": () => pathsOf(P.parsePattern("number"), undefined),
  "paths(p, {})": () => pathsOf(P.parsePattern("number"), {}),
  'paths(p, "text")': () => pathsOf(P.parsePattern("number"), "text"),
  "mutating a parsed pattern changes its display": () => {
    const p = P.parsePattern("1") as { pattern: { pattern: { value: number } } };
    p.pattern.pattern.value = 2;
    return P.display(p as unknown as P.Pattern);
  },
  "Object.isFrozen(DcborPatternErrorCode)": () => Object.isFrozen(P.DcborPatternErrorCode),
  "Object.isFrozen(Reluctance)": () => Object.isFrozen(P.Reluctance),
  "Object.isFrozen(parsePattern('1'))": () => {
    const p = P.parsePattern("1");
    return [Object.isFrozen(p), Object.isFrozen(p.pattern), Object.isFrozen(p.pattern.pattern)];
  },
  "Object.isFrozen(error.details), (error.details.span)": () => {
    try {
      P.parsePattern("(1");
    } catch (e) {
      const d = (e as { details: { span: object } }).details;
      return [Object.isFrozen(d), Object.isFrozen(d.span)];
    }
    return "no throw";
  },
  "Object.isFrozen(pathsWithCaptures(...)), (.paths)": () => {
    const r = P.pathsWithCaptures(P.parsePattern("@a(1)"), makeCbor(1));
    return [Object.isFrozen(r), Object.isFrozen(r.paths)];
  },
  "new Interval(3, 1)": () => new P.Interval(3, 1).toString(),
  "new Interval(-1)": () => new P.Interval(-1).toString(),
  "new Interval(1.5)": () => new P.Interval(1.5).toString(),
  "Quantifier.from(2, 1)": () => P.Quantifier.from(2, 1).toString(),
  "Interval.from(1, 3).min is a method": () => typeof P.Interval.from(1, 3).min,
  "Quantifier.exactly(1).reluctance is a method": () => typeof P.Quantifier.exactly(1).reluctance,
  'capture("a b", any())': () => P.display(P.capture("a b", P.any())),
  'taggedName("a b", any())': () => P.display(P.taggedName("a b", P.any())),
  "and()": () => P.display(P.and()),
  "or()": () => P.display(P.or()),
  "sequence()": () => P.display(P.sequence()),
  "number(NaN)": () => P.display(P.number(Number.NaN)),
  "number(-0)": () => P.display(P.number(-0)),
  "number(1e21)": () => P.display(P.number(1e21)),
  'dateIso8601("nope")': () => P.display(P.dateIso8601("nope")),
  "digestPrefix(33 bytes)": () => P.display(P.digestPrefix(new Uint8Array(33))),
  'text("a\\nb") re-parses': () => {
    const d = P.display(P.text("a\nb"));
    return [d, P.display(P.parsePattern(d))];
  },
  "paths(...)[0][0] === haystack": () => {
    const h = makeCbor(1);
    return P.paths(P.parsePattern("1"), h)[0][0] === h;
  },
  // errors and shapes
  'parsePattern("(1") message': () => parse("(1"),
  'parsePattern("(1") details keys': () => {
    try {
      P.parsePattern("(1");
    } catch (e) {
      return Object.keys((e as { details: object }).details).sort();
    }
    return "no throw";
  },
  'parsePattern("& 1") UnexpectedToken details': () => {
    try {
      P.parsePattern("& 1");
    } catch (e) {
      const d = (e as { code: string; details: { token?: unknown } }).details;
      return [(e as { code: string }).code, Object.keys(d).sort(), JSON.stringify(d.token)];
    }
    return "no throw";
  },
  "DcborPatternErrorCode has Unknown": () => "Unknown" in P.DcborPatternErrorCode,
  "isDcborPatternError of a same-shaped error from another copy": () => {
    const e = Object.assign(new Error("m"), { code: "EmptyInput" });
    e.name = "DcborPatternError";
    return P.DcborPatternError.isDcborPatternError(e);
  },
  "error own keys": () => {
    try {
      P.parsePattern("");
    } catch (e) {
      return Object.keys(e as object).sort();
    }
    return "no throw";
  },
  "format exports": () => Object.keys(F).sort(),
  "patterns export count": () => Object.keys(I).length,
  exports: () => Object.keys(P).sort(),
};

describe("golden: argument domain and edges", () => {
  it("every known divergence, every JS-only input, and the runtime shapes", () => {
    const lines = Object.entries(rows).map(([name, f]) => `${name} → ${outcome(f)}`);
    expect(lines).toMatchSnapshot();
  });

  it("the /patterns entry imported alone", async () => {
    vi.resetModules();
    const internal = await import("../src/patterns");
    const elements = internal.arrayPatternWithElements({
      kind: "Value",
      pattern: { type: "Number", pattern: internal.numberPatternAny() },
    });
    const line = outcome(() => internal.arrayPatternMatches(elements, makeCbor([1])));
    expect(line).toMatchSnapshot();
  });
});
