/**
 * `array`, `[{n,m}]` and `[p, q, …]`: patterns over arrays.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import { isArray, arrayLength, arrayItem, cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../../format";
import type { Pattern } from "../../index";
import type { PatternOps } from "../../ops";
import type { SequencePattern } from "../../meta/sequence-pattern";
import type { RepeatPattern } from "../../meta/repeat-pattern";
import { Interval } from "../../../interval";
import { collectPatternCaptureNames, compilePattern } from "../../matcher";
import { run } from "../../vm";
import {
  hasRepeatPatternsInSlice,
  extractCaptureWithRepeat,
  isRepeatPattern,
  buildSimpleArrayContextPath,
  formatArrayElementPattern,
  transformCapturesWithArrayContext,
} from "./helpers";
import { SequenceAssigner } from "./assigner";

export * from "./helpers";
export * from "./backtrack";
export * from "./assigner";

/** A pattern over arrays: any array, an element pattern, or a length. */
export type ArrayPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Elements";
      /** The pattern the array's elements must match. */
      readonly pattern: Pattern;
    }
  | {
      /** The discriminant. */
      readonly variant: "Length";
      /** The interval the array's length must lie in. */
      readonly length: Interval;
    };

/** An `ArrayPattern` matching any array. */
export const arrayPatternAny = (): ArrayPattern => Object.freeze({ variant: "Any" });

/** An `ArrayPattern` whose elements match `pattern` (a sequence, a repeat, or one element). */
export const arrayPatternWithElements = (pattern: Pattern): ArrayPattern =>
  Object.freeze({ variant: "Elements", pattern });

/** An `ArrayPattern` matching arrays of exactly `length` elements. */
export const arrayPatternWithLength = (length: number): ArrayPattern =>
  Object.freeze({ variant: "Length", length: Interval.exactly(length) });

/** An `ArrayPattern` matching arrays of `min` to `max` elements (unbounded without `max`). */
export const arrayPatternWithLengthRange = (min: number, max?: number): ArrayPattern =>
  Object.freeze({
    variant: "Length",
    length: max !== undefined ? Interval.from(min, max) : Interval.atLeast(min),
  });

/** An `ArrayPattern` matching arrays whose length lies in `interval`. */
export const arrayPatternWithLengthInterval = (interval: Interval): ArrayPattern =>
  Object.freeze({ variant: "Length", length: interval });

const getArrayElements = (haystack: Cbor): Cbor[] | undefined => {
  if (!isArray(haystack)) return undefined;
  const len = arrayLength(haystack);
  if (len === undefined) return undefined;
  const elements: Cbor[] = [];
  for (let i = 0; i < len; i++) {
    const item = arrayItem(haystack, i);
    if (item === undefined) return undefined;
    elements.push(item);
  }
  return elements;
};

const matchRepeatPatternAgainstArray = (
  repeatPattern: RepeatPattern,
  arr: readonly Cbor[],
  ops: PatternOps,
): boolean => {
  const quantifier = repeatPattern.quantifier;
  const minCount = quantifier.min;
  const maxCount = quantifier.max ?? arr.length;
  if (arr.length < minCount || arr.length > maxCount) return false;
  return arr.every((element) => ops.matches(repeatPattern.pattern, element));
};

const matchSequencePatternsAgainstArray = (
  seqPattern: SequencePattern,
  arr: readonly Cbor[],
  ops: PatternOps,
): boolean => new SequenceAssigner(seqPattern.patterns, arr, ops.matches).canMatch();

const canMatchSequenceAgainstArray = (
  pattern: Pattern,
  arr: readonly Cbor[],
  ops: PatternOps,
): boolean => {
  if (pattern.kind === "Meta") {
    if (pattern.pattern.type === "Sequence") {
      return matchSequencePatternsAgainstArray(pattern.pattern.pattern, arr, ops);
    }
    if (pattern.pattern.type === "Repeat") {
      return matchRepeatPatternAgainstArray(pattern.pattern.pattern, arr, ops);
    }
  }
  return ops.matches(pattern, cbor([...arr]));
};

const matchComplexSequence = (haystack: Cbor, pattern: Pattern, ops: PatternOps): Path[] => {
  const arr = getArrayElements(haystack);
  if (arr === undefined) return [];
  return canMatchSequenceAgainstArray(pattern, arr, ops) ? [[haystack]] : [];
};

