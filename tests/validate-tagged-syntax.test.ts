/**
 * Tests for validating tagged pattern syntax.
 */

import { describe, it, expect } from "vitest";
import { tryParsePattern, display as patternDisplay } from "../src";

describe("validate tagged syntax", () => {
  it("should validate tagged pattern syntax examples", () => {
    // Test the tagged syntax examples from AGENTS.md
    const testCases: [string, string][] = [
      ["tagged", "Matches any CBOR tagged value"],
      ["tagged(1234, text)", "Matches tagged value with specific u64 tag and content pattern"],
      ["tagged(myTag, number)", "Matches tagged value with named tag and content pattern"],
      [
        "tagged(/test.*/, text)",
        "Matches tagged value with tag name matching regex and content pattern",
      ],
    ];

    for (const [patternStr, description] of testCases) {
      const result = tryParsePattern(patternStr);
      expect(result.ok, `FAILED: \`${patternStr}\` - ${description}`).toBe(true);
      if (result.ok) {
        // Successfully parsed - display the pattern
        const display = patternDisplay(result.value);
        expect(display).toBeDefined();
      }
    }
  });
});
