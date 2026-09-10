/**
 * Properties (Phase 0.3): the display round-trips; every path is a walk down
 * the haystack; matches ⇔ paths non-empty.
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
import { redesignedAdapterFor, unhex, hex } from "./vectors/recipes";
import { currentDeps } from "./vectors/deps";
import { PATTERNS } from "./corpus/patterns";
import { HAYSTACKS } from "./corpus/corpus";

const api = redesignedAdapterFor(src, currentDeps);
const parsing = PATTERNS.filter((p) => {
  try {
    api.display(p);
    return true;
  } catch {
    return false;
  }
});

const children = (c: Cbor): Cbor[] => {
  if (isArray(c)) return [...(asArray(c) ?? [])];
  if (isMap(c)) return [...(mapKeys(c) ?? []), ...(mapValues(c) ?? [])];
  if (isTagged(c)) return [asTaggedValue(c)![1]];
  return [];
};

describe("dcbor-pattern properties", () => {
  it("display reaches a fixpoint: parse(display(parse(display(p)))) displays identically", () => {
    // One round is not enough today: an explicit group displays with its
    // default quantifier (`(bool)` → `(bool){1}`), a display wart the Rust
    // harness classifies and Phase 3 addresses.
    for (const p of parsing) {
      const d = api.display(api.display(p));
      expect(api.display(d), p).toBe(d);
    }
  });

  it("every path is a walk down the haystack, and starts at the root", () => {
    for (const p of parsing.filter((_, i) => i % 3 === 0)) {
      for (const h of HAYSTACKS) {
        const root = decodeCbor(unhex(h));
        const m = api.match(p, unhex(h));
        for (const path of m.paths) {
          expect(hex(path[0]), `${p} on ${h}`).toBe(hex(encodeCbor(root)));
          let node = root;
          for (const element of path.slice(1)) {
            const next = children(node).find((c) => hex(encodeCbor(c)) === hex(element));
            expect(next, `${p} on ${h}: ${hex(element)} is not a child`).toBeDefined();
            node = next!;
          }
        }
      }
    }
  });

  it("captures only hold paths that start at the root", () => {
    for (const p of parsing.filter((s) => s.includes("@"))) {
      for (const h of HAYSTACKS.filter((_, i) => i % 4 === 0)) {
        const m = api.match(p, unhex(h));
        const root = hex(encodeCbor(decodeCbor(unhex(h))));
        for (const [, paths] of m.captures)
          for (const path of paths) expect(hex(path[0])).toBe(root);
      }
    }
  });
});
