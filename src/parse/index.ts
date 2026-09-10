/**
 * Parsing pattern text: `parsePattern` throws, `tryParsePattern` returns
 * the error; the `…Prefix` forms parse the pattern at the start of a
 * longer text and report how much they consumed.
 */
import type { Pattern } from "../pattern";
import { type DcborResult, DcborPatternError } from "../error";
import { DEFAULT_MAX_DEPTH, parseAll, parsePrefix } from "./parser";

/** How deep a pattern may nest; the field has a default. */
export interface ParseOptions {
  /** The deepest nesting of groups, captures, `search`, arrays, maps and tagged values accepted (a positive integer), 500 by default. */
  readonly maxDepth?: number | undefined;
}

/** A parsed pattern prefix and how many UTF-16 code units it consumed. */
export interface PatternPrefix {
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

const resolveMaxDepth = (options: ParseOptions | undefined): number => {
  if (options !== undefined && (options === null || typeof options !== "object")) {
    throw new TypeError("options must be an object");
  }
  const maxDepth = options?.maxDepth;
  if (maxDepth === undefined) return DEFAULT_MAX_DEPTH;
  if (typeof maxDepth !== "number" || !Number.isInteger(maxDepth) || maxDepth < 1) {
    throw new RangeError("maxDepth must be a positive integer");
  }
  return maxDepth;
};

/**
 * Parses a whole pattern string; whitespace may follow the pattern.
 *
 * @throws {DcborPatternError} If the string is not a pattern, has trailing input, or nests deeper than `maxDepth`
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
export function parsePatternPrefix(input: string, options?: ParseOptions): PatternPrefix {
  requireSource(input);
  const [pattern, length] = parsePrefix(input, resolveMaxDepth(options));
  return { pattern, length };
}

/** `parsePatternPrefix` with the error returned instead of thrown; a `TypeError` or `RangeError` still throws. */
export function tryParsePatternPrefix(
  input: string,
  options?: ParseOptions,
): DcborResult<PatternPrefix, DcborPatternError> {
  return attempt(() => parsePatternPrefix(input, options));
}
