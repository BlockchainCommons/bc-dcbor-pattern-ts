/**
 * `null`: matches the null value.
 */

import type { Cbor } from "@blockchaincommons/dcbor";
import { isNull } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";

/** A pattern that matches the null value. */
export interface NullPattern {
  /** The discriminant. */
  readonly variant: "Null";
}

/** A `NullPattern`. */
export const nullPattern = (): NullPattern => Object.freeze({ variant: "Null" });

/** Whether the value is null. */
export const nullPatternMatches = (_pattern: NullPattern, haystack: Cbor): boolean => {
  return isNull(haystack);
};

/** The root path when the value is null, else none. */
export const nullPatternPaths = (pattern: NullPattern, haystack: Cbor): Path[] => {
  if (nullPatternMatches(pattern, haystack)) {
    return [[haystack]];
  }
  return [];
};

/** `null`. */
export const nullPatternDisplay = (_pattern: NullPattern): string => {
  return "null";
};
