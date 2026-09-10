/**
 * Tests for verifying canonical format of parsed patterns.
 */

import { describe, it, expect } from "vitest";
import { tryParsePattern, display } from "../src";

describe("verify canonical format", () => {
  it("parsing with spaces produces canonical format", () => {
    // Parse patterns with spaces (should work)
    const orWithSpaces = tryParsePattern("bool | text | number");
    const andWithSpaces = tryParsePattern("bool & text & number");

    expect(orWithSpaces.ok).toBe(true);
    expect(andWithSpaces.ok).toBe(true);

    // Parse patterns without spaces (should also work)
    const orNoSpaces = tryParsePattern("bool|text|number");
    const andNoSpaces = tryParsePattern("bool&text&number");

    expect(orNoSpaces.ok).toBe(true);
    expect(andNoSpaces.ok).toBe(true);

    if (orWithSpaces.ok && orNoSpaces.ok) {
      // Both should produce the same canonical format
      expect(display(orNoSpaces.value)).toBe(display(orWithSpaces.value));

      // Verify canonical format has spaces
      expect(display(orWithSpaces.value)).toBe("bool | text | number");
    }

    if (andWithSpaces.ok && andNoSpaces.ok) {
      // Both should produce the same canonical format
      expect(display(andNoSpaces.value)).toBe(display(andWithSpaces.value));

      // Verify canonical format has spaces
      expect(display(andWithSpaces.value)).toBe("bool & text & number");
    }
  });
});
