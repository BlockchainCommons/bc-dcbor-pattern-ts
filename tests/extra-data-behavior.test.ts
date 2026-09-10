/**
 * Extra data behavior tests for dCBOR patterns.
 *
 * Tests that the parser correctly rejects patterns with trailing extra data.
 */

import { describe, it, expect } from "vitest";
import { tryParsePattern } from "../src";

describe("extra data behavior", () => {
  it("should parse 'true' successfully with no extra data", () => {
    const result = tryParsePattern("true");
    expect(result.ok).toBe(true);
  });

  it("should fail on 'true extra' - valid pattern followed by extra data", () => {
    const result = tryParsePattern("true extra");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Should be either ExtraData or UnrecognizedToken error
      expect(["ExtraData", "UnrecognizedToken"]).toContain(result.error.code);
    }
  });

  it("should fail on 'true false' - valid pattern followed by another pattern", () => {
    const result = tryParsePattern("true false");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Should be either ExtraData or UnrecognizedToken error
      expect(["ExtraData", "UnrecognizedToken"]).toContain(result.error.code);
    }
  });

  it("should fail on '42    more stuff' - valid pattern followed by whitespace and more", () => {
    const result = tryParsePattern("42    more stuff");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Should be either ExtraData or UnrecognizedToken error
      expect(["ExtraData", "UnrecognizedToken"]).toContain(result.error.code);
    }
  });

  it("should fail on '42 |' - valid pattern followed by a valid token", () => {
    const result = tryParsePattern("42 |");
    expect(result.ok).toBe(false);
    // We just verify it fails
  });
});
