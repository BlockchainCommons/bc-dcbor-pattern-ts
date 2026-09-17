/**
 * Differential corpus and the golden subset: every known pattern string
 * parsed, matched against a fixed set of haystacks, and formatted; the
 * partial parses; generated valid patterns × haystacks; generated rejections;
 * the regex dialect differential; and the JavaScript-only domain cases.
 */
import { encodeCbor, getGlobalTagsStore } from "@blockchaincommons/dcbor";
import { parseDcborItem } from "@blockchaincommons/dcbor-parse";
import { registerTags } from "@blockchaincommons/tags";
import { hex, type Recipe, type FormatOpts } from "../vectors/recipes";
import { PATTERNS, PARTIAL_SOURCES } from "./patterns";
import { DOMAIN_CASES } from "./domain-cases";
import { regexes } from "./regexes";
export { regexes };

registerTags(getGlobalTagsStore());
const H = (diagnostic: string): string =>
  hex(encodeCbor(parseDcborItem(diagnostic, { tags: getGlobalTagsStore() })));

/** Haystacks as dCBOR diagnostic text. */
const HAYSTACK_TEXTS: readonly string[] = [
  "42",
  "-1",
  "1.5",
  "NaN",
  "Infinity",
  '"hello"',
  '""',
  "true",
  "null",
  "h'0102'",
  "h''",
  "2023-06-15",
  "2023-06-15T12:30:00Z",
  "'isA'",
  "'1'",
  "1(1)",
  '42("x")',
  "date(2023-06-15)",
  "digest(h'000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f')",
  "[]",
  "[1, 2, 3]",
  '[1, "x", 3]',
  '[1, "x", 3, "y"]',
  "[42]",
  "[[1], [2, [3]]]",
  "[true, null, 1.5, \"s\", h'ff']",
  "{}",
  '{"a": 1}',
  '{"a": 1, "b": "two"}',
  '{1: "one", 2: "two"}',
  '{"id": 1, "name": "n"}',
  '{"a": {"b": {"c": 3}}}',
  '[{"id": 1}, {"id": 2}, {"name": "x"}]',
  '100({"a": {"b": {"c": {"d": [42]}}}})',
  '[1, [2, [3, [4, [5, "needle"]]]]]',
  '{"list": [1, 2, {"deep": [3, 4]}], "x": 5}',
  // repeated elements
  "[1, 1, 1]",
  "{1: 1}",
  "[1, 2, 1, 2]",
  "[[1], [1]]",
  '{"k": "v", "x": "v"}',
  "[1, 1]",
  // small arrays for quantified captures
  "[1]",
  "[2]",
  "[3]",
  "[1, 2]",
  '["x"]',
  '["a", 1, "b", 2]',
  // tags, known values, digests
  "100([1, [2]])",
  '100({"a": 1})',
  "1000(1)",
  "40000(1)",
  "40000(25)",
  "40000(706)",
  "40000(999999)",
  "40000(0)",
  // dates
  "2023-06-15T12:30:00.123456Z",
  "2023-06-15T12:30:00.5Z",
  "1969-12-31T23:59:59.5Z",
  "0050-01-01",
  "2023-06-15T12:31:00Z",
  // bytes and text beyond ASCII
  "h'ff'",
  "h'c3a9'",
  "h'0aff'",
  '"😀"',
  '"é"',
  '"٣"',
  '"Hello123"',
  '"v"',
  // integers beyond 2^53
  "9007199254740992",
  "1152921504606846976",
  "18446744073709551615",
  "-9007199254740993",
  "-18446744073709551616",
  // nesting for capture depth
  '{"a": [1]}',
  '{"a": {"b": 1}}',
  '{"a": [{"b": 1}, {"b": 2}]}',
  '{"a": 1, "b": 1}',
  '{"a": 100(1)}',
  "100(200(1))",
  // scalars and short arrays the probes pair with
  "1",
  "2",
  '"x"',
  "[1, 3]",
  "[1, 42, 3]",
  "[1, 2, 1]",
  '[{"type": "person"}, {"name": "Alice"}]',
  "[1, [1]]",
];
export const HAYSTACKS: readonly string[] = HAYSTACK_TEXTS.map(H);
const hexOf = (text: string): string => HAYSTACKS[HAYSTACK_TEXTS.indexOf(text)];

const FORMAT_OPTS: readonly FormatOpts[] = [
  {},
  { flat: true },
  { indent: false },
  { lastElementOnly: true },
  { maxLength: 12 },
  { flat: true, maxLength: 8, lastElementOnly: true },
];

