/**
 * The per-kind pattern types, constructors, matchers and displayers behind
 * the `Pattern` union, for languages built on dCBOR patterns (envelope
 * patterns embed them at their leaves). Every matcher here runs with the
 * root module's operations, so this entry works when imported alone.
 *
 * @packageDocumentation
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "./format";
import { ops, type MatchResult } from "./pattern";
import * as meta from "./pattern/meta";
import * as structure from "./pattern/structure";

export * from "./pattern/value";
export { compilePattern, collectPatternCaptureNames } from "./pattern/matcher";
export type { Program, Instr, Axis } from "./pattern/vm";
export { patternEquals } from "./pattern/equals";

export type {
  ArrayPattern,
  MapPattern,
  TaggedPattern,
  StructurePattern,
} from "./pattern/structure";
export {
  arrayPatternAny,
  arrayPatternWithElements,
  arrayPatternWithLength,
  arrayPatternWithLengthRange,
  arrayPatternWithLengthInterval,
  arrayPatternDisplay,
  arrayPatternEquals,
  mapPatternAny,
  mapPatternWithConstraints,
  mapPatternWithLength,
  mapPatternWithLengthRange,
  mapPatternWithLengthInterval,
  mapPatternDisplay,
  mapPatternEquals,
  taggedPatternAny,
  taggedPatternWithTag,
  taggedPatternWithName,
  taggedPatternWithRegex,
  taggedPatternDisplay,
  taggedPatternEquals,
  structurePatternDisplay,
  structureArray,
  structureMap,
  structureTagged,
} from "./pattern/structure";

export type {
  AnyPattern,
  AndPattern,
  OrPattern,
  NotPattern,
  RepeatPattern,
  CapturePattern,
  SearchPattern,
  SequencePattern,
  SearchWithCaptures,
  MetaPattern,
} from "./pattern/meta";
export {
  anyPattern,
  anyPatternMatches,
  anyPatternPaths,
  anyPatternDisplay,
  andPattern,
  andPatternDisplay,
  orPattern,
  orPatternDisplay,
  notPattern,
  notPatternDisplay,
  repeatPattern,
  repeatZeroOrMore,
  repeatOneOrMore,
  repeatOptional,
  repeatExact,
  repeatRange,
  repeatPatternDisplay,
  capturePattern,
  capturePatternDisplay,
  searchPattern,
  searchPatternDisplay,
  sequencePattern,
  sequencePatternMatches,
  sequencePatternPaths,
  sequencePatternDisplay,
  sequencePatternPatterns,
  metaPatternDisplay,
  metaAny,
  metaAnd,
  metaOr,
  metaNot,
  metaRepeat,
  metaCapture,
  metaSearch,
  metaSequence,
} from "./pattern/meta";

/** Whether an array pattern matches. */
export const arrayPatternMatches = (pattern: structure.ArrayPattern, haystack: Cbor): boolean =>
  structure.arrayPatternMatches(pattern, haystack, ops);
/** The paths an array pattern matches. */
export const arrayPatternPaths = (pattern: structure.ArrayPattern, haystack: Cbor): Path[] =>
  structure.arrayPatternPaths(pattern, haystack, ops);
/** The paths and captures of an array pattern. */
export const arrayPatternPathsWithCaptures = (
  pattern: structure.ArrayPattern,
  haystack: Cbor,
): [Path[], Map<string, Path[]>] => structure.arrayPatternPathsWithCaptures(pattern, haystack, ops);
/** Whether a map pattern matches. */
export const mapPatternMatches = (pattern: structure.MapPattern, haystack: Cbor): boolean =>
  structure.mapPatternMatches(pattern, haystack, ops);
/** The paths a map pattern matches. */
export const mapPatternPaths = (pattern: structure.MapPattern, haystack: Cbor): Path[] =>
  structure.mapPatternPaths(pattern, haystack, ops);
/** The paths and captures of a map pattern. */
export const mapPatternPathsWithCaptures = (
  pattern: structure.MapPattern,
  haystack: Cbor,
): [Path[], Map<string, Path[]>] => structure.mapPatternPathsWithCaptures(pattern, haystack, ops);
/** Whether a tagged pattern matches. */
export const taggedPatternMatches = (pattern: structure.TaggedPattern, haystack: Cbor): boolean =>
  structure.taggedPatternMatches(pattern, haystack, ops);
