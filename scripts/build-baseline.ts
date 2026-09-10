/**
 * Build the frozen bundle of the previous behaviour.
 *
 *   bun scripts/build-baseline.ts
 *
 * Bundles tests/baseline/entry.ts (the package surface plus the inlined
 * dcbor codec) as a single ESM file with every @blockchaincommons sibling
 * INLINED as it is in the workspace at build time, so the bundle keeps the
 * behaviour of this package and its dependencies at the moment it was
 * frozen. Writes tests/baseline/<pkg>-baseline.mjs, the .d.mts surface
 * snapshot, and README.md with the commit and sha256 pinned.
 * `tests/differential.test.ts` compares every corpus recipe between this
 * bundle and the working tree.
 */
import { build } from "tsdown";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { name: string };
const short = pkg.name.replace("@blockchaincommons/", "");
const outDir = join(root, "tests", "baseline");
mkdirSync(outDir, { recursive: true });

await build({
  // Never load the package's own tsdown.config.ts: its settings keep the siblings external.
  config: false,
  entry: { [`${short}-baseline`]: join(outDir, "entry.ts") },
  outDir,
  format: ["esm"],
  dts: false,
  sourcemap: false,
  clean: false,
  target: "es2022",
  noExternal: [/^@blockchaincommons\//],
  inputOptions: {
    onwarn(w, d) {
      if (w.code !== "SOURCEMAP_BROKEN") d(w);
    },
  },
});

const bundle = join(outDir, `${short}-baseline.mjs`);
const text = readFileSync(bundle, "utf8").replace(/\n\/\/# sourceMappingURL=.*\n?$/, "\n");
writeFileSync(bundle, text);
const sha = createHash("sha256").update(text).digest("hex");
const commit = execSync("git rev-parse HEAD", { cwd: root }).toString().trim();
if (existsSync(join(root, "api/index.d.mts"))) {
  copyFileSync(join(root, "api/index.d.mts"), join(outDir, `${short}-baseline.d.mts`));
}
writeFileSync(
  join(outDir, "README.md"),
  `# Frozen build of the previous behaviour

\`${short}-baseline.mjs\` is the self-contained ESM bundle of \`${pkg.name}\` built from
commit \`${commit}\`, the reference for the language wire before the changes this
tree carries. Its sibling \`@blockchaincommons/*\` dependencies are INLINED as
they were in the workspace at that moment, so the bundle keeps their behaviour
after they change. \`${short}-baseline.d.mts\` is the public surface at that commit.

\`tests/differential.test.ts\` runs every corpus recipe through this bundle and
the working tree and asserts identical outcomes outside the enumerated
tombstones; it pins the sha256 below so an accidental rebuild cannot turn the
differential into a self-comparison.

Baseline commit: ${commit}
Baseline sha256: ${sha}
`,
);
console.log(`wrote ${bundle}\nsha256 ${sha}\ncommit ${commit}`);