const xorshift = (seed: number): (() => number) => {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x;
  };
};
const pick = <T>(next: () => number, xs: readonly T[]): T => xs[next() % xs.length];

/** Leaves the grammar accepts: every value and structure form. */
const VALID_LEAVES: readonly string[] = [
  "*",
  "bool",
  "true",
  "false",
  "null",
  "number",
  "42",
  "1...3",
  ">1",
  "<=2",
  ">=0",
  "<100",
  "NaN",
  "Infinity",
  "-Infinity",
  "1.5",
  "-1",
  "9007199254740993",
  "text",
  '"x"',
  '"hello"',
  "/x/",
  "/^H/",
  "bstr",
  "h'ff'",
  "h'0102'",
  "h'/^\\xff/'",
  "date",
  "date'2023-06-15'",
  "date'2023-06-15...'",
  "date'...2023-06-15'",
  "date'/2023/'",
  "known",
  "'1'",
  "'isA'",
  "'/^is/'",
  "digest",
  "digest'00'",
  "tagged",
  "tagged(42, *)",
  "tagged(1, number)",
  "tagged(date, *)",
  "tagged(/^d/, *)",
  "array",
  "map",
  "[*]",
  "[]",
  "[{2}]",
  "{*: *}",
  "{{1}}",
  '{"a": *}',
];

/** Leaves the grammar rejects, for the rejection corpus. */
const INVALID_LEAVES: readonly string[] = [
  "number(42)",
  'text("x")',
  "bstr(h'ff')",
  "known(1)",
  "date(2023-06-15)",
  "{}",
  "number(1...3)",
  "xyz",
  "Number",
  "@(1)",
  "1..2",
  "h'zz'",
  "date'nope'",
  "digest'xyz'",
  "tagged(,*)",
  "[{3,1}]",
];

const CAPTURE_NAMES = ["a", "b", "item", "x1"] as const;
const QUANTIFIERS = [
  "",
  "",
  "*",
  "+",
  "?",
  "*?",
  "+?",
  "??",
  "*+",
  "++",
  "?+",
  "{2}",
  "{1,3}",
  "{0,}",
  "{2,}?",
] as const;

/** Grammar-driven patterns to a given depth, over the given leaves. */
function genPattern(next: () => number, depth: number, leaves: readonly string[]): string {
  if (depth <= 0) return pick(next, leaves);
  const sub = (): string => genPattern(next, depth - 1, leaves);
  switch (next() % 14) {
    case 0:
      return `${sub()} | ${sub()}`;
    case 1:
      return `${sub()} & ${sub()}`;
    case 2:
      return `!${sub()}`;
    case 3:
      return `(${sub()})${pick(next, QUANTIFIERS)}`;
    case 4:
      return `@${pick(next, CAPTURE_NAMES)}(${sub()})`;
    case 5:
      return `search(${sub()})`;
    case 6: {
      const n = next() % 4;
      const items = Array.from({ length: n }, () => {
        const p = sub();
        const q = pick(next, QUANTIFIERS);
        return q === "" ? p : `(${p})${q}`;
      });
      return `[${items.join(", ")}]`;
    }
    case 7:
      return `{${sub()}: ${sub()}}`;
    case 8:
      return `{{${next() % 4}}}`;
    case 9:
      return `tagged(${pick(next, ["42", "1", "100", "date", "/^d/", "*"])}, ${sub()})`;
    case 10:
      return `[(${sub()})*, ${sub()}, (*)*]`;
    case 11:
      return `[(@${pick(next, CAPTURE_NAMES)}(${sub()}))${pick(next, QUANTIFIERS)}]`;
    case 12:
      return `{${sub()}: @${pick(next, CAPTURE_NAMES)}(${sub()}), ${sub()}: ${sub()}}`;
    default:
      return pick(next, leaves);
  }
}

export function* hand(): Generator<Recipe> {
  for (const src of PATTERNS) yield { k: "parse", src };
  for (const src of PARTIAL_SOURCES) yield { k: "partial", src };
  for (const pattern of PATTERNS) for (const hex of HAYSTACKS) yield { k: "match", pattern, hex };
  const formatPatterns = PATTERNS.filter((_, i) => i % 9 === 0);
  for (const pattern of formatPatterns)
    for (const hex of HAYSTACKS.filter((_, i) => i % 5 === 0))
      for (const opts of FORMAT_OPTS) yield { k: "format", pattern, hex, opts };
}