const findSequenceElementAssignments = (
  seqPattern: SequencePattern,
  arr: readonly Cbor[],
  ops: PatternOps,
): [number, number][] | undefined =>
  new SequenceAssigner(seqPattern.patterns, arr, ops.matches).findAssignments();

/**
 * Captures of a sequence with captures: a capture around a repeat, or a
 * repeat containing captures, captures the sub-array it consumed; every
 * other pattern's captures are re-rooted on `[array, element]`.
 */
const handleSequenceCaptures = (
  seqPattern: SequencePattern,
  arrayCbor: Cbor,
  arr: readonly Cbor[],
  ops: PatternOps,
): [Path[], Map<string, Path[]>] => {
  const assignments = findSequenceElementAssignments(seqPattern, arr, ops);
  if (assignments === undefined) return [[], new Map<string, Path[]>()];

  const allCaptures = new Map<string, Path[]>();
  const assignedElements = (patternIdx: number): Cbor[] =>
    assignments.filter(([pIdx]) => pIdx === patternIdx).map(([, eIdx]) => arr[eIdx]);

  for (let patternIdx = 0; patternIdx < seqPattern.patterns.length; patternIdx++) {
    const pattern = seqPattern.patterns[patternIdx];

    if (pattern.kind === "Meta" && pattern.pattern.type === "Capture") {
      if (extractCaptureWithRepeat(pattern) !== undefined) {
        const subArray = cbor(assignedElements(patternIdx));
        const existing = allCaptures.get(pattern.pattern.pattern.name) ?? [];
        existing.push(buildSimpleArrayContextPath(arrayCbor, subArray));
        allCaptures.set(pattern.pattern.pattern.name, existing);
        continue;
      }
    } else if (
      isRepeatPattern(pattern) &&
      pattern.kind === "Meta" &&
      pattern.pattern.type === "Repeat"
    ) {
      const repeatCaptureNames: string[] = [];
      collectPatternCaptureNames(pattern, repeatCaptureNames);
      if (repeatCaptureNames.length > 0) {
        const subArray = cbor(assignedElements(patternIdx));
        const sub = ops.pathsWithCaptures(pattern, subArray);
        transformCapturesWithArrayContext(arrayCbor, subArray, sub.captures, allCaptures);
        continue;
      }
    }

    for (const element of assignedElements(patternIdx)) {
      const elementResult = ops.pathsWithCaptures(pattern, element);
      transformCapturesWithArrayContext(arrayCbor, element, elementResult.captures, allCaptures);
    }
  }

  return [[[arrayCbor]], allCaptures];
};

/** Whether the array pattern matches the haystack. */
export const arrayPatternMatches = (
  pattern: ArrayPattern,
  haystack: Cbor,
  ops: PatternOps,
): boolean => {
  if (!isArray(haystack)) return false;

  switch (pattern.variant) {
    case "Any":
      return true;
    case "Elements": {
      const arr = getArrayElements(haystack);
      if (arr === undefined) return false;
      const elemPattern = pattern.pattern;
      if (elemPattern.kind === "Meta") {
        if (elemPattern.pattern.type === "Sequence") {
          return matchSequencePatternsAgainstArray(elemPattern.pattern.pattern, arr, ops);
        }
        if (elemPattern.pattern.type === "Repeat") {
          return matchRepeatPatternAgainstArray(elemPattern.pattern.pattern, arr, ops);
        }
        if (elemPattern.pattern.type === "Capture") {
          return arr.some((element) => ops.matches(elemPattern, element));
        }
      }
      // a value, structure or `*` element pattern needs exactly one element
      if (
        elemPattern.kind === "Value" ||
        elemPattern.kind === "Structure" ||
        (elemPattern.kind === "Meta" && elemPattern.pattern.type === "Any")
      ) {
        return arr.length === 1 && ops.matches(elemPattern, arr[0]);
      }
      // any other meta pattern matches when some element matches
      return arr.some((element) => ops.matches(elemPattern, element));
    }
    case "Length": {
      const len = arrayLength(haystack);
      return len !== undefined && pattern.length.contains(len);
    }
  }
};

