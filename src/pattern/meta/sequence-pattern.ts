/**
 * `a, b, c`: consecutive elements of an array; on its own it matches nothing.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { Pattern } from "../index";

/** A pattern that matches consecutive array elements in order. */
export interface SequencePattern {
  /** The discriminant. */
  readonly variant: "Sequence";
  /** The patterns consecutive elements must match, in order. */
  readonly patterns: readonly Pattern[];
}

/** A `SequencePattern` over the given patterns. */
export const sequencePattern = (patterns: readonly Pattern[]): SequencePattern =>
  Object.freeze({ variant: "Sequence", patterns: Object.freeze([...patterns]) });

/** Always `false`: a sequence only matches inside an array pattern. */
export const sequencePatternMatches = (_pattern: SequencePattern, _haystack: Cbor): boolean =>
  false;

/** Always none: a sequence only matches inside an array pattern. */
export const sequencePatternPaths = (_pattern: SequencePattern, _haystack: Cbor): Path[] => [];

/** The operands joined by `, `; an empty sequence displays as `()` so it re-parses. */
export const sequencePatternDisplay = (
  pattern: SequencePattern,
  patternDisplay: (p: Pattern) => string,
): string =>
  pattern.patterns.length === 0 ? "()" : pattern.patterns.map(patternDisplay).join(", ");

/** The operands. */
export const sequencePatternPatterns = (pattern: SequencePattern): readonly Pattern[] =>
  pattern.patterns;
