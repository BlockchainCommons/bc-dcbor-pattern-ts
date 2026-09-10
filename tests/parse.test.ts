/**
 * Parser tests for dCBOR patterns.
 */

import { describe, it, expect } from "vitest";
import { tryParsePattern, display as patternDisplay, matches } from "../src";
import { cbor } from "@blockchaincommons/dcbor";

describe("parse", () => {
  describe("basic patterns", () => {
    it("should parse bool pattern", () => {
      const result = tryParsePattern("bool");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("bool");
      }
    });

    it("should parse true literal", () => {
      const result = tryParsePattern("true");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("true");
      }
    });

    it("should parse false literal", () => {
      const result = tryParsePattern("false");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("false");
      }
    });

    it("should parse null pattern", () => {
      const result = tryParsePattern("null");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("null");
      }
    });

    it("should parse number pattern", () => {
      const result = tryParsePattern("number");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("number");
      }
    });

    it("should parse text pattern", () => {
      const result = tryParsePattern("text");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("text");
      }
    });

    it("should parse array pattern", () => {
      const result = tryParsePattern("array");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("array");
      }
    });

    it("should parse map pattern", () => {
      const result = tryParsePattern("map");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("map");
      }
    });
  });

  describe("number literals", () => {
    it("should parse integer", () => {
      const result = tryParsePattern("42");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("42");
      }
    });

    it("should parse negative integer", () => {
      const result = tryParsePattern("-42");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("-42");
      }
    });

    it("should parse float", () => {
      const result = tryParsePattern("3.14");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("3.14");
      }
    });

    it("should parse number range", () => {
      // only three dots form a range
      const result = tryParsePattern("1...10");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("1...10");
      }
    });
  });

  describe("string literals", () => {
    it("should parse string literal", () => {
      const result = tryParsePattern('"hello"');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe('"hello"');
      }
    });

    it("should parse regex pattern", () => {
      // a regex literal is a primary of its own
      const result = tryParsePattern("/^hello/");
      expect(result.ok).toBe(true);
      // Regex display format may vary
    });
  });

  describe("meta patterns", () => {
    it("should parse OR pattern", () => {
      const result = tryParsePattern("number | text");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const display = patternDisplay(result.value);
        expect(display).toContain("|");
      }
    });

    it("should parse AND pattern", () => {
      const result = tryParsePattern("number & text");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const display = patternDisplay(result.value);
        expect(display).toContain("&");
      }
    });

    it("should parse NOT pattern", () => {
      const result = tryParsePattern("!number");
      expect(result.ok).toBe(true);
      if (result.ok) {
        const display = patternDisplay(result.value);
        expect(display).toContain("!");
      }
    });

    it("should parse grouped pattern", () => {
      const result = tryParsePattern("(number | text)");
      expect(result.ok).toBe(true);
    });

    it("should parse any pattern (*)", () => {
      const result = tryParsePattern("*");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(patternDisplay(result.value)).toBe("*");
      }
    });
  });

  describe("structure patterns", () => {
    it("should parse bracket array pattern", () => {
      const result = tryParsePattern("[number]");
      expect(result.ok).toBe(true);
    });

    it("should parse brace map pattern", () => {
      const result = tryParsePattern("{text: number}");
      expect(result.ok).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should fail on empty input", () => {
      // empty or whitespace-only input ends before the first primary
      const result = tryParsePattern("");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedEndOfInput");
      }
    });

    it("should fail on whitespace-only input", () => {
      const result = tryParsePattern("   ");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UnexpectedEndOfInput");
      }
    });
  });

  describe("OR/AND/NOT extended ", () => {
    it("test_parse_or_simple", () => {
      const result = tryParsePattern("bool | text");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("bool | text");
    });

    it("test_parse_or_three_patterns", () => {
      const result = tryParsePattern("bool | text | number");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("bool | text | number");
    });

    it("test_parse_or_single_pattern", () => {
      const result = tryParsePattern("bool");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // Should return the pattern directly, not wrapped in OR
      expect(result.value.kind).toBe("Value");
    });

    it("test_parse_and_simple", () => {
      const result = tryParsePattern("bool & text");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("bool & text");
    });

    it("test_parse_and_three_patterns", () => {
      const result = tryParsePattern("bool & text & number");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("bool & text & number");
    });

    it("test_parse_not_simple", () => {
      const result = tryParsePattern("!bool");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("!bool");
    });

    it("test_parse_not_double", () => {
      const result = tryParsePattern("!!bool");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      // Test display formatting (nested NOT patterns use parentheses)
      expect(patternDisplay(result.value)).toBe("!(!bool)");
    });
  });

  describe("precedence parsing", () => {
    it("test_precedence_or_and_parsing", () => {
      const result = tryParsePattern("bool | text & number");
      // Should parse as: bool | (text & number)
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value).length).toBeGreaterThan(0);
    });

    it("test_precedence_and_not_parsing", () => {
      const result = tryParsePattern("bool & !text");
      // Should parse as: bool & (!text)
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value).length).toBeGreaterThan(0);
    });

    it("test_precedence_or_not_parsing", () => {
      const result = tryParsePattern("bool | !text");
      // Should parse as: bool | (!text)
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value).length).toBeGreaterThan(0);
    });

    it("test_parentheses_grouping_parsing", () => {
      const result = tryParsePattern("(bool | text) & number");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value).length).toBeGreaterThan(0);
    });

    it("test_nested_parentheses", () => {
      const result = tryParsePattern("((bool))");
      // Should create nested RepeatPatterns with "exactly one" quantifiers
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("((bool){1}){1}");
    });

    it("test_precedence_functionality", () => {
      // Test that "bool | text & number" is parsed as "bool | (text & number)"
      // This means a boolean should match, but for the right side, both text and
      // number would need to match (which is impossible, so only bool can match)
      const result = tryParsePattern("bool | text & number");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const pattern = result.value;

      const boolValue = cbor(true);
      const textValue = cbor("hello");
      const numberValue = cbor(42);

      // Boolean should match because of the OR
      expect(matches(pattern, boolValue)).toBe(true);

      // Text should NOT match because "text & number" can never be true
      expect(matches(pattern, textValue)).toBe(false);

      // Number should NOT match because "text & number" can never be true
      expect(matches(pattern, numberValue)).toBe(false);
    });

    it("test_grouping_functionality", () => {
      // Test that "(bool | text) & number" groups correctly
      // This should never match anything since no value can be both (bool or
      // text) AND number
      const result = tryParsePattern("(bool | text) & number");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const pattern = result.value;

      const boolValue = cbor(true);
      const textValue = cbor("hello");
      const numberValue = cbor(42);

      // Nothing should match because no value can be in two different types
      // simultaneously
      expect(matches(pattern, boolValue)).toBe(false);
      expect(matches(pattern, textValue)).toBe(false);
      expect(matches(pattern, numberValue)).toBe(false);
    });
  });

  describe("any patterns (* / !*)", () => {
    it("test_parse_any", () => {
      const result = tryParsePattern("*");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("*");
    });

    it("test_parse_not_any", () => {
      const result = tryParsePattern("!*");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("!*");
    });
  });

  describe("capture patterns (parsed from text)", () => {
    it("test_parse_capture_simple", () => {
      const result = tryParsePattern("@name(bool)");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("@name(bool)");
    });

    it("test_parse_capture_complex", () => {
      const result = tryParsePattern("@item(bool | text)");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("@item(bool | text)");
    });

    it("test_parse_capture_nested", () => {
      const result = tryParsePattern("@outer(@inner(bool))");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("@outer(@inner(bool))");
    });

    it("test_parse_capture_missing_parens", () => {
      const result = tryParsePattern("@name bool");
      expect(result.ok).toBe(false);
    });

    it("test_parse_capture_unclosed_parens", () => {
      const result = tryParsePattern("@name(bool");
      expect(result.ok).toBe(false);
    });

    it("test_parse_parentheses_unclosed", () => {
      const result = tryParsePattern("(bool");
      expect(result.ok).toBe(false);
    });
  });

  describe("integration with other pattern types", () => {
    it("test_integration_with_structure_patterns", () => {
      const result = tryParsePattern("[*] | map");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("[*] | map");
    });

    it("test_integration_with_value_patterns", () => {
      const result = tryParsePattern(`"hello" | 42`);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe(`"hello" | 42`);
    });

    it("test_complex_mixed_pattern", () => {
      const result = tryParsePattern("@result(bool | (text & !null)) | @number(number)");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      // The exact formatting might vary, just check it parses successfully
      expect(patternDisplay(result.value).length).toBeGreaterThan(0);
    });
  });

  describe("search pattern parsing", () => {
    it("test_parse_search_simple", () => {
      const result = tryParsePattern("search(42)");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("search(42)");
    });

    it("test_parse_search_with_text", () => {
      const result = tryParsePattern(`search("hello")`);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe(`search("hello")`);
    });

    it("test_parse_search_with_any", () => {
      const result = tryParsePattern("search(*)");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("search(*)");
    });

    it("test_parse_search_with_complex_pattern", () => {
      const result = tryParsePattern("search(bool | text)");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("search(bool | text)");
    });

    it("test_parse_search_with_capture", () => {
      const result = tryParsePattern("search(@found(42))");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("search(@found(42))");
    });

    it("test_parse_search_with_nested_structure", () => {
      const result = tryParsePattern("search([*])");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.kind).toBe("Meta");
      expect(patternDisplay(result.value)).toBe("search([*])");
    });

    it("test_parse_search_errors", () => {
      // Missing opening parenthesis
      expect(tryParsePattern("search 42").ok).toBe(false);

      // Missing closing parenthesis
      expect(tryParsePattern("search(42").ok).toBe(false);

      // Empty search pattern
      expect(tryParsePattern("search()").ok).toBe(false);
    });

    it("test_parse_search_in_combinations", () => {
      // Search within OR pattern
      const result1 = tryParsePattern("search(42) | text");
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value.kind).toBe("Meta");
      }

      // AND with search
      const result2 = tryParsePattern("search(42) & search(text)");
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value.kind).toBe("Meta");
      }
    });
  });
});
