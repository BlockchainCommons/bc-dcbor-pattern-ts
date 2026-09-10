/**
 * `number`, a literal, a comparison or a range: matches numbers.
 */

import type { Cbor } from "@blockchaincommons/dcbor";
import { asNumber, isNumber } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";

/**
 * A number as the shortest decimal that reads back to it, without an
 * exponent: `1e21` is `1000000000000000000000`, `1e-7` is `0.0000001`.
 */
export const formatNumber = (x: number): string => {
  if (!Number.isFinite(x)) return String(x);
  const text = String(x);
  const m = /^(-?)(\d+)(?:\.(\d+))?e([+-]\d+)$/.exec(text);
  if (m === null) return text;
  const [, sign, whole, fraction = "", exp] = m;
  const digits = whole + fraction;
  const point = whole.length + Number(exp);
  if (point <= 0) return `${sign}0.${"0".repeat(-point)}${digits}`;
  if (point >= digits.length) return `${sign}${digits}${"0".repeat(point - digits.length)}`;
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
};

/** The haystack's number, when it is one and a double represents it exactly. */
const exactNumber = (haystack: Cbor): number | undefined => {
  const value = asNumber(haystack);
  if (typeof value !== "bigint") return value;
  const n = Number(value);
  return BigInt(n) === value ? n : undefined;
};

/** A pattern over numbers: any, an exact value, a range, a comparison, or NaN/±Infinity. */
export type NumberPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Value";
      /** The number the value must equal. */
      readonly value: number;
    }
  | {
      /** The discriminant. */
      readonly variant: "Range";
      /** The inclusive lower bound. */
      readonly min: number;
      /** The inclusive upper bound. */
      readonly max: number;
    }
  | {
      /** The discriminant. */
      readonly variant: "GreaterThan";
      /** The exclusive lower bound. */
      readonly value: number;
    }
  | {
      /** The discriminant. */
      readonly variant: "GreaterThanOrEqual";
      /** The inclusive lower bound. */
      readonly value: number;
    }
  | {
      /** The discriminant. */
      readonly variant: "LessThan";
      /** The exclusive upper bound. */
      readonly value: number;
    }
  | {
      /** The discriminant. */
      readonly variant: "LessThanOrEqual";
      /** The inclusive upper bound. */
      readonly value: number;
    }
  | {
      /** The discriminant. */
      readonly variant: "NaN";
    }
  | {
      /** The discriminant. */
      readonly variant: "Infinity";
    }
  | {
      /** The discriminant. */
      readonly variant: "NegInfinity";
    };

/** `number`. */
export const numberPatternAny = (): NumberPattern => Object.freeze({ variant: "Any" });

/** A `NumberPattern` matching this exact value. */
export const numberPatternValue = (value: number): NumberPattern =>
  Object.freeze({
    variant: "Value",
    value,
  });

/** A `NumberPattern` matching numbers within `min..=max`. */
export const numberPatternRange = (min: number, max: number): NumberPattern =>
  Object.freeze({
    variant: "Range",
    min,
    max,
  });

/** A `NumberPattern` matching numbers greater than `value` (`>value`). */
export const numberPatternGreaterThan = (value: number): NumberPattern =>
  Object.freeze({
    variant: "GreaterThan",
    value,
  });

/** A `NumberPattern` matching numbers greater than or equal to `value` (`>=value`). */
export const numberPatternGreaterThanOrEqual = (value: number): NumberPattern =>
  Object.freeze({
    variant: "GreaterThanOrEqual",
    value,
  });

/** A `NumberPattern` matching numbers less than `value` (`<value`). */
export const numberPatternLessThan = (value: number): NumberPattern =>
  Object.freeze({
    variant: "LessThan",
    value,
  });

/** A `NumberPattern` matching numbers less than or equal to `value` (`<=value`). */
export const numberPatternLessThanOrEqual = (value: number): NumberPattern =>
  Object.freeze({
    variant: "LessThanOrEqual",
    value,
  });

/** A `NumberPattern` matching `NaN`. */
export const numberPatternNaN = (): NumberPattern => Object.freeze({ variant: "NaN" });

/** A `NumberPattern` matching positive infinity (`Infinity`). */
export const numberPatternInfinity = (): NumberPattern =>
  Object.freeze({
    variant: "Infinity",
  });

/** A `NumberPattern` matching negative infinity (`-Infinity`). */
export const numberPatternNegInfinity = (): NumberPattern =>
  Object.freeze({
    variant: "NegInfinity",
  });

/** Whether `pattern` matches the value: a number satisfying the literal, range or comparison. */
export const numberPatternMatches = (pattern: NumberPattern, haystack: Cbor): boolean => {
  if (pattern.variant === "Any") return isNumber(haystack);
  const value = exactNumber(haystack);
  if (value === undefined) return false;
  switch (pattern.variant) {
    case "Value":
      return value === pattern.value;
    case "Range":
      return value >= pattern.min && value <= pattern.max;
    case "GreaterThan":
      return value > pattern.value;
    case "GreaterThanOrEqual":
      return value >= pattern.value;
    case "LessThan":
      return value < pattern.value;
    case "LessThanOrEqual":
      return value <= pattern.value;
    case "NaN":
      return Number.isNaN(value);
    case "Infinity":
      return value === Number.POSITIVE_INFINITY;
    case "NegInfinity":
      return value === Number.NEGATIVE_INFINITY;
  }
};

/** The root path when the number matches, else none. */
export const numberPatternPaths = (pattern: NumberPattern, haystack: Cbor): Path[] => {
  if (numberPatternMatches(pattern, haystack)) {
    return [[haystack]];
  }
  return [];
};

/** `number`, the literal, or the comparison/range operator form. */
export const numberPatternDisplay = (pattern: NumberPattern): string => {
  switch (pattern.variant) {
    case "Any":
      return "number";
    case "Value":
      return formatNumber(pattern.value);
    case "Range":
      return `${formatNumber(pattern.min)}...${formatNumber(pattern.max)}`;
    case "GreaterThan":
      return `>${formatNumber(pattern.value)}`;
    case "GreaterThanOrEqual":
      return `>=${formatNumber(pattern.value)}`;
    case "LessThan":
      return `<${formatNumber(pattern.value)}`;
    case "LessThanOrEqual":
      return `<=${formatNumber(pattern.value)}`;
    case "NaN":
      return "NaN";
    case "Infinity":
      return "Infinity";
    case "NegInfinity":
      return "-Infinity";
  }
};
