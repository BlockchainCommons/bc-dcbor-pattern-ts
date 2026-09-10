/**
 * Meta patterns: the combinators over other patterns.
 */
export * from "./any-pattern";
export * from "./and-pattern";
export * from "./or-pattern";
export * from "./not-pattern";
export * from "./repeat-pattern";
export * from "./capture-pattern";
export * from "./search-pattern";
export * from "./sequence-pattern";

import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { Pattern } from "../index";
import type { PatternOps } from "../ops";

import { type AnyPattern, anyPatternPaths, anyPatternDisplay } from "./any-pattern";
import { type AndPattern, andPatternPaths, andPatternDisplay } from "./and-pattern";
import { type OrPattern, orPatternPaths, orPatternDisplay } from "./or-pattern";
import { type NotPattern, notPatternPaths, notPatternDisplay } from "./not-pattern";
import { type RepeatPattern, repeatPatternPaths, repeatPatternDisplay } from "./repeat-pattern";
import { type CapturePattern, capturePatternPaths, capturePatternDisplay } from "./capture-pattern";
import { type SearchPattern, searchPatternPaths, searchPatternDisplay } from "./search-pattern";
import {
  type SequencePattern,
  sequencePatternPaths,
  sequencePatternDisplay,
} from "./sequence-pattern";

/** The union of the meta pattern kinds. */
export type MetaPattern =
  | {
      /** The discriminant. */
      readonly type: "Any";
      /** The any pattern. */
      readonly pattern: AnyPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "And";
      /** The `and` pattern. */
      readonly pattern: AndPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Or";
      /** The `or` pattern. */
      readonly pattern: OrPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Not";
      /** The `not` pattern. */
      readonly pattern: NotPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Repeat";
      /** The repeat pattern. */
      readonly pattern: RepeatPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Capture";
      /** The capture pattern. */
      readonly pattern: CapturePattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Search";
      /** The search pattern. */
      readonly pattern: SearchPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Sequence";
      /** The sequence pattern. */
      readonly pattern: SequencePattern;
    };

/** The paths a meta pattern matches. */
export const metaPatternPaths = (pattern: MetaPattern, haystack: Cbor, ops: PatternOps): Path[] => {
  switch (pattern.type) {
    case "Any":
      return anyPatternPaths(pattern.pattern, haystack);
    case "And":
      return andPatternPaths(pattern.pattern, haystack, ops);
    case "Or":
      return orPatternPaths(pattern.pattern, haystack, ops);
    case "Not":
      return notPatternPaths(pattern.pattern, haystack, ops);
    case "Repeat":
      return repeatPatternPaths(pattern.pattern, haystack, ops);
    case "Capture":
      return capturePatternPaths(pattern.pattern, haystack, ops);
    case "Search":
      return searchPatternPaths(pattern.pattern, haystack, ops);
    case "Sequence":
      return sequencePatternPaths(pattern.pattern, haystack);
  }
};

/** Whether a meta pattern matches. */
export const metaPatternMatches = (
  pattern: MetaPattern,
  haystack: Cbor,
  ops: PatternOps,
): boolean => metaPatternPaths(pattern, haystack, ops).length > 0;

/** The canonical text of a meta pattern. */
export const metaPatternDisplay = (
  pattern: MetaPattern,
  patternDisplay: (p: Pattern) => string,
): string => {
  switch (pattern.type) {
    case "Any":
      return anyPatternDisplay(pattern.pattern);
    case "And":
      return andPatternDisplay(pattern.pattern, patternDisplay);
    case "Or":
      return orPatternDisplay(pattern.pattern, patternDisplay);
    case "Not":
      return notPatternDisplay(pattern.pattern, patternDisplay);
    case "Repeat":
      return repeatPatternDisplay(pattern.pattern, patternDisplay);
    case "Capture":
      return capturePatternDisplay(pattern.pattern, patternDisplay);
    case "Search":
      return searchPatternDisplay(pattern.pattern, patternDisplay);
    case "Sequence":
      return sequencePatternDisplay(pattern.pattern, patternDisplay);
  }
};

/** An `Any` meta pattern. */
export const metaAny = (pattern: AnyPattern): MetaPattern =>
  Object.freeze({ type: "Any", pattern });
/** An `And` meta pattern. */
export const metaAnd = (pattern: AndPattern): MetaPattern =>
  Object.freeze({ type: "And", pattern });
/** An `Or` meta pattern. */
export const metaOr = (pattern: OrPattern): MetaPattern => Object.freeze({ type: "Or", pattern });
/** A `Not` meta pattern. */
export const metaNot = (pattern: NotPattern): MetaPattern =>
  Object.freeze({ type: "Not", pattern });
/** A `Repeat` meta pattern. */
export const metaRepeat = (pattern: RepeatPattern): MetaPattern =>
  Object.freeze({ type: "Repeat", pattern });
/** A `Capture` meta pattern. */
export const metaCapture = (pattern: CapturePattern): MetaPattern =>
  Object.freeze({ type: "Capture", pattern });
/** A `Search` meta pattern. */
export const metaSearch = (pattern: SearchPattern): MetaPattern =>
  Object.freeze({ type: "Search", pattern });
/** A `Sequence` meta pattern. */
export const metaSequence = (pattern: SequencePattern): MetaPattern =>
  Object.freeze({ type: "Sequence", pattern });
