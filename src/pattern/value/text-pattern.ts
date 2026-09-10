/**
 * `text`, `"value"`, `/regex/`: matches text values.
 */

import type { Cbor } from "@blockchaincommons/dcbor";
import { asText } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import { type PatternRegex, type RegexInput, toPatternRegex } from "../../regex";

/** A pattern that matches text values, by presence, exact value or regex. */
export type TextPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Value";
      /** The string the text must equal. */
      readonly value: string;
    }
  | {
      /** The discriminant. */
      readonly variant: "Regex";
      /** The regex the text must match. */
      readonly regex: PatternRegex;
    };

/** `text`. */
export const textPatternAny = (): TextPattern => Object.freeze({ variant: "Any" });

/** A `TextPattern` matching this exact value. */
export const textPatternValue = (value: string): TextPattern =>
  Object.freeze({
    variant: "Value",
    value,
  });

/** A `TextPattern` matching text against this regex. */
export const textPatternRegex = (regex: RegexInput): TextPattern =>
  Object.freeze({ variant: "Regex", regex: toPatternRegex(regex, "text") });

/** Whether `pattern` matches the value: text equal to `value` or matching `regex`. */
export const textPatternMatches = (pattern: TextPattern, haystack: Cbor): boolean => {
  const value = asText(haystack);
  if (value === undefined) {
    return false;
  }
  switch (pattern.variant) {
    case "Any":
      return true;
    case "Value":
      return value === pattern.value;
    case "Regex":
      return pattern.regex.regex.test(value);
  }
};

/** The root path when the text matches, else none. */
export const textPatternPaths = (pattern: TextPattern, haystack: Cbor): Path[] => {
  if (textPatternMatches(pattern, haystack)) {
    return [[haystack]];
  }
  return [];
};

/** `text`, the quoted and escaped value, or `/regex/`. */
export const textPatternDisplay = (pattern: TextPattern): string => {
  switch (pattern.variant) {
    case "Any":
      return "text";
    case "Value": {
      const escaped = pattern.value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `"${escaped}"`;
    }
    case "Regex":
      return `/${pattern.regex.source}/`;
  }
};
