import { n as Path } from "./format-BXbJoOH-.mjs";
import { _ as Reluctance, b as Interval, g as DEFAULT_RELUCTANCE, h as Quantifier, l as Span, m as DEFAULT_QUANTIFIER, n as DcborPatternErrorCode, r as DcborPatternErrorDetails, s as ParseResult, t as DcborPatternError, u as span, v as reluctanceSuffix, y as DEFAULT_INTERVAL } from "./error-63y30a8u.mjs";
import { $ as taggedRegex, A as digestBinaryRegex, B as numberGreaterThanOrEqual, C as date, D as dateRange, E as dateLatest, F as knownValueRegex, G as numberNegInfinity, H as numberLessThan, I as not, J as repeat, K as numberRange, L as nullValue, M as group, N as knownValue, O as dateRegex, P as knownValueNamed, Q as taggedName, Qt as StructurePattern, R as number, S as capture, T as dateIso8601, U as numberLessThanOrEqual, V as numberInfinity, W as numberNaN, X as sequence, Y as search, Z as tagged, _ as anyTagged, a as paths, b as byteString, c as any, cr as ValuePattern, d as anyByteString, et as text, f as anyDate, g as anyNumber, h as anyMap, i as matches, j as digestPrefix, k as digest, l as anyArray, m as anyKnownValue, n as Pattern, nt as MetaPattern, o as pathsWithCaptures, p as anyDigest, q as or, r as display, s as and, t as MatchResult, tt as textRegex, u as anyBool, v as anyText, w as dateEarliest, x as byteStringRegex, y as boolean, z as numberGreaterThan } from "./index-DD3Opg-3.mjs";
//#region src/parse/index.d.ts
/** A parsed pattern prefix and how many UTF-16 code units it consumed. */
interface PatternPrefix {
  readonly pattern: Pattern;
  readonly length: number;
}
/**
 * Parses a whole pattern string.
 *
 * @throws {DcborPatternError} If the string is not a pattern, or has trailing input
 */
declare function parsePattern(input: string): Pattern;
/** `parsePattern` without throwing. */
declare function tryParsePattern(input: string): ParseResult<Pattern>;
/**
 * Parses the pattern at the start of `input` and reports how much it
 * consumed, for languages that embed patterns.
 *
 * @throws {DcborPatternError} If no pattern starts the input
 */
declare function parsePatternPrefix(input: string): PatternPrefix;
/** `parsePatternPrefix` without throwing. */
declare function tryParsePatternPrefix(input: string): ParseResult<PatternPrefix>;
//#endregion
export { DEFAULT_INTERVAL, DEFAULT_QUANTIFIER, DEFAULT_RELUCTANCE, DcborPatternError, DcborPatternErrorCode, type DcborPatternErrorDetails, Interval, type MatchResult, type MetaPattern, type ParseResult, type Path, type Pattern, type PatternPrefix, Quantifier, Reluctance, type Span, type StructurePattern, type ValuePattern, and, any, anyArray, anyBool, anyByteString, anyDate, anyDigest, anyKnownValue, anyMap, anyNumber, anyTagged, anyText, boolean, byteString, byteStringRegex, capture, date, dateEarliest, dateIso8601, dateLatest, dateRange, dateRegex, digest, digestBinaryRegex, digestPrefix, display, group, knownValue, knownValueNamed, knownValueRegex, matches, not, nullValue, number, numberGreaterThan, numberGreaterThanOrEqual, numberInfinity, numberLessThan, numberLessThanOrEqual, numberNaN, numberNegInfinity, numberRange, or, parsePattern, parsePatternPrefix, paths, pathsWithCaptures, reluctanceSuffix, repeat, search, sequence, span, tagged, taggedName, taggedRegex, text, textRegex, tryParsePattern, tryParsePatternPrefix };
//# sourceMappingURL=index.d.mts.map