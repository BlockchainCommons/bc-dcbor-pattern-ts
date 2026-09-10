/**
 * Value patterns: the leaf kinds a dCBOR value is matched against.
 */

export * from "./bool-pattern";
export * from "./null-pattern";
export * from "./number-pattern";
export * from "./text-pattern";
export * from "./bytestring-pattern";
export * from "./date-pattern";
export * from "./digest-pattern";
export * from "./known-value-pattern";

import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";

import { type BoolPattern, boolPatternPaths, boolPatternDisplay } from "./bool-pattern";
import { type NullPattern, nullPatternPaths, nullPatternDisplay } from "./null-pattern";
import { type NumberPattern, numberPatternPaths, numberPatternDisplay } from "./number-pattern";
import { type TextPattern, textPatternPaths, textPatternDisplay } from "./text-pattern";
import {
  type ByteStringPattern,
  byteStringPatternPaths,
  byteStringPatternDisplay,
} from "./bytestring-pattern";
import { type DatePattern, datePatternPaths, datePatternDisplay } from "./date-pattern";
import { type DigestPattern, digestPatternPaths, digestPatternDisplay } from "./digest-pattern";
import {
  type KnownValuePattern,
  knownValuePatternPaths,
  knownValuePatternDisplay,
} from "./known-value-pattern";

/** The union of the value pattern kinds. */
export type ValuePattern =
  | {
      /** The discriminant. */
      readonly type: "Bool";
      /** The boolean pattern. */
      readonly pattern: BoolPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Null";
      /** The null pattern. */
      readonly pattern: NullPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Number";
      /** The number pattern. */
      readonly pattern: NumberPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Text";
      /** The text pattern. */
      readonly pattern: TextPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "ByteString";
      /** The byte string pattern. */
      readonly pattern: ByteStringPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Date";
      /** The date pattern. */
      readonly pattern: DatePattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Digest";
      /** The digest pattern. */
      readonly pattern: DigestPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "KnownValue";
      /** The known value pattern. */
      readonly pattern: KnownValuePattern;
    };

/** The paths a value pattern matches. */
export const valuePatternPaths = (pattern: ValuePattern, haystack: Cbor): Path[] => {
  switch (pattern.type) {
    case "Bool":
      return boolPatternPaths(pattern.pattern, haystack);
    case "Null":
      return nullPatternPaths(pattern.pattern, haystack);
    case "Number":
      return numberPatternPaths(pattern.pattern, haystack);
    case "Text":
      return textPatternPaths(pattern.pattern, haystack);
    case "ByteString":
      return byteStringPatternPaths(pattern.pattern, haystack);
    case "Date":
      return datePatternPaths(pattern.pattern, haystack);
    case "Digest":
      return digestPatternPaths(pattern.pattern, haystack);
    case "KnownValue":
      return knownValuePatternPaths(pattern.pattern, haystack);
  }
};

/** Whether a value pattern matches. */
export const valuePatternMatches = (pattern: ValuePattern, haystack: Cbor): boolean => {
  return valuePatternPaths(pattern, haystack).length > 0;
};

/** The canonical text of a value pattern. */
export const valuePatternDisplay = (pattern: ValuePattern): string => {
  switch (pattern.type) {
    case "Bool":
      return boolPatternDisplay(pattern.pattern);
    case "Null":
      return nullPatternDisplay(pattern.pattern);
    case "Number":
      return numberPatternDisplay(pattern.pattern);
    case "Text":
      return textPatternDisplay(pattern.pattern);
    case "ByteString":
      return byteStringPatternDisplay(pattern.pattern);
    case "Date":
      return datePatternDisplay(pattern.pattern);
    case "Digest":
      return digestPatternDisplay(pattern.pattern);
    case "KnownValue":
      return knownValuePatternDisplay(pattern.pattern);
  }
};

/** A `Bool` value pattern. */
export const valueBool = (pattern: BoolPattern): ValuePattern =>
  Object.freeze({
    type: "Bool",
    pattern,
  });

/** A `Null` value pattern. */
export const valueNull = (pattern: NullPattern): ValuePattern =>
  Object.freeze({
    type: "Null",
    pattern,
  });

/** A `Number` value pattern. */
export const valueNumber = (pattern: NumberPattern): ValuePattern =>
  Object.freeze({
    type: "Number",
    pattern,
  });

/** A `Text` value pattern. */
export const valueText = (pattern: TextPattern): ValuePattern =>
  Object.freeze({
    type: "Text",
    pattern,
  });

/** A `ByteString` value pattern. */
export const valueByteString = (pattern: ByteStringPattern): ValuePattern =>
  Object.freeze({
    type: "ByteString",
    pattern,
  });

/** A `Date` value pattern. */
export const valueDate = (pattern: DatePattern): ValuePattern =>
  Object.freeze({
    type: "Date",
    pattern,
  });

/** A `Digest` value pattern. */
export const valueDigest = (pattern: DigestPattern): ValuePattern =>
  Object.freeze({
    type: "Digest",
    pattern,
  });

/** A `KnownValue` value pattern. */
export const valueKnownValue = (pattern: KnownValuePattern): ValuePattern =>
  Object.freeze({
    type: "KnownValue",
    pattern,
  });
