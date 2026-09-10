import { $ as search, $r as RegexInput, A as dateLatest, B as not, C as boolean, D as date, Dn as ValuePattern, E as capture, F as digestPrefix, G as numberInfinity, H as number, I as group, J as numberNaN, K as numberLessThan, L as knownValue, M as dateRegex, N as digest, O as dateEarliest, P as digestBinaryRegex, Q as repeat, Qr as PatternRegex, R as knownValueNamed, S as anyText, T as byteStringRegex, U as numberGreaterThan, V as nullValue, W as numberGreaterThanOrEqual, Wt as StructurePattern, X as numberRange, Y as numberNegInfinity, Z as or, _ as anyDigest, a as paths, ai as DEFAULT_RELUCTANCE, at as textRegex, b as anyNumber, d as and, ei as RegexMode, et as sequence, f as any, g as anyDate, h as anyByteString, i as matches, ii as Interval, it as text, j as dateRange, k as dateIso8601, m as anyBool, n as Pattern, ni as Quantifier, nt as taggedName, o as pathsWithCaptures, oi as Reluctance, ot as MetaPattern, p as anyArray, q as numberLessThanOrEqual, r as display, ri as DEFAULT_INTERVAL, rt as taggedRegex, t as MatchResult, ti as DEFAULT_QUANTIFIER, tt as tagged, u as patternEquals, v as anyKnownValue, w as byteString, x as anyTagged, y as anyMap, z as knownValueRegex } from "./index-DV_TAMcn.mjs";
import { Path } from "./format.mjs";
//#region src/error.d.ts
/**
 * Errors: `DcborPatternError` for text that does not parse. Spans are UTF-16
 * code-unit offsets into the source.
 *
 * @module error
 */
