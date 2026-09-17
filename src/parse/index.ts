/**
 * Parsing pattern text: `parsePattern` throws, `tryParsePattern` returns
 * the error; the `…Partial` forms parse the pattern at the start of a
 * longer text and report how much they consumed.
 */
import type { Pattern } from "../pattern";
import { type DcborResult, DcborPatternError } from "../error";
import { parseAll, parsePartial } from "./parser";

/** An optional limit on how deep a pattern may nest. */
export interface ParseOptions {
  /**
   * The deepest nesting of groups, captures, `search`, arrays, maps and
   * tagged values accepted (a positive integer). No limit by default: text
   * nested a few thousand levels deep then exhausts the engine's stack with
   * a `RangeError`.
   */
  readonly maxDepth?: number | undefined;
}

/** A parsed pattern and how many UTF-16 code units of the text it consumed. */
export interface PatternPartial {
  /** The pattern. */
  readonly pattern: Pattern;
  /** How many UTF-16 code units it consumed, trailing whitespace included. */
  readonly length: number;
}

const attempt = <T>(f: () => T): DcborResult<T, DcborPatternError> => {
  try {
    return { ok: true, value: f() };
  } catch (e) {
    if (DcborPatternError.isDcborPatternError(e)) return { ok: false, error: e };
    throw e;
  }
};

const requireSource = (input: string): void => {
  if (typeof input !== "string") throw new TypeError("pattern source must be a string");
};

const resolveMaxDepth = (options: ParseOptions | undefined): number | undefined => {
  if (options !== undefined && (options === null || typeof options !== "object")) {
    throw new TypeError("options must be an object");
  }
  const maxDepth = options?.maxDepth;
  if (maxDepth === undefined) return undefined;
  if (typeof maxDepth !== "number" || !Number.isInteger(maxDepth) || maxDepth < 1) {
    throw new RangeError("maxDepth must be a positive integer");
  }
  return maxDepth;
};

/**
 * Parses a whole pattern string; whitespace may follow the pattern.
 *
 * @throws {DcborPatternError} If the string is not a pattern, has trailing input, or nests deeper than a given `maxDepth`
 * @throws {TypeError} If `input` is not a string
 * @throws {RangeError} If `maxDepth` is not a positive integer
 */
export function parsePattern(input: string, options?: ParseOptions): Pattern {
  requireSource(input);
  return parseAll(input, resolveMaxDepth(options));
}

/** `parsePattern` with the error returned instead of thrown; a `TypeError` or `RangeError` still throws. */
export function tryParsePattern(
  input: string,
  options?: ParseOptions,
): DcborResult<Pattern, DcborPatternError> {
  return attempt(() => parsePattern(input, options));
}

/**
 * Parses the pattern at the start of `input` and reports how much it
 * consumed (whitespace after the pattern included), for languages that
 * embed patterns.
 *
 * @throws {DcborPatternError} If no pattern starts the input
 * @throws {TypeError} If `input` is not a string
 * @throws {RangeError} If `maxDepth` is not a positive integer
 */
export function parsePatternPartial(input: string, options?: ParseOptions): PatternPartial {
  requireSource(input);
  const [pattern, length] = parsePartial(input, resolveMaxDepth(options));
  return { pattern, length };
}

/** `parsePatternPartial` with the error returned instead of thrown; a `TypeError` or `RangeError` still throws. */
export function tryParsePatternPartial(
  input: string,
  options?: ParseOptions,
): DcborResult<PatternPartial, DcborPatternError> {
  return attempt(() => parsePatternPartial(input, options));
}
