/**
 * `*`: matches every value.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";

/** A pattern that matches any value. */
export interface AnyPattern {
  /** The discriminant. */
  readonly variant: "Any";
}

/** The `AnyPattern`. */
export const anyPattern = (): AnyPattern => Object.freeze({ variant: "Any" });

/** Always `true`. */
export const anyPatternMatches = (_pattern: AnyPattern, _haystack: Cbor): boolean => true;

/** The root path. */
export const anyPatternPaths = (_pattern: AnyPattern, haystack: Cbor): Path[] => [[haystack]];

/** `*`. */
export const anyPatternDisplay = (_pattern: AnyPattern): string => "*";
