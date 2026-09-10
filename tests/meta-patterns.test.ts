/**
 * Meta pattern matching tests for dCBOR patterns.
 */

import { describe, it, expect } from "vitest";
import { cbor } from "@blockchaincommons/dcbor";
import { tryParsePattern, matches } from "../src";

describe("meta patterns", () => {
  describe("any pattern (*)", () => {
    it("should match anything", () => {
      const result = tryParsePattern("*");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor(42))).toBe(true);
        expect(matches(result.value, cbor("hello"))).toBe(true);
        expect(matches(result.value, cbor(true))).toBe(true);
        expect(matches(result.value, cbor(null))).toBe(true);
        expect(matches(result.value, cbor([1, 2, 3]))).toBe(true);
        expect(matches(result.value, cbor({ a: 1 }))).toBe(true);
      }
    });
  });

  describe("or patterns", () => {
    it("should match if any pattern matches", () => {
      const result = tryParsePattern("number | text");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor(42))).toBe(true);
        expect(matches(result.value, cbor("hello"))).toBe(true);
        expect(matches(result.value, cbor(true))).toBe(false);
      }
    });

    it("should handle multiple alternatives", () => {
      const result = tryParsePattern("number | text | bool");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor(42))).toBe(true);
        expect(matches(result.value, cbor("hello"))).toBe(true);
        expect(matches(result.value, cbor(true))).toBe(true);
        expect(matches(result.value, cbor(null))).toBe(false);
      }
    });

    it("true | false should match any bool", () => {
      const result = tryParsePattern("true | false");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor(true))).toBe(true);
        expect(matches(result.value, cbor(false))).toBe(true);
        expect(matches(result.value, cbor(42))).toBe(false);
      }
    });
  });

  describe("and patterns", () => {
    it("should match if all patterns match", () => {
      const result = tryParsePattern("number & 42");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor(42))).toBe(true);
        expect(matches(result.value, cbor(43))).toBe(false);
      }
    });
  });

  describe("not patterns", () => {
    it("should negate match", () => {
      const result = tryParsePattern("!number");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor(42))).toBe(false);
        expect(matches(result.value, cbor("hello"))).toBe(true);
        expect(matches(result.value, cbor(true))).toBe(true);
      }
    });

    it("should work with complex patterns", () => {
      const result = tryParsePattern("!(number | text)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor(42))).toBe(false);
        expect(matches(result.value, cbor("hello"))).toBe(false);
        expect(matches(result.value, cbor(true))).toBe(true);
        expect(matches(result.value, cbor(null))).toBe(true);
      }
    });
  });

  describe("operator precedence", () => {
    it("NOT binds tighter than AND", () => {
      // !number & text should be (!number) & text
      const result = tryParsePattern("!number & text");
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Must be text AND not number
        // "hello" is text and not number - should match
        expect(matches(result.value, cbor("hello"))).toBe(true);
        // 42 is number - should not match
        expect(matches(result.value, cbor(42))).toBe(false);
      }
    });

    it("AND binds tighter than OR", () => {
      // number & 42 | text should be (number & 42) | text
      const result = tryParsePattern("number & 42 | text");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor(42))).toBe(true);
        expect(matches(result.value, cbor("hello"))).toBe(true);
        expect(matches(result.value, cbor(43))).toBe(false);
      }
    });

    it("parentheses override precedence", () => {
      // number & (42 | 43) should match 42 or 43
      const result = tryParsePattern("number & (42 | 43)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor(42))).toBe(true);
        expect(matches(result.value, cbor(43))).toBe(true);
        expect(matches(result.value, cbor(44))).toBe(false);
      }
    });
  });

  describe("grouped patterns", () => {
    it("should handle nested groups", () => {
      const result = tryParsePattern("((number | text))");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor(42))).toBe(true);
        expect(matches(result.value, cbor("hello"))).toBe(true);
      }
    });
  });
});
