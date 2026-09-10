/**
 * Shared test helpers: a throwing `parsePattern` with the source in the
 * message, paths/captures accessors and the formatted-output comparators.
 */
import { expect } from "vitest";
import { cbor as createCbor, type Cbor, type CborInput } from "@blockchaincommons/dcbor";
import {
  parsePattern as parsePatternSrc,
  type Pattern,
  matches,
  paths,
  pathsWithCaptures,
  display,
  type Path,
} from "../src";
import { formatPaths, type FormatPathsOptions } from "../src/format";

export { matches, paths, pathsWithCaptures, display, formatPaths };

export const cbor = (value: CborInput): Cbor => createCbor(value);

/** `parsePattern`, naming the pattern in the failure message. */
export const parsePattern = (s: string): Pattern => {
  try {
    return parsePatternSrc(s);
  } catch (e) {
    throw new Error(`Failed to parse pattern "${s}": ${(e as Error).message}`, { cause: e });
  }
};

export const assertActualExpected = (actual: string, expected: string): void => {
  if (actual !== expected) {
    console.log(`Actual:\n${actual}\nExpected:\n${expected}`);
  }
  expect(actual).toBe(expected);
};

export const getPaths = (pattern: Pattern, data: Cbor): Path[] => paths(pattern, data);

export const getPathsWithCaptures = (
  pattern: Pattern,
  data: Cbor,
): [readonly Path[], ReadonlyMap<string, readonly Path[]>] => {
  const result = pathsWithCaptures(pattern, data);
  return [result.paths, result.captures];
};

export const formatPathsWithCaptures = (
  p: readonly Path[],
  captures: ReadonlyMap<string, readonly Path[]>,
  options: FormatPathsOptions = {},
): string => formatPaths(p, { ...options, captures });

export const formatPathsStr = (p: readonly Path[]): string => formatPaths(p);

export const formatPathsWithCapturesStr = (
  p: readonly Path[],
  captures: ReadonlyMap<string, readonly Path[]>,
): string => (captures.size === 0 ? formatPaths(p) : formatPaths(p, { captures }));