/** The root path when the array pattern matches, else none. */
export const arrayPatternPaths = (
  pattern: ArrayPattern,
  haystack: Cbor,
  ops: PatternOps,
): Path[] => {
  if (!isArray(haystack)) return [];
  const arr = getArrayElements(haystack);
  if (arr === undefined) return [];

  switch (pattern.variant) {
    case "Any":
      return [[haystack]];

    case "Elements": {
      const elemPattern = pattern.pattern;
      if (elemPattern.kind === "Meta") {
        if (elemPattern.pattern.type === "Sequence") {
          const seqPattern = elemPattern.pattern.pattern;
          if (hasRepeatPatternsInSlice(seqPattern.patterns)) {
            return matchComplexSequence(haystack, elemPattern, ops);
          }
          if (seqPattern.patterns.length !== arr.length) return [];
          for (let i = 0; i < seqPattern.patterns.length; i++) {
            if (!ops.matches(seqPattern.patterns[i], arr[i])) return [];
          }
          return [[haystack]];
        }
        if (elemPattern.pattern.type === "Repeat") {
          return matchComplexSequence(haystack, elemPattern, ops);
        }
        if (elemPattern.pattern.type === "Capture") {
          return arr.some((element) => ops.matches(elemPattern, element)) ? [[haystack]] : [];
        }
      }
      if (
        elemPattern.kind === "Value" ||
        elemPattern.kind === "Structure" ||
        (elemPattern.kind === "Meta" && elemPattern.pattern.type === "Any")
      ) {
        return arr.length === 1 && ops.matches(elemPattern, arr[0]) ? [[haystack]] : [];
      }
      return arr.some((element) => ops.matches(elemPattern, element)) ? [[haystack]] : [];
    }

    case "Length":
      return pattern.length.contains(arr.length) ? [[haystack]] : [];
  }
};

/** The paths and captures of the array pattern on the haystack. */
export const arrayPatternPathsWithCaptures = (
  pattern: ArrayPattern,
  haystack: Cbor,
  ops: PatternOps,
): [Path[], Map<string, Path[]>] => {
  if (!isArray(haystack)) return [[], new Map<string, Path[]>()];
  const arr = getArrayElements(haystack);
  if (arr === undefined) return [[], new Map<string, Path[]>()];

  switch (pattern.variant) {
    case "Any":
    case "Length":
      return [arrayPatternPaths(pattern, haystack, ops), new Map<string, Path[]>()];

    case "Elements": {
      const elemPattern = pattern.pattern;
      const innerCaptureNames: string[] = [];
      collectPatternCaptureNames(elemPattern, innerCaptureNames);

      if (innerCaptureNames.length === 0) {
        return [arrayPatternPaths(pattern, haystack, ops), new Map<string, Path[]>()];
      }
      if (arrayPatternPaths(pattern, haystack, ops).length === 0) {
        return [[], new Map<string, Path[]>()];
      }
      // a sequence with captures is matched element-wise
      if (elemPattern.kind === "Meta" && elemPattern.pattern.type === "Sequence") {
        return handleSequenceCaptures(elemPattern.pattern.pattern, haystack, arr, ops);
      }
      // any other element pattern with captures runs on the byte-code machine
      const wrappedPattern: Pattern = {
        kind: "Structure",
        pattern: { type: "Array", pattern },
      };
      const result = run(compilePattern(wrappedPattern), haystack, ops);
      return [[...result.paths], new Map([...result.captures].map(([n, p]) => [n, [...p]]))];
    }
  }
};

/** `array`, `[p, q]` or `[{n,m}]`. */
export const arrayPatternDisplay = (
  pattern: ArrayPattern,
  patternDisplay: (p: Pattern) => string,
): string => {
  switch (pattern.variant) {
    case "Any":
      return "array";
    case "Elements":
      return `[${formatArrayElementPattern(pattern.pattern, patternDisplay)}]`;
    case "Length":
      return `[${pattern.length.toString()}]`;
  }
};

/** Whether two array patterns are the same, comparing elements with `patternEquals`. */
export const arrayPatternEquals = (
  a: ArrayPattern,
  b: ArrayPattern,
  patternEquals: (p1: Pattern, p2: Pattern) => boolean,
): boolean => {
  if (a.variant !== b.variant) return false;
  switch (a.variant) {
    case "Any":
      return true;
    case "Elements":
      return patternEquals(a.pattern, (b as typeof a).pattern);
    case "Length":
      return a.length.equals((b as typeof a).length);
  }
};