/** A non-throwing outcome: the value, or the error. */
type DcborResult<T, E> = {
  /** `true`: `value` is present. */
  readonly ok: true;
  /** The outcome. */
  readonly value: T;
} | {
  /** `false`: `error` is present. */
  readonly ok: false;
  /** Why there is no value. */
  readonly error: E;
};
/** A half-open range of UTF-16 code units in the source string. */
interface Span {
  /** The offset of the first code unit. */
  readonly start: number;
  /** The offset after the last code unit. */
  readonly end: number;
}
/** Builds a frozen span. */
export declare function span(start: number, end: number): Span;
/** Converts a span's UTF-16 offsets to UTF-8 byte offsets, as other implementations count them. */
export declare function spanToByteOffsets(source: string, range: Span): Span;
/** The kind of a token, as `UnexpectedToken` reports it. */
type TokenKind = "And" | "Or" | "Not" | "RepeatZeroOrMore" | "RepeatZeroOrMoreLazy" | "RepeatZeroOrMorePossessive" | "RepeatOneOrMore" | "RepeatOneOrMoreLazy" | "RepeatOneOrMorePossessive" | "RepeatZeroOrOne" | "RepeatZeroOrOneLazy" | "RepeatZeroOrOnePossessive" | "Tagged" | "Array" | "Map" | "Bool" | "ByteString" | "Date" | "Known" | "Null" | "Number" | "Text" | "Digest" | "Search" | "BoolTrue" | "BoolFalse" | "NaN" | "Infinity" | "NegInfinity" | "ParenOpen" | "ParenClose" | "BracketOpen" | "BracketClose" | "BraceOpen" | "BraceClose" | "Comma" | "Colon" | "Ellipsis" | "GreaterThanOrEqual" | "LessThanOrEqual" | "GreaterThan" | "LessThan" | "NumberLiteral" | "GroupName" | "StringLiteral" | "SingleQuoted" | "Regex" | "HexString" | "HexRegex" | "DateQuoted" | "DigestQuoted" | "Range";
/** Why a pattern text was rejected. */
export declare const DcborPatternErrorCode: {
  /** The source is empty. */
  readonly EmptyInput: "EmptyInput";
  /** The source ended inside a pattern. */
  readonly UnexpectedEndOfInput: "UnexpectedEndOfInput";
  /** Text follows the pattern. */
  readonly ExtraData: "ExtraData";
  /** A token that cannot start or continue a pattern here. */
  readonly UnexpectedToken: "UnexpectedToken";
  /** Text no token matches. */
  readonly UnrecognizedToken: "UnrecognizedToken";
  /** A regex the pattern language's dialect does not accept. */
  readonly InvalidRegex: "InvalidRegex";
  /** A `/regex/` without its closing slash. */
  readonly UnterminatedRegex: "UnterminatedRegex";
  /** A string literal without its closing quote. */
  readonly UnterminatedString: "UnterminatedString";
  /** A `{n,m}` range that is not one, or with `n` above `m`. */
  readonly InvalidRange: "InvalidRange";
  /** An `h'…'` or `digest'…'` literal that is not even-length hex. */
  readonly InvalidHexString: "InvalidHexString";
  /** An `h'…'` literal without its closing quote. */
  readonly UnterminatedHexString: "UnterminatedHexString";
  /** A `date'…'` body that is not a date, a range of dates, or a regex. */
  readonly InvalidDateFormat: "InvalidDateFormat";
  /** A number literal that is not a finite dCBOR number. */
  readonly InvalidNumberFormat: "InvalidNumberFormat";
  /** A `digest'ur:…'` body the UR decoder rejects. */
  readonly InvalidUr: "InvalidUr";
  /** An opening parenthesis was required. */
  readonly ExpectedOpenParen: "ExpectedOpenParen";
  /** A closing parenthesis was required. */
  readonly ExpectedCloseParen: "ExpectedCloseParen";
  /** A closing bracket was required. */
  readonly ExpectedCloseBracket: "ExpectedCloseBracket";
  /** A closing brace was required. */
  readonly ExpectedCloseBrace: "ExpectedCloseBrace";
  /** A colon was required between a map key and its value. */
  readonly ExpectedColon: "ExpectedColon";
  /** A pattern was required after an operator. */
  readonly ExpectedPattern: "ExpectedPattern";
  /** Parentheses that do not pair. */
  readonly UnmatchedParentheses: "UnmatchedParentheses";
  /** Braces that do not pair. */
  readonly UnmatchedBraces: "UnmatchedBraces";
  /** A capture name that is not an identifier. */
  readonly InvalidCaptureGroupName: "InvalidCaptureGroupName";
  /** A `digest'…'` body that is neither a UR, a regex nor a hex prefix. */
  readonly InvalidDigestPattern: "InvalidDigestPattern";
  /** A `digest'…'` literal without its closing quote. */
  readonly UnterminatedDigestQuoted: "UnterminatedDigestQuoted";
  /** A `date'…'` literal without its closing quote. */
  readonly UnterminatedDateQuoted: "UnterminatedDateQuoted";
  /** Nesting deeper than `ParseOptions.maxDepth`; this package's own limit. */
  readonly NestingTooDeep: "NestingTooDeep";
};
/** One of the `DcborPatternErrorCode` values. */
export type DcborPatternErrorCode = (typeof DcborPatternErrorCode)[keyof typeof DcborPatternErrorCode];
/**
 * The structured payload of a {@link DcborPatternError}, discriminated by
 * `code`: `e.details.code === "UnexpectedToken"` narrows to `{ span, kind,
 * text }`. Every code but `EmptyInput` and `UnexpectedEndOfInput` carries
 * the span of the offending text.
 */
