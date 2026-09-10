/**
 * Golden vector generator. `bun scripts/generate-vectors.ts`.
 * Materialises the golden recipe subset with the WORKING TREE and writes
 * tests/vectors/vectors.json. With VECTORS_FROM=baseline it materialises
 * with the frozen bundle instead (domain rows excepted), the way the file
 * was first created. Regenerating is a deliberate, reviewed act.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  materialize,
  recipeName,
  frozenAdapterFor,
  adapterFor,
  type Recipe,
  type VectorApi,
} from "../tests/vectors/recipes.ts";
import { goldenRecipes } from "../tests/corpus/corpus.ts";
import { currentDeps } from "../tests/vectors/deps.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fromBaseline = process.env["VECTORS_FROM"] === "baseline";
const api: VectorApi = fromBaseline
  ? frozenAdapterFor(await import("../tests/baseline/dcbor-pattern-baseline.mjs"))
  : adapterFor(
      { ...(await import("../src/index.ts")), ...(await import("../src/format.ts")) },
      currentDeps,
    );
const vectors: { name: string; recipe: Recipe; expect: string }[] = [];
for (const recipe of goldenRecipes()) {
  vectors.push({ name: recipeName(recipe), recipe, expect: materialize(api, recipe) });
}
writeFileSync(
  join(root, "tests/vectors/vectors.json"),
  `${JSON.stringify({ count: vectors.length, vectors }, null, 1)}\n`,
);
console.log(
  `wrote ${vectors.length} vectors from ${fromBaseline ? "the frozen baseline" : "the working tree"}`,
);
