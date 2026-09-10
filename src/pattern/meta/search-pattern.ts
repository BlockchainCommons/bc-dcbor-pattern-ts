/**
 * `search(p)`: every node of the tree where `p` matches, each once.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import {
  isArray,
  isMap,
  isTagged,
  arrayLength,
  arrayItem,
  mapKeys,
  mapValue,
  asTaggedValue,
  bytesToHex,
  encodeCbor,
} from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { Pattern } from "../index";
import type { PatternOps } from "../ops";

/** A pattern that searches the whole tree for its inner pattern. */
export interface SearchPattern {
  /** The discriminant. */
  readonly variant: "Search";
  /** The pattern searched for at every node of the tree. */
  readonly pattern: Pattern;
}

/** A `SearchPattern` over the given pattern. */
export const searchPattern = (pattern: Pattern): SearchPattern =>
  Object.freeze({ variant: "Search", pattern });

/** The children of a node in search order: elements, then keys and values, then tag content. */
const visitChildren = (haystack: Cbor, visit: (child: Cbor) => void): void => {
  if (isArray(haystack)) {
    const len = arrayLength(haystack);
    if (len === undefined) return;
    for (let i = 0; i < len; i++) {
      const item = arrayItem(haystack, i);
      if (item !== undefined) visit(item);
    }
  } else if (isMap(haystack)) {
    const keys = mapKeys(haystack);
    if (keys === undefined) return;
    for (const key of keys) {
      visit(key);
      const value = mapValue(haystack, key);
      if (value !== undefined && value !== null) visit(value);
    }
  } else if (isTagged(haystack)) {
    const content = asTaggedValue(haystack)?.[1];
    if (content !== undefined) visit(content);
  }
};

/** The paths with any duplicate (by encoded elements) removed, first occurrence kept. */
const uniquePaths = (paths: readonly Path[]): Path[] => {
  const seen = new Set<string>();
  const unique: Path[] = [];
  for (const path of paths) {
    const key = path.map((c) => bytesToHex(encodeCbor(c))).join(",");
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(path);
    }
  }
  return unique;
};

const searchRecursive = (
  pattern: Pattern,
  haystack: Cbor,
  currentPath: Cbor[],
  results: Path[],
  ops: PatternOps,
): void => {
  if (ops.matches(pattern, haystack)) results.push([...currentPath, haystack]);
  visitChildren(haystack, (child) =>
    searchRecursive(pattern, child, [...currentPath, haystack], results, ops),
  );
};

/** Whether any node of the tree matches the inner pattern. */
export const searchPatternMatches = (
  pattern: SearchPattern,
  haystack: Cbor,
  ops: PatternOps,
): boolean => searchPatternPaths(pattern, haystack, ops).length > 0;

/** The path to every node of the tree the inner pattern matches, each once. */
export const searchPatternPaths = (
  pattern: SearchPattern,
  haystack: Cbor,
  ops: PatternOps,
): Path[] => {
  const results: Path[] = [];
  searchRecursive(pattern.pattern, haystack, [], results, ops);
  return uniquePaths(results);
};

/** Paths and captures from a search. */
export interface SearchWithCaptures {
  /** The path to every node the inner pattern matched, each once. */
  readonly paths: Path[];
  /** The paths each capture name matched. */
  readonly captures: Map<string, Path[]>;
}

/**
 * Records a match's captures under the search location: element-level or
 * nested captures keep their relative path below it; a capture of the
 * matched node itself is the location.
 */
const searchRecursiveWithCaptures = (
  pattern: Pattern,
  haystack: Cbor,
  currentPath: Cbor[],
  results: Path[],
  captures: Map<string, Path[]>,
  ops: PatternOps,
): void => {
  const path = [...currentPath, haystack];
  const r = ops.pathsWithCaptures(pattern, haystack);
  if (r.paths.length > 0) {
    results.push(path);
    for (const [name, capturePaths] of r.captures) {
      const list = captures.get(name) ?? [];
      if (
        capturePaths.length > 1 ||
        (capturePaths.length === 1 && capturePaths[0].length > path.length)
      ) {
        for (const capturePath of capturePaths) {
          list.push(capturePath.length > 1 ? [...path, ...capturePath.slice(1)] : [...path]);
        }
      } else {
        list.push([...path]);
      }
      captures.set(name, list);
    }
  }
  visitChildren(haystack, (child) =>
    searchRecursiveWithCaptures(pattern, child, path, results, captures, ops),
  );
};

/** The paths (each once) and captures of every node of the tree the inner pattern matches. */
export const searchPatternPathsWithCaptures = (
  pattern: SearchPattern,
  haystack: Cbor,
  ops: PatternOps,
): SearchWithCaptures => {
  const results: Path[] = [];
  const captures = new Map<string, Path[]>();
  searchRecursiveWithCaptures(pattern.pattern, haystack, [], results, captures, ops);
  return { paths: uniquePaths(results), captures };
};

/** `search(p)`. */
export const searchPatternDisplay = (
  pattern: SearchPattern,
  patternDisplay: (p: Pattern) => string,
): string => `search(${patternDisplay(pattern.pattern)})`;
