/**
 * The `Pattern` union and the operations over it: `paths`, `matches`,
 * `display`, `pathsWithCaptures`, `patternEquals`. This module is the only
 * one that knows every pattern kind; the per-kind modules recurse through
 * the `PatternOps` it hands them.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../format";
import type { PatternOps } from "./ops";

export * from "./value";
export * from "./structure";
export * from "./meta";
export * from "./constructors";
export { patternEquals } from "./equals";

import { type ValuePattern, valuePatternPaths, valuePatternDisplay } from "./value";
import {
  type StructurePattern,
  structurePatternPaths,
  structurePatternDisplay,
  structurePatternPathsWithCaptures,
} from "./structure";
import { type MetaPattern, metaPatternPaths, metaPatternDisplay } from "./meta";
import { metaPatternPathsWithCaptures } from "./meta/captures";
import { collectPatternCaptureNames } from "./matcher";
import { run, type Program } from "./vm";
import { requireCbor, requirePattern } from "./guards";

/** A pattern: a value pattern, a structure pattern or a meta pattern. */
export type Pattern =
  | {
      /** The discriminant. */
      readonly kind: "Value";
      /** The value pattern. */
      readonly pattern: ValuePattern;
    }
  | {
      /** The discriminant. */
      readonly kind: "Structure";
      /** The structure pattern. */
      readonly pattern: StructurePattern;
    }
  | {
      /** The discriminant. */
      readonly kind: "Meta";
      /** The meta pattern. */
      readonly pattern: MetaPattern;
    };

/** What a match yields: the matched paths and, by name, the captured paths. */
export interface MatchResult {
  /** Every path the pattern matched, each once, in match order. */
  readonly paths: readonly Path[];
  /** The paths each capture name matched, in match order. */
  readonly captures: ReadonlyMap<string, readonly Path[]>;
}

const emptyCaptures = (): Map<string, Path[]> => new Map();

const pathsOf = (pattern: Pattern, haystack: Cbor): Path[] => {
  switch (pattern.kind) {
    case "Value":
      return valuePatternPaths(pattern.pattern, haystack);
    case "Structure":
      return structurePatternPaths(pattern.pattern, haystack, ops);
    case "Meta":
      return metaPatternPaths(pattern.pattern, haystack, ops);
  }
};

/**
 * Every path in `haystack` the pattern matches.
 *
 * @throws {TypeError} If `pattern` is not a `Pattern` or `haystack` is not a `Cbor`
 */
export const paths = (pattern: Pattern, haystack: Cbor): Path[] =>
  pathsOf(requirePattern(pattern), requireCbor(haystack));

/**
 * Whether the pattern matches `haystack`.
 *
 * @throws {TypeError} If `pattern` is not a `Pattern` or `haystack` is not a `Cbor`
 */
export const matches = (pattern: Pattern, haystack: Cbor): boolean =>
  paths(pattern, haystack).length > 0;

const displayOf = (pattern: Pattern): string => {
  switch (pattern.kind) {
    case "Value":
      return valuePatternDisplay(pattern.pattern);
    case "Structure":
      return structurePatternDisplay(pattern.pattern, displayOf);
    case "Meta":
      return metaPatternDisplay(pattern.pattern, displayOf);
  }
};

/**
 * The canonical text of the pattern, which parses back to an equal pattern.
 *
 * @throws {TypeError} If `pattern` is not a `Pattern`
 */
export const display = (pattern: Pattern): string => displayOf(requirePattern(pattern));

const pathsWithCapturesOf = (pattern: Pattern, haystack: Cbor): MatchResult => {
  const names: string[] = [];
  collectPatternCaptureNames(pattern, names);
  if (names.length === 0) return { paths: pathsOf(pattern, haystack), captures: emptyCaptures() };
  switch (pattern.kind) {
    case "Meta":
      return metaPatternPathsWithCaptures(pattern.pattern, haystack, ops);
    case "Structure": {
      const [structurePaths, captures] = structurePatternPathsWithCaptures(
        pattern.pattern,
        haystack,
        ops,
      );
      return { paths: structurePaths, captures };
    }
    case "Value":
      return { paths: pathsOf(pattern, haystack), captures: emptyCaptures() };
  }
};

/**
 * Every path the pattern matches in `haystack`, with the paths each capture name matched.
 *
 * @throws {TypeError} If `pattern` is not a `Pattern` or `haystack` is not a `Cbor`
 */
export const pathsWithCaptures = (pattern: Pattern, haystack: Cbor): MatchResult =>
  pathsWithCapturesOf(requirePattern(pattern), requireCbor(haystack));

/** The operations the per-kind matchers recurse through. */
export const ops: PatternOps = Object.freeze({
  paths: pathsOf,
  matches: (pattern: Pattern, haystack: Cbor): boolean => pathsOf(pattern, haystack).length > 0,
  pathsWithCaptures: pathsWithCapturesOf,
  display: displayOf,
});

/** Runs a compiled program against a value with this module's operations. */
export const runProgram = (program: Program, root: Cbor): MatchResult => run(program, root, ops);
