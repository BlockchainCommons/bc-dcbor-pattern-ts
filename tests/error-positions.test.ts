/**
 * Error position reporting tests for dCBOR patterns.
 *
 * Tests that parse errors report the correct positions in the input string.
 */

import { describe, it, expect } from "vitest";
import { tryParsePattern } from "../src";

describe("error positions", () => {
  it("should report correct error position for tagged patterns", () => {
    // This should fail and report the correct position of FOO (at position 14)
    const patternStr = "tagged(12345, FOO)";
    const result = tryParsePattern(patternStr);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UnrecognizedToken");
      if (result.error.code === "UnrecognizedToken") {
        // The FOO token starts at position 14 in "tagged(12345, FOO)"
        // 0123456789012345
        const expectedStart = 14;
        expect(result.error.span?.start).toBe(expectedStart);
      }
    }
  });

  it("should report correct error position for array patterns", () => {
    // This should fail and report the correct position of BAR
    const patternStr = "[number, BAR]";
    const result = tryParsePattern(patternStr);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UnrecognizedToken");
      if (result.error.code === "UnrecognizedToken") {
        // The BAR token starts at position 9 in "[number, BAR]"
        //                                     0123456789012
        const expectedStart = 9;
        expect(result.error.span?.start).toBe(expectedStart);
      }
    }
  });

  it("should report correct error position for map pattern key errors", () => {
    // This should fail and report the correct position of FOO as a key
    const patternStr = "{FOO: number}";
    const result = tryParsePattern(patternStr);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UnrecognizedToken");
      if (result.error.code === "UnrecognizedToken") {
        // The FOO token starts at position 1 in "{FOO: number}"
        //                                     0123456789012
        const expectedStart = 1;
        expect(result.error.span?.start).toBe(expectedStart);
      }
    }
  });

  it("should report correct error position for map pattern value errors", () => {
    // This should fail and report the correct position of FOO as a value
    const patternStr = "{text: FOO}";
    const result = tryParsePattern(patternStr);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UnrecognizedToken");
      if (result.error.code === "UnrecognizedToken") {
        // The FOO token starts at position 7 in "{text: FOO}"
        //                                     0123456789
        const expectedStart = 7;
        expect(result.error.span?.start).toBe(expectedStart);
      }
    }
  });

  it("should report correct error position for second constraint key errors", () => {
    // This should fail and report the correct position of FOO in the second constraint
    const patternStr = "{text: *, FOO: number}";
    const result = tryParsePattern(patternStr);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UnrecognizedToken");
      if (result.error.code === "UnrecognizedToken") {
        // The FOO token starts at position 10 in "{text: *, FOO: number}"
        // 01234567890123456789012
        const expectedStart = 10;
        expect(result.error.span?.start).toBe(expectedStart);
      }
    }
  });

  it("should report correct error position for second constraint value errors", () => {
    // This should fail and report the correct position of FOO in the second constraint value
    const patternStr = "{bool: bstr, *: FOO}";
    const result = tryParsePattern(patternStr);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UnrecognizedToken");
      if (result.error.code === "UnrecognizedToken") {
        // The FOO token starts at position 16 in "{bool: bstr, *: FOO}"
        // 0123456789012345678901
        const expectedStart = 16;
        expect(result.error.span?.start).toBe(expectedStart);
      }
    }
  });

  it("should report correct error position for complex map patterns", () => {
    // Test with multiple constraints and error in the middle
    const patternStr = '{"name": text, "age": number, BAD: *, "email": text}';
    const result = tryParsePattern(patternStr);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UnrecognizedToken");
      if (result.error.code === "UnrecognizedToken") {
        // The BAD token starts at position 30 in the pattern
        // {"name": text, "age": number, BAD: *, "email": text}
        //  01234567890123456789012345678901234567890123456789012
        const expectedStart = 30;
        expect(result.error.span?.start).toBe(expectedStart);
      }
    }
  });

  it("should report correct error position for nested map pattern errors", () => {
    // Test error inside a nested structure within a map
    const patternStr = '{"data": [number, INVALID], "id": number}';
    const result = tryParsePattern(patternStr);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UnrecognizedToken");
      if (result.error.code === "UnrecognizedToken") {
        // The INVALID token starts at position 18 in the pattern
        // {"data": [number, INVALID], "id": number}
        //  012345678901234567890123456789012345678901
        const expectedStart = 18;
        expect(result.error.span?.start).toBe(expectedStart);
      }
    }
  });

  describe("variants and spans", () => {
    const outcome = (src: string): string => {
      const result = tryParsePattern(src);
      if (result.ok) return "ok";
      const { error } = result;
      const kind = error.details.code === "UnexpectedToken" ? `(${error.details.kind})` : "";
      const span = error.span === undefined ? "" : `@${error.span.start}-${error.span.end}`;
      return `${error.code}${kind}${span}`;
    };

    it("names the token the parser met, or the end of the source", () => {
      expect(outcome("(1")).toBe("UnexpectedEndOfInput");
      expect(outcome("(1]")).toBe("UnexpectedToken(BracketClose)@2-3");
      expect(outcome("(1 2)")).toBe("UnexpectedToken(NumberLiteral)@3-4");
      expect(outcome("[1 2]")).toBe("UnexpectedToken(NumberLiteral)@3-4");
      expect(outcome("{1 2}")).toBe("UnexpectedToken(NumberLiteral)@3-4");
      expect(outcome("{*}")).toBe("UnexpectedToken(BraceClose)@2-3");
      expect(outcome("@a 1")).toBe("UnexpectedToken(NumberLiteral)@3-4");
      expect(outcome("@a(1")).toBe("ExpectedCloseParen@4-4");
      expect(outcome("search(1")).toBe("ExpectedCloseParen@8-8");
      expect(outcome("[1")).toBe("ExpectedCloseBracket@2-2");
      expect(outcome("{1")).toBe("ExpectedColon@2-2");
      expect(outcome("{1:")).toBe("UnexpectedEndOfInput");
      expect(outcome("{1:2")).toBe("ExpectedCloseBrace@4-4");
      expect(outcome("tagged(1, *")).toBe("ExpectedCloseParen@11-11");
      expect(outcome("1 )")).toBe("ExtraData@2-3");
      expect(outcome("& 1")).toBe("UnexpectedToken(And)@0-1");
    });

    it("spans unrecognised text as a single-pass scanner reads it", () => {
      expect(outcome("xyz")).toBe("UnrecognizedToken@0-1");
      expect(outcome("@(1)")).toBe("UnrecognizedToken@0-1");
      expect(outcome("nul")).toBe("UnrecognizedToken@0-3");
      expect(outcome("-Inf")).toBe("UnrecognizedToken@0-4");
      expect(outcome("..")).toBe("UnrecognizedToken@0-2");
      expect(outcome("1 xyz")).toBe("ExtraData@2-5");
      expect(outcome("[1 xyz]")).toBe("UnrecognizedToken@3-4");
      expect(outcome("truex")).toBe("ExtraData@4-5");
      expect(outcome("¬")).toBe("UnrecognizedToken@0-1");
    });

    it("reports a malformed literal when it is consumed, over the span the lexer had", () => {
      expect(outcome("/abc")).toBe("UnterminatedRegex@0-1");
      expect(outcome('"abc')).toBe("UnterminatedString@0-1");
      expect(outcome("'abc")).toBe("UnterminatedString@0-1");
      expect(outcome("h'ab")).toBe("UnterminatedHexString@0-2");
      expect(outcome("h'zz'")).toBe("InvalidHexString@0-2");
      expect(outcome("h'abc'")).toBe("InvalidHexString@0-2");
      expect(outcome("h'/ab")).toBe("UnterminatedRegex@0-3");
      expect(outcome("/a(/")).toBe("InvalidRegex@0-4");
      expect(outcome("date'")).toBe("UnterminatedDateQuoted@0-5");
      expect(outcome("date''")).toBe("InvalidDateFormat@0-6");
      expect(outcome("digest'zz'")).toBe("InvalidDigestPattern@0-10");
      expect(outcome("(1){3,1}")).toBe("InvalidRange@3-8");
      expect(outcome("(1){3,x}")).toBe("InvalidRange@3-4");
      expect(outcome("1 h'zz'")).toBe("ExtraData@2-7");
    });
  });
});
