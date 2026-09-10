/**
 * Infinity pattern integration tests for dCBOR patterns.
 */

import { describe, it, expect } from "vitest";
import { cbor } from "@blockchaincommons/dcbor";
import { tryParsePattern, display, matches } from "../src";

describe("infinity pattern integration", () => {
  it("should parse and match infinity patterns", () => {
    // Test parsing and matching of infinity patterns

    // Parse Infinity pattern
    const infResult = tryParsePattern("Infinity");
    expect(infResult.ok).toBe(true);
    if (infResult.ok) {
      expect(display(infResult.value)).toBe("Infinity");
    }

    // Parse -Infinity pattern
    const negInfResult = tryParsePattern("-Infinity");
    expect(negInfResult.ok).toBe(true);
    if (negInfResult.ok) {
      expect(display(negInfResult.value)).toBe("-Infinity");
    }

    // Create CBOR values
    const infCbor = cbor(Infinity);
    const negInfCbor = cbor(-Infinity);
    const nanCbor = cbor(NaN);
    const regularCbor = cbor(42.0);

    // Test positive infinity pattern matching
    if (infResult.ok) {
      expect(matches(infResult.value, infCbor)).toBe(true);
      expect(matches(infResult.value, negInfCbor)).toBe(false);
      expect(matches(infResult.value, nanCbor)).toBe(false);
      expect(matches(infResult.value, regularCbor)).toBe(false);
    }

    // Test negative infinity pattern matching
    if (negInfResult.ok) {
      expect(matches(negInfResult.value, infCbor)).toBe(false);
      expect(matches(negInfResult.value, negInfCbor)).toBe(true);
      expect(matches(negInfResult.value, nanCbor)).toBe(false);
      expect(matches(negInfResult.value, regularCbor)).toBe(false);
    }

    // Test parsing still works for NaN
    const nanResult = tryParsePattern("NaN");
    expect(nanResult.ok).toBe(true);
    if (nanResult.ok) {
      expect(display(nanResult.value)).toBe("NaN");
      expect(matches(nanResult.value, infCbor)).toBe(false);
      expect(matches(nanResult.value, negInfCbor)).toBe(false);
      expect(matches(nanResult.value, nanCbor)).toBe(true);
      expect(matches(nanResult.value, regularCbor)).toBe(false);
    }
  });
});