type DcborPatternErrorDetails = {
  /** The discriminant. */
  readonly code: "EmptyInput";
} | {
  /** The discriminant. */
  readonly code: "UnexpectedEndOfInput";
} | {
  /** The discriminant. */
  readonly code: "ExtraData";
  /** The text after the pattern. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "UnexpectedToken";
  /** The token. */
  readonly span: Span;
  /** The kind of the token found. */
  readonly kind: TokenKind;
  /** The token's source text. */
  readonly text: string;
} | {
  /** The discriminant. */
  readonly code: "UnrecognizedToken";
  /** The unrecognised text. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidRegex";
  /** The regex literal. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "UnterminatedRegex";
  /** The literal, to the end of the source. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "UnterminatedString";
  /** The literal, to the end of the source. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidRange";
  /** The range text. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidHexString";
  /** The literal. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "UnterminatedHexString";
  /** The literal, to the end of the source. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidDateFormat";
  /** The literal. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidNumberFormat";
  /** The literal. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidUr";
  /** The literal. */
  readonly span: Span;
  /** The UR decoder's reason. */
  readonly cause: string;
} | {
  /** The discriminant. */
  readonly code: "ExpectedOpenParen";
  /** Where the parenthesis was required. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "ExpectedCloseParen";
  /** The token found instead, or the end of the source. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "ExpectedCloseBracket";
  /** The token found instead, or the end of the source. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "ExpectedCloseBrace";
  /** The token found instead, or the end of the source. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "ExpectedColon";
  /** The token found instead, or the end of the source. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "ExpectedPattern";
  /** Where the pattern was required. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "UnmatchedParentheses";
  /** The parenthesis without a pair. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "UnmatchedBraces";
  /** The brace without a pair. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "InvalidCaptureGroupName";
  /** The `@` and the name. */
  readonly span: Span;
  /** The name as written. */
  readonly name: string;
} | {
  /** The discriminant. */
  readonly code: "InvalidDigestPattern";
  /** The literal. */
  readonly span: Span;
  /** The body as written, or `empty content`. */
  readonly reason: string;
} | {
  /** The discriminant. */
  readonly code: "UnterminatedDigestQuoted";
  /** The literal, to the end of the source. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "UnterminatedDateQuoted";
  /** The literal, to the end of the source. */
  readonly span: Span;
} | {
  /** The discriminant. */
  readonly code: "NestingTooDeep";
  /** The token that opened the level too many. */
  readonly span: Span;
  /** The limit in force. */
  readonly maxDepth: number;
};
/** The details payload of each `DcborPatternErrorCode`. */
type DcborPatternErrorDetailsByCode = { [D in DcborPatternErrorDetails as D["code"]]: D; };
/**
 * A {@link DcborPatternError} narrowed to one code: `code` is `C` and
 * `details` is the payload of `C`. With the default type argument it is the
 * union over every code, so narrowing on `error.code` narrows `error.details`.
 */
type DcborPatternErrorTyped<C extends DcborPatternErrorCode = DcborPatternErrorCode> = C extends DcborPatternErrorCode ? DcborPatternError & {
  /** The discriminant. */
  readonly code: C;
  /** The payload of `code`. */
  readonly details: DcborPatternErrorDetailsByCode[C];
} : never;
/**
 * Thrown by `parsePattern` and `parsePatternPrefix` (and carried by the
 * `try…` forms) for text that does not parse. `code` says why; `details`
 * carries the span and the code-specific fields; `fullMessage(source)`
 * renders the message with the source line and a caret. Instances come
 * from the static factories only.
 *
 * @example
 * ```ts
 * try {
 *   parsePattern("[1, 2");
 * } catch (e) {
 *   if (DcborPatternError.isDcborPatternError(e) && e.code === "ExpectedCloseBracket") {
 *     e.details.span; // where the bracket was required
 *   }
 * }
 * ```
 */
