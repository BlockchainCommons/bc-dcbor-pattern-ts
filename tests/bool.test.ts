/**
 * Boolean tests.
 */

import { describe, it, expect } from "vitest";
import { cbor, parsePattern, matches, display } from "./common";

describe("test new bool syntax", () => {
  it("test_bool_pattern_parsing", () => {
    // Test bool pattern (matches any boolean)
    const boolPattern = parsePattern("bool");
    expect(display(boolPattern)).toBe("bool");

    // Test true pattern
    const truePattern = parsePattern("true");
    expect(display(truePattern)).toBe("true");

    // Test false pattern
    const falsePattern = parsePattern("false");
    expect(display(falsePattern)).toBe("false");
  });

  it("test_bool_pattern_matching", () => {
    const boolPattern = parsePattern("bool");
    const truePattern = parsePattern("true");
    const falsePattern = parsePattern("false");

    const trueCbor = cbor(true);
    const falseCbor = cbor(false);
    const numberCbor = cbor(42);

    // Test bool pattern matching
    expect(matches(boolPattern, trueCbor)).toBe(true);
    expect(matches(boolPattern, falseCbor)).toBe(true);
    expect(matches(boolPattern, numberCbor)).toBe(false);

    // Test true pattern matching
    expect(matches(truePattern, trueCbor)).toBe(true);
    expect(matches(truePattern, falseCbor)).toBe(false);
    expect(matches(truePattern, numberCbor)).toBe(false);

    // Test false pattern matching
    expect(matches(falsePattern, trueCbor)).toBe(false);
    expect(matches(falsePattern, falseCbor)).toBe(true);
    expect(matches(falsePattern, numberCbor)).toBe(false);
  });

  it("test_bool_combinations", () => {
    // Test OR combinations
    const trueOrFalse = parsePattern("true | false");
    const trueCbor = cbor(true);
    const falseCbor = cbor(false);
    const numberCbor = cbor(42);

    expect(matches(trueOrFalse, trueCbor)).toBe(true);
    expect(matches(trueOrFalse, falseCbor)).toBe(true);
    expect(matches(trueOrFalse, numberCbor)).toBe(false);

    // Test with other patterns
    const boolOrNumber = parsePattern("bool | number");
    expect(matches(boolOrNumber, trueCbor)).toBe(true);
    expect(matches(boolOrNumber, falseCbor)).toBe(true);
    expect(matches(boolOrNumber, numberCbor)).toBe(true);
  });
});
