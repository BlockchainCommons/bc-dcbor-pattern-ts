/**
 * `bool`, `true`, `false`: matches boolean values.
 */

import type { Cbor } from "@blockchaincommons/dcbor";
import { asBoolean } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";

/** A pattern that matches booleans, by presence or exact value. */
export type BoolPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Value";
      /** The boolean the value must equal. */
      readonly value: boolean;
    };

/** `bool`. */
export const boolPatternAny = (): BoolPattern => Object.freeze({ variant: "Any" });

/** A `BoolPattern` matching this exact value. */
export const boolPatternValue = (value: boolean): BoolPattern =>
  Object.freeze({
    variant: "Value",
    value,
  });

/** Whether `pattern` matches the value: a boolean, equal to `value` when one is given. */
export const boolPatternMatches = (pattern: BoolPattern, haystack: Cbor): boolean => {
  const value = asBoolean(haystack);
  if (value === undefined) {
    return false;
  }
  switch (pattern.variant) {
    case "Any":
      return true;
    case "Value":
      return value === pattern.value;
  }
};

/** The root path when the boolean matches, else none. */
export const boolPatternPaths = (pattern: BoolPattern, haystack: Cbor): Path[] => {
  if (boolPatternMatches(pattern, haystack)) {
    return [[haystack]];
  }
  return [];
};

/** `bool`, `true` or `false`. */
export const boolPatternDisplay = (pattern: BoolPattern): string => {
  switch (pattern.variant) {
    case "Any":
      return "bool";
    case "Value":
      return pattern.value ? "true" : "false";
  }
};
