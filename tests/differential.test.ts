/**
 * Differential harness (Phase 1.3): every corpus recipe is run with the
 * frozen baseline bundle AND the working tree; displays, paths (as bytes),
 * captures, formatted output and error variants must be identical outside
 * the enumerated tombstones.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import * as baselineMod from "./baseline/dcbor-pattern-baseline.mjs";
import * as src from "../src";
import {
  materialize,
  baselineAdapterFor,
  redesignedAdapterFor,
  recipeName,
  type Recipe,
} from "./vectors/recipes";
import { currentDeps } from "./vectors/deps";
import { categories } from "./corpus/corpus";

const here = dirname(fileURLToPath(import.meta.url));
const BASELINE_SHA256 = readFileSync(join(here, "baseline/README.md"), "utf8").match(
  /Baseline sha256: ([0-9a-f]{64})/,
)?.[1];

/** Tombstones: the only allowed differences. */
const TOMBSTONES: {
  id: string;
  landed: boolean;
  matches: (r: Recipe, baselineOutcome: string, currentOutcome: string) => boolean;
}[] = [
  {
    // The canonical dcbor registers its standard-tag summarisers, so a tag-1
    // value formats as a date where the pre-redesign compat printed `1(…)`,
    // as the reference does.
    id: "T1-date-summary",
    landed: true,
    matches: (r, a, b) =>
      r.k === "format" &&
      /\b1\(\d+\)/.test(a) &&
      /\d{4}-\d\d-\d\d/.test(b) &&
      // the date may be truncated by `maxLength`
      a.replace(/\b1\(\d+\)/g, "") === b.replace(/\d{4}-\d\d-\d\d[^\n ]*/g, ""),
  },
  {
    // P2: `[]` is any array (displayed `[{0,}]`), as in the reference; the
    // baseline read it as the empty array.
    id: "T2-empty-array-is-any-array",
    landed: true,
    matches: (r, _a, _b) => (r.k === "parse" ? r.src : r.pattern).includes("[]"),
  },
  {
    // P1/P3: matching with captures follows the reference's dispatch — meta
    // patterns (groups, and/or/not, captures, search) carry their own
    // semantics instead of the byte-code VM, so a group outside an array
    // matches, `and`/`or`/`search` report the root path, and nested captures
    // keep their element paths. The Rust harness proves each vector.
    id: "T3-meta-capture-semantics",
    landed: true,
    matches: (r, a, b) =>
      r.k !== "parse" &&
      /[()&|!@]|search/.test(r.pattern) &&
      !a.startsWith("throw") &&
      !b.startsWith("throw"),
  },
];

const baseline = baselineAdapterFor(baselineMod);
const current = redesignedAdapterFor(src, currentDeps);

describe("differential: baseline vs working tree", () => {
  it("baseline bundle integrity", () => {
    const sha = createHash("sha256")
      .update(readFileSync(join(here, "baseline/dcbor-pattern-baseline.mjs")))
      .digest("hex");
    expect(sha).toBe(BASELINE_SHA256);
  });
  for (const [name, gen] of Object.entries(categories)) {
    it(`category ${name}`, { timeout: 900_000 }, () => {
      let n = 0;
      const diffs: string[] = [];
      for (const recipe of gen()) {
        n++;
        const a = materialize(baseline, recipe);
        const b = materialize(current, recipe);
        const tomb = TOMBSTONES.find((t) => t.matches(recipe, a, b));
        if (a !== b && tomb?.landed !== true)
          diffs.push(`${recipeName(recipe)}: ${a.slice(0, 80)} !== ${b.slice(0, 80)}`);
      }
      expect(n).toBeGreaterThan(0);
      expect(diffs).toEqual([]);
    });
  }
});