export declare class DcborPatternError extends Error {
  /** Always `"DcborPatternError"`; the cross-copy identity {@link DcborPatternError.isDcborPatternError} checks. */
  override readonly name = "DcborPatternError";
  /** The discriminant; equals `details.code`. */
  readonly code: DcborPatternErrorCode;
  /** The structured payload, discriminated by `code`. */
  readonly details: DcborPatternErrorDetails;
  private constructor();
  /** Type guard for a `DcborPatternError`, including one from another copy of this package. */
  static isDcborPatternError(value: unknown): value is DcborPatternErrorTyped;
  /** `true` when `code` is this error's code. */
  is(code: DcborPatternErrorCode): boolean;
  /** The span, if the error has one. */
  get span(): Span | undefined;
  /** The message with the source line and a caret under the span. */
  fullMessage(source: string): string;
  /** @internal The same error with its span moved by `offset`. */
  shifted(offset: number): DcborPatternError;
  private static make;
  /** The source is empty. */
  static emptyInput(): DcborPatternErrorTyped<"EmptyInput">;
  /** The source ended inside a pattern. */
  static unexpectedEndOfInput(): DcborPatternErrorTyped<"UnexpectedEndOfInput">;
  /** Text follows the pattern. */
  static extraData(range: Span): DcborPatternErrorTyped<"ExtraData">;
  /** A token that cannot start or continue a pattern here. */
  static unexpectedToken(kind: TokenKind, text: string, range: Span): DcborPatternErrorTyped<"UnexpectedToken">;
  /** Text no token matches. */
  static unrecognizedToken(range: Span): DcborPatternErrorTyped<"UnrecognizedToken">;
  /** A regex the dialect does not accept. */
  static invalidRegex(range: Span): DcborPatternErrorTyped<"InvalidRegex">;
  /** A `/regex/` without its closing slash. */
  static unterminatedRegex(range: Span): DcborPatternErrorTyped<"UnterminatedRegex">;
  /** A string literal without its closing quote. */
  static unterminatedString(range: Span): DcborPatternErrorTyped<"UnterminatedString">;
  /** A `{n,m}` range that is not one, or with `n` above `m`. */
  static invalidRange(range: Span): DcborPatternErrorTyped<"InvalidRange">;
  /** A hex literal that is not even-length hex. */
  static invalidHexString(range: Span): DcborPatternErrorTyped<"InvalidHexString">;
  /** An `h'…'` literal without its closing quote. */
  static unterminatedHexString(range: Span): DcborPatternErrorTyped<"UnterminatedHexString">;
  /** A `date'…'` body that is not a date, a range of dates, or a regex. */
  static invalidDateFormat(range: Span): DcborPatternErrorTyped<"InvalidDateFormat">;
  /** A number literal that is not a finite dCBOR number. */
  static invalidNumberFormat(range: Span): DcborPatternErrorTyped<"InvalidNumberFormat">;
  /** A `digest'ur:…'` body the UR decoder rejects. */
  static invalidUr(cause: string, range: Span): DcborPatternErrorTyped<"InvalidUr">;
  /** An opening parenthesis was required. */
  static expectedOpenParen(range: Span): DcborPatternErrorTyped<"ExpectedOpenParen">;
  /** A closing parenthesis was required. */
  static expectedCloseParen(range: Span): DcborPatternErrorTyped<"ExpectedCloseParen">;
  /** A closing bracket was required. */
  static expectedCloseBracket(range: Span): DcborPatternErrorTyped<"ExpectedCloseBracket">;
  /** A closing brace was required. */
  static expectedCloseBrace(range: Span): DcborPatternErrorTyped<"ExpectedCloseBrace">;
  /** A colon was required between a map key and its value. */
  static expectedColon(range: Span): DcborPatternErrorTyped<"ExpectedColon">;
  /** A pattern was required after an operator. */
  static expectedPattern(range: Span): DcborPatternErrorTyped<"ExpectedPattern">;
  /** Parentheses that do not pair. */
  static unmatchedParentheses(range: Span): DcborPatternErrorTyped<"UnmatchedParentheses">;
  /** Braces that do not pair. */
  static unmatchedBraces(range: Span): DcborPatternErrorTyped<"UnmatchedBraces">;
  /** A capture name that is not an identifier. */
  static invalidCaptureGroupName(name: string, range: Span): DcborPatternErrorTyped<"InvalidCaptureGroupName">;
  /** A `digest'…'` body that is neither a UR, a regex nor a hex prefix. */
  static invalidDigestPattern(reason: string, range: Span): DcborPatternErrorTyped<"InvalidDigestPattern">;
  /** A `digest'…'` literal without its closing quote. */
  static unterminatedDigestQuoted(range: Span): DcborPatternErrorTyped<"UnterminatedDigestQuoted">;
  /** A `date'…'` literal without its closing quote. */
  static unterminatedDateQuoted(range: Span): DcborPatternErrorTyped<"UnterminatedDateQuoted">;
  /** A pattern nested deeper than `maxDepth`. */
  static nestingTooDeep(maxDepth: number, range: Span): DcborPatternErrorTyped<"NestingTooDeep">;
}
//#endregion
//#region src/parse/index.d.ts
/** How deep a pattern may nest; the field has a default. */
interface ParseOptions {
  /** The deepest nesting of groups, captures, `search`, arrays, maps and tagged values accepted (a positive integer), 500 by default. */
  readonly maxDepth?: number | undefined;
}
/** A parsed pattern prefix and how many UTF-16 code units it consumed. */
interface PatternPrefix {
  /** The pattern. */
  readonly pattern: Pattern;
  /** How many UTF-16 code units it consumed, trailing whitespace included. */
  readonly length: number;
}
/**
 * Parses a whole pattern string; whitespace may follow the pattern.
 *
 * @throws {DcborPatternError} If the string is not a pattern, has trailing input, or nests deeper than `maxDepth`
 * @throws {TypeError} If `input` is not a string
 * @throws {RangeError} If `maxDepth` is not a positive integer
 */
