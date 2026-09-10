/**
 * `(p){n,m}`: a group with a quantifier.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { Pattern } from "../index";
import type { PatternOps } from "../ops";
import { Quantifier } from "../../quantifier";

/** A pattern repeated according to a quantifier. */
export interface RepeatPattern {
  /** The discriminant. */
  readonly variant: "Repeat";
  /** The repeated pattern. */
  readonly pattern: Pattern;
  /** How many repetitions are allowed, and how eagerly they are taken. */
  readonly quantifier: Quantifier;
}

/** A `RepeatPattern` over the given pattern and quantifier. */
export const repeatPattern = (pattern: Pattern, quantifier: Quantifier): RepeatPattern =>
  Object.freeze({ variant: "Repeat", pattern, quantifier });

/** A `RepeatPattern` matching zero or more times (greedy). */
export const repeatZeroOrMore = (pattern: Pattern): RepeatPattern =>
  repeatPattern(pattern, Quantifier.zeroOrMore());

/** A `RepeatPattern` matching one or more times (greedy). */
export const repeatOneOrMore = (pattern: Pattern): RepeatPattern =>
  repeatPattern(pattern, Quantifier.oneOrMore());

/** A `RepeatPattern` matching zero or one time (greedy). */
export const repeatOptional = (pattern: Pattern): RepeatPattern =>
  repeatPattern(pattern, Quantifier.zeroOrOne());

/** A `RepeatPattern` matching exactly `n` times. */
export const repeatExact = (pattern: Pattern, n: number): RepeatPattern =>
  repeatPattern(pattern, Quantifier.exactly(n));

/** A `RepeatPattern` matching between `min` and `max` times (unbounded without `max`). */
export const repeatRange = (pattern: Pattern, min: number, max?: number): RepeatPattern =>
  repeatPattern(
    pattern,
    max !== undefined ? Quantifier.between(min, max) : Quantifier.atLeast(min),
  );

/**
 * The paths of a repeat outside an array: the inner pattern's paths when it
 * matches and the quantifier allows one repetition; the root path when it
 * does not match and the quantifier allows zero; else none.
 */
export const repeatPatternPaths = (
  pattern: RepeatPattern,
  haystack: Cbor,
  ops: PatternOps,
): Path[] => {
  const innerPaths = ops.paths(pattern.pattern, haystack);
  if (innerPaths.length > 0) return pattern.quantifier.contains(1) ? innerPaths : [];
  return pattern.quantifier.contains(0) ? [[haystack]] : [];
};

/** Whether the repeat matches a single value. */
export const repeatPatternMatches = (
  pattern: RepeatPattern,
  haystack: Cbor,
  ops: PatternOps,
): boolean => repeatPatternPaths(pattern, haystack, ops).length > 0;

/** `(p)` followed by the quantifier. */
export const repeatPatternDisplay = (
  pattern: RepeatPattern,
  patternDisplay: (p: Pattern) => string,
): string => `(${patternDisplay(pattern.pattern)})${pattern.quantifier.toString()}`;
