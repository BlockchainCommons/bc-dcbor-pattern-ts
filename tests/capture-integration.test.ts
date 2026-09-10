/**
 * Capture integration tests.
 *
 * Tests integration for named capture functionality with various pattern types.
 */

import { tryParsePattern } from "../src";
import { describe, it, expect, beforeAll } from "vitest";
import { getGlobalTagsStore } from "@blockchaincommons/dcbor";
import { registerTags } from "@blockchaincommons/tags";
import {
  cbor,
  parsePattern,
  assertActualExpected,
  getPathsWithCaptures,
  formatPathsWithCapturesStr,
} from "./common";
import { taggedValue } from "@blockchaincommons/dcbor";

describe("capture integration tests", () => {
  // tag-1 dates summarise only once the standard tags are registered
  beforeAll(() => registerTags(getGlobalTagsStore()));
  /**
   * Test basic capture functionality with simple patterns
   */
  it("test_capture_basic_number", () => {
    const pattern = parsePattern("@num(42)");
    const cborData = cbor(42);

    const [paths, captures] = getPathsWithCaptures(pattern, cborData);

    // Validate formatted output with captures
    const expectedOutput = `@num
    42
42`;
    assertActualExpected(formatPathsWithCapturesStr(paths, captures), expectedOutput);
  });

  /**
   * Test capture with text patterns
   */
  it("test_capture_basic_text", () => {
    const pattern = parsePattern(`@greeting("hello")`);
    const cborData = cbor("hello");

    const [paths, captures] = getPathsWithCaptures(pattern, cborData);

    // Validate formatted output with captures
    const expectedOutput = `@greeting
    "hello"
"hello"`;
    assertActualExpected(formatPathsWithCapturesStr(paths, captures), expectedOutput);
  });

  /**
   * Test capture with patterns that don't match
   */
  it("test_capture_no_match", () => {
    const pattern = parsePattern("@num(42)");
    const cborData = cbor(24);

    const [paths, captures] = getPathsWithCaptures(pattern, cborData);

    // Should not match - should be empty output
    const expectedOutput = "";
    assertActualExpected(formatPathsWithCapturesStr(paths, captures), expectedOutput);
  });

  /**
   * Test multiple captures in OR pattern
   */
  it("test_multiple_captures_or", () => {
    const pattern = parsePattern(`@first(42) | @second("hello")`);

    // Test matching the first alternative
    const cbor1 = cbor(42);
    const [paths1, captures1] = getPathsWithCaptures(pattern, cbor1);

    const expectedOutput1 = `@first
    42
42`;
    assertActualExpected(formatPathsWithCapturesStr(paths1, captures1), expectedOutput1);

    // Test matching the second alternative
    const cbor2 = cbor("hello");
    const [paths2, captures2] = getPathsWithCaptures(pattern, cbor2);

    const expectedOutput2 = `@second
    "hello"
"hello"`;
    assertActualExpected(formatPathsWithCapturesStr(paths2, captures2), expectedOutput2);
  });

  /**
   * Test nested captures
   */
  it("test_nested_captures", () => {
    const pattern = parsePattern("@outer(@inner(42))");
    const cborData = cbor(42);

    const [paths, captures] = getPathsWithCaptures(pattern, cborData);

    // Should have both captures pointing to the same value, sorted alphabetically
    const expectedOutput = `@inner
    42
@outer
    42
42`;
    assertActualExpected(formatPathsWithCapturesStr(paths, captures), expectedOutput);
  });

  /**
   * Test captures in array patterns
   */
  it("test_capture_in_array", () => {
    const pattern = parsePattern("[@item(42)]");
    const cborData = cbor([42]);

    const [paths, captures] = getPathsWithCaptures(pattern, cborData);

    // Validate the structured output
    const expectedOutput = `@item
    [42]
        42
[42]`;
    assertActualExpected(formatPathsWithCapturesStr(paths, captures), expectedOutput);
  });

  /**
   * Test captures in array sequence patterns
   */
  it("test_capture_in_array_sequence", () => {
    const pattern = parsePattern(`[@first("a"), @second(42)]`);
    const cborData = cbor(["a", 42]);

    const [paths, captures] = getPathsWithCaptures(pattern, cborData);

    // Should capture both elements, sorted alphabetically
    const expectedOutput = `@first
    ["a", 42]
        "a"
@second
    ["a", 42]
        42
["a", 42]`;
    assertActualExpected(formatPathsWithCapturesStr(paths, captures), expectedOutput);
  });

  /**
   * Test captures in map patterns
   */
  it("test_capture_in_map", () => {
    const pattern = parsePattern(`{@key("name"): @value("Alice")}`);
    const cborData = cbor({ name: "Alice" });

    const [paths, captures] = getPathsWithCaptures(pattern, cborData);

    // Validate formatted output with captures
    const expectedOutput = `@key
    {"name": "Alice"}
        "name"
@value
    {"name": "Alice"}
        "Alice"
{"name": "Alice"}`;
    assertActualExpected(formatPathsWithCapturesStr(paths, captures), expectedOutput);
  });

  /**
   * Test captures with search patterns
   */
  it("test_capture_with_search", () => {
    const pattern = parsePattern("search(@found(42))");
    const cborData = cbor([1, [2, 42], 3]);

    const [paths, captures] = getPathsWithCaptures(pattern, cborData);

    // Validate formatted output with captures
    const expectedOutput = `@found
    [1, [2, 42], 3]
        [2, 42]
            42
[1, [2, 42], 3]
    [2, 42]
        42`;
    assertActualExpected(formatPathsWithCapturesStr(paths, captures), expectedOutput);
  });

  /**
   * Test captures with tagged patterns
   */
  it("test_capture_with_tagged", () => {
    const pattern = parsePattern("tagged(1, @content(42))");
    const cborData = taggedValue(1, 42);

    const [paths, captures] = getPathsWithCaptures(pattern, cborData);

    // Validate formatted output with captures
    // tag 1 is a date: the summariser registered with the standard tags renders it
    const expectedOutput = `@content
    1970-01-01T00:00:42Z
        42
1970-01-01T00:00:42Z`;
    assertActualExpected(formatPathsWithCapturesStr(paths, captures), expectedOutput);
  });

  /**
   * Test capture performance doesn't significantly degrade
   */
  it("test_capture_performance", () => {
    // Create a complex nested structure
    const cborData = cbor([{ a: [1, 2, 3] }, { b: [4, 5, 6] }, { c: [7, 8, 9] }]);

    // Pattern that will search through the structure
    const pattern = parsePattern("search(@nums(number))");

    const start = globalThis.performance.now();
    const [paths, captures] = getPathsWithCaptures(pattern, cborData);
    const duration = globalThis.performance.now() - start;

    // Validate formatted output with all captured numbers
    const expectedOutput = `@nums
    [{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
        {"a": [1, 2, 3]}
            [1, 2, 3]
                1
    [{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
        {"a": [1, 2, 3]}
            [1, 2, 3]
                2
    [{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
        {"a": [1, 2, 3]}
            [1, 2, 3]
                3
    [{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
        {"b": [4, 5, 6]}
            [4, 5, 6]
                4
    [{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
        {"b": [4, 5, 6]}
            [4, 5, 6]
                5
    [{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
        {"b": [4, 5, 6]}
            [4, 5, 6]
                6
    [{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
        {"c": [7, 8, 9]}
            [7, 8, 9]
                7
    [{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
        {"c": [7, 8, 9]}
            [7, 8, 9]
                8
    [{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
        {"c": [7, 8, 9]}
            [7, 8, 9]
                9
[{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
    {"a": [1, 2, 3]}
        [1, 2, 3]
            1
[{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
    {"a": [1, 2, 3]}
        [1, 2, 3]
            2
[{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
    {"a": [1, 2, 3]}
        [1, 2, 3]
            3
[{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
    {"b": [4, 5, 6]}
        [4, 5, 6]
            4
[{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
    {"b": [4, 5, 6]}
        [4, 5, 6]
            5
[{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
    {"b": [4, 5, 6]}
        [4, 5, 6]
            6
[{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
    {"c": [7, 8, 9]}
        [7, 8, 9]
            7
[{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
    {"c": [7, 8, 9]}
        [7, 8, 9]
            8
[{"a": [1, 2, 3]}, {"b": [4, 5, 6]}, {"c": [7, 8, 9]}]
    {"c": [7, 8, 9]}
        [7, 8, 9]
            9`;
    assertActualExpected(formatPathsWithCapturesStr(paths, captures), expectedOutput);

    // Should complete reasonably quickly (less than 250ms for this small example)
    // Note: a looser bound than the reference's, for runtime variance
    expect(duration).toBeLessThan(250);
  });

  /**
   * Test patterns without captures use the optimized path
   */
  it("test_no_captures_optimization", () => {
    const pattern = parsePattern("42");
    const cborData = cbor(42);

    const [paths, captures] = getPathsWithCaptures(pattern, cborData);

    // Validate formatted output with no captures
    const expectedOutput = "42";
    assertActualExpected(formatPathsWithCapturesStr(paths, captures), expectedOutput);
  });

  /**
   * Test error handling with invalid capture patterns
   */
  it("test_capture_parsing_errors", () => {
    // Missing closing parenthesis
    expect(tryParsePattern("@name(42").ok).toBe(false);

    // Missing pattern inside capture
    expect(tryParsePattern("@name()").ok).toBe(false);

    // Invalid capture name (empty)
    expect(tryParsePattern("@(42)").ok).toBe(false);
  });

  /**
   * Test complex nested captures with multiple levels
   */
  it("test_complex_nested_captures", () => {
    const pattern = parsePattern(
      `[@first_map({@key1("type"): @val1("person")}), @second_map({@key2("name"): @val2(text)})]`,
    );

    const cborData = cbor([{ type: "person" }, { name: "Alice" }]);

    const [paths, captures] = getPathsWithCaptures(pattern, cborData);

    // every capture is reported: the maps under the array, their keys and
    // values under the map that satisfied the constraint
    const expected = `@first_map
    [{"type": "person"}, {"name": "Alice"}]
        {"type": "person"}
@key1
    [{"type": "person"}, {"name": "Alice"}]
        {"type": "person"}
            "type"
@key2
    [{"type": "person"}, {"name": "Alice"}]
        {"name": "Alice"}
            "name"
@second_map
    [{"type": "person"}, {"name": "Alice"}]
        {"name": "Alice"}
@val1
    [{"type": "person"}, {"name": "Alice"}]
        {"type": "person"}
            "person"
@val2
    [{"type": "person"}, {"name": "Alice"}]
        {"name": "Alice"}
            "Alice"
[{"type": "person"}, {"name": "Alice"}]`;
    assertActualExpected(formatPathsWithCapturesStr(paths, captures), expected);
  });
});