/** Generated patterns the grammar accepts, parsed and matched. */
export function* valid(): Generator<Recipe> {
  const next = xorshift(0x9e3779b1);
  const patterns: string[] = [];
  for (let i = 0; i < 2000; i++) patterns.push(genPattern(next, 1 + (next() % 3), VALID_LEAVES));
  for (const src of patterns) yield { k: "parse", src };
  for (const pattern of patterns) {
    for (let j = 0; j < 4; j++) yield { k: "match", pattern, hex: pick(next, HAYSTACKS) };
  }
}

/** Generated patterns the grammar rejects: invalid leaves, truncations and corruptions. */
export function* rejections(): Generator<Recipe> {
  const next = xorshift(0x2545f491);
  const mixed = [...VALID_LEAVES, ...INVALID_LEAVES, ...INVALID_LEAVES];
  for (let i = 0; i < 400; i++)
    yield { k: "parse", src: genPattern(next, 1 + (next() % 2), mixed) };
  const sound: string[] = [];
  for (let i = 0; i < 60; i++) sound.push(genPattern(next, 2, VALID_LEAVES));
  for (const src of sound) {
    for (let cut = 1; cut < src.length; cut++) yield { k: "parse", src: src.slice(0, cut) };
    yield { k: "parse", src: src.slice(1) };
    yield { k: "parse", src: `${src})` };
    yield { k: "parse", src: `(${src}` };
    yield { k: "parse", src: `${src} ${src}` };
    yield { k: "partial", src: `${src} ${src}` };
  }
}

/** The JavaScript-only domain cases (golden only; the frozen surface cannot run them). */
export function* domain(): Generator<Recipe> {
  for (const s of Object.keys(DOMAIN_CASES)) yield { k: "domain", s };
}

export const categories: Record<string, () => Generator<Recipe>> = {
  hand,
  valid,
  rejections,
  regexes,
  domain,
};

/** The haystacks every hand pattern is matched against in the golden file. */
const GOLDEN_HAYSTACKS: readonly string[] = [
  "-1",
  '"hello"',
  '[1, "x", 3]',
  '{"a": 1, "b": "two"}',
  "[1, 2, 1, 2]",
  "100([1, [2]])",
  '{"a": [{"b": 1}, {"b": 2}]}',
  "[1, 2]",
  "[42]",
  "[1, 42, 3]",
  "[1]",
  "[1, 1]",
  '[1, [2, [3, [4, [5, "needle"]]]]]',
].map(hexOf);

