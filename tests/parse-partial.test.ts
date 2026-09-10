/**
 * Prefix parsing: the pattern at the start of a longer text and how much of
 * it was consumed, the whitespace after the pattern included.
 */

import { describe, it, expect } from "vitest";
import { tryParsePattern, tryParsePatternPrefix, display } from "../src";

describe("parse partial tests", () => {
  it("test_parse_partial_basic", () => {
    const result = tryParsePatternPrefix("true rest");
    expect(result.ok).toBe(true);
    if (result.ok) {
      const { pattern: pattern, length: consumed } = result.value;
      expect(display(pattern)).toBe("true");
      expect(consumed).toBe(5); // "true " with the whitespace after it
    }
  });

  it("test_parse_partial_with_whitespace", () => {
    const result = tryParsePatternPrefix("42    more stuff");
    expect(result.ok).toBe(true);
    if (result.ok) {
      const { pattern: pattern, length: consumed } = result.value;
      expect(display(pattern)).toBe("42");
      expect(consumed).toBe(6); // "42    " with the whitespace after it
    }
  });

  it("test_parse_partial_complete_input", () => {
    const result = tryParsePatternPrefix("false");
    expect(result.ok).toBe(true);
    if (result.ok) {
      const { pattern: pattern, length: consumed } = result.value;
      expect(display(pattern)).toBe("false");
      expect(consumed).toBe(5); // "false".length
    }
  });

  it("test_parse_partial_complex_pattern", () => {
    const result = tryParsePatternPrefix("number | text additional");
    expect(result.ok).toBe(true);
    if (result.ok) {
      const { pattern: _pattern, length: consumed } = result.value;
      // Should parse "number | text" and stop before "additional"
      expect(consumed).toBeGreaterThanOrEqual("number | text".length); // At least "number | text".length
      expect(consumed).toBeLessThan("number | text additional".length); // But not the full string
    }
  });

  it("test_parse_full_compatibility", () => {
    // Existing behavior should still work
    const okResult = tryParsePattern("true");
    expect(okResult.ok).toBe(true);

    // Should still return error for extra data (backward compatibility)
    const extraResult = tryParsePattern("true extra");
    expect(extraResult.ok).toBe(false);
    if (!extraResult.ok) {
      expect(extraResult.error.code).toBe("ExtraData"); // Expected
    }
  });

  it("test_parse_partial_with_valid_following_token", () => {
    const result1 = tryParsePatternPrefix("true false");
    expect(result1.ok).toBe(true);
    if (result1.ok) {
      const { pattern: pattern1, length: consumed1 } = result1.value;
      expect(display(pattern1)).toBe("true");
      expect(consumed1).toBe(5); // "true " with the whitespace after it

      const remaining = "true false".slice(consumed1);
      const result2 = tryParsePatternPrefix(remaining);
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        const { pattern: pattern2, length: consumed2 } = result2.value;
        expect(display(pattern2)).toBe("false");
        expect(consumed2).toBe(5); // "false".length
      }
    }
  });

  it("test_parse_partial_error_cases", () => {
    // Invalid pattern should still error
    const invalidResult = tryParsePatternPrefix("invalid_pattern");
    expect(invalidResult.ok).toBe(false);

    // Empty input should error
    const emptyResult = tryParsePatternPrefix("");
    expect(emptyResult.ok).toBe(false);
  });
});
