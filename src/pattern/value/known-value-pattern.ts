/**
 * `known`, `'name'`, `'/regex/'`: matches known values (tagged values with
 * tag 40000).
 */

import type { Cbor } from "@blockchaincommons/dcbor";
import { tagValue, isTagged, asUnsigned, asTaggedValue } from "@blockchaincommons/dcbor";
import { KnownValue, getGlobalKnownValuesStore } from "@blockchaincommons/known-values";
import { TAG_KNOWN_VALUE } from "@blockchaincommons/tags";
import type { Path } from "../../format";
import { type PatternRegex, type RegexInput, toPatternRegex } from "../../regex";

/** Whether the tag value equals the expected tag, comparing as bigint so number and bigint agree. */
const tagEquals = (actual: number | bigint | undefined, expected: number | bigint): boolean => {
  if (actual === undefined) return false;
  const actualBig = typeof actual === "bigint" ? actual : BigInt(actual);
  const expectedBig = typeof expected === "bigint" ? expected : BigInt(expected);
  return actualBig === expectedBig;
};

/** A pattern that matches known values: any, an exact value, by registered name, or by regex on the name. */
export type KnownValuePattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Value";
      /** The known value the value must equal. */
      readonly value: KnownValue;
    }
  | {
      /** The discriminant. */
      readonly variant: "Named";
      /** The registered name the known value must have. */
      readonly name: string;
    }
  | {
      /** The discriminant. */
      readonly variant: "Regex";
      /** The regex the known value's registered name must match. */
      readonly regex: PatternRegex;
    };

/** `known`. */
export const knownValuePatternAny = (): KnownValuePattern =>
  Object.freeze({
    variant: "Any",
  });

/** A `KnownValuePattern` matching this exact value. */
export const knownValuePatternValue = (value: KnownValue): KnownValuePattern =>
  Object.freeze({
    variant: "Value",
    value,
  });

/** A `KnownValuePattern` matching the known value registered under this name. */
export const knownValuePatternNamed = (name: string): KnownValuePattern =>
  Object.freeze({
    variant: "Named",
    name,
  });

/** A `KnownValuePattern` matching known values whose registered name matches this regex. */
export const knownValuePatternRegex = (regex: RegexInput): KnownValuePattern =>
  Object.freeze({ variant: "Regex", regex: toPatternRegex(regex, "text") });

/**
 * The known value a tagged CBOR value carries, or `undefined` if it isn't
 * one. The result carries no assigned name; look that up via the global
 * `KNOWN_VALUES` registry.
 */
const extractKnownValue = (haystack: Cbor): KnownValue | undefined => {
  if (!isTagged(haystack)) {
    return undefined;
  }
  const tag = tagValue(haystack);
  if (!tagEquals(tag, TAG_KNOWN_VALUE.value)) {
    return undefined;
  }
  const content = asTaggedValue(haystack)?.[1];
  if (content === undefined) {
    return undefined;
  }
  const value = asUnsigned(content);
  if (value === undefined) {
    return undefined;
  }
  return new KnownValue(value);
};

/** The known value's name from the global registry, falling back to its numeric name. */
const resolveKnownValueName = (knownValue: KnownValue): string => {
  const store = getGlobalKnownValuesStore();
  return store.nameOf(knownValue);
};

/** Whether `pattern` matches the value: a known value equal to `value`, named `name` or whose name matches `regex`. */
export const knownValuePatternMatches = (pattern: KnownValuePattern, haystack: Cbor): boolean => {
  const knownValue = extractKnownValue(haystack);
  if (knownValue === undefined) {
    return false;
  }

  switch (pattern.variant) {
    case "Any":
      return true;
    case "Value":
      return knownValue.valueBigInt === pattern.value.valueBigInt;
    case "Named": {
      const store = getGlobalKnownValuesStore();
      const expected = store.byName(pattern.name);
      if (expected === undefined) return false;
      return knownValue.valueBigInt === expected.valueBigInt;
    }
    case "Regex":
      return pattern.regex.regex.test(resolveKnownValueName(knownValue));
  }
};

/** The root path when the known value matches, else none. */
export const knownValuePatternPaths = (pattern: KnownValuePattern, haystack: Cbor): Path[] => {
  if (knownValuePatternMatches(pattern, haystack)) {
    return [[haystack]];
  }
  return [];
};

/** `known`, `'<name>'`, or `'/regex/'`. */
export const knownValuePatternDisplay = (pattern: KnownValuePattern): string => {
  switch (pattern.variant) {
    case "Any":
      return "known";
    case "Value":
      return `'${pattern.value.name}'`;
    case "Named":
      return `'${pattern.name}'`;
    case "Regex":
      return `'/${pattern.regex.source}/'`;
  }
};
