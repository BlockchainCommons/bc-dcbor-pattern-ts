/**
 * Differential corpus (Phase 1.3) and the golden subset (Phase 1.2): every
 * known pattern string parsed, matched against a fixed set of haystacks, and
 * formatted; plus generated patterns × generated haystacks.
 */
import { encodeCbor, getGlobalTagsStore } from "@blockchaincommons/dcbor";
import { parseDcbor } from "@blockchaincommons/dcbor-parse";
import { registerTags } from "@blockchaincommons/tags";
import { hex, type Recipe, type FormatOpts } from "../vectors/recipes";
import { PATTERNS } from "./patterns";

registerTags(getGlobalTagsStore());
const H = (diagnostic: string): string =>
  hex(encodeCbor(parseDcbor(diagnostic, { tags: getGlobalTagsStore() })));

/** Haystacks (as dCBOR diagnostic text, encoded once). */
export const HAYSTACKS: readonly string[] = [
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
].map(H);

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

/** Grammar-driven patterns to a given depth. */
function genPattern(next: () => number, depth: number): string {
  const leaves = [
    "*",
    "bool",
    "true",
    "false",
    "null",
    "number",
    "number(42)",
    "number(1...3)",
    "number(>1)",
    "text",
    'text("x")',
    "text(/x/)",
    "bstr",
    "bstr(h'ff')",
    "date",
    "date(2023-06-15)",
    "known",
    "known(1)",
    "known('isA')",
    "digest",
    "tagged",
    "tagged(42, *)",
    "tagged(date, *)",
    "array",
    "map",
    "[*]",
    "[]",
    "{*}",
    "{}",
    "number(1.5)",
    'text("hello")',
    "tagged(1, number)",
  ];
  if (depth <= 0) return pick(next, leaves);
  switch (next() % 12) {
    case 0:
      return `${genPattern(next, depth - 1)} | ${genPattern(next, depth - 1)}`;
    case 1:
      return `${genPattern(next, depth - 1)} & ${genPattern(next, depth - 1)}`;
    case 2:
      return `!${genPattern(next, depth - 1)}`;
    case 3:
      return `(${genPattern(next, depth - 1)})`;
    case 4:
      return `@${pick(next, ["a", "b", "item", "x1"])}(${genPattern(next, depth - 1)})`;
    case 5:
      return `search(${genPattern(next, depth - 1)})`;
    case 6: {
      const n = next() % 4;
      const items = Array.from({ length: n }, () => {
        const p = genPattern(next, depth - 1);
        const q = pick(next, ["", "", "*", "+", "?", "*?", "+?", "{2}", "{1,3}", "{0,}"]);
        return q === "" ? p : `(${p})${q}`;
      });
      return `[${items.join(", ")}]`;
    }
    case 7:
      return `{${genPattern(next, depth - 1)}: ${genPattern(next, depth - 1)}}`;
    case 8:
      return `{{${next() % 4}}}`;
    case 9:
      return `tagged(${pick(next, ["42", "1", "100", "date", "/^d/", "*"])}, ${genPattern(next, depth - 1)})`;
    case 10:
      return `[(${genPattern(next, depth - 1)})*, ${genPattern(next, depth - 1)}, (*)*]`;
    default:
      return pick(next, leaves);
  }
}

export function* hand(): Generator<Recipe> {
  for (const src of PATTERNS) yield { k: "parse", src };
  for (const pattern of PATTERNS) for (const hex of HAYSTACKS) yield { k: "match", pattern, hex };
  const formatPatterns = PATTERNS.filter((_, i) => i % 9 === 0);
  for (const pattern of formatPatterns)
    for (const hex of HAYSTACKS.filter((_, i) => i % 5 === 0))
      for (const opts of FORMAT_OPTS) yield { k: "format", pattern, hex, opts };
}

export function* generated(): Generator<Recipe> {
  const next = xorshift(0x9e3779b1);
  const patterns: string[] = [];
  for (let i = 0; i < 2000; i++) patterns.push(genPattern(next, 1 + (next() % 3)));
  for (const src of patterns) yield { k: "parse", src };
  for (const pattern of patterns) {
    for (let j = 0; j < 4; j++) yield { k: "match", pattern, hex: pick(next, HAYSTACKS) };
  }
  // corruptions: truncations of 40 patterns
  for (let i = 0; i < 40; i++) {
    const src = patterns[i * 13];
    for (let cut = 1; cut < src.length; cut++) yield { k: "parse", src: src.slice(0, cut) };
  }
}

export const categories: Record<string, () => Generator<Recipe>> = { hand, generated };

/** The golden subset: parses of every pattern, matches on four haystacks, the format calls. */
export function* goldenRecipes(): Generator<Recipe> {
  for (const src of PATTERNS) yield { k: "parse", src };
  const goldenHaystacks = [HAYSTACKS[1], HAYSTACKS[5], HAYSTACKS[21], HAYSTACKS[28]];
  for (const pattern of PATTERNS)
    for (const hex of goldenHaystacks) yield { k: "match", pattern, hex };
  for (const pattern of PATTERNS.filter((_, i) => i % 9 === 0))
    for (const hex of [HAYSTACKS[22], HAYSTACKS[32]])
      for (const opts of FORMAT_OPTS) yield { k: "format", pattern, hex, opts };
  let i = 0;
  for (const r of generated()) {
    if (i++ >= 300) break;
    yield r;
  }
}
