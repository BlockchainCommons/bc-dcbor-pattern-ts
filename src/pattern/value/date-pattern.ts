/**
 * `date`, `date'...'`: matches dates (tag 1, RFC 8943).
 */

import type { Cbor } from "@blockchaincommons/dcbor";
import { CborDate, tagValue, isTagged } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import { type PatternRegex, type RegexInput, toPatternRegex } from "../../regex";

/** A pattern over dates: any, an exact date, a range, a bound, an ISO-8601 string, or a regex on it. */
export type DatePattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Value";
      /** The date the value must equal. */
      readonly value: CborDate;
    }
  | {
      /** The discriminant. */
      readonly variant: "Range";
      /** The inclusive earliest date. */
      readonly min: CborDate;
      /** The inclusive latest date. */
      readonly max: CborDate;
    }
  | {
      /** The discriminant. */
      readonly variant: "Earliest";
      /** The inclusive earliest date. */
      readonly value: CborDate;
    }
  | {
      /** The discriminant. */
      readonly variant: "Latest";
      /** The inclusive latest date. */
      readonly value: CborDate;
    }
  | {
      /** The discriminant. */
      readonly variant: "StringValue";
      /** The ISO-8601 string the date must equal. */
      readonly value: string;
    }
  | {
      /** The discriminant. */
      readonly variant: "Regex";
      /** The regex the date's ISO-8601 string must match. */
      readonly regex: PatternRegex;
    };

const DATE_TAG = 1;

/** Whether the tag value equals the expected tag, comparing as bigint so number and bigint agree. */
const tagEquals = (actual: number | bigint | undefined, expected: number | bigint): boolean => {
  if (actual === undefined) return false;
  const actualBig = typeof actual === "bigint" ? actual : BigInt(actual);
  const expectedBig = typeof expected === "bigint" ? expected : BigInt(expected);
  return actualBig === expectedBig;
};

/** `date`. */
export const datePatternAny = (): DatePattern => Object.freeze({ variant: "Any" });

/** A `DatePattern` matching this exact date. */
export const datePatternValue = (value: CborDate): DatePattern =>
  Object.freeze({
    variant: "Value",
    value,
  });

/** A `DatePattern` matching dates within `min..=max`. */
export const datePatternRange = (min: CborDate, max: CborDate): DatePattern =>
  Object.freeze({
    variant: "Range",
    min,
    max,
  });

/** A `DatePattern` matching dates on or after `value`. */
export const datePatternEarliest = (value: CborDate): DatePattern =>
  Object.freeze({
    variant: "Earliest",
    value,
  });

/** A `DatePattern` matching dates on or before `value`. */
export const datePatternLatest = (value: CborDate): DatePattern =>
  Object.freeze({
    variant: "Latest",
    value,
  });

/** A `DatePattern` matching by the date's ISO-8601 string. */
export const datePatternStringValue = (value: string): DatePattern =>
  Object.freeze({
    variant: "StringValue",
    value,
  });

/** A `DatePattern` matching a regex against the date's ISO-8601 string. */
export const datePatternRegex = (regex: RegexInput): DatePattern =>
  Object.freeze({ variant: "Regex", regex: toPatternRegex(regex, "text") });

/** The date a tagged CBOR value carries, or `undefined` if it isn't one. */
const extractDate = (haystack: Cbor): CborDate | undefined => {
  if (!isTagged(haystack)) {
    return undefined;
  }
  const tag = tagValue(haystack);
  if (!tagEquals(tag, DATE_TAG)) {
    return undefined;
  }
  try {
    return CborDate.fromTaggedCbor(haystack);
  } catch {
    return undefined;
  }
};

/** Whether `pattern` matches the value: a date satisfying the value, range, bound, string or regex. */
export const datePatternMatches = (pattern: DatePattern, haystack: Cbor): boolean => {
  const date = extractDate(haystack);
  if (date === undefined) {
    return false;
  }

  switch (pattern.variant) {
    case "Any":
      return true;
    case "Value":
      return date.epochSeconds === pattern.value.epochSeconds;
    case "Range":
      return (
        date.epochSeconds >= pattern.min.epochSeconds &&
        date.epochSeconds <= pattern.max.epochSeconds
      );
    case "Earliest":
      return date.epochSeconds >= pattern.value.epochSeconds;
    case "Latest":
      return date.epochSeconds <= pattern.value.epochSeconds;
    case "StringValue":
      return date.toString() === pattern.value;
    case "Regex":
      return pattern.regex.regex.test(date.toString());
  }
};

/** The root path when the date matches, else none. */
export const datePatternPaths = (pattern: DatePattern, haystack: Cbor): Path[] => {
  if (datePatternMatches(pattern, haystack)) {
    return [[haystack]];
  }
  return [];
};

/** `date`, or `date'...'` with the value, range, bound, string or regex. */
export const datePatternDisplay = (pattern: DatePattern): string => {
  switch (pattern.variant) {
    case "Any":
      return "date";
    case "Value":
      return `date'${pattern.value.toString()}'`;
    case "Range":
      return `date'${pattern.min.toString()}...${pattern.max.toString()}'`;
    case "Earliest":
      return `date'${pattern.value.toString()}...'`;
    case "Latest":
      return `date'...${pattern.value.toString()}'`;
    case "StringValue":
      return `date'${pattern.value}'`;
    case "Regex":
      return `date'/${pattern.regex.source}/'`;
  }
};