export declare function parsePattern(input: string, options?: ParseOptions): Pattern;
/** `parsePattern` with the error returned instead of thrown; a `TypeError` or `RangeError` still throws. */
export declare function tryParsePattern(input: string, options?: ParseOptions): DcborResult<Pattern, DcborPatternError>;
/**
 * Parses the pattern at the start of `input` and reports how much it
 * consumed (whitespace after the pattern included), for languages that
 * embed patterns.
 *
 * @throws {DcborPatternError} If no pattern starts the input
 * @throws {TypeError} If `input` is not a string
 * @throws {RangeError} If `maxDepth` is not a positive integer
 */
export declare function parsePatternPrefix(input: string, options?: ParseOptions): PatternPrefix;
/** `parsePatternPrefix` with the error returned instead of thrown; a `TypeError` or `RangeError` still throws. */
export declare function tryParsePatternPrefix(input: string, options?: ParseOptions): DcborResult<PatternPrefix, DcborPatternError>;
//#endregion
export { DEFAULT_INTERVAL, DEFAULT_QUANTIFIER, DEFAULT_RELUCTANCE, type DcborPatternErrorDetails, type DcborPatternErrorDetailsByCode, type DcborPatternErrorTyped, type DcborResult, Interval, type MatchResult, type MetaPattern, type ParseOptions, type Path, type Pattern, type PatternPrefix, type PatternRegex, Quantifier, type RegexInput, type RegexMode, Reluctance, type Span, type StructurePattern, type TokenKind, type ValuePattern, and, any, anyArray, anyBool, anyByteString, anyDate, anyDigest, anyKnownValue, anyMap, anyNumber, anyTagged, anyText, boolean, byteString, byteStringRegex, capture, date, dateEarliest, dateIso8601, dateLatest, dateRange, dateRegex, digest, digestBinaryRegex, digestPrefix, display, group, knownValue, knownValueNamed, knownValueRegex, matches, not, nullValue, number, numberGreaterThan, numberGreaterThanOrEqual, numberInfinity, numberLessThan, numberLessThanOrEqual, numberNaN, numberNegInfinity, numberRange, or, paths, pathsWithCaptures, patternEquals, repeat, search, sequence, tagged, taggedName, taggedRegex, text, textRegex };
//# sourceMappingURL=index.d.mts.map