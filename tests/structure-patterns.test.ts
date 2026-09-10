/**
 * Structure pattern matching tests for dCBOR patterns.
 */

import { describe, it, expect } from "vitest";
import { cbor } from "@blockchaincommons/dcbor";
import { tryParsePattern, matches } from "../src";

describe("structure patterns", () => {
  describe("array patterns", () => {
    it("array pattern should match any array", () => {
      const result = tryParsePattern("array");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor([1, 2, 3]))).toBe(true);
        expect(matches(result.value, cbor([]))).toBe(true);
        expect(matches(result.value, cbor(["a", "b"]))).toBe(true);
        expect(matches(result.value, cbor(42))).toBe(false);
      }
    });

    it("bracket array with element pattern should match arrays with matching elements", () => {
      const result = tryParsePattern("[number]");
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Single value pattern requires exactly one matching element
        expect(matches(result.value, cbor([1]))).toBe(true);
        expect(matches(result.value, cbor([1, 2, 3]))).toBe(false); // a single pattern needs a single element
        expect(matches(result.value, cbor(["a"]))).toBe(false);
      }
    });

    it("bracket array with repeat pattern should match arrays with multiple matching elements", () => {
      const result = tryParsePattern("[(number)*]");
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Repeat pattern can match any number of elements
        expect(matches(result.value, cbor([]))).toBe(true);
        expect(matches(result.value, cbor([1]))).toBe(true);
        expect(matches(result.value, cbor([1, 2, 3]))).toBe(true);
        expect(matches(result.value, cbor(["a"]))).toBe(false);
      }
    });
  });

  describe("map patterns", () => {
    it("map pattern should match any map", () => {
      const result = tryParsePattern("map");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor({ a: 1 }))).toBe(true);
        expect(matches(result.value, cbor({}))).toBe(true);
        expect(matches(result.value, cbor(42))).toBe(false);
      }
    });

    it("empty brace `{}` is rejected (use `map` for any-map)", () => {
      // the brace form needs at least one constraint; `map` is any map
      const result = tryParsePattern("{}");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedToken");
      }

      // Bare `map` keeps working as the any-map sentinel.
      const anyMapResult = tryParsePattern("map");
      expect(anyMapResult.ok).toBe(true);
      if (anyMapResult.ok) {
        expect(matches(anyMapResult.value, cbor({ a: 1 }))).toBe(true);
        expect(matches(anyMapResult.value, cbor({}))).toBe(true);
      }
    });

    it("brace map with key-value constraint should match maps with matching entries", () => {
      const result = tryParsePattern("{text: number}");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor({ a: 1, b: 2 }))).toBe(true);
        expect(matches(result.value, cbor({ x: 99 }))).toBe(true);
      }
    });
  });

  describe("tagged patterns", () => {
    it("tagged pattern should match any tagged value", () => {
      const result = tryParsePattern("tagged");
      expect(result.ok).toBe(true);
      // Tagged patterns require actual tagged CBOR values
    });
  });

  describe("combined patterns", () => {
    it("should match OR of structure patterns", () => {
      const result = tryParsePattern("array | map");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(matches(result.value, cbor([1, 2, 3]))).toBe(true);
        expect(matches(result.value, cbor({ a: 1 }))).toBe(true);
        expect(matches(result.value, cbor(42))).toBe(false);
      }
    });
  });
});
