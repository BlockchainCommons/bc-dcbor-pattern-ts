/**
 * Paths with captures for meta patterns: a capture holds the paths its
 * inner pattern matched; `and` merges, `or` unions across every
 * alternative, `not` exposes none; a repeat outside an array matches once
 * and over an array collects each element's captures; `search` re-anchors
 * nested captures under the path where the pattern was found.
 */
import { asArray, isArray, type Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { MatchResult } from "../index";
import type { PatternOps } from "../ops";
import { collectPatternCaptureNames } from "../matcher";
import type { MetaPattern } from "./index";
import { searchPatternPathsWithCaptures } from "./search-pattern";
import { sequencePatternPaths } from "./sequence-pattern";

const merge = (into: Map<string, Path[]>, from: ReadonlyMap<string, readonly Path[]>): void => {
  for (const [name, paths] of from) {
    const existing = into.get(name);
    if (existing === undefined) into.set(name, [...paths]);
    else existing.push(...paths);
  }
};

const result = (paths: Path[], captures: Map<string, Path[]>): MatchResult => ({ paths, captures });

/** The paths and captures of a meta pattern on the haystack. */
export const metaPatternPathsWithCaptures = (
  pattern: MetaPattern,
  haystack: Cbor,
  ops: PatternOps,
): MatchResult => {
  switch (pattern.type) {
    case "Any":
      return result([[haystack]], new Map());
    case "And": {
      const captures = new Map<string, Path[]>();
      for (const p of pattern.pattern.patterns) {
        const r = ops.pathsWithCaptures(p, haystack);
        if (r.paths.length === 0) return result([], new Map());
        merge(captures, r.captures);
      }
      return result([[haystack]], captures);
    }
    case "Or": {
      const paths: Path[] = [];
      const captures = new Map<string, Path[]>();
      for (const p of pattern.pattern.patterns) {
        const r = ops.pathsWithCaptures(p, haystack);
        paths.push(...r.paths);
        merge(captures, r.captures);
      }
      return result(paths, captures);
    }
    case "Not": {
      const r = ops.pathsWithCaptures(pattern.pattern.pattern, haystack);
      return result(r.paths.length === 0 ? [[haystack]] : [], new Map());
    }
    case "Capture": {
      const r = ops.pathsWithCaptures(pattern.pattern.pattern, haystack);
      const captures = new Map<string, Path[]>();
      merge(captures, r.captures);
      if (r.paths.length > 0) captures.set(pattern.pattern.name, [...r.paths]);
      return result([...r.paths], captures);
    }
    case "Repeat": {
      const { pattern: inner, quantifier } = pattern.pattern;
      const names: string[] = [];
      collectPatternCaptureNames(inner, names);
      if (names.length === 0)
        return result(ops.paths({ kind: "Meta", pattern }, haystack), new Map());
      if (isArray(haystack)) {
        // over an array the repeat consumes the elements
        const items = asArray(haystack) ?? [];
        if (!quantifier.contains(items.length)) return result([], new Map());
        const captures = new Map<string, Path[]>();
        if (items.length === 0 && quantifier.contains(0)) {
          for (const name of names) captures.set(name, []);
        } else {
          for (const item of items) merge(captures, ops.pathsWithCaptures(inner, item).captures);
        }
        return result([[haystack]], captures);
      }
      const matches = ops.paths(inner, haystack).length > 0;
      if (matches && quantifier.contains(1)) {
        const captures = new Map<string, Path[]>();
        merge(captures, ops.pathsWithCaptures(inner, haystack).captures);
        return result([[haystack]], captures);
      }
      if (!matches && quantifier.contains(0)) {
        const captures = new Map<string, Path[]>();
        for (const name of names) captures.set(name, []);
        return result([[haystack]], captures);
      }
      return result([], new Map());
    }
    case "Search": {
      const r = searchPatternPathsWithCaptures(pattern.pattern, haystack, ops);
      return result(r.paths, r.captures);
    }
    case "Sequence":
      return result(sequencePatternPaths(pattern.pattern, haystack), new Map());
  }
};
