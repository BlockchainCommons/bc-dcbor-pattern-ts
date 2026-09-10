/**
 * Paths with captures for meta patterns, with the reference's semantics: a
 * capture holds the paths its inner pattern matched; `and` merges, `or`
 * unions across every alternative, `not` exposes none; a repeat outside an
 * array matches once; `search` re-anchors nested captures under the path
 * where the pattern was found.
 */
import { asArray, asMap, asTaggedValue, isArray, type Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { MetaPattern } from "./index";
import {
  getPatternPaths,
  getPatternPathsWithCaptures,
  type MatchResultInternal,
} from "../match-registry";
import { collectPatternCaptureNames } from "../matcher";
import { sequencePatternPaths } from "./sequence-pattern";

const merge = (into: Map<string, Path[]>, from: Map<string, Path[]>): void => {
  for (const [name, paths] of from) {
    const existing = into.get(name);
    if (existing === undefined) into.set(name, [...paths]);
    else existing.push(...paths);
  }
};

export const metaPatternPathsWithCaptures = (
  pattern: MetaPattern,
  haystack: Cbor,
): MatchResultInternal => {
  switch (pattern.type) {
    case "Any":
      return { paths: [[haystack]], captures: new Map() };
    case "And": {
      const captures = new Map<string, Path[]>();
      for (const p of pattern.pattern.patterns) {
        const r = getPatternPathsWithCaptures(p, haystack);
        if (r.paths.length === 0) return { paths: [], captures: new Map() };
        merge(captures, r.captures);
      }
      return { paths: [[haystack]], captures };
    }
    case "Or": {
      const paths: Path[] = [];
      const captures = new Map<string, Path[]>();
      for (const p of pattern.pattern.patterns) {
        const r = getPatternPathsWithCaptures(p, haystack);
        paths.push(...r.paths);
        merge(captures, r.captures);
      }
      return { paths, captures };
    }
    case "Not": {
      const r = getPatternPathsWithCaptures(pattern.pattern.pattern, haystack);
      return { paths: r.paths.length === 0 ? [[haystack]] : [], captures: new Map() };
    }
    case "Capture": {
      const r = getPatternPathsWithCaptures(pattern.pattern.pattern, haystack);
      const captures = new Map(r.captures);
      if (r.paths.length > 0) captures.set(pattern.pattern.name, [...r.paths]);
      return { paths: r.paths, captures };
    }
    case "Repeat": {
      const { pattern: inner, quantifier } = pattern.pattern;
      const names: string[] = [];
      collectPatternCaptureNames(inner, names);
      if (names.length === 0) {
        const innerPaths = getPatternPaths(inner, haystack);
        if (innerPaths.length > 0)
          return { paths: quantifier.contains(1) ? innerPaths : [], captures: new Map() };
        return { paths: quantifier.contains(0) ? [[haystack]] : [], captures: new Map() };
      }
      if (isArray(haystack)) {
        const items = asArray(haystack) ?? [];
        if (!quantifier.contains(items.length)) return { paths: [], captures: new Map() };
        const captures = new Map<string, Path[]>();
        if (items.length === 0 && quantifier.contains(0)) {
          for (const name of names) captures.set(name, []);
        } else {
          for (const item of items)
            merge(captures, getPatternPathsWithCaptures(inner, item).captures);
        }
        return { paths: [[haystack]], captures };
      }
      const matches = getPatternPaths(inner, haystack).length > 0;
      if (matches && quantifier.contains(1)) {
        return {
          paths: [[haystack]],
          captures: getPatternPathsWithCaptures(inner, haystack).captures,
        };
      }
      if (!matches && quantifier.contains(0)) {
        const captures = new Map<string, Path[]>();
        for (const name of names) captures.set(name, []);
        return { paths: [[haystack]], captures };
      }
      return { paths: [], captures: new Map() };
    }
    case "Search": {
      const results: Path[] = [];
      const captures = new Map<string, Path[]>();
      searchWithCaptures(pattern.pattern.pattern, haystack, [haystack], results, captures);
      const seen = new Set<string>();
      const unique: Path[] = [];
      for (const path of results) {
        const key = path.map((c) => Buffer.from(c.toData()).toString("hex")).join(",");
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(path);
        }
      }
      return { paths: unique, captures };
    }
    case "Sequence":
      return { paths: sequencePatternPaths(pattern.pattern, haystack), captures: new Map() };
  }
};

const searchWithCaptures = (
  inner: unknown,
  cbor: Cbor,
  path: Path,
  results: Path[],
  captures: Map<string, Path[]>,
): void => {
  const r = getPatternPathsWithCaptures(inner, cbor);
  if (r.paths.length > 0) {
    results.push([...path]);
    for (const [name, capturePaths] of r.captures) {
      const list = captures.get(name) ?? [];
      if (
        capturePaths.length > 1 ||
        (capturePaths.length === 1 && capturePaths[0].length > path.length)
      ) {
        // element-level or nested captures keep their relative path under the search location
        for (const capturePath of capturePaths) {
          list.push(capturePath.length > 1 ? [...path, ...capturePath.slice(1)] : [...path]);
        }
      } else {
        list.push([...path]);
      }
      captures.set(name, list);
    }
  }
  const items = asArray(cbor);
  if (items !== undefined) {
    for (const child of items)
      searchWithCaptures(inner, child, [...path, child], results, captures);
    return;
  }
  const map = asMap(cbor);
  if (map !== undefined) {
    for (const [key, value] of map.entries()) {
      searchWithCaptures(inner, key, [...path, key], results, captures);
      searchWithCaptures(inner, value, [...path, value], results, captures);
    }
    return;
  }
  const tagged = asTaggedValue(cbor);
  if (tagged !== undefined)
    searchWithCaptures(inner, tagged[1], [...path, tagged[1]], results, captures);
};
