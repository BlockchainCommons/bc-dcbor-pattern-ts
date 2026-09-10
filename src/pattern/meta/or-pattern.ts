/**
 * `a | b`: matches when any operand matches.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { Pattern } from "../index";
import type { PatternOps } from "../ops";

/** A pattern that matches when any contained pattern matches. */
export interface OrPattern {
  /** The discriminant. */
  readonly variant: "Or";
  /** The operands, any one of which may match. */
  readonly patterns: readonly Pattern[];
}

/** An `OrPattern` over the given patterns. */
export const orPattern = (patterns: readonly Pattern[]): OrPattern =>
  Object.freeze({ variant: "Or", patterns: Object.freeze([...patterns]) });

/** Whether any operand matches the haystack. */
export const orPatternMatches = (pattern: OrPattern, haystack: Cbor, ops: PatternOps): boolean =>
  pattern.patterns.some((p) => ops.matches(p, haystack));

/** The root path when any operand matches, else none. */
export const orPatternPaths = (pattern: OrPattern, haystack: Cbor, ops: PatternOps): Path[] =>
  orPatternMatches(pattern, haystack, ops) ? [[haystack]] : [];

/** The operands joined by ` | `. */
export const orPatternDisplay = (
  pattern: OrPattern,
  patternDisplay: (p: Pattern) => string,
): string => pattern.patterns.map(patternDisplay).join(" | ");
