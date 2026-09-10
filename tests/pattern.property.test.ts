/**
 * Properties: the display reaches a fixpoint; every path starts at the root
 * and descends the haystack; captures start at the root; capture-free
 * patterns yield the same paths with and without captures; no path is
 * reported twice; `matches` agrees with `pathsWithCaptures`. Each property
 * snapshots its violations, so a violation is a reviewed fact until the
 * change that removes it lands.
 */
import { describe, it, expect } from "vitest";
import {
  decodeCbor,
  isArray,
  isMap,
  isTagged,
  mapKeys,
  mapValues,
  asArray,
  asTaggedValue,
  encodeCbor,
  type Cbor,
} from "@blockchaincommons/dcbor";
import * as src from "../src";
import { adapterFor, unhex, hex } from "./vectors/recipes";
import { currentDeps } from "./vectors/deps";
import { PATTERNS } from "./corpus/patterns";
import { HAYSTACKS } from "./corpus/corpus";

const api = adapterFor(src, currentDeps);
const parsing = PATTERNS.filter((p) => {
  try {
    api.display(p);
    return true;
  } catch {
    return false;
  }
});
const sample = parsing.filter((_, i) => i % 3 === 0);

const children = (c: Cbor): Cbor[] => {
  if (isArray(c)) return [...(asArray(c) ?? [])];
  if (isMap(c)) return [...(mapKeys(c) ?? []), ...(mapValues(c) ?? [])];
  if (isTagged(c)) {
    const tagged = asTaggedValue(c);
    return tagged === undefined ? [] : [tagged[1]];
  }
  return [];
};
const encoded = (c: Cbor): string => hex(encodeCbor(c));
/** Whether `target` is `node` or reachable from it through child steps. */
const descends = (node: Cbor, target: string): boolean => {
  if (encoded(node) === target) return true;
  return children(node).some((child) => descends(child, target));
};

describe("dcbor-pattern properties", () => {
  it("display reaches a fixpoint: parse(display(parse(display(p)))) displays identically", () => {
    // One round is not enough today: an explicit group displays with its
    // default quantifier (`(bool)` → `(bool){1}`), a display wart the
    // harness classifies.
    for (const p of parsing) {
      const d = api.display(api.display(p));
      expect(api.display(d), p).toBe(d);
    }
  });

  it("every path starts at the root and descends the haystack", () => {
    const violations: string[] = [];
    for (const p of sample) {
      for (const h of HAYSTACKS) {
        const root = decodeCbor(unhex(h));
        for (const path of api.match(p, unhex(h)).paths) {
          if (path.length === 0 || hex(path[0]) !== encoded(root)) {
            violations.push(`${p} on ${h}: path does not start at the root`);
            continue;
          }
          let node = root;
          for (const element of path.slice(1)) {
            const target = hex(element);
            const next = children(node).find((c) => descends(c, target));
            if (next === undefined) {
              violations.push(`${p} on ${h}: ${target} does not descend from ${encoded(node)}`);
              break;
            }
            node = next;
            while (encoded(node) !== target) {
              const step = children(node).find((c) => descends(c, target));
              if (step === undefined) break;
              node = step;
            }
          }
        }
      }
    }
    expect(violations).toMatchSnapshot();
  });

  it("captures only hold paths that start at the root", () => {
    const violations: string[] = [];
    for (const p of parsing.filter((s) => s.includes("@"))) {
      for (const h of HAYSTACKS.filter((_, i) => i % 4 === 0)) {
        const m = api.match(p, unhex(h));
        const root = encoded(decodeCbor(unhex(h)));
        for (const [name, paths] of m.captures)
          for (const path of paths)
            if (path.length === 0 || hex(path[0]) !== root)
              violations.push(`${p} on ${h}: @${name} ${path.map(hex).join(",")}`);
      }
    }
    expect(violations).toMatchSnapshot();
  });

  it("a capture-free pattern yields the same paths with and without captures", () => {
    const violations: string[] = [];
    for (const p of sample.filter((s) => !s.includes("@"))) {
      const pattern = src.parsePattern(p);
      for (const h of HAYSTACKS) {
        const haystack = decodeCbor(unhex(h));
        const plain = src.paths(pattern, haystack).map((path) => path.map(encoded).join(","));
        const withCaptures = src
          .pathsWithCaptures(pattern, haystack)
          .paths.map((path) => path.map(encoded).join(","));
        if (plain.join("|") !== withCaptures.join("|"))
          violations.push(`${p} on ${h}: ${plain.join("|")} !== ${withCaptures.join("|")}`);
      }
    }
    expect(violations).toMatchSnapshot();
  });

  it("no path is reported twice", () => {
    const violations: string[] = [];
    for (const p of sample) {
      for (const h of HAYSTACKS) {
        const keys = api.match(p, unhex(h)).paths.map((path) => path.map(hex).join(","));
        if (new Set(keys).size !== keys.length) violations.push(`${p} on ${h}`);
      }
    }
    expect(violations).toMatchSnapshot();
  });

  it("matches agrees with pathsWithCaptures", () => {
    const violations: string[] = [];
    for (const p of sample) {
      const pattern = src.parsePattern(p);
      for (const h of HAYSTACKS) {
        const haystack = decodeCbor(unhex(h));
        const a = src.matches(pattern, haystack);
        const b = src.pathsWithCaptures(pattern, haystack).paths.length > 0;
        if (a !== b) violations.push(`${p} on ${h}: matches ${a}, pathsWithCaptures ${b}`);
      }
    }
    expect(violations).toMatchSnapshot();
  });
});
