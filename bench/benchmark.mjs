/**
 * Baseline vs working tree micro-benchmarks (Phase 2.3).
 *
 *   bun run build && bun bench/benchmark.mjs
 */
import * as baseline from "../tests/baseline/dcbor-pattern-baseline.mjs";
import * as current from "../dist/index.mjs";
import { decodeCbor, encodeCbor, cbor } from "@blockchaincommons/dcbor";

const big = encodeCbor(cbor(Array.from({ length: 10000 }, (_, i) => (i === 7777 ? "needle" : i))));
const deep = encodeCbor(cbor({ a: { b: { c: { d: [42] } } } }));
const api = (m, redesigned) =>
  redesigned
    ? { parse: (s) => m.parsePattern(s), paths: (p, h) => m.pathsWithCaptures(p, decodeCbor(h)).paths.length }
    : { parse: (s) => m.parse(s).value, paths: (p, h) => m.patternPathsWithCaptures(p, m.baselineDecodeCbor ? m.baselineDecodeCbor(h) : decodeCbor(h)).paths.length };
const time = (fn, n) => {
  fn();
  const t0 = performance.now();
  for (let i = 0; i < n; i++) fn();
  return (performance.now() - t0) / n;
};
const run = (m, redesigned) => {
  const a = api(m, redesigned);
  const search = a.parse('search("needle")');
  const nested = a.parse('{"a": {"b": {"c": {"d": [42]}}}}');
  const seq = a.parse("[(number)*, (text)+]");
  const text = encodeCbor(cbor([1, 2, 3, "a", "b"]));
  return [
    ["parse a complex pattern", time(() => a.parse("[(number)*, @x(text | bool), (*)*] | search(@n(number))"), 2000)],
    ["search over 10k elements", time(() => a.paths(search, big), 20)],
    ["deep structure", time(() => a.paths(nested, deep), 2000)],
    ["array sequence", time(() => a.paths(seq, text), 2000)],
  ];
};
const before = run(baseline, false);
const after = run(current, typeof current.parsePattern === "function");
console.log(`${"operation".padEnd(30)} ${"baseline".padStart(10)} ${"current".padStart(10)} ${"ratio".padStart(7)}`);
for (let i = 0; i < before.length; i++) {
  const [label, b] = before[i];
  const c = after[i][1];
  console.log(`${label.padEnd(30)} ${b.toFixed(3).padStart(8)}ms ${c.toFixed(3).padStart(8)}ms ${(c / b).toFixed(2).padStart(6)}×`);
}