/** The paths a tagged pattern matches. */
export const taggedPatternPaths = (pattern: structure.TaggedPattern, haystack: Cbor): Path[] =>
  structure.taggedPatternPaths(pattern, haystack, ops);
/** The paths and captures of a tagged pattern. */
export const taggedPatternPathsWithCaptures = (
  pattern: structure.TaggedPattern,
  haystack: Cbor,
): [Path[], Map<string, Path[]>] =>
  structure.taggedPatternPathsWithCaptures(pattern, haystack, ops);
/** The paths a structure pattern matches. */
export const structurePatternPaths = (
  pattern: structure.StructurePattern,
  haystack: Cbor,
): Path[] => structure.structurePatternPaths(pattern, haystack, ops);
/** Whether a structure pattern matches. */
export const structurePatternMatches = (
  pattern: structure.StructurePattern,
  haystack: Cbor,
): boolean => structure.structurePatternMatches(pattern, haystack, ops);
/** The paths and captures of a structure pattern. */
export const structurePatternPathsWithCaptures = (
  pattern: structure.StructurePattern,
  haystack: Cbor,
): [Path[], Map<string, Path[]>] =>
  structure.structurePatternPathsWithCaptures(pattern, haystack, ops);

/** Whether an `and` pattern matches. */
export const andPatternMatches = (pattern: meta.AndPattern, haystack: Cbor): boolean =>
  meta.andPatternMatches(pattern, haystack, ops);
/** The paths an `and` pattern matches. */
export const andPatternPaths = (pattern: meta.AndPattern, haystack: Cbor): Path[] =>
  meta.andPatternPaths(pattern, haystack, ops);
/** Whether an `or` pattern matches. */
export const orPatternMatches = (pattern: meta.OrPattern, haystack: Cbor): boolean =>
  meta.orPatternMatches(pattern, haystack, ops);
/** The paths an `or` pattern matches. */
export const orPatternPaths = (pattern: meta.OrPattern, haystack: Cbor): Path[] =>
  meta.orPatternPaths(pattern, haystack, ops);
/** Whether a `not` pattern matches. */
export const notPatternMatches = (pattern: meta.NotPattern, haystack: Cbor): boolean =>
  meta.notPatternMatches(pattern, haystack, ops);
/** The paths a `not` pattern matches. */
export const notPatternPaths = (pattern: meta.NotPattern, haystack: Cbor): Path[] =>
  meta.notPatternPaths(pattern, haystack, ops);
/** Whether a repeat pattern matches. */
export const repeatPatternMatches = (pattern: meta.RepeatPattern, haystack: Cbor): boolean =>
  meta.repeatPatternMatches(pattern, haystack, ops);
/** The paths a repeat pattern matches. */
export const repeatPatternPaths = (pattern: meta.RepeatPattern, haystack: Cbor): Path[] =>
  meta.repeatPatternPaths(pattern, haystack, ops);
/** Whether a capture pattern matches. */
export const capturePatternMatches = (pattern: meta.CapturePattern, haystack: Cbor): boolean =>
  meta.capturePatternMatches(pattern, haystack, ops);
/** The paths a capture pattern matches. */
export const capturePatternPaths = (pattern: meta.CapturePattern, haystack: Cbor): Path[] =>
  meta.capturePatternPaths(pattern, haystack, ops);
/** Whether a search pattern matches. */
export const searchPatternMatches = (pattern: meta.SearchPattern, haystack: Cbor): boolean =>
  meta.searchPatternMatches(pattern, haystack, ops);
/** The paths a search pattern matches. */
export const searchPatternPaths = (pattern: meta.SearchPattern, haystack: Cbor): Path[] =>
  meta.searchPatternPaths(pattern, haystack, ops);
/** The paths and captures of a search pattern. */
export const searchPatternPathsWithCaptures = (
  pattern: meta.SearchPattern,
  haystack: Cbor,
): meta.SearchWithCaptures => meta.searchPatternPathsWithCaptures(pattern, haystack, ops);
/** The paths a meta pattern matches. */
export const metaPatternPaths = (pattern: meta.MetaPattern, haystack: Cbor): Path[] =>
  meta.metaPatternPaths(pattern, haystack, ops);
/** Whether a meta pattern matches. */
export const metaPatternMatches = (pattern: meta.MetaPattern, haystack: Cbor): boolean =>
  meta.metaPatternMatches(pattern, haystack, ops);

export type { MatchResult };
