/**
 * Value pattern matching tests for dCBOR patterns.
 */

import { describe, it, expect } from "vitest";
import { cbor } from "@blockchaincommons/dcbor";
import { tryParsePattern, matches } from "../src";

describe("value patterns", () => {
  describe("bool patterns", () => {
    it("bool pattern should match true", () => {
      const result = tryParsePattern("bool");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const trueCbor = cbor(true);
        expect(matches(result.value, trueCbor)).toBe(true);
      }
    });

    it("bool pattern should match false", () => {
      const result = tryParsePattern("bool");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const falseCbor = cbor(false);
        expect(matches(result.value, falseCbor)).toBe(true);
      }
    });

    it("bool pattern should not match number", () => {
      const result = tryParsePattern("bool");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const numCbor = cbor(42);
        expect(matches(result.value, numCbor)).toBe(false);
      }
    });

    it("true pattern should match true", () => {
      const result = tryParsePattern("true");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const trueCbor = cbor(true);
        expect(matches(result.value, trueCbor)).toBe(true);
      }
    });

    it("true pattern should not match false", () => {
      const result = tryParsePattern("true");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const falseCbor = cbor(false);
        expect(matches(result.value, falseCbor)).toBe(false);
      }
    });

    it("false pattern should match false", () => {
      const result = tryParsePattern("false");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const falseCbor = cbor(false);
        expect(matches(result.value, falseCbor)).toBe(true);
      }
    });

    it("false pattern should not match true", () => {
      const result = tryParsePattern("false");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const trueCbor = cbor(true);
        expect(matches(result.value, trueCbor)).toBe(false);
      }
    });
  });

  describe("null patterns", () => {
    it("null pattern should match null", () => {
      const result = tryParsePattern("null");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const nullCbor = cbor(null);
        expect(matches(result.value, nullCbor)).toBe(true);
      }
    });

    it("null pattern should not match number", () => {
      const result = tryParsePattern("null");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const numCbor = cbor(42);
        expect(matches(result.value, numCbor)).toBe(false);
      }
    });
  });

  describe("number patterns", () => {
    it("number pattern should match integer", () => {
      const result = tryParsePattern("number");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const numCbor = cbor(42);
        expect(matches(result.value, numCbor)).toBe(true);
      }
    });

    it("number pattern should match float", () => {
      const result = tryParsePattern("number");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const floatCbor = cbor(3.14);
        expect(matches(result.value, floatCbor)).toBe(true);
      }
    });

    it("number pattern should match negative number", () => {
      const result = tryParsePattern("number");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const negCbor = cbor(-42);
        expect(matches(result.value, negCbor)).toBe(true);
      }
    });

    it("number pattern should not match string", () => {
      const result = tryParsePattern("number");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const strCbor = cbor("hello");
        expect(matches(result.value, strCbor)).toBe(false);
      }
    });

    it("specific number should match that number", () => {
      const result = tryParsePattern("42");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const num42 = cbor(42);
        const num43 = cbor(43);
        expect(matches(result.value, num42)).toBe(true);
        expect(matches(result.value, num43)).toBe(false);
      }
    });

    it("number range should match numbers in range", () => {
      const result = tryParsePattern("1...10");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const num1 = cbor(1);
        const num5 = cbor(5);
        const num10 = cbor(10);
        const num11 = cbor(11);
        expect(matches(result.value, num1)).toBe(true);
        expect(matches(result.value, num5)).toBe(true);
        expect(matches(result.value, num10)).toBe(true);
        expect(matches(result.value, num11)).toBe(false);
      }
    });
  });

  describe("text patterns", () => {
    it("text pattern should match string", () => {
      const result = tryParsePattern("text");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const strCbor = cbor("hello");
        expect(matches(result.value, strCbor)).toBe(true);
      }
    });

    it("text pattern should not match number", () => {
      const result = tryParsePattern("text");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const numCbor = cbor(42);
        expect(matches(result.value, numCbor)).toBe(false);
      }
    });

    it("specific string should match that string", () => {
      const result = tryParsePattern('"hello"');
      expect(result.ok).toBe(true);
      if (result.ok) {
        const hello = cbor("hello");
        const world = cbor("world");
        expect(matches(result.value, hello)).toBe(true);
        expect(matches(result.value, world)).toBe(false);
      }
    });
  });
});