/** Pattern and haystack pairs from the gap analysis, each designed to hit. */
const GOLDEN_PROBES: readonly (readonly [string, string])[] = [
  ["search(1)", "[1, 1, 1]"],
  ["search(1)", "{1: 1}"],
  ["search(*)", "[1, 2, 1, 2]"],
  ["search([*])", "[[1], [1]]"],
  ["search(text)", '{"k": "v", "x": "v"}'],
  ["search(!1)", "[1, 1, 1]"],
  ["search((1)*)", "[1, 1, 1]"],
  ["search(number)", "[1, 1, 1]"],
  ["search(array)", "[[1], [1]]"],
  ["search([1])", "[[1], [1]]"],
  ["search([(*)*, 1])", "[[1], [1]]"],
  ["search(!number)", '{"k": "v", "x": "v"}'],
  ["search(search(*))", "[1, 1]"],
  ['search("v")', '{"k": "v", "x": "v"}'],
  ["search(/^v$/)", '{"k": "v", "x": "v"}'],
  ["@a(search(1))", "[1, 1, 1]"],
  ["search(@x(search(1)))", "[1, 1, 1]"],
  ["search(@a(*))", "[1, 1]"],
  ["[(@a(1))*]", "[2]"],
  ["[(@a(1))*]", "[1, 2]"],
  ["[(@a(1))*]", "[1, 1]"],
  ["[(@a(1))*]", "[]"],
  ["[(@a(1 | 2))*]", "[1, 2, 3]"],
  ["[(@a(1 | 2))*]", "[1, 2]"],
  ["[(@a(number))*]", '["x"]'],
  ["[(@a(number))*]", "[1, 2, 3]"],
  ["[(@a(1))*, (@b(2))*]", "[]"],
  ["[(@a(1))*, (@b(2))*]", "[1]"],
  ["[(@a(1))*, (@b(2))*]", "[1, 2]"],
  ["[(@a(1))*, 3]", "[3]"],
  ["[(@a(1))*, 3]", "[1, 3]"],
  ["[(@a(1))+]", "[1, 1]"],
  ["[(@a(1)){2}]", "[1, 1]"],
  ["[(@a(1))?, @b(*)]", "[2]"],
  ["[(@a(1))?, @b(*)]", "[1, 2]"],
  ["[(@a(*))*?, 1]", "[1, 2, 1]"],
  ["[(@a(number))++, text]", '["a", 1, "b", 2]'],
  ["[(@a(*))*, @b(*)]", "[1, 2, 3]"],
  ["[@b(*), (@a(*))*]", "[1, 2, 3]"],
  ["[(@a([@b(*)]))*]", "[[1], [1]]"],
  ["[@a((1)*)]", "[1, 1]"],
  ["[@a(*), @rest((*)*)]", "[1, 2, 3]"],
  ["[(*)*, @item(42), (*)*]", "[1, 42, 3]"],
  ["(search(1))*", "[1, 2]"],
  ["(search(1))", "[1, 2]"],
  ["(search(1))?", "[1, 2]"],
  ["@a((search(1))*)", "[1, 2]"],
  ["([@a(*)])", "[1, 2]"],
  ["(search(1))*", "[[1], [1]]"],
  ["(search(1))*", "{1: 1}"],
  ["(search(1))*", "100([1, [2]])"],
  ["(1)*", "1"],
  ["(1)+", "2"],
  ["(@a(number))", "1"],
  ["(@a(number) | @b(text))*", '"x"'],
  ["1152921504606846976", "1152921504606846976"],
  ["9007199254740993", "9007199254740992"],
  ["18446744073709551615", "18446744073709551615"],
  [">=9007199254740993", "9007199254740992"],
  ["1...18446744073709551615", "18446744073709551615"],
  ["<0", "-9007199254740993"],
  ["<0", "-18446744073709551616"],
  ["number", "18446744073709551615"],
  ["/^.$/", '"😀"'],
  ["/^.{2}$/", '"😀"'],
  ["/^\\S$/", '"😀"'],
  ["/^[^a]$/", '"😀"'],
  ["/^\\x{1F600}$/", '"😀"'],
  ["/\\w+/", '"é"'],
  ["/\\w+/", '"٣"'],
  ["/^\\d$/", '"٣"'],
  ["/^\\p{L}$/", '"é"'],
  ["/\\bé/", '"é"'],
  ["/^\\W$/", '"é"'],
  ["/^\\W$/", '"٣"'],
  ["/^é$/", '"é"'],
  ["/^[a-z]+$/", '"hello"'],
  ["/^H/", '"Hello123"'],
  ["/hello/", '"hello"'],
  ["h'/\\xff/'", "h'ff'"],
  ["h'/^.$/'", "h'ff'"],
  ["h'/./'", "h'ff'"],
  ["h'/[^\\x00]/'", "h'0aff'"],
  ["h'/^.$/'", "h'c3a9'"],
  ["h'/é/'", "h'c3a9'"],
  ["h'/^..$/'", "h'c3a9'"],
  ["h'/^\\xc3\\xa9$/'", "h'c3a9'"],
  ["h'/(?-u)^.$/'", "h'ff'"],
  ["h'/(?-u)\\xc3/'", "h'c3a9'"],
  ["h'/^\\x01\\x02$/'", "h'0102'"],
  [
    "digest'/^\\x00/'",
    "digest(h'000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f')",
  ],
  [
    "digest'/(?-u)^\\x00/'",
    "digest(h'000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f')",
  ],
  ["date'2023-06-15T12:30:00.123456Z'", "2023-06-15T12:30:00.123456Z"],
  ["date'2023-06-15T12:30:00.5Z'", "2023-06-15T12:30:00.5Z"],
  ["date'2023-06-15T12:30:60Z'", "2023-06-15T12:31:00Z"],
  ["date'0050-01-01'", "0050-01-01"],
  ["date'1969-12-31T23:59:59.5Z'", "1969-12-31T23:59:59.5Z"],
  ["date'2023-06-15...2023-06-16'", "2023-06-15T12:30:00Z"],
  ["date'2023-06-15T00:00:00Z...'", "2023-06-15T12:30:00Z"],
  ["date'...2023-06-15'", "2023-06-15T12:30:00Z"],
  ["date'/2023/'", "2023-06-15T12:30:00Z"],
  ["date", "2023-06-15T12:30:00.123456Z"],
  ["tagged(1, number)", "2023-06-15T12:30:00Z"],
  ['{"a": [@x(1)]}', '{"a": [1]}'],
  ['{"a": {"b": @x(1)}}', '{"a": {"b": 1}}'],
  ['{@k("a"): {"b": @v(1)}}', '{"a": {"b": 1}}'],
  ['{"a": [@x(*)]}', '{"a": [1]}'],
  ['{"a": [{"b": @x(1)}, {"b": @y(2)}]}', '{"a": [{"b": 1}, {"b": 2}]}'],
  ["@t(tagged(100, @c([@e(*)])))", "100([1, [2]])"],
  ['tagged(100, {"a": @v(1)})', '100({"a": 1})'],
  ['{"a": @v(number), "b": @v(number)}', '{"a": 1}'],
  ['{"a": @v(number), "b": @v(number)}', '{"a": 1, "b": 1}'],
  ['{@k("a"): 1, @k("b"): 1}', '{"a": 1}'],
  ["tagged(100, [@e(*)])", "100([1, [2]])"],
  ["tagged(100, [(*)*, @e(1), (*)*])", "100([1, [2]])"],
  ['{"a": tagged(100, @c(*))}', '{"a": 100(1)}'],
  ["[{@k(text): @v(*)}]", '[{"id": 1}, {"id": 2}, {"name": "x"}]'],
  ['{"a": [@x(1), @y(2)]}', '{"a": [1]}'],
  ['{"a": [(@x(number))*]}', '{"a": [1]}'],
  ["@m({@k(*): @v(*)})", "{1: 1}"],
  ["@arr([@first(*), (*)*])", "[1, 2, 3]"],
  ["tagged(100, @inner(tagged(200, @deep(*))))", "100(200(1))"],
  [
    '[@first_map({@key1("type"): @val1("person")}), @second_map({@key2("name"): @val2(text)})]',
    '[{"type": "person"}, {"name": "Alice"}]',
  ],
  ["[@x(search(1))]", "[[1], [1]]"],
  ["[@x(search(1))]", "[1, [1]]"],
  ["[@a(*), @a(*)]", "[1, 1]"],
  ["{@a(*): @a(*)}", "{1: 1}"],
  ["[@a(1), @a(1), @a(1)]", "[1, 1, 1]"],
  ["@a(*) | @a(number)", "1"],
  ["@a(number) & @a(*)", "1"],
  ["tagged(+1, *)", "1(1)"],
  ["tagged(-1, *)", "1(1)"],
  ["tagged(01, *)", "1(1)"],
  ["tagged(date, *)", "1(1)"],
  ["tagged(/^d/, *)", "1(1)"],
  ["tagged(known-value, *)", "40000(1)"],
  [
    "tagged(digest, *)",
    "digest(h'000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f')",
  ],
  ["tagged(/./, *)", "1000(1)"],
  ["tagged(/./, *)", "1(1)"],
  ["tagged(date, number)", "2023-06-15T12:30:00Z"],
  ["'value'", "40000(25)"],
  ["'Self'", "40000(706)"],
  ["'/^value$/'", "40000(25)"],
  ["'/^\\d+$/'", "40000(25)"],
  ["'/^\\d+$/'", "40000(999999)"],
  ["'25'", "40000(25)"],
  ["'999999'", "40000(999999)"],
  ["'0'", "40000(0)"],
  ["''", "40000(0)"],
  ["'isA'", "'isA'"],
  ["'/^is/'", "'isA'"],
  ["known", "40000(999999)"],
  ["formatted", "[1, 2, 1, 2]"],
];

