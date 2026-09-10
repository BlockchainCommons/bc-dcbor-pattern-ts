/**
 * Differential: every corpus recipe is run with the frozen bundle of the
 * previous surface AND the working tree; displays, paths (as bytes),
 * captures, formatted output and error variants must be identical outside
 * the enumerated tombstones.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import * as frozenMod from "./baseline/dcbor-pattern-baseline.mjs";
import * as srcRoot from "../src";
import * as srcFormat from "../src/format";
const src = { ...srcRoot, ...srcFormat };
import {
  materialize,
  frozenAdapterFor,
  adapterFor,
  recipeName,
  unhex,
  type Recipe,
} from "./vectors/recipes";
import { currentDeps } from "./vectors/deps";
import { categories } from "./corpus/corpus";

const here = dirname(fileURLToPath(import.meta.url));
const FROZEN_SHA256 = readFileSync(join(here, "baseline/README.md"), "utf8").match(
  /Baseline sha256: ([0-9a-f]{64})/,
)?.[1];

const sourceOf = (r: Recipe): string => ("src" in r ? r.src : "pattern" in r ? r.pattern : "");
const depthOf = (s: string): number => {
  let depth = 0;
  let max = 0;
  for (const c of s) {
    if (c === "[" || c === "{" || c === "(") max = Math.max(max, ++depth);
    else if (c === "]" || c === "}" || c === ")") depth--;
  }
  return max;
};
const throws = (o: string): boolean => o.startsWith("throw:");
/** The outcome with duplicate paths and duplicate capture entries removed. */
const dedup = (o: string): string =>
  o.replace(
    /\[([^\]]*)\]/g,
    (_m, inner: string) => `[${[...new Set(inner.split("|"))].join("|")}]`,
  );
/** Whether a match haystack is an integer at or beyond 2^53 (an 8-byte integer head). */
const bigHaystack = (r: Recipe): boolean => {
  if (r.k !== "match" && r.k !== "format") return false;
  const first = unhex(r.hex)[0];
  return first === 0x1b || first === 0x3b;
};

/**
 * Tombstones: the only allowed differences, each a fix towards the reference
 * or a JavaScript-only limit. `rows` pins how many corpus rows each one
 * covers once it has landed; a tombstone that has not landed must cover none.
 * Order matters: the first matching tombstone claims a row.
 */
