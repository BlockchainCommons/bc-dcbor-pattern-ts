/**
 * `bstr`, `h'...'`, `h'/regex/'`: matches byte strings.
 */

import type { Cbor } from "@blockchaincommons/dcbor";
import { asBytes, bytesToHex } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import { bytesEqual, bytesToLatin1 } from "./bytes-utils";
import { type PatternRegex, type RegexInput, toPatternRegex } from "../../regex";

/**
 * A pattern over byte strings: any, exact bytes, or a regex run over the
 * bytes with one character per byte (`\x00` names byte 0, `\d` an ASCII
 * digit).
 */
export type ByteStringPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Value";
      /** The bytes the byte string must equal. */
      readonly value: Uint8Array;
    }
  | {
      /** The discriminant. */
      readonly variant: "BinaryRegex";
      /** The regex the bytes, one character each, must match. */
      readonly regex: PatternRegex;
    };

/** `bstr`. */
export const byteStringPatternAny = (): ByteStringPattern =>
  Object.freeze({
    variant: "Any",
  });

/** A `ByteStringPattern` matching these exact bytes. */
export const byteStringPatternValue = (value: Uint8Array): ByteStringPattern =>
  Object.freeze({
    variant: "Value",
    value,
  });

/**
 * A `ByteStringPattern` matching the bytes as a Latin-1 string against a
 * regex — one character per byte, so `\x00` names byte 0.
 *
 * ```typescript
 * byteStringPatternBinaryRegex(/^\x00/)   // starts with byte 0x00
 * byteStringPatternBinaryRegex(/Hello/)   // contains ASCII "Hello"
 * byteStringPatternBinaryRegex(/^\d+$/)   // all ASCII digits
 * ```
 */
export const byteStringPatternBinaryRegex = (regex: RegexInput): ByteStringPattern =>
  Object.freeze({ variant: "BinaryRegex", regex: toPatternRegex(regex, "bytes") });

/** Whether `pattern` matches the value: a byte string equal to `value` or matching `regex`. */
export const byteStringPatternMatches = (pattern: ByteStringPattern, haystack: Cbor): boolean => {
  const value = asBytes(haystack);
  if (value === undefined) {
    return false;
  }
  switch (pattern.variant) {
    case "Any":
      return true;
    case "Value":
      return bytesEqual(value, pattern.value);
    case "BinaryRegex":
      return pattern.regex.regex.test(bytesToLatin1(value));
  }
};

/** The root path when the bytes match, else none. */
export const byteStringPatternPaths = (pattern: ByteStringPattern, haystack: Cbor): Path[] => {
  if (byteStringPatternMatches(pattern, haystack)) {
    return [[haystack]];
  }
  return [];
};

/** `bstr`, `h'<hex>'`, or `h'/regex/'`. */
export const byteStringPatternDisplay = (pattern: ByteStringPattern): string => {
  switch (pattern.variant) {
    case "Any":
      return "bstr";
    case "Value":
      return `h'${bytesToHex(pattern.value)}'`;
    case "BinaryRegex":
      return `h'/${pattern.regex.source}/'`;
  }
};
