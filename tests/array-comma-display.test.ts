/**
 * Array comma display tests.
 *
 * Tests for verifying that array sequence patterns display with proper comma formatting.
 */

import { describe, it, expect } from "vitest";
import { parsePattern, display } from "./common";

describe("array comma display", () => {
  it("test_array_sequence_display_format", () => {
    const pattern = parsePattern('["a", "b"]');
    const displayStr = display(pattern);
    expect(displayStr).toBe('["a", "b"]');
  });

  it("test_complex_array_sequence_display", () => {
    const pattern = parsePattern("[(*)*, 42, (*)*]");
    const displayStr = display(pattern);
    expect(displayStr).toBe("[(*)*, 42, (*)*]");
  });
});
