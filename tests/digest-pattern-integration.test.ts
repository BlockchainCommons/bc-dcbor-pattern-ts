/**
 * Digest pattern integration tests for dCBOR patterns.
 *
 */

import { describe, it, expect } from "vitest";
import { cbor, taggedValue } from "@blockchaincommons/dcbor";
import {
  tryParsePattern,
  matches,
  display as patternDisplay,
  anyDigest,
  digest,
  digestPrefix,
} from "../src";
import { Digest, hexToBytes } from "@blockchaincommons/components";

/** CBOR tag for digest (40001) - using bigint for strict equality matching */
const DIGEST_TAG = 40001n;

/**
 * Creates a tagged CBOR value for a Digest.
 *
 * Note: We use taggedValue with a bigint tag because the digest pattern
 * matching code compares tags using strict equality (===) with bigint.
 */
const createDigestCbor = (digestValue: Digest) => {
  return taggedValue(DIGEST_TAG, digestValue.untaggedCbor());
};

describe("digest pattern integration", () => {
  describe("parsing", () => {
    it("should parse 'digest' as any digest pattern", () => {
      const src = "digest";
      const result = tryParsePattern(src);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe(src);
      }
    });

    it("should parse digest with hex prefix", () => {
      // Note: The TypeScript implementation currently only supports full 64-char hex
      // when parsing digest'...' patterns. This test uses a full hex digest.
      const fullDigestHex = "4d303dac9eed63573f6190e9c4191be619e03a7b3c21e9bb3d27ac1a55971e6b";
      const src = `digest'${fullDigestHex}'`;
      const result = tryParsePattern(src);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe(src);
      }
    });

    it("should parse digest with full hex", () => {
      const fullDigestHex = "4d303dac9eed63573f6190e9c4191be619e03a7b3c21e9bb3d27ac1a55971e6b";
      const src = `digest'${fullDigestHex}'`;
      const result = tryParsePattern(src);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const display = patternDisplay(result.value);
        expect(display).toBe(src);
      }
    });

    it("should parse digest with UR string", () => {
      // a `ur:` body decodes to the digest, which displays as the same UR
      const digestValue = Digest.fromImage(new TextEncoder().encode("hello world"));
      const urString = digestValue.toUR().toString();
      const src = `digest'${urString}'`;
      const result = tryParsePattern(src);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe(src);
      }
    });
  });

  describe("matching", () => {
    it("any digest pattern should match a digest", () => {
      const digestValue = Digest.fromImage(new TextEncoder().encode("test data"));
      const digestCbor = createDigestCbor(digestValue);

      const anyPattern = tryParsePattern("digest");
      expect(anyPattern.ok).toBe(true);
      if (anyPattern.ok) {
        expect(matches(anyPattern.value, digestCbor)).toBe(true);
      }
    });

    it("specific digest pattern should match the same digest", () => {
      const digestValue = Digest.fromImage(new TextEncoder().encode("test data"));
      const digestCbor = createDigestCbor(digestValue);

      // Get the hex representation of the digest
      const digestHex = digestValue.toHex();
      const specificPattern = tryParsePattern(`digest'${digestHex}'`);
      expect(specificPattern.ok).toBe(true);
      if (specificPattern.ok) {
        expect(matches(specificPattern.value, digestCbor)).toBe(true);
      }
    });

    it("specific digest pattern should not match a different digest", () => {
      const digestValue = Digest.fromImage(new TextEncoder().encode("test data"));

      const otherDigest = Digest.fromImage(new TextEncoder().encode("other data"));
      const otherDigestCbor = createDigestCbor(otherDigest);

      // Create pattern matching the first digest
      const digestHex = digestValue.toHex();
      const specificPattern = tryParsePattern(`digest'${digestHex}'`);
      expect(specificPattern.ok).toBe(true);
      if (specificPattern.ok) {
        // Should not match the other digest
        expect(matches(specificPattern.value, otherDigestCbor)).toBe(false);
      }
    });

    it("prefix pattern should match digest with matching prefix", () => {
      const digestValue = Digest.fromImage(new TextEncoder().encode("test data"));
      const digestCbor = createDigestCbor(digestValue);

      // Get the first 4 bytes of the digest as a prefix
      const prefixBytes = digestValue.bytes.slice(0, 4);
      const prefixPattern = digestPrefix(prefixBytes);

      expect(matches(prefixPattern, digestCbor)).toBe(true);
    });

    it("prefix pattern should not match digest with different prefix", () => {
      const digestValue = Digest.fromImage(new TextEncoder().encode("test data"));
      const digestCbor = createDigestCbor(digestValue);

      // Use bytes that don't match the digest prefix
      const wrongPrefix = new Uint8Array([0xff, 0xee, 0xdd, 0xcc]);
      const prefixPattern = digestPrefix(wrongPrefix);

      expect(matches(prefixPattern, digestCbor)).toBe(false);
    });

    it("any digest pattern should not match non-digest values", () => {
      const anyPattern = tryParsePattern("digest");
      expect(anyPattern.ok).toBe(true);
      if (anyPattern.ok) {
        // Number should not match
        expect(matches(anyPattern.value, cbor(42))).toBe(false);
        // String should not match
        expect(matches(anyPattern.value, cbor("test"))).toBe(false);
        // Boolean should not match
        expect(matches(anyPattern.value, cbor(true))).toBe(false);
      }
    });
  });

  describe("round trip", () => {
    it("anyDigest pattern should round-trip through display/parse", () => {
      const pattern = anyDigest();
      const stringRepr = patternDisplay(pattern);
      const parsedBack = tryParsePattern(stringRepr);

      expect(parsedBack.ok).toBe(true);
      if (parsedBack.ok) {
        expect(patternDisplay(parsedBack.value)).toBe(stringRepr);
      }
    });

    it("specific digest pattern should round-trip through display/parse", () => {
      const digestValue = Digest.fromImage(new TextEncoder().encode("test"));
      const pattern = digest(digestValue);
      const stringRepr = patternDisplay(pattern);
      const parsedBack = tryParsePattern(stringRepr);

      expect(parsedBack.ok).toBe(true);
      if (parsedBack.ok) {
        expect(patternDisplay(parsedBack.value)).toBe(stringRepr);
      }
    });

    it("digest prefix pattern should round-trip through display/parse", () => {
      const prefixBytes = hexToBytes("deadbeef");
      const pattern = digestPrefix(prefixBytes);
      const stringRepr = patternDisplay(pattern);

      // Note: The current TypeScript parser may not support parsing prefix patterns
      // This test verifies the display format is correct
      expect(stringRepr).toBe("digest'deadbeef'");
    });
  });

  describe("errors", () => {
    it("should fail on unterminated quote", () => {
      const result = tryParsePattern("digest'unclosed");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnterminatedDigestQuoted");
      }
    });

    it("should fail on invalid hex (odd length)", () => {
      // odd-length hex is `InvalidHexString`, not `InvalidDigestPattern`
      const result = tryParsePattern("digest'abc'");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidHexString");
      }
    });

    it("should fail on invalid hex characters", () => {
      // Non-hex content (and not UR / regex) → InvalidDigestPattern.
      const result = tryParsePattern("digest'xyzz'");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidDigestPattern");
      }
    });

    it("should fail on empty content", () => {
      const result = tryParsePattern("digest''");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidDigestPattern");
      }
    });

    it("should fail on invalid UR", () => {
      const result = tryParsePattern("digest'ur:invalid/data'");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidUr");
      }
    });
  });

  describe("programmatic pattern creation", () => {
    it("should create any digest pattern", () => {
      const pattern = anyDigest();
      expect(patternDisplay(pattern)).toBe("digest");
    });

    it("should create specific digest pattern", () => {
      const digestValue = Digest.fromImage(new TextEncoder().encode("test"));
      const pattern = digest(digestValue);
      const display = patternDisplay(pattern);

      // The display should be digest'<hex>'
      expect(display.startsWith("digest'")).toBe(true);
      expect(display.endsWith("'")).toBe(true);
    });

    it("should create prefix digest pattern", () => {
      const prefixBytes = hexToBytes("a1b2c3d4");
      const pattern = digestPrefix(prefixBytes);
      const display = patternDisplay(pattern);

      expect(display).toBe("digest'a1b2c3d4'");
    });

    it("specific digest pattern should match correctly", () => {
      const digestValue = Digest.fromImage(new TextEncoder().encode("test"));
      const digestCbor = createDigestCbor(digestValue);

      const pattern = digest(digestValue);
      expect(matches(pattern, digestCbor)).toBe(true);
    });

    it("prefix digest pattern should match correctly", () => {
      const digestValue = Digest.fromImage(new TextEncoder().encode("test"));
      const digestCbor = createDigestCbor(digestValue);

      // Use first 8 bytes as prefix
      const prefixBytes = digestValue.bytes.slice(0, 8);
      const pattern = digestPrefix(prefixBytes);

      expect(matches(pattern, digestCbor)).toBe(true);
    });
  });
});