/** The golden subset: every parse and prefix, matches on the golden haystacks, formats, generated samples, the domain. */
export function* goldenRecipes(): Generator<Recipe> {
  for (const src of PATTERNS) yield { k: "parse", src };
  for (const src of PARTIAL_SOURCES) yield { k: "partial", src };
  for (const pattern of PATTERNS)
    for (const hex of GOLDEN_HAYSTACKS) yield { k: "match", pattern, hex };
  for (const [pattern, text] of GOLDEN_PROBES) {
    if (pattern === "formatted") {
      yield { k: "format", pattern: "search(*)", hex: hexOf(text), opts: {} };
      continue;
    }
    yield { k: "match", pattern, hex: hexOf(text) };
  }
  for (const pattern of PATTERNS.filter((_, i) => i % 9 === 0))
    for (const hex of [hexOf('[1, "x", 3, "y"]'), hexOf('[{"id": 1}, {"id": 2}, {"name": "x"}]')])
      for (const opts of FORMAT_OPTS) yield { k: "format", pattern, hex, opts };
  let i = 0;
  for (const r of valid()) {
    if (i++ >= 600) break;
    yield r;
  }
  i = 0;
  for (const r of rejections()) {
    if (i++ >= 150) break;
    yield r;
  }
  yield* regexes();
  yield* domain();
}
