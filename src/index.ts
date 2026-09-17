/**
 * dCBOR patterns: a text syntax parsed into a `Pattern`, run against a
 * `Cbor` value to yield the paths it matches and the captures it names.
 * Formatting the paths lives on `/format`; the per-kind pattern modules on
 * `/patterns`.
 *
 * @packageDocumentation
 */
export {
  DcborPatternError,
  DcborPatternErrorCode,
  type DcborPatternErrorDetails,
  type DcborPatternErrorDetailsByCode,
  type DcborPatternErrorTyped,
  type DcborResult,
  type Span,
  type TokenKind,
  span,
  spanToByteOffsets,
} from "./error";
export { Reluctance, DEFAULT_RELUCTANCE } from "./reluctance";
export { Interval, DEFAULT_INTERVAL } from "./interval";
export { Quantifier, DEFAULT_QUANTIFIER } from "./quantifier";
export type { Path } from "./format";
export type { PatternRegex, RegexInput, RegexMode } from "./regex";
export {
  type Pattern,
  type MatchResult,
  paths,
  matches,
  display,
  pathsWithCaptures,
  patternEquals,
} from "./pattern";
export * from "./pattern/constructors";
export type { ValuePattern } from "./pattern/value";
export type { StructurePattern } from "./pattern/structure";
export type { MetaPattern } from "./pattern/meta";
export {
  parsePattern,
  tryParsePattern,
  parsePatternPartial,
  tryParsePatternPartial,
  type PatternPartial,
  type ParseOptions,
} from "./parse";
