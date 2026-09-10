/**
 * `digest`, `digest'ur:digest/…'`, `digest'hex'`, `digest'/regex/'`: matches
 * digests (tag 40001, BCR-2021-002).
 */

import type { Cbor } from "@blockchaincommons/dcbor";
import { tagValue, isTagged, asBytes, bytesToHex, asTaggedValue } from "@blockchaincommons/dcbor";
import type { Digest } from "@blockchaincommons/components";
import type { Path } from "../../format";
import { bytesEqual, bytesStartsWith, bytesToLatin1 } from "./bytes-utils";
import { type PatternRegex, type RegexInput, toPatternRegex } from "../../regex";

/**
 * A pattern over digests: any, an exact digest, a byte prefix, or a regex
 * run over the 32 bytes with one character per byte.
 */
export type DigestPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Value";
      /** The digest the value must equal. */
      readonly value: Digest;
    }
  | {
      /** The discriminant. */
      readonly variant: "Prefix";
      /** The bytes the digest must start with. */
      readonly prefix: Uint8Array;
    }
  | {
      /** The discriminant. */
      readonly variant: "BinaryRegex";
      /** The regex the digest's bytes, one character each, must match. */
      readonly regex: PatternRegex;
    };

const DIGEST_TAG = 40001;
const DIGEST_SIZE = 32;

/** `digest`. */
export const digestPatternAny = (): DigestPattern => Object.freeze({ variant: "Any" });

/** A `DigestPattern` matching this exact digest. */
export const digestPatternValue = (value: Digest): DigestPattern =>
  Object.freeze({
    variant: "Value",
    value,
  });

/** A `DigestPattern` matching digests starting with this byte prefix. */
export const digestPatternPrefix = (prefix: Uint8Array): DigestPattern =>
  Object.freeze({
    variant: "Prefix",
    prefix,
  });

/** A `DigestPattern` whose bytes, one character each, the regex matches. */
export const digestPatternBinaryRegex = (regex: RegexInput): DigestPattern =>
  Object.freeze({ variant: "BinaryRegex", regex: toPatternRegex(regex, "bytes") });

/** The digest's bytes, or `undefined` if the value isn't a digest. */
const extractDigestBytes = (haystack: Cbor): Uint8Array | undefined => {
  if (!isTagged(haystack)) {
    return undefined;
  }
  const tag = tagValue(haystack);
  // Number() handles both number and bigint tag values.
  if (tag === undefined || Number(tag) !== DIGEST_TAG) {
    return undefined;
  }
  const content = asTaggedValue(haystack)?.[1];
  if (content === undefined) {
    return undefined;
  }
  const bytes = asBytes(content);
  if (bytes?.length !== DIGEST_SIZE) {
    return undefined;
  }
  return bytes;
};

/** Whether `pattern` matches the value: a digest equal to `value`, starting with `prefix` or matching `regex`. */
export const digestPatternMatches = (pattern: DigestPattern, haystack: Cbor): boolean => {
  const digestBytes = extractDigestBytes(haystack);
  if (digestBytes === undefined) {
    return false;
  }

  switch (pattern.variant) {
    case "Any":
      return true;
    case "Value":
      return bytesEqual(digestBytes, pattern.value.bytes);
    case "Prefix":
      return bytesStartsWith(digestBytes, pattern.prefix);
    case "BinaryRegex":
      return pattern.regex.regex.test(bytesToLatin1(digestBytes));
  }
};

/** The root path when the digest matches, else none. */
export const digestPatternPaths = (pattern: DigestPattern, haystack: Cbor): Path[] => {
  if (digestPatternMatches(pattern, haystack)) {
    return [[haystack]];
  }
  return [];
};

/** `digest`, `digest'ur:digest/…'`, `digest'hex'` or `digest'/regex/'`. */
export const digestPatternDisplay = (pattern: DigestPattern): string => {
  switch (pattern.variant) {
    case "Any":
      return "digest";
    case "Value":
      return `digest'${pattern.value.toUR().toString()}'`;
    case "Prefix":
      return `digest'${bytesToHex(pattern.prefix)}'`;
    case "BinaryRegex":
      return `digest'/${pattern.regex.source}/'`;
  }
};
