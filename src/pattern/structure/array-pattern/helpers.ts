/**
 * Helpers for matching array patterns: repeat detection, bounds, and the
 * array-context paths captures are re-rooted on.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../../format";
import type { Pattern } from "../../index";
import type { RepeatPattern } from "../../meta/repeat-pattern";
import type { Quantifier } from "../../../quantifier";

/** Whether the pattern is a repeat. */
export const isRepeatPattern = (pattern: Pattern): boolean =>
  pattern.kind === "Meta" && pattern.pattern.type === "Repeat";

/** The repeat directly inside a capture, if the pattern is such a capture. */
export const extractCaptureWithRepeat = (pattern: Pattern): RepeatPattern | undefined => {
  if (pattern.kind === "Meta" && pattern.pattern.type === "Capture") {
    const innerPattern = pattern.pattern.pattern.pattern;
    if (innerPattern.kind === "Meta" && innerPattern.pattern.type === "Repeat") {
      return innerPattern.pattern.pattern;
    }
  }
  return undefined;
};

/** The repeat of the pattern, whether direct or inside a capture. */
export const extractRepeatPattern = (pattern: Pattern): RepeatPattern | undefined => {
  if (pattern.kind === "Meta" && pattern.pattern.type === "Repeat") return pattern.pattern.pattern;
  return extractCaptureWithRepeat(pattern);
};

/** Whether any of the patterns is a repeat, direct or inside a capture. */
export const hasRepeatPatternsInSlice = (patterns: readonly Pattern[]): boolean =>
  patterns.some((p) => extractRepeatPattern(p) !== undefined);

/** The least and most repetitions a repeat may consume from `elementIdx` on. */
export const calculateRepeatBounds = (
  quantifier: Quantifier,
  elementIdx: number,
  arrLen: number,
): [number, number] => {
  const minCount = quantifier.min;
  const remainingElements = Math.max(0, arrLen - elementIdx);
  const maxCount = Math.min(quantifier.max ?? remainingElements, remainingElements);
  return [minCount, maxCount];
};

/** Whether the repeat's pattern matches `repCount` consecutive elements from `elementIdx`. */
export const canRepeatMatch = (
  repeatPattern: RepeatPattern,
  arr: readonly Cbor[],
  elementIdx: number,
  repCount: number,
  matchFn: (pattern: Pattern, value: Cbor) => boolean,
): boolean => {
  for (let i = 0; i < repCount; i++) {
    if (!matchFn(repeatPattern.pattern, arr[elementIdx + i])) return false;
  }
  return true;
};

/** `[array, element]`. */
export const buildSimpleArrayContextPath = (arrayCbor: Cbor, element: Cbor): Cbor[] => [
  arrayCbor,
  element,
];

/** `[array, element, …capturedPath after its root]`. */
export const buildExtendedArrayContextPath = (
  arrayCbor: Cbor,
  element: Cbor,
  capturedPath: Path,
): Cbor[] => {
  const arrayPath: Cbor[] = [arrayCbor, element];
  if (capturedPath.length > 1) arrayPath.push(...capturedPath.slice(1));
  return arrayPath;
};

/** The text of an array's element pattern: nested sequences use `, `. */
export const formatArrayElementPattern = (
  pattern: Pattern,
  patternDisplay: (p: Pattern) => string,
): string => {
  if (pattern.kind === "Meta" && pattern.pattern.type === "Sequence") {
    return pattern.pattern.pattern.patterns
      .map((p) => formatArrayElementPattern(p, patternDisplay))
      .join(", ");
  }
  return patternDisplay(pattern);
};

/** Re-roots every nested capture path on `[array, element]` and adds them to `allCaptures`. */
export const transformCapturesWithArrayContext = (
  arrayCbor: Cbor,
  element: Cbor,
  nestedCaptures: ReadonlyMap<string, readonly Path[]>,
  allCaptures: Map<string, Path[]>,
): void => {
  for (const [captureName, capturedPaths] of nestedCaptures) {
    const existing = allCaptures.get(captureName) ?? [];
    for (const capturedPath of capturedPaths) {
      existing.push(buildExtendedArrayContextPath(arrayCbor, element, capturedPath));
    }
    allCaptures.set(captureName, existing);
  }
};
