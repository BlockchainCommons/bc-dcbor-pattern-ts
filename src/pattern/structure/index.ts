/**
 * Structure patterns: arrays, maps and tagged values.
 */
export * from "./array-pattern";
export * from "./map-pattern";
export * from "./tagged-pattern";

import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { Pattern } from "../index";
import type { PatternOps } from "../ops";

import {
  type ArrayPattern,
  arrayPatternPaths,
  arrayPatternDisplay,
  arrayPatternPathsWithCaptures,
} from "./array-pattern";
import {
  type MapPattern,
  mapPatternPaths,
  mapPatternDisplay,
  mapPatternPathsWithCaptures,
} from "./map-pattern";
import {
  type TaggedPattern,
  taggedPatternPaths,
  taggedPatternDisplay,
  taggedPatternPathsWithCaptures,
} from "./tagged-pattern";

/** The union of the structure pattern kinds. */
export type StructurePattern =
  | {
      /** The discriminant. */
      readonly type: "Array";
      /** The array pattern. */
      readonly pattern: ArrayPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Map";
      /** The map pattern. */
      readonly pattern: MapPattern;
    }
  | {
      /** The discriminant. */
      readonly type: "Tagged";
      /** The tagged value pattern. */
      readonly pattern: TaggedPattern;
    };

/** The paths a structure pattern matches. */
export const structurePatternPaths = (
  pattern: StructurePattern,
  haystack: Cbor,
  ops: PatternOps,
): Path[] => {
  switch (pattern.type) {
    case "Array":
      return arrayPatternPaths(pattern.pattern, haystack, ops);
    case "Map":
      return mapPatternPaths(pattern.pattern, haystack, ops);
    case "Tagged":
      return taggedPatternPaths(pattern.pattern, haystack, ops);
  }
};

/** Whether a structure pattern matches. */
export const structurePatternMatches = (
  pattern: StructurePattern,
  haystack: Cbor,
  ops: PatternOps,
): boolean => structurePatternPaths(pattern, haystack, ops).length > 0;

/** The paths and captures of a structure pattern. */
export const structurePatternPathsWithCaptures = (
  pattern: StructurePattern,
  haystack: Cbor,
  ops: PatternOps,
): [Path[], Map<string, Path[]>] => {
  switch (pattern.type) {
    case "Array":
      return arrayPatternPathsWithCaptures(pattern.pattern, haystack, ops);
    case "Map":
      return mapPatternPathsWithCaptures(pattern.pattern, haystack, ops);
    case "Tagged":
      return taggedPatternPathsWithCaptures(pattern.pattern, haystack, ops);
  }
};

/** The canonical text of a structure pattern. */
export const structurePatternDisplay = (
  pattern: StructurePattern,
  patternDisplay: (p: Pattern) => string,
): string => {
  switch (pattern.type) {
    case "Array":
      return arrayPatternDisplay(pattern.pattern, patternDisplay);
    case "Map":
      return mapPatternDisplay(pattern.pattern, patternDisplay);
    case "Tagged":
      return taggedPatternDisplay(pattern.pattern, patternDisplay);
  }
};

/** An `Array` structure pattern. */
export const structureArray = (pattern: ArrayPattern): StructurePattern =>
  Object.freeze({ type: "Array", pattern });
/** A `Map` structure pattern. */
export const structureMap = (pattern: MapPattern): StructurePattern =>
  Object.freeze({ type: "Map", pattern });
/** A `Tagged` structure pattern. */
export const structureTagged = (pattern: TaggedPattern): StructurePattern =>
  Object.freeze({ type: "Tagged", pattern });