const TOMBSTONES: {
  id: string;
  landed: boolean;
  rows: number;
  matches: (r: Recipe, frozenOutcome: string, currentOutcome: string) => boolean;
}[] = [
  {
    // `search` reported a path once per occurrence; every path is reported
    // once, as the reference does.
    id: "search-dedup",
    landed: true,
    rows: 77,
    matches: (r, a, b) =>
      r.k !== "parse" &&
      sourceOf(r).includes("search") &&
      !throws(a) &&
      !throws(b) &&
      (r.k === "format" || dedup(a) === dedup(b)),
  },
  {
    // A capture inside a quantified array element matched on the byte-code
    // route where the plain route did not, and zero-width repeats produced
    // phantom captures; both routes agree, as the reference does.
    id: "capture-in-repeat",
    landed: true,
    rows: 266,
    matches: (r, a, b) =>
      r.k !== "parse" && /\[.*\(.*@\w+\(.*\)[*+?{]/.test(sourceOf(r)) && !throws(a) && !throws(b),
  },
  {
    // A group or repeat outside an array reported the root path; it reports
    // its inner pattern's paths, as the reference does.
    id: "group-paths",
    landed: true,
    rows: 189,
    matches: (r, a, b) =>
      r.k !== "parse" && /^(@\w+\()?\(/.test(sourceOf(r)) && !throws(a) && !throws(b) && a !== b,
  },
  {
    // A `search` inside a capturing array element was widened to the
    // element's subtree; the machine matches the searched pattern where it
    // stands, as the reference's does.
    id: "search-in-element",
    landed: true,
    rows: 4,
    matches: (r, _a, _b) => r.k !== "parse" && /\[.*@\w+\(search\(/.test(sourceOf(r)),
  },
  {
    // Trailing whitespace was rejected and a prefix parse stopped before it;
    // whitespace after the pattern is consumed, as the reference does.
    id: "trailing-whitespace",
    landed: true,
    rows: 1244,
    matches: (r, a, b) =>
      (r.k === "prefix" && a.split("@")[0] === b.split("@")[0] && a !== b) ||
      (a.startsWith("throw:ExtraData") && (!throws(b) || b.startsWith("throw:ExtraData"))),
  },
  {
    // Integers at or beyond 2^53 never matched a value pattern; exactly
    // representable ones do, as the reference computes.
    id: "big-integers",
    landed: true,
    rows: 56,
    matches: (r, a, b) => bigHaystack(r) && a.startsWith("paths=[]") && !b.startsWith("paths=[]"),
  },
  {
    // Regexes were compiled as written for JavaScript; the reference's
    // dialect is translated, so some patterns start or stop parsing.
    id: "regex-translation",
    landed: true,
    rows: 3430,
    matches: (r, a, b) =>
      sourceOf(r).includes("/") &&
      (a.startsWith("throw:InvalidRegex") !== b.startsWith("throw:InvalidRegex") ||
        (r.k === "parse" && !throws(a) && !throws(b) && a !== b)),
  },
  {
    // A text regex ran over UTF-16 code units; it runs over code points, as
    // the reference's Unicode mode does.
    id: "regex-unicode",
    landed: true,
    rows: 43,
    matches: (r, a, b) =>
      r.k !== "parse" && /^(@\w+\()?\//.test(sourceOf(r)) && !throws(a) && !throws(b) && a !== b,
  },
  {
    // A byte regex ran in Unicode mode over the Latin-1 text; it runs over
    // bytes, and a leading `(?-u)` is accepted, as the reference's byte mode is.
    id: "byte-regex-mode",
    landed: true,
    rows: 0,
    matches: (r, a, b) => /^(h|digest)'\//.test(sourceOf(r)) && a !== b,
  },
  {
    // Regex objects were stored as given: flags were dropped by the display,
    // a global regex kept a cursor between matches, and an empty one printed
    // `/(?:)/`; a pattern stores the regex's source and inline flags, and
    // refuses `g`/`y`.
    id: "regex-objects",
    landed: true,
    rows: 6,
    matches: (r, _a, _b) => r.k === "domain" && /^(text|byte)-regex-/.test(r.s),
  },
  {
    // `date'…'` content was parsed by dcbor's `fromString`; it is parsed as
    // dCBOR diagnostic notation, as the reference does.
    id: "dates-via-dcbor-parse",
    landed: true,
    rows: 266,
    matches: (r, a, b) => sourceOf(r).includes("date'") && a !== b,
  },
  {
    // Numbers displayed in JavaScript's exponent form; they display as the
    // reference's shortest plain decimal.
    id: "number-display",
    landed: true,
    rows: 14,
    matches: (r, a, b) =>
      (r.k === "parse" || r.k === "domain") && /\de[+-]\d/.test(a) && !/\de[+-]\d/.test(b),
  },
  {
    // A capture under a map or tagged value kept its full path and a capture
    // inside an array inside a map was lost; the path is `[container, value]`
    // and every capture is reported, as the reference does.
    id: "capture-depth",
    landed: true,
    rows: 14,
    matches: (r, a, b) =>
      r.k !== "parse" &&
      /@/.test(sourceOf(r)) &&
      /[{]|tagged\(/.test(sourceOf(r)) &&
      !throws(a) &&
      !throws(b) &&
      a !== b,
  },
  {
    // Equal capture paths were reported once; they are reported per
    // occurrence, as the reference does.
    id: "duplicate-captures",
    landed: true,
    rows: 3,
    matches: (r, a, b) => r.k !== "parse" && !throws(a) && a !== b && dedup(b) === a,
  },
  {
    // `tagged(+1, …)` was the tag name `+1`; it is tag 1, as the reference parses it.
    id: "signed-tag-value",
    landed: true,
    rows: 10,
    matches: (r, _a, _b) => sourceOf(r).includes("tagged(+"),
  },
  {
    // Nesting past `maxDepth` overflowed the stack (a `RangeError`); it is
    // `NestingTooDeep`, a JavaScript-only limit.
    id: "nesting-limit",
    landed: true,
    rows: 5,
    matches: (r, _a, b) =>
      (depthOf(sourceOf(r)) > 500 && b.startsWith("throw:NestingTooDeep")) ||
      (r.k === "domain" && /^((try-)?nest-|max-depth-|error-codes)/.test(r.s)),
  },
  {
    // Patterns were plain mutable objects and had no equality; every
    // constructed or parsed pattern is frozen, and `patternEquals` compares
    // them structurally.
    id: "frozen-patterns",
    landed: true,
    rows: 4,
    matches: (r, _a, _b) =>
      r.k === "domain" &&
      [
        "mutate-parsed-pattern",
        "frozen-parsed-pattern",
        "frozen-constructed-pattern",
        "pattern-equals",
      ].includes(r.s),
  },
  {
    // Arguments of the wrong type raised engine errors or were accepted
    // silently, and the API grew `fullMessage`, `maxDepth` and getter
    // accessors; every JavaScript-only row that changed.
    id: "domain-guards",
    landed: true,
    rows: 31,
    matches: (r, _a, _b) => r.k === "domain",
  },
];

const frozen = frozenAdapterFor(frozenMod);
const current = adapterFor(src, currentDeps);

describe("differential: frozen surface vs working tree", () => {
  it("frozen bundle integrity", () => {
    const sha = createHash("sha256")
      .update(readFileSync(join(here, "baseline/dcbor-pattern-baseline.mjs")))
      .digest("hex");
    expect(sha).toBe(FROZEN_SHA256);
  });
  const hits = new Map<string, number>();
  for (const [name, gen] of Object.entries(categories)) {
    it(`category ${name}`, { timeout: 900_000 }, () => {
      let n = 0;
      const diffs: string[] = [];
      for (const recipe of gen()) {
        n++;
        const a = materialize(frozen, recipe);
        const b = materialize(current, recipe);
        if (a === b) continue;
        const tomb = TOMBSTONES.find((t) => t.matches(recipe, a, b));
        if (tomb === undefined || !tomb.landed) {
          diffs.push(
            `${recipeName(recipe)}${tomb === undefined ? "" : ` [${tomb.id} not landed]`}: ${a.slice(0, 80)} !== ${b.slice(0, 80)}`,
          );
        } else {
          hits.set(tomb.id, (hits.get(tomb.id) ?? 0) + 1);
        }
      }
      expect(n).toBeGreaterThan(0);
      expect(diffs).toEqual([]);
    });
  }
  it("every tombstone covers exactly the rows it pins", () => {
    const counts = Object.fromEntries(TOMBSTONES.map((t) => [t.id, hits.get(t.id) ?? 0]));
    expect(counts).toEqual(
      Object.fromEntries(TOMBSTONES.map((t) => [t.id, t.landed ? t.rows : 0])),
    );
  });
});
