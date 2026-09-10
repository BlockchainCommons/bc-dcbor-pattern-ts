/**
 * Captures inside an array's element pattern (a capture, an `or` of
 * captures, nested arrays): each `expected` block is the formatted output
 * the reference produces for the same input.
 */

import { describe, it } from "vitest";
import { cbor, parsePattern, getPathsWithCaptures, formatPathsWithCapturesStr } from "./common";
import { assertActualExpected } from "./common";

describe("array element captures", () => {
  it("[@item(number)] against [1, 2, 3]", () => {
    const pattern = parsePattern("[@item(number)]");
    const cborData = cbor([1, 2, 3]);
    const [paths, captures] = getPathsWithCaptures(pattern, cborData);
    const output = formatPathsWithCapturesStr(paths, captures);
    const expected = `@item
    [1, 2, 3]
        3
    [1, 2, 3]
        2
    [1, 2, 3]
        1
[1, 2, 3]`;
    assertActualExpected(output, expected);
  });

  it('[@item(number)] against [1, "x", 3] (mixed)', () => {
    const pattern = parsePattern("[@item(number)]");
    const cborData = cbor([1, "x", 3]);
    const [paths, captures] = getPathsWithCaptures(pattern, cborData);
    const output = formatPathsWithCapturesStr(paths, captures);
    const expected = `@item
    [1, "x", 3]
        3
    [1, "x", 3]
        1
[1, "x", 3]`;
    assertActualExpected(output, expected);
  });

  it("[@a(number) | @b(text)] (Or with two captures)", () => {
    const pattern = parsePattern("[@a(number) | @b(text)]");
    const cborData = cbor([1, "x", 3, "y"]);
    const [paths, captures] = getPathsWithCaptures(pattern, cborData);
    const output = formatPathsWithCapturesStr(paths, captures);
    const expected = `@a
    [1, "x", 3, "y"]
        3
    [1, "x", 3, "y"]
        1
@b
    [1, "x", 3, "y"]
        "y"
    [1, "x", 3, "y"]
        "x"
[1, "x", 3, "y"]`;
    assertActualExpected(output, expected);
  });

  it("[@a((number)*)] (capture wrapping a Repeat)", () => {
    const pattern = parsePattern("[@a((number)*)]");
    const cborData = cbor([1, 2, 3]);
    const [paths, captures] = getPathsWithCaptures(pattern, cborData);
    const output = formatPathsWithCapturesStr(paths, captures);
    const expected = `@a
    [1, 2, 3]
        3
    [1, 2, 3]
        2
    [1, 2, 3]
        1
[1, 2, 3]`;
    assertActualExpected(output, expected);
  });
});
