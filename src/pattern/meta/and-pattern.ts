/**
 * `a & b`: matches when every operand matches.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { Pattern } from "../index";
import type { PatternOps } from "../ops";

/** A pattern that matches when every contained pattern matches. */
export interface AndPattern {
  /** The discriminant. */
  readonly variant: "And";
  /** The operands, every one of which must match. */
  readonly patterns: readonly Pattern[];
}

/** An `AndPattern` over the given patterns. */
export const andPattern = (patterns: readonly Pattern[]): AndPattern =>
  Object.freeze({ variant: "And", patterns: Object.freeze([...patterns]) });

/** Whether every operand matches the haystack. */
export const andPatternMatches = (pattern: AndPattern, haystack: Cbor, ops: PatternOps): boolean =>
  pattern.patterns.every((p) => ops.matches(p, haystack));

/** The root path when every operand matches, else none. */
export const andPatternPaths = (pattern: AndPattern, haystack: Cbor, ops: PatternOps): Path[] =>
  andPatternMatches(pattern, haystack, ops) ? [[haystack]] : [];

/** The operands joined by ` & `. */
export const andPatternDisplay = (
  pattern: AndPattern,
  patternDisplay: (p: Pattern) => string,
): string => pattern.patterns.map(patternDisplay).join(" & ");
