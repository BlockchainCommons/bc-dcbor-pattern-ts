import { Cbor, CborDate, Tag } from "@blockchaincommons/dcbor-compat";
import { KnownValue } from "@blockchaincommons/known-values";
import { Digest } from "@blockchaincommons/components";
//#region src/interval.d.ts
/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * Provides an `Interval` type representing a range of values with a
 * minimum and optional maximum.
 *
 * This module is used in the context of pattern matching for dCBOR items
 * to represent cardinality specifications like `{n}`, `{n,m}`, or `{n,}`
 * in pattern expressions.
 *
 * @module interval
 */
/**
 * Represents an inclusive interval with a minimum value and an optional
 * maximum value.
 *
 * When the maximum is `undefined`, the interval is considered unbounded above.
 *
 * @example
 * ```typescript
 * // Single value interval
 * const exact = new Interval(3, 3);  // Matches exactly 3
 *
 * // Bounded range
 * const range = new Interval(1, 5);  // Matches 1 to 5 inclusive
 *
 * // Unbounded range
 * const unbounded = new Interval(2); // Matches 2 or more
 * ```
 */
declare class Interval {
  private readonly _min;
  private readonly _max;
  /**
   * Creates a new Interval.
   *
   * @param min - The minimum value (inclusive)
   * @param max - The maximum value (inclusive), or undefined for unbounded
   */
  constructor(min: number, max?: number);
  /**
   * Creates an interval from a range specification.
   *
   * @param start - The start of the range (inclusive)
   * @param end - The end of the range (inclusive), or undefined for unbounded
   * @returns A new Interval
   */
  static from(start: number, end?: number): Interval;
  /**
   * Creates an interval for exactly n occurrences.
   *
   * @param n - The exact count
   * @returns A new Interval with min = max = n
   */
  static exactly(n: number): Interval;
  /**
   * Creates an interval for at least n occurrences.
   *
   * @param n - The minimum count
   * @returns A new Interval with min = n and no maximum
   */
  static atLeast(n: number): Interval;
  /**
   * Creates an interval for at most n occurrences.
   *
   * @param n - The maximum count
   * @returns A new Interval with min = 0 and max = n
   */
  static atMost(n: number): Interval;
  /**
   * Creates an interval for zero or more occurrences (0..).
   *
   * @returns A new Interval representing *
   */
  static zeroOrMore(): Interval;
  /**
   * Creates an interval for one or more occurrences (1..).
   *
   * @returns A new Interval representing +
   */
  static oneOrMore(): Interval;
  /**
   * Creates an interval for zero or one occurrence (0..=1).
   *
   * @returns A new Interval representing ?
   */
  static zeroOrOne(): Interval;
  /**
   * Returns the minimum value of the interval.
   */
  min(): number;
  /**
   * Returns the maximum value of the interval, or `undefined` if unbounded.
   */
  max(): number | undefined;
  /**
   * Checks if the given count falls within this interval.
   *
   * @param count - The count to check
   * @returns true if count is within the interval
   */
  contains(count: number): boolean;
  /**
   * Checks if the interval represents a single value (i.e., min equals max).
   */
  isSingle(): boolean;
  /**
   * Checks if the interval is unbounded (i.e., has no maximum value).
   */
  isUnbounded(): boolean;
  /**
   * Returns a string representation of the interval using standard range notation.
   *
   * @returns The range notation string
   *
   * @example
   * ```typescript
   * new Interval(3, 3).rangeNotation()  // "{3}"
   * new Interval(1, 5).rangeNotation()  // "{1,5}"
   * new Interval(2).rangeNotation()     // "{2,}"
   * ```
   */
  rangeNotation(): string;
  /**
   * Returns a string representation of the interval using shorthand notation
   * where applicable.
   *
   * @returns The shorthand notation string
   *
   * @example
   * ```typescript
   * new Interval(0, 1).shorthandNotation()  // "?"
   * new Interval(0).shorthandNotation()     // "*"
   * new Interval(1).shorthandNotation()     // "+"
   * new Interval(1, 5).shorthandNotation()  // "{1,5}"
   * ```
   */
  shorthandNotation(): string;
  /**
   * Returns a string representation using range notation.
   */
  toString(): string;
  /**
   * Checks equality with another Interval.
   */
  equals(other: Interval): boolean;
}
/**
 * Default interval is exactly 1 occurrence.
 */
declare const DEFAULT_INTERVAL: Interval;
//#endregion
//#region src/reluctance.d.ts
/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * Reluctance for quantifiers.
 *
 * This module defines the matching behavior for quantified patterns,
 * controlling how greedily the pattern matcher consumes input.
 *
 * @module reluctance
 */
/**
 * Reluctance for quantifiers.
 *
 * Controls how a quantified pattern matches:
 * - `Greedy`: Match as many as possible, backtrack if needed
 * - `Lazy`: Match as few as possible, add more if needed
 * - `Possessive`: Match as many as possible, never backtrack
 */
declare enum Reluctance {
  /**
   * Grabs as many repetitions as possible, then backtracks if the rest of
   * the pattern cannot match.
   */
  Greedy = "greedy",
  /**
   * Starts with as few repetitions as possible, adding more only if the rest
   * of the pattern cannot match.
   */
  Lazy = "lazy",
  /**
   * Grabs as many repetitions as possible and never backtracks; if the rest
   * of the pattern cannot match, the whole match fails.
   */
  Possessive = "possessive"
}
/**
 * Default reluctance is Greedy.
 */
declare const DEFAULT_RELUCTANCE: Reluctance;
/**
 * Returns the suffix character for a reluctance type.
 *
 * @param reluctance - The reluctance type
 * @returns The suffix string ("" for Greedy, "?" for Lazy, "+" for Possessive)
 *
 * @example
 * ```typescript
 * reluctanceSuffix(Reluctance.Greedy)     // ""
 * reluctanceSuffix(Reluctance.Lazy)       // "?"
 * reluctanceSuffix(Reluctance.Possessive) // "+"
 * ```
 */
declare const reluctanceSuffix: (reluctance: Reluctance) => string;
//#endregion
//#region src/quantifier.d.ts
/**
 * Defines how many times a pattern may or must match, with an interval and a
 * reluctance.
 *
 * @example
 * ```typescript
 * // Zero or more, greedy
 * const star = Quantifier.zeroOrMore();
 *
 * // One or more, lazy
 * const plusLazy = Quantifier.oneOrMore(Reluctance.Lazy);
 *
 * // Exactly 3 times
 * const exact = Quantifier.exactly(3);
 *
 * // Between 2 and 5, possessive
 * const range = Quantifier.between(2, 5, Reluctance.Possessive);
 * ```
 */
declare class Quantifier {
  private readonly _interval;
  private readonly _reluctance;
  /**
   * Creates a new Quantifier.
   *
   * @param interval - The interval defining how many times to match
   * @param reluctance - The matching strategy (default: Greedy)
   */
  constructor(interval: Interval, reluctance?: Reluctance);
  /**
   * Creates a quantifier from min/max values.
   *
   * @param min - Minimum occurrences
   * @param max - Maximum occurrences (undefined for unbounded)
   * @param reluctance - The matching strategy
   */
  static from(min: number, max?: number, reluctance?: Reluctance): Quantifier;
  /**
   * Creates a quantifier for exactly n occurrences.
   */
  static exactly(n: number, reluctance?: Reluctance): Quantifier;
  /**
   * Creates a quantifier for at least n occurrences.
   */
  static atLeast(n: number, reluctance?: Reluctance): Quantifier;
  /**
   * Creates a quantifier for at most n occurrences.
   */
  static atMost(n: number, reluctance?: Reluctance): Quantifier;
  /**
   * Creates a quantifier for between min and max occurrences.
   */
  static between(min: number, max: number, reluctance?: Reluctance): Quantifier;
  /**
   * Creates a quantifier for zero or more occurrences (*).
   */
  static zeroOrMore(reluctance?: Reluctance): Quantifier;
  /**
   * Creates a quantifier for one or more occurrences (+).
   */
  static oneOrMore(reluctance?: Reluctance): Quantifier;
  /**
   * Creates a quantifier for zero or one occurrence (?).
   */
  static zeroOrOne(reluctance?: Reluctance): Quantifier;
  /**
   * Returns the minimum number of occurrences.
   */
  min(): number;
  /**
   * Returns the maximum number of occurrences, or undefined if unbounded.
   */
  max(): number | undefined;
  /**
   * Returns the interval.
   */
  interval(): Interval;
  /**
   * Returns the reluctance (matching strategy).
   */
  reluctance(): Reluctance;
  /**
   * Checks if the given count is within the quantifier's range.
   */
  contains(count: number): boolean;
  /**
   * Checks if the quantifier is unbounded (no maximum).
   */
  isUnbounded(): boolean;
  /**
   * Returns a string representation of the quantifier.
   *
   * @example
   * ```typescript
   * Quantifier.zeroOrMore().toString()              // "*"
   * Quantifier.zeroOrMore(Reluctance.Lazy).toString() // "*?"
   * Quantifier.between(1, 5).toString()             // "{1,5}"
   * ```
   */
  toString(): string;
  /**
   * Checks equality with another Quantifier.
   */
  equals(other: Quantifier): boolean;
  /**
   * Converts to an Interval (discarding reluctance).
   */
  toInterval(): Interval;
}
/**
 * Default quantifier is exactly 1 occurrence, greedy.
 */
declare const DEFAULT_QUANTIFIER: Quantifier;
//#endregion
//#region src/parse/token.d.ts
/**
 * Token types for dCBOR pattern parsing.
 *
 * This is a discriminated union matching the Rust Token enum.
 */
type Token = {
  readonly type: "And";
} | {
  readonly type: "Or";
} | {
  readonly type: "Not";
} | {
  readonly type: "RepeatZeroOrMore";
} | {
  readonly type: "RepeatZeroOrMoreLazy";
} | {
  readonly type: "RepeatZeroOrMorePossessive";
} | {
  readonly type: "RepeatOneOrMore";
} | {
  readonly type: "RepeatOneOrMoreLazy";
} | {
  readonly type: "RepeatOneOrMorePossessive";
} | {
  readonly type: "RepeatZeroOrOne";
} | {
  readonly type: "RepeatZeroOrOneLazy";
} | {
  readonly type: "RepeatZeroOrOnePossessive";
} | {
  readonly type: "Tagged";
} | {
  readonly type: "Array";
} | {
  readonly type: "Map";
} | {
  readonly type: "Bool";
} | {
  readonly type: "ByteString";
} | {
  readonly type: "Date";
} | {
  readonly type: "Known";
} | {
  readonly type: "Null";
} | {
  readonly type: "Number";
} | {
  readonly type: "Text";
} | {
  readonly type: "Digest";
} | {
  readonly type: "Search";
} | {
  readonly type: "BoolTrue";
} | {
  readonly type: "BoolFalse";
} | {
  readonly type: "NaN";
} | {
  readonly type: "Infinity";
} | {
  readonly type: "NegInfinity";
} | {
  readonly type: "ParenOpen";
} | {
  readonly type: "ParenClose";
} | {
  readonly type: "BracketOpen";
} | {
  readonly type: "BracketClose";
} | {
  readonly type: "BraceOpen";
} | {
  readonly type: "BraceClose";
} | {
  readonly type: "Comma";
} | {
  readonly type: "Colon";
} | {
  readonly type: "Ellipsis";
} | {
  readonly type: "GreaterThanOrEqual";
} | {
  readonly type: "LessThanOrEqual";
} | {
  readonly type: "GreaterThan";
} | {
  readonly type: "LessThan";
} | {
  readonly type: "NumberLiteral";
  readonly value: number;
} | {
  readonly type: "GroupName";
  readonly name: string;
} | {
  readonly type: "StringLiteral";
  readonly value: string;
} | {
  readonly type: "SingleQuoted";
  readonly value: string;
} | {
  readonly type: "Regex";
  readonly pattern: string;
} | {
  readonly type: "HexString";
  readonly value: Uint8Array;
} | {
  readonly type: "HexRegex";
  readonly pattern: string;
} | {
  readonly type: "DateQuoted";
  readonly value: string;
} | {
  readonly type: "DigestQuoted";
  readonly value: string;
} | {
  readonly type: "Range";
  readonly quantifier: Quantifier;
};
/**
 * A token with its position in the source.
 */
interface SpannedToken {
  readonly token: Token;
  readonly span: Span;
}
/**
 * Lexer state for tokenizing dCBOR pattern expressions.
 */
declare class Lexer {
  private readonly _input;
  private _position;
  constructor(input: string);
  /**
   * Creates a new lexer for the given input.
   */
  static new(input: string): Lexer;
  /**
   * Returns the input string.
   */
  input(): string;
  /**
   * Returns the current position in the input.
   */
  position(): number;
  /**
   * Returns the remaining input.
   */
  remainder(): string;
  /**
   * Peeks at the current character without consuming it.
   */
  peek(): string | undefined;
  /**
   * Peeks at the character at offset from current position.
   */
  peekAt(offset: number): string | undefined;
  /**
   * Consumes and returns the current character.
   */
  advance(): string | undefined;
  /**
   * Advances by n characters.
   */
  bump(n: number): void;
  /**
   * Creates a span from start to current position.
   */
  spanFrom(start: number): Span;
  /**
   * Skips whitespace characters.
   */
  skipWhitespace(): void;
  /**
   * Checks if the remainder starts with the given string.
   */
  startsWith(s: string): boolean;
  /**
   * Gets the next token.
   */
  next(): Result<SpannedToken> | undefined;
  /**
   * Tokenizes the entire input and returns all tokens.
   */
  tokenize(): Result<SpannedToken[]>;
  /**
   * Parse { - could be BraceOpen or Range.
   */
  private parseBraceOpen;
  /**
   * Check if content looks like a range pattern.
   */
  private looksLikeRangePattern;
  /**
   * Parse a range pattern like {1,5} or {3,} or {5}.
   */
  private parseRange;
  /**
   * Parse a string literal.
   */
  private parseString;
  /**
   * Parse a single-quoted string.
   */
  private parseSingleQuoted;
  /**
   * Parse a regex pattern.
   */
  private parseRegex;
  /**
   * Parse a group name.
   */
  private parseGroupName;
  /**
   * Parse a hex string.
   */
  private parseHexString;
  /**
   * Parse a hex regex pattern.
   */
  private parseHexRegex;
  /**
   * Parse a number literal using dcbor-parse for consistency with dCBOR.
   */
  private parseNumber;
  /**
   * Parse an identifier or keyword.
   */
  private parseIdentifierOrKeyword;
  /**
   * Parse a date quoted pattern.
   */
  private parseDateQuoted;
  /**
   * Parse a digest quoted pattern.
   */
  private parseDigestQuoted;
  /**
   * Peeks at the next token without consuming it.
   * Returns a Result with the token or undefined if at end of input.
   */
  peekToken(): Result<Token> | undefined;
  /**
   * Returns the current span (position to position).
   */
  span(): Span;
  /**
   * Returns the last token's span.
   */
  lastSpan(): Span;
}
//#endregion
//#region src/error.d.ts
/**
 * Represents a span in the input string, indicating position for error reporting.
 */
interface Span {
  readonly start: number;
  readonly end: number;
}
/**
 * Creates a new Span.
 */
declare const span: (start: number, end: number) => Span;
/**
 * Errors that can occur during parsing of dCBOR patterns.
 *
 * This is a discriminated union type matching the Rust Error enum.
 */
type Error = {
  readonly type: "EmptyInput";
} | {
  readonly type: "UnexpectedEndOfInput";
} | {
  readonly type: "ExtraData";
  readonly span: Span;
} | {
  readonly type: "UnexpectedToken";
  readonly token: Token;
  readonly span: Span;
} | {
  readonly type: "UnrecognizedToken";
  readonly span: Span;
} | {
  readonly type: "InvalidRegex";
  readonly span: Span;
} | {
  readonly type: "UnterminatedRegex";
  readonly span: Span;
} | {
  readonly type: "UnterminatedString";
  readonly span: Span;
} | {
  readonly type: "InvalidRange";
  readonly span: Span;
} | {
  readonly type: "InvalidHexString";
  readonly span: Span;
} | {
  readonly type: "UnterminatedHexString";
  readonly span: Span;
} | {
  readonly type: "InvalidDateFormat";
  readonly span: Span;
} | {
  readonly type: "InvalidNumberFormat";
  readonly span: Span;
} | {
  readonly type: "InvalidUr";
  readonly message: string;
  readonly span: Span;
} | {
  readonly type: "ExpectedOpenParen";
  readonly span: Span;
} | {
  readonly type: "ExpectedCloseParen";
  readonly span: Span;
} | {
  readonly type: "ExpectedCloseBracket";
  readonly span: Span;
} | {
  readonly type: "ExpectedCloseBrace";
  readonly span: Span;
} | {
  readonly type: "ExpectedColon";
  readonly span: Span;
} | {
  readonly type: "ExpectedPattern";
  readonly span: Span;
} | {
  readonly type: "UnmatchedParentheses";
  readonly span: Span;
} | {
  readonly type: "UnmatchedBraces";
  readonly span: Span;
} | {
  readonly type: "InvalidCaptureGroupName";
  readonly name: string;
  readonly span: Span;
} | {
  readonly type: "InvalidDigestPattern";
  readonly message: string;
  readonly span: Span;
} | {
  readonly type: "UnterminatedDigestQuoted";
  readonly span: Span;
} | {
  readonly type: "UnterminatedDateQuoted";
  readonly span: Span;
} | {
  readonly type: "Unknown";
};
/**
 * A Result type specialized for dCBOR pattern parsing.
 * Matches Rust's Result<T, Error> pattern.
 */
type Result<T> = {
  readonly ok: true;
  readonly value: T;
} | {
  readonly ok: false;
  readonly error: Error;
};
/**
 * Creates a successful Result.
 */
declare const Ok: <T>(value: T) => Result<T>;
/**
 * Creates a failed Result.
 */
declare const Err: <T>(error: Error) => Result<T>;
/**
 * Unwraps a Result, throwing an error if it's not Ok.
 */
declare const unwrap: <T>(result: Result<T>) => T;
/**
 * Unwraps a Result, returning the default value if it's an error.
 */
declare const unwrapOr: <T>(result: Result<T>, defaultValue: T) => T;
/**
 * Maps a Result's value if it's Ok.
 */
declare const map: <T, U>(result: Result<T>, fn: (value: T) => U) => Result<U>;
/**
 * Converts an Error to a human-readable string.
 */
declare const errorToString: (error: Error) => string;
/**
 * Adjusts the span of an error by adding the given offset to both start and end positions.
 * Returns a new error with adjusted span, or the original error if it has no span.
 */
declare const adjustSpan: (error: Error, offset: number) => Error;
/**
 * JavaScript Error class wrapper for PatternError.
 * Provides stack traces and works with try/catch blocks.
 */
declare class PatternError extends globalThis.Error {
  readonly errorType: Error;
  constructor(errorType: Error, message?: string);
}
//#endregion
//#region src/format.d.ts
/**
 * A Path is a sequence of CBOR values representing the traversal from root
 * to a matched element.
 */
type Path = Cbor[];
/**
 * A builder that provides formatting options for each path element.
 */
declare enum PathElementFormat {
  /**
   * Diagnostic summary format, with optional maximum length for truncation.
   */
  DiagnosticSummary = "diagnostic_summary",
  /**
   * Flat diagnostic format (single line), with optional maximum length for
   * truncation.
   */
  DiagnosticFlat = "diagnostic_flat"
}
/**
 * Options for formatting paths.
 */
interface FormatPathsOpts {
  /**
   * Whether to indent each path element.
   * If true, each element will be indented by 4 spaces per level.
   * @default true
   */
  readonly indent: boolean;
  /**
   * Format for each path element.
   * @default PathElementFormat.DiagnosticSummary
   */
  readonly elementFormat: PathElementFormat;
  /**
   * Maximum length for element representation before truncation.
   * If undefined, no truncation is applied.
   */
  readonly maxLength: number | undefined;
  /**
   * If true, only the last element of each path will be formatted.
   * This is useful for displaying only the final destination of a path.
   * If false, all elements will be formatted.
   * @default false
   */
  readonly lastElementOnly: boolean;
}
/**
 * Default formatting options.
 */
declare const DEFAULT_FORMAT_OPTS: FormatPathsOpts;
/**
 * Creates formatting options with builder pattern.
 */
declare class FormatPathsOptsBuilder {
  private _opts;
  constructor();
  /**
   * Creates a new builder with default options.
   */
  static new(): FormatPathsOptsBuilder;
  /**
   * Sets whether to indent each path element.
   */
  indent(indent: boolean): FormatPathsOptsBuilder;
  /**
   * Sets the format for each path element.
   */
  elementFormat(format: PathElementFormat): FormatPathsOptsBuilder;
  /**
   * Sets the maximum length for element representation.
   */
  maxLength(length: number | undefined): FormatPathsOptsBuilder;
  /**
   * Sets whether to format only the last element of each path.
   */
  lastElementOnly(lastOnly: boolean): FormatPathsOptsBuilder;
  /**
   * Builds the options object.
   */
  build(): FormatPathsOpts;
}
/**
 * Format each path element on its own line, each line successively indented by
 * 4 spaces. Options can be provided to customize the formatting.
 *
 * @param path - The path to format
 * @param opts - Formatting options
 * @returns The formatted path string
 */
declare const formatPathOpt: (path: Path, opts?: FormatPathsOpts) => string;
/**
 * Format each path element on its own line, each line successively indented by
 * 4 spaces.
 *
 * @param path - The path to format
 * @returns The formatted path string
 */
declare const formatPath: (path: Path) => string;
/**
 * Format multiple paths with captures in a structured way.
 * Captures come first, sorted lexicographically by name, with their name
 * prefixed by '@'. Regular paths follow after all captures.
 *
 * @param paths - The paths to format
 * @param captures - Named capture groups and their paths
 * @param opts - Formatting options
 * @returns The formatted string
 */
declare const formatPathsWithCaptures: (paths: Path[], captures: Map<string, Path[]>, opts?: FormatPathsOpts) => string;
/**
 * Format multiple paths with custom formatting options.
 *
 * @param paths - The paths to format
 * @param opts - Formatting options
 * @returns The formatted string
 */
declare const formatPathsOpt: (paths: Path[], opts?: FormatPathsOpts) => string;
/**
 * Format multiple paths with default options.
 *
 * @param paths - The paths to format
 * @returns The formatted string
 */
declare const formatPaths: (paths: Path[]) => string;
//#endregion
//#region src/pattern/value/bool-pattern.d.ts
/**
 * Pattern for matching boolean values in dCBOR.
 */
type BoolPattern = {
  readonly variant: "Any";
} | {
  readonly variant: "Value";
  readonly value: boolean;
};
/**
 * Creates a BoolPattern that matches any boolean value.
 */
declare const boolPatternAny: () => BoolPattern;
/**
 * Creates a BoolPattern that matches a specific boolean value.
 */
declare const boolPatternValue: (value: boolean) => BoolPattern;
/**
 * Tests if a CBOR value matches this boolean pattern.
 */
declare const boolPatternMatches: (pattern: BoolPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching boolean values.
 */
declare const boolPatternPaths: (pattern: BoolPattern, haystack: Cbor) => Path[];
/**
 * Formats a BoolPattern as a string.
 */
declare const boolPatternDisplay: (pattern: BoolPattern) => string;
//#endregion
//#region src/pattern/value/null-pattern.d.ts
/**
 * Pattern for matching null values in dCBOR.
 * This is a unit type - there's only one way to match null.
 */
interface NullPattern {
  readonly variant: "Null";
}
/**
 * Tests if a CBOR value matches the null pattern.
 */
declare const nullPatternMatches: (_pattern: NullPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching null values.
 */
declare const nullPatternPaths: (pattern: NullPattern, haystack: Cbor) => Path[];
/**
 * Formats a NullPattern as a string.
 */
declare const nullPatternDisplay: (_pattern: NullPattern) => string;
//#endregion
//#region src/pattern/value/number-pattern.d.ts
/**
 * Pattern for matching number values in dCBOR.
 */
type NumberPattern = {
  readonly variant: "Any";
} | {
  readonly variant: "Value";
  readonly value: number;
} | {
  readonly variant: "Range";
  readonly min: number;
  readonly max: number;
} | {
  readonly variant: "GreaterThan";
  readonly value: number;
} | {
  readonly variant: "GreaterThanOrEqual";
  readonly value: number;
} | {
  readonly variant: "LessThan";
  readonly value: number;
} | {
  readonly variant: "LessThanOrEqual";
  readonly value: number;
} | {
  readonly variant: "NaN";
} | {
  readonly variant: "Infinity";
} | {
  readonly variant: "NegInfinity";
};
/**
 * Creates a NumberPattern that matches any number.
 */
declare const numberPatternAny: () => NumberPattern;
/**
 * Creates a NumberPattern that matches a specific number.
 */
declare const numberPatternValue: (value: number) => NumberPattern;
/**
 * Creates a NumberPattern that matches numbers within a range (inclusive).
 */
declare const numberPatternRange: (min: number, max: number) => NumberPattern;
/**
 * Creates a NumberPattern that matches numbers greater than a value.
 */
declare const numberPatternGreaterThan: (value: number) => NumberPattern;
/**
 * Creates a NumberPattern that matches numbers greater than or equal to a value.
 */
declare const numberPatternGreaterThanOrEqual: (value: number) => NumberPattern;
/**
 * Creates a NumberPattern that matches numbers less than a value.
 */
declare const numberPatternLessThan: (value: number) => NumberPattern;
/**
 * Creates a NumberPattern that matches numbers less than or equal to a value.
 */
declare const numberPatternLessThanOrEqual: (value: number) => NumberPattern;
/**
 * Creates a NumberPattern that matches NaN.
 */
declare const numberPatternNaN: () => NumberPattern;
/**
 * Creates a NumberPattern that matches positive infinity.
 */
declare const numberPatternInfinity: () => NumberPattern;
/**
 * Creates a NumberPattern that matches negative infinity.
 */
declare const numberPatternNegInfinity: () => NumberPattern;
/**
 * Tests if a CBOR value matches this number pattern.
 */
declare const numberPatternMatches: (pattern: NumberPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching number values.
 */
declare const numberPatternPaths: (pattern: NumberPattern, haystack: Cbor) => Path[];
/**
 * Formats a NumberPattern as a string.
 */
declare const numberPatternDisplay: (pattern: NumberPattern) => string;
//#endregion
//#region src/pattern/value/text-pattern.d.ts
/**
 * Pattern for matching text values in dCBOR.
 */
type TextPattern = {
  readonly variant: "Any";
} | {
  readonly variant: "Value";
  readonly value: string;
} | {
  readonly variant: "Regex";
  readonly pattern: RegExp;
};
/**
 * Creates a TextPattern that matches any text.
 */
declare const textPatternAny: () => TextPattern;
/**
 * Creates a TextPattern that matches a specific text value.
 */
declare const textPatternValue: (value: string) => TextPattern;
/**
 * Creates a TextPattern that matches text by regex.
 */
declare const textPatternRegex: (pattern: RegExp) => TextPattern;
/**
 * Tests if a CBOR value matches this text pattern.
 */
declare const textPatternMatches: (pattern: TextPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching text values.
 */
declare const textPatternPaths: (pattern: TextPattern, haystack: Cbor) => Path[];
/**
 * Formats a TextPattern as a string.
 */
declare const textPatternDisplay: (pattern: TextPattern) => string;
//#endregion
//#region src/pattern/value/bytestring-pattern.d.ts
/**
 * Pattern for matching byte string values in dCBOR.
 *
 * The BinaryRegex variant matches against raw bytes by converting them to
 * a Latin-1 string (where each byte 0-255 maps to exactly one character).
 * This mimics Rust's regex::bytes::Regex behavior.
 *
 * For example:
 * - To match bytes starting with 0x00: `/^\x00/`
 * - To match ASCII digits: `/^\d+$/`
 * - To match specific hex pattern: `/\x48\x65\x6c\x6c\x6f/` (matches "Hello")
 */
type ByteStringPattern = {
  readonly variant: "Any";
} | {
  readonly variant: "Value";
  readonly value: Uint8Array;
} | {
  readonly variant: "BinaryRegex";
  readonly pattern: RegExp;
};
/**
 * Creates a ByteStringPattern that matches any byte string.
 */
declare const byteStringPatternAny: () => ByteStringPattern;
/**
 * Creates a ByteStringPattern that matches a specific byte string value.
 */
declare const byteStringPatternValue: (value: Uint8Array) => ByteStringPattern;
/**
 * Creates a ByteStringPattern that matches byte strings by binary regex.
 *
 * The regex matches against raw bytes converted to a Latin-1 string.
 * Use escape sequences like `\x00` to match specific byte values.
 *
 * @example
 * ```typescript
 * // Match bytes starting with 0x00
 * byteStringPatternBinaryRegex(/^\x00/)
 *
 * // Match ASCII "Hello"
 * byteStringPatternBinaryRegex(/Hello/)
 *
 * // Match any digits
 * byteStringPatternBinaryRegex(/^\d+$/)
 * ```
 */
declare const byteStringPatternBinaryRegex: (pattern: RegExp) => ByteStringPattern;
/**
 * Tests if a CBOR value matches this byte string pattern.
 */
declare const byteStringPatternMatches: (pattern: ByteStringPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching byte string values.
 */
declare const byteStringPatternPaths: (pattern: ByteStringPattern, haystack: Cbor) => Path[];
/**
 * Formats a ByteStringPattern as a string.
 */
declare const byteStringPatternDisplay: (pattern: ByteStringPattern) => string;
//#endregion
//#region src/pattern/value/date-pattern.d.ts
/**
 * Pattern for matching date values in dCBOR.
 * Dates in CBOR are represented as tagged values with tag 1.
 */
type DatePattern = {
  readonly variant: "Any";
} | {
  readonly variant: "Value";
  readonly value: CborDate;
} | {
  readonly variant: "Range";
  readonly min: CborDate;
  readonly max: CborDate;
} | {
  readonly variant: "Earliest";
  readonly value: CborDate;
} | {
  readonly variant: "Latest";
  readonly value: CborDate;
} | {
  readonly variant: "StringValue";
  readonly value: string;
} | {
  readonly variant: "Regex";
  readonly pattern: RegExp;
};
/**
 * Creates a DatePattern that matches any date.
 */
declare const datePatternAny: () => DatePattern;
/**
 * Creates a DatePattern that matches a specific date.
 */
declare const datePatternValue: (value: CborDate) => DatePattern;
/**
 * Creates a DatePattern that matches dates within a range (inclusive).
 */
declare const datePatternRange: (min: CborDate, max: CborDate) => DatePattern;
/**
 * Creates a DatePattern that matches dates on or after the specified date.
 */
declare const datePatternEarliest: (value: CborDate) => DatePattern;
/**
 * Creates a DatePattern that matches dates on or before the specified date.
 */
declare const datePatternLatest: (value: CborDate) => DatePattern;
/**
 * Creates a DatePattern that matches dates by their ISO-8601 string representation.
 */
declare const datePatternStringValue: (value: string) => DatePattern;
/**
 * Creates a DatePattern that matches dates by regex on their ISO-8601 string.
 */
declare const datePatternRegex: (pattern: RegExp) => DatePattern;
/**
 * Tests if a CBOR value matches this date pattern.
 */
declare const datePatternMatches: (pattern: DatePattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching date values.
 */
declare const datePatternPaths: (pattern: DatePattern, haystack: Cbor) => Path[];
/**
 * Formats a DatePattern as a string.
 */
declare const datePatternDisplay: (pattern: DatePattern) => string;
//#endregion
//#region src/pattern/value/digest-pattern.d.ts
/**
 * Pattern for matching digest values in dCBOR.
 * Digests are represented as tagged values with tag 40001.
 *
 * Note on `BinaryRegex`: this variant matches the regex against a
 * **Latin-1** decoding of the digest bytes (each byte becomes the
 * char-code-equal Unicode code unit). Mirrors the
 * `ByteStringPattern.BinaryRegex` strategy and Rust's
 * `regex::bytes::Regex` semantics for byte-level patterns expressed as
 * `\xNN` escapes. Earlier this port matched against the hex-encoded
 * digest, which silently rejected `/^\xff/`-style byte patterns and
 * was inconsistent with `ByteStringPattern`.
 */
type DigestPattern = {
  readonly variant: "Any";
} | {
  readonly variant: "Value";
  readonly value: Digest;
} | {
  readonly variant: "Prefix";
  readonly prefix: Uint8Array;
} | {
  readonly variant: "BinaryRegex";
  readonly pattern: RegExp;
};
/**
 * Creates a DigestPattern that matches any digest.
 */
declare const digestPatternAny: () => DigestPattern;
/**
 * Creates a DigestPattern that matches a specific digest.
 */
declare const digestPatternValue: (value: Digest) => DigestPattern;
/**
 * Creates a DigestPattern that matches digests with a prefix.
 */
declare const digestPatternPrefix: (prefix: Uint8Array) => DigestPattern;
/**
 * Creates a DigestPattern that matches digests by binary regex.
 *
 * Note: matches against a Latin-1 decoding of the digest bytes (matching
 * Rust's `regex::bytes::Regex`-on-`Vec<u8>` semantics for byte-level
 * patterns). Use `\xNN` escapes for individual bytes.
 */
declare const digestPatternBinaryRegex: (pattern: RegExp) => DigestPattern;
/**
 * Tests if a CBOR value matches this digest pattern.
 */
declare const digestPatternMatches: (pattern: DigestPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching digest values.
 */
declare const digestPatternPaths: (pattern: DigestPattern, haystack: Cbor) => Path[];
/**
 * Formats a DigestPattern as a string.
 *
 * Mirrors Rust `Display for DigestPattern`
 * (`bc-dcbor-pattern-rust/src/pattern/value/digest_pattern.rs`):
 *
 * - `Any`        → `digest`
 * - `Value(d)`   → `digest'{ur:digest/...}'` (UR string of the digest)
 * - `Prefix(b)`  → `digest'{hex}'`
 * - `BinaryRegex` → `digest'/{regex}/'`
 *
 * Earlier this port emitted the raw hex of the full digest for the
 * `Value` variant. Rust's parser would re-parse that as a `Prefix`
 * (since hex with even length ≤ 64 chars is treated as prefix), so the
 * formatter break silently changed pattern semantics during round-trip.
 */
declare const digestPatternDisplay: (pattern: DigestPattern) => string;
//#endregion
//#region src/pattern/value/known-value-pattern.d.ts
/**
 * Pattern for matching known values in dCBOR.
 * Known values are represented as tagged values with tag 40000.
 */
type KnownValuePattern = {
  readonly variant: "Any";
} | {
  readonly variant: "Value";
  readonly value: KnownValue;
} | {
  readonly variant: "Named";
  readonly name: string;
} | {
  readonly variant: "Regex";
  readonly pattern: RegExp;
};
/**
 * Creates a KnownValuePattern that matches any known value.
 */
declare const knownValuePatternAny: () => KnownValuePattern;
/**
 * Creates a KnownValuePattern that matches a specific known value.
 */
declare const knownValuePatternValue: (value: KnownValue) => KnownValuePattern;
/**
 * Creates a KnownValuePattern that matches a known value by name.
 */
declare const knownValuePatternNamed: (name: string) => KnownValuePattern;
/**
 * Creates a KnownValuePattern that matches known values by regex on name.
 */
declare const knownValuePatternRegex: (pattern: RegExp) => KnownValuePattern;
/**
 * Tests if a CBOR value matches this known value pattern.
 */
declare const knownValuePatternMatches: (pattern: KnownValuePattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching known values.
 */
declare const knownValuePatternPaths: (pattern: KnownValuePattern, haystack: Cbor) => Path[];
/**
 * Formats a KnownValuePattern as a string.
 */
declare const knownValuePatternDisplay: (pattern: KnownValuePattern) => string;
//#endregion
//#region src/pattern/value/index.d.ts
/**
 * Union of all value pattern types.
 */
type ValuePattern = {
  readonly type: "Bool";
  readonly pattern: BoolPattern;
} | {
  readonly type: "Null";
  readonly pattern: NullPattern;
} | {
  readonly type: "Number";
  readonly pattern: NumberPattern;
} | {
  readonly type: "Text";
  readonly pattern: TextPattern;
} | {
  readonly type: "ByteString";
  readonly pattern: ByteStringPattern;
} | {
  readonly type: "Date";
  readonly pattern: DatePattern;
} | {
  readonly type: "Digest";
  readonly pattern: DigestPattern;
} | {
  readonly type: "KnownValue";
  readonly pattern: KnownValuePattern;
};
/**
 * Returns paths to matching values for a ValuePattern.
 */
declare const valuePatternPaths: (pattern: ValuePattern, haystack: Cbor) => Path[];
/**
 * Tests if a CBOR value matches a ValuePattern.
 */
declare const valuePatternMatches: (pattern: ValuePattern, haystack: Cbor) => boolean;
/**
 * Formats a ValuePattern as a string.
 */
declare const valuePatternDisplay: (pattern: ValuePattern) => string;
/**
 * Creates a Bool ValuePattern.
 */
declare const valueBool: (pattern: BoolPattern) => ValuePattern;
/**
 * Creates a Null ValuePattern.
 */
declare const valueNull: (pattern: NullPattern) => ValuePattern;
/**
 * Creates a Number ValuePattern.
 */
declare const valueNumber: (pattern: NumberPattern) => ValuePattern;
/**
 * Creates a Text ValuePattern.
 */
declare const valueText: (pattern: TextPattern) => ValuePattern;
/**
 * Creates a ByteString ValuePattern.
 */
declare const valueByteString: (pattern: ByteStringPattern) => ValuePattern;
/**
 * Creates a Date ValuePattern.
 */
declare const valueDate: (pattern: DatePattern) => ValuePattern;
/**
 * Creates a Digest ValuePattern.
 */
declare const valueDigest: (pattern: DigestPattern) => ValuePattern;
/**
 * Creates a KnownValue ValuePattern.
 */
declare const valueKnownValue: (pattern: KnownValuePattern) => ValuePattern;
//#endregion
//#region src/pattern/meta/repeat-pattern.d.ts
/**
 * A pattern that matches with repetition.
 */
interface RepeatPattern {
  readonly variant: "Repeat";
  readonly pattern: Pattern;
  readonly quantifier: Quantifier;
}
/**
 * Creates a RepeatPattern with the given pattern and quantifier.
 */
declare const repeatPattern: (pattern: Pattern, quantifier: Quantifier) => RepeatPattern;
/**
 * Creates a RepeatPattern that matches zero or more times (greedy).
 */
declare const repeatZeroOrMore: (pattern: Pattern) => RepeatPattern;
/**
 * Creates a RepeatPattern that matches one or more times (greedy).
 */
declare const repeatOneOrMore: (pattern: Pattern) => RepeatPattern;
/**
 * Creates a RepeatPattern that matches zero or one time (greedy).
 */
declare const repeatOptional: (pattern: Pattern) => RepeatPattern;
/**
 * Creates a RepeatPattern that matches exactly n times.
 */
declare const repeatExact: (pattern: Pattern, n: number) => RepeatPattern;
/**
 * Creates a RepeatPattern that matches between min and max times.
 */
declare const repeatRange: (pattern: Pattern, min: number, max?: number) => RepeatPattern;
/**
 * Tests if a CBOR value matches this repeat pattern.
 * Note: This is a simplified implementation. Complex matching
 * will be implemented with the VM.
 */
declare const repeatPatternMatches: (pattern: RepeatPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching values.
 */
declare const repeatPatternPaths: (pattern: RepeatPattern, haystack: Cbor) => Path[];
/**
 * Formats a RepeatPattern as a string.
 * Always wraps the inner pattern in parentheses to match Rust behavior.
 */
declare const repeatPatternDisplay: (pattern: RepeatPattern, patternDisplay: (p: Pattern) => string) => string;
//#endregion
//#region src/pattern/structure/array-pattern/helpers.d.ts
/**
 * Check if a pattern is a repeat pattern.
 */
declare const isRepeatPattern: (pattern: Pattern) => boolean;
/**
 * Check if a pattern is a capture pattern containing a repeat pattern.
 * Returns the inner repeat pattern if found.
 */
declare const extractCaptureWithRepeat: (pattern: Pattern) => RepeatPattern | undefined;
/**
 * Extract any repeat pattern from a pattern, whether direct or within a capture.
 */
declare const extractRepeatPattern: (pattern: Pattern) => RepeatPattern | undefined;
/**
 * Check if a slice of patterns contains any repeat patterns (direct or in captures).
 */
declare const hasRepeatPatternsInSlice: (patterns: Pattern[]) => boolean;
/**
 * Calculate the bounds for repeat pattern matching based on quantifier and
 * available elements.
 */
declare const calculateRepeatBounds: (quantifier: Quantifier, elementIdx: number, arrLen: number) => [number, number];
/**
 * Check if a repeat pattern can match a specific number of elements starting
 * at elementIdx.
 */
declare const canRepeatMatch: (repeatPattern: RepeatPattern, arr: Cbor[], elementIdx: number, repCount: number, matchFn: (pattern: Pattern, value: Cbor) => boolean) => boolean;
/**
 * Build a simple array context path: [arrayCbor, element]
 */
declare const buildSimpleArrayContextPath: (arrayCbor: Cbor, element: Cbor) => Cbor[];
/**
 * Build an extended array context path: [arrayCbor, element] + capturedPath
 * (skip first element)
 */
declare const buildExtendedArrayContextPath: (arrayCbor: Cbor, element: Cbor, capturedPath: Cbor[]) => Cbor[];
/**
 * Format a pattern for display within array context, swapping
 * `>`-separator sequences to `,`-separator inside arrays — recursively.
 *
 * Mirrors Rust `format_array_element_pattern`
 * (`bc-dcbor-pattern-rust/src/pattern/structure/array_pattern/helpers.rs:54-67`):
 *
 * ```rust
 * pub fn format_array_element_pattern(pattern: &Pattern) -> String {
 *     match pattern {
 *         Pattern::Meta(MetaPattern::Sequence(seq_pattern)) => {
 *             let patterns_str: Vec<String> = seq_pattern
 *                 .patterns()
 *                 .iter()
 *                 .map(format_array_element_pattern)
 *                 .collect();
 *             patterns_str.join(", ")
 *         }
 *         _ => pattern.to_string(),
 *     }
 * }
 * ```
 *
 * Crucially, the function recurses through nested `Sequence` patterns
 * (e.g. `[(a > b)*]`) so any `Sequence` *inside* the array uses
 * commas. Earlier this port only swapped the outermost `Sequence`,
 * which left nested sequences with `>`-separator that the parser
 * doesn't accept inside `[ … ]`.
 */
declare const formatArrayElementPattern: (pattern: Pattern) => string;
/**
 * Transform nested captures to include array context, extending allCaptures.
 */
declare const transformCapturesWithArrayContext: (arrayCbor: Cbor, element: Cbor, nestedCaptures: Map<string, Cbor[][]>, allCaptures: Map<string, Cbor[][]>) => void;
//#endregion
//#region src/pattern/structure/array-pattern/backtrack.d.ts
/**
 * Generic backtracking state interface.
 * Abstracts the differences between boolean matching and assignment tracking.
 */
interface BacktrackState<T> {
  /**
   * Try to advance the state with a new assignment and return true if successful.
   */
  tryAdvance(patternIdx: number, elementIdx: number): boolean;
  /**
   * Backtrack by removing the last state change.
   */
  backtrack(): void;
  /**
   * Check if we've reached a successful final state.
   */
  isSuccess(patternIdx: number, elementIdx: number, patternsLen: number, elementsLen: number): boolean;
  /**
   * Get the final result.
   */
  getResult(): T;
}
/**
 * Boolean backtracking state - just tracks success/failure.
 */
declare class BooleanBacktrackState implements BacktrackState<boolean> {
  tryAdvance(_patternIdx: number, _elementIdx: number): boolean;
  backtrack(): void;
  isSuccess(patternIdx: number, elementIdx: number, patternsLen: number, elementsLen: number): boolean;
  getResult(): boolean;
}
/**
 * Assignment tracking backtracking state - collects pattern-element pairs.
 */
declare class AssignmentBacktrackState implements BacktrackState<[number, number][]> {
  readonly assignments: [number, number][];
  tryAdvance(patternIdx: number, elementIdx: number): boolean;
  backtrack(): void;
  isSuccess(patternIdx: number, elementIdx: number, patternsLen: number, elementsLen: number): boolean;
  getResult(): [number, number][];
  len(): number;
  truncate(len: number): void;
}
/**
 * Generic backtracking algorithm that works with any BacktrackState.
 */
declare class GenericBacktracker {
  private readonly _patterns;
  private readonly _arr;
  private readonly _matchFn;
  constructor(patterns: Pattern[], arr: Cbor[], matchFn: (pattern: Pattern, value: Cbor) => boolean);
  /**
   * Generic backtracking algorithm that works with any state type.
   */
  backtrack<T>(state: BacktrackState<T>, patternIdx: number, elementIdx: number): boolean;
  /**
   * Helper for repeat pattern backtracking with generic state.
   */
  private tryRepeatBacktrack;
}
//#endregion
//#region src/pattern/structure/array-pattern/assigner.d.ts
/**
 * Helper class for handling element-to-pattern assignment logic.
 * Encapsulates the complex logic for mapping array elements to sequence
 * patterns that was previously duplicated between matching and capture
 * collection.
 */
declare class SequenceAssigner {
  private readonly _patterns;
  private readonly _arr;
  private readonly _matchFn;
  constructor(patterns: Pattern[], arr: Cbor[], matchFn: (pattern: Pattern, value: Cbor) => boolean);
  /**
   * Check if the sequence can match against the array elements (boolean result).
   */
  canMatch(): boolean;
  /**
   * Find the element-to-pattern assignments (returns assignment pairs).
   */
  findAssignments(): [number, number][] | undefined;
}
//#endregion
//#region src/pattern/structure/array-pattern/index.d.ts
/**
 * Pattern for matching CBOR array structures.
 */
type ArrayPattern = {
  readonly variant: "Any";
} | {
  readonly variant: "Elements";
  readonly pattern: Pattern;
} | {
  readonly variant: "Length";
  readonly length: Interval;
};
/**
 * Creates an ArrayPattern that matches any array.
 */
declare const arrayPatternAny: () => ArrayPattern;
/**
 * Creates an ArrayPattern that matches arrays with elements matching the pattern.
 */
declare const arrayPatternWithElements: (pattern: Pattern) => ArrayPattern;
/**
 * Creates an ArrayPattern that matches arrays with a specific length.
 */
declare const arrayPatternWithLength: (length: number) => ArrayPattern;
/**
 * Creates an ArrayPattern that matches arrays with length in a range.
 */
declare const arrayPatternWithLengthRange: (min: number, max?: number) => ArrayPattern;
/**
 * Creates an ArrayPattern that matches arrays with length in an interval.
 */
declare const arrayPatternWithLengthInterval: (interval: Interval) => ArrayPattern;
/**
 * Tests if a CBOR value matches this array pattern.
 */
declare const arrayPatternMatches: (pattern: ArrayPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching array values.
 */
declare const arrayPatternPaths: (pattern: ArrayPattern, haystack: Cbor) => Path[];
/**
 * Returns paths with captures for array patterns.
 */
declare const arrayPatternPathsWithCaptures: (pattern: ArrayPattern, haystack: Cbor) => [Path[], Map<string, Path[]>];
/**
 * Formats an ArrayPattern as a string.
 */
declare const arrayPatternDisplay: (pattern: ArrayPattern, _patternDisplay: (p: Pattern) => string) => string;
/**
 * Compares two ArrayPatterns for equality.
 */
declare const arrayPatternEquals: (a: ArrayPattern, b: ArrayPattern, patternEquals: (p1: Pattern, p2: Pattern) => boolean) => boolean;
//#endregion
//#region src/pattern/structure/map-pattern.d.ts
/**
 * Pattern for matching CBOR map structures.
 */
type MapPattern = {
  readonly variant: "Any";
} | {
  readonly variant: "Constraints";
  readonly constraints: [Pattern, Pattern][];
} | {
  readonly variant: "Length";
  readonly length: Interval;
};
/**
 * Creates a MapPattern that matches any map.
 */
declare const mapPatternAny: () => MapPattern;
/**
 * Creates a MapPattern that matches maps with key-value constraints.
 */
declare const mapPatternWithConstraints: (constraints: [Pattern, Pattern][]) => MapPattern;
/**
 * Creates a MapPattern that matches maps with a specific number of entries.
 */
declare const mapPatternWithLength: (length: number) => MapPattern;
/**
 * Creates a MapPattern that matches maps with length in a range.
 */
declare const mapPatternWithLengthRange: (min: number, max?: number) => MapPattern;
/**
 * Creates a MapPattern that matches maps with length in an interval.
 */
declare const mapPatternWithLengthInterval: (interval: Interval) => MapPattern;
/**
 * Tests if a CBOR value matches this map pattern.
 */
declare const mapPatternMatches: (pattern: MapPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching map values.
 */
declare const mapPatternPaths: (pattern: MapPattern, haystack: Cbor) => Path[];
/**
 * Returns paths with captures for map patterns.
 */
declare const mapPatternPathsWithCaptures: (pattern: MapPattern, haystack: Cbor) => [Path[], Map<string, Path[]>];
/**
 * Formats a MapPattern as a string.
 */
declare const mapPatternDisplay: (pattern: MapPattern, patternDisplay: (p: Pattern) => string) => string;
/**
 * Compares two MapPatterns for equality.
 */
declare const mapPatternEquals: (a: MapPattern, b: MapPattern, patternEquals: (p1: Pattern, p2: Pattern) => boolean) => boolean;
//#endregion
//#region src/pattern/structure/tagged-pattern.d.ts
/**
 * Pattern for matching CBOR tagged value structures.
 */
type TaggedPattern = {
  readonly variant: "Any";
} | {
  readonly variant: "Tag";
  readonly tag: Tag;
  readonly pattern: Pattern;
} | {
  readonly variant: "Name";
  readonly name: string;
  readonly pattern: Pattern;
} | {
  readonly variant: "Regex";
  readonly regex: RegExp;
  readonly pattern: Pattern;
};
/**
 * Creates a TaggedPattern that matches any tagged value.
 */
declare const taggedPatternAny: () => TaggedPattern;
/**
 * Creates a TaggedPattern that matches tagged values with specific tag and content.
 */
declare const taggedPatternWithTag: (tag: Tag, pattern: Pattern) => TaggedPattern;
/**
 * Creates a TaggedPattern that matches tagged values with a tag having the given name.
 */
declare const taggedPatternWithName: (name: string, pattern: Pattern) => TaggedPattern;
/**
 * Creates a TaggedPattern that matches tagged values with a tag name matching the regex.
 */
declare const taggedPatternWithRegex: (regex: RegExp, pattern: Pattern) => TaggedPattern;
/**
 * Tests if a CBOR value matches this tagged pattern.
 */
declare const taggedPatternMatches: (pattern: TaggedPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching tagged values.
 */
declare const taggedPatternPaths: (pattern: TaggedPattern, haystack: Cbor) => Path[];
/**
 * Returns paths with captures for a tagged pattern.
 * Collects captures from inner patterns for Tag variant.
 */
declare const taggedPatternPathsWithCaptures: (pattern: TaggedPattern, haystack: Cbor) => [Path[], Map<string, Path[]>];
/**
 * Formats a TaggedPattern as a string.
 */
declare const taggedPatternDisplay: (pattern: TaggedPattern, patternDisplay: (p: Pattern) => string) => string;
//#endregion
//#region src/pattern/structure/index.d.ts
/**
 * Union of all structure pattern types.
 */
type StructurePattern = {
  readonly type: "Array";
  readonly pattern: ArrayPattern;
} | {
  readonly type: "Map";
  readonly pattern: MapPattern;
} | {
  readonly type: "Tagged";
  readonly pattern: TaggedPattern;
};
/**
 * Returns paths to matching structures for a StructurePattern.
 */
declare const structurePatternPaths: (pattern: StructurePattern, haystack: Cbor) => Path[];
/**
 * Tests if a CBOR value matches a StructurePattern.
 */
declare const structurePatternMatches: (pattern: StructurePattern, haystack: Cbor) => boolean;
/**
 * Returns paths with captures for a StructurePattern.
 * Used internally by the VM to avoid infinite recursion.
 */
declare const structurePatternPathsWithCaptures: (pattern: StructurePattern, haystack: Cbor) => [Path[], Map<string, Path[]>];
/**
 * Formats a StructurePattern as a string.
 */
declare const structurePatternDisplay: (pattern: StructurePattern, patternDisplay: (p: Pattern) => string) => string;
/**
 * Creates an Array StructurePattern.
 */
declare const structureArray: (pattern: ArrayPattern) => StructurePattern;
/**
 * Creates a Map StructurePattern.
 */
declare const structureMap: (pattern: MapPattern) => StructurePattern;
/**
 * Creates a Tagged StructurePattern.
 */
declare const structureTagged: (pattern: TaggedPattern) => StructurePattern;
//#endregion
//#region src/pattern/meta/any-pattern.d.ts
/**
 * A pattern that always matches any CBOR value.
 */
interface AnyPattern {
  readonly variant: "Any";
}
/**
 * Creates an AnyPattern.
 */
declare const anyPattern: () => AnyPattern;
/**
 * Tests if a CBOR value matches this any pattern.
 * Always returns true.
 */
declare const anyPatternMatches: (_pattern: AnyPattern, _haystack: Cbor) => boolean;
/**
 * Returns paths to matching values.
 */
declare const anyPatternPaths: (_pattern: AnyPattern, haystack: Cbor) => Path[];
/**
 * Formats an AnyPattern as a string.
 */
declare const anyPatternDisplay: (_pattern: AnyPattern) => string;
//#endregion
//#region src/pattern/meta/and-pattern.d.ts
/**
 * A pattern that matches if all contained patterns match.
 */
interface AndPattern {
  readonly variant: "And";
  readonly patterns: Pattern[];
}
/**
 * Creates an AndPattern with the given patterns.
 */
declare const andPattern: (patterns: Pattern[]) => AndPattern;
/**
 * Tests if a CBOR value matches this and pattern.
 * All patterns must match.
 */
declare const andPatternMatches: (pattern: AndPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching values.
 */
declare const andPatternPaths: (pattern: AndPattern, haystack: Cbor) => Path[];
/**
 * Formats an AndPattern as a string.
 */
declare const andPatternDisplay: (pattern: AndPattern, patternDisplay: (p: Pattern) => string) => string;
//#endregion
//#region src/pattern/meta/or-pattern.d.ts
/**
 * A pattern that matches if any contained pattern matches.
 */
interface OrPattern {
  readonly variant: "Or";
  readonly patterns: Pattern[];
}
/**
 * Creates an OrPattern with the given patterns.
 */
declare const orPattern: (patterns: Pattern[]) => OrPattern;
/**
 * Tests if a CBOR value matches this or pattern.
 * At least one pattern must match.
 */
declare const orPatternMatches: (pattern: OrPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching values.
 */
declare const orPatternPaths: (pattern: OrPattern, haystack: Cbor) => Path[];
/**
 * Formats an OrPattern as a string.
 */
declare const orPatternDisplay: (pattern: OrPattern, patternDisplay: (p: Pattern) => string) => string;
//#endregion
//#region src/pattern/meta/not-pattern.d.ts
/**
 * A pattern that matches if the inner pattern does NOT match.
 */
interface NotPattern {
  readonly variant: "Not";
  readonly pattern: Pattern;
}
/**
 * Creates a NotPattern with the given inner pattern.
 */
declare const notPattern: (pattern: Pattern) => NotPattern;
/**
 * Tests if a CBOR value matches this not pattern.
 * Returns true if the inner pattern does NOT match.
 */
declare const notPatternMatches: (pattern: NotPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching values.
 */
declare const notPatternPaths: (pattern: NotPattern, haystack: Cbor) => Path[];
/**
 * Formats a NotPattern as a string.
 */
declare const notPatternDisplay: (pattern: NotPattern, patternDisplay: (p: Pattern) => string) => string;
//#endregion
//#region src/pattern/meta/capture-pattern.d.ts
/**
 * A pattern that captures matched values with a name.
 */
interface CapturePattern {
  readonly variant: "Capture";
  readonly name: string;
  readonly pattern: Pattern;
}
/**
 * Creates a CapturePattern with the given name and inner pattern.
 */
declare const capturePattern: (name: string, pattern: Pattern) => CapturePattern;
/**
 * Tests if a CBOR value matches this capture pattern.
 * Capture itself doesn't affect matching - it delegates to inner pattern.
 */
declare const capturePatternMatches: (pattern: CapturePattern, haystack: Cbor) => boolean;
/**
 * Returns paths to matching values.
 */
declare const capturePatternPaths: (pattern: CapturePattern, haystack: Cbor) => Path[];
/**
 * Formats a CapturePattern as a string.
 */
declare const capturePatternDisplay: (pattern: CapturePattern, patternDisplay: (p: Pattern) => string) => string;
//#endregion
//#region src/pattern/meta/search-pattern.d.ts
/**
 * A pattern that searches the entire CBOR tree for matches.
 */
interface SearchPattern {
  readonly variant: "Search";
  readonly pattern: Pattern;
}
/**
 * Creates a SearchPattern with the given inner pattern.
 */
declare const searchPattern: (pattern: Pattern) => SearchPattern;
/**
 * Tests if a CBOR value matches this search pattern.
 * Returns true if any node in the tree matches.
 */
declare const searchPatternMatches: (pattern: SearchPattern, haystack: Cbor) => boolean;
/**
 * Returns paths to all matching values in the tree.
 */
declare const searchPatternPaths: (pattern: SearchPattern, haystack: Cbor) => Path[];
/**
 * Result type for paths with captures from search operations.
 */
interface SearchWithCaptures {
  readonly paths: Path[];
  readonly captures: Map<string, Path[]>;
}
/**
 * Returns paths with captures for all matching values in the tree.
 */
declare const searchPatternPathsWithCaptures: (pattern: SearchPattern, haystack: Cbor) => SearchWithCaptures;
/**
 * Formats a SearchPattern as a string.
 */
declare const searchPatternDisplay: (pattern: SearchPattern, patternDisplay: (p: Pattern) => string) => string;
//#endregion
//#region src/pattern/meta/sequence-pattern.d.ts
/**
 * A pattern that matches a sequence of patterns in order.
 * Used primarily for matching array elements.
 */
interface SequencePattern {
  readonly variant: "Sequence";
  readonly patterns: Pattern[];
}
/**
 * Creates a SequencePattern with the given patterns.
 */
declare const sequencePattern: (patterns: Pattern[]) => SequencePattern;
/**
 * Tests if a CBOR value matches this sequence pattern.
 *
 * Note: Sequence patterns are used within array patterns for matching
 * consecutive elements. When used standalone (not within an array),
 * they return false/empty as the actual sequence matching logic is
 * handled by the VM and array pattern matching.
 */
declare const sequencePatternMatches: (_pattern: SequencePattern, _haystack: Cbor) => boolean;
/**
 * Returns paths to matching values.
 *
 * Note: Sequence patterns return empty paths when used directly.
 * The actual sequence matching is handled by the VM within array contexts.
 */
declare const sequencePatternPaths: (_pattern: SequencePattern, _haystack: Cbor) => Path[];
/**
 * Formats a SequencePattern as a string.
 *
 * Mirrors Rust `Display for SequencePattern`
 * (`bc-dcbor-pattern-rust/src/pattern/meta/sequence_pattern.rs:117-127`):
 * an empty sequence renders as `()` (empty parens), not `""`. This
 * keeps `parse(format(emptySequence()))` round-trippable.
 */
declare const sequencePatternDisplay: (pattern: SequencePattern, patternDisplay: (p: Pattern) => string) => string;
/**
 * Gets the patterns in this sequence.
 */
declare const sequencePatternPatterns: (pattern: SequencePattern) => Pattern[];
//#endregion
//#region src/pattern/meta/index.d.ts
/**
 * Union of all meta pattern types.
 */
type MetaPattern = {
  readonly type: "Any";
  readonly pattern: AnyPattern;
} | {
  readonly type: "And";
  readonly pattern: AndPattern;
} | {
  readonly type: "Or";
  readonly pattern: OrPattern;
} | {
  readonly type: "Not";
  readonly pattern: NotPattern;
} | {
  readonly type: "Repeat";
  readonly pattern: RepeatPattern;
} | {
  readonly type: "Capture";
  readonly pattern: CapturePattern;
} | {
  readonly type: "Search";
  readonly pattern: SearchPattern;
} | {
  readonly type: "Sequence";
  readonly pattern: SequencePattern;
};
/**
 * Returns paths to matching values for a MetaPattern.
 */
declare const metaPatternPaths: (pattern: MetaPattern, haystack: Cbor) => Path[];
/**
 * Tests if a CBOR value matches a MetaPattern.
 */
declare const metaPatternMatches: (pattern: MetaPattern, haystack: Cbor) => boolean;
/**
 * Formats a MetaPattern as a string.
 */
declare const metaPatternDisplay: (pattern: MetaPattern, patternDisplay: (p: Pattern) => string) => string;
/**
 * Creates an Any MetaPattern.
 */
declare const metaAny: (pattern: AnyPattern) => MetaPattern;
/**
 * Creates an And MetaPattern.
 */
declare const metaAnd: (pattern: AndPattern) => MetaPattern;
/**
 * Creates an Or MetaPattern.
 */
declare const metaOr: (pattern: OrPattern) => MetaPattern;
/**
 * Creates a Not MetaPattern.
 */
declare const metaNot: (pattern: NotPattern) => MetaPattern;
/**
 * Creates a Repeat MetaPattern.
 */
declare const metaRepeat: (pattern: RepeatPattern) => MetaPattern;
/**
 * Creates a Capture MetaPattern.
 */
declare const metaCapture: (pattern: CapturePattern) => MetaPattern;
/**
 * Creates a Search MetaPattern.
 */
declare const metaSearch: (pattern: SearchPattern) => MetaPattern;
/**
 * Creates a Sequence MetaPattern.
 */
declare const metaSequence: (pattern: SequencePattern) => MetaPattern;
//#endregion
//#region src/pattern/vm.d.ts
/**
 * Navigation axis for traversing dCBOR tree structures.
 */
type Axis = "ArrayElement" | "MapKey" | "MapValue" | "TaggedContent";
/**
 * Return child CBOR values reachable from `cbor` via the given axis.
 */
declare const axisChildren: (axis: Axis, cbor: Cbor) => Cbor[];
/**
 * Bytecode instructions for the pattern VM.
 */
type Instr = {
  type: "MatchPredicate";
  literalIndex: number;
} | {
  type: "MatchStructure";
  literalIndex: number;
} | {
  type: "Split";
  a: number;
  b: number;
} | {
  type: "Jump";
  address: number;
} | {
  type: "PushAxis";
  axis: Axis;
} | {
  type: "Pop";
} | {
  type: "Save";
} | {
  type: "Accept";
} | {
  type: "Search";
  patternIndex: number;
  captureMap: [string, number][];
} | {
  type: "ExtendSequence";
} | {
  type: "CombineSequence";
} | {
  type: "NotMatch";
  patternIndex: number;
} | {
  type: "Repeat";
  patternIndex: number;
  quantifier: Quantifier;
} | {
  type: "CaptureStart";
  captureIndex: number;
} | {
  type: "CaptureEnd";
  captureIndex: number;
};
/**
 * A compiled pattern program.
 */
interface Program {
  code: Instr[];
  literals: Pattern[];
  captureNames: string[];
}
/**
 * Match atomic patterns without recursion into the VM.
 *
 * This function handles only the patterns that are safe to use in
 * MatchPredicate instructions.
 */
declare const atomicPaths: (pattern: Pattern, cbor: Cbor) => Path[];
/**
 * Execute a program against a dCBOR value, returning all matching paths and captures.
 */
declare const run: (prog: Program, root: Cbor) => {
  paths: Path[];
  captures: Map<string, Path[]>;
};
/**
 * VM for executing pattern programs against dCBOR values.
 */
declare class Vm {
  /**
   * Execute a program against a dCBOR value.
   */
  static run(prog: Program, root: Cbor): {
    paths: Path[];
    captures: Map<string, Path[]>;
  };
}
//#endregion
//#region src/pattern/matcher.d.ts
/**
 * Result of pattern matching with captures.
 */
interface MatchWithCaptures {
  readonly paths: Path[];
  readonly captures: Map<string, Path[]>;
}
/**
 * Interface for objects that can match against CBOR values.
 *
 * This interface defines the contract for all pattern types in the system.
 * Implementations handle matching, path collection, and VM bytecode compilation.
 */
interface Matcher {
  /**
   * Return all matching paths along with any named captures.
   *
   * @param haystack - The CBOR value to match against
   * @returns A tuple of paths and captures map
   */
  pathsWithCaptures(haystack: Cbor): MatchWithCaptures;
  /**
   * Return only the matching paths, discarding any captures.
   *
   * @param haystack - The CBOR value to match against
   * @returns Array of paths to matching elements
   */
  paths(haystack: Cbor): Path[];
  /**
   * Check if the pattern matches the given CBOR value.
   *
   * @param haystack - The CBOR value to test
   * @returns true if the pattern matches
   */
  matches(haystack: Cbor): boolean;
  /**
   * Compile this pattern into VM bytecode.
   *
   * @param code - The instruction array to append to
   * @param literals - The literals array to append to
   * @param captures - The capture names array
   */
  compile(code: Instr[], literals: Pattern[], captures: string[]): void;
  /**
   * Recursively collect all capture names from this pattern.
   *
   * @param names - The array to collect names into
   */
  collectCaptureNames(names: string[]): void;
  /**
   * Check if the pattern display is "complex" (requires parentheses).
   *
   * @returns true if the pattern requires grouping
   */
  isComplex(): boolean;
  /**
   * Format the pattern as a string.
   */
  toString(): string;
}
/**
 * Default implementation helpers for Matcher.
 */
declare const MatcherDefaults: {
  /**
   * Default paths implementation using pathsWithCaptures.
   */
  paths(matcher: Pick<Matcher, "pathsWithCaptures">, haystack: Cbor): Path[];
  /**
   * Default matches implementation using paths.
   */
  matches(matcher: Pick<Matcher, "paths">, haystack: Cbor): boolean;
  /**
   * Default pathsWithCaptures throws not implemented.
   */
  pathsWithCaptures(_haystack: Cbor): MatchWithCaptures;
  /**
   * Default compile throws not implemented.
   */
  compile(_code: Instr[], _literals: Pattern[], _captures: string[]): void;
  /**
   * Default collectCaptureNames does nothing.
   */
  collectCaptureNames(_names: string[]): void;
  /**
   * Default isComplex returns false.
   */
  isComplex(): boolean;
};
/**
 * Compiles a pattern into a VM program.
 *
 * @param pattern - The pattern to compile
 * @returns A compiled program ready for execution
 */
declare const compilePattern: (pattern: Pattern) => Program;
/**
 * Recursively collects capture names from a pattern.
 *
 * Mirrors Rust `collect_capture_names` impl on each pattern variant in
 * `bc-dcbor-pattern-rust/src/pattern/**`. Used by both the VM compile
 * path and the runtime `arrayPatternPathsWithCaptures` fast-path check
 * (DP1 — see `array_pattern/mod.rs::paths_with_captures` lines ~530-540).
 */
declare const collectPatternCaptureNames: (pattern: Pattern, names: string[]) => void;
//#endregion
//#region src/pattern/match-registry.d.ts
type Pattern$1 = any;
/**
 * Match result with paths and captures.
 */
interface MatchResultInternal {
  readonly paths: Path[];
  readonly captures: Map<string, Path[]>;
}
/**
 * Registry for the pattern matching function.
 * This gets set by pattern/index.ts after all modules are loaded.
 */
declare let matchFn: ((pattern: Pattern$1, haystack: Cbor) => boolean) | undefined;
/**
 * Registry for the pattern paths function.
 * This gets set by pattern/index.ts after all modules are loaded.
 */
declare let pathsFn: ((pattern: Pattern$1, haystack: Cbor) => Path[]) | undefined;
/**
 * Registry for the pattern paths with captures function (VM-based).
 * This gets set by pattern/index.ts after all modules are loaded.
 */
declare let pathsWithCapturesFn: ((pattern: Pattern$1, haystack: Cbor) => MatchResultInternal) | undefined;
/**
 * Registry for the direct pattern paths with captures function (non-VM).
 * This is used by the VM to avoid infinite recursion.
 */
declare let pathsWithCapturesDirectFn: ((pattern: Pattern$1, haystack: Cbor) => MatchResultInternal) | undefined;
/**
 * Sets the pattern matching function.
 * Called by pattern/index.ts during module initialization.
 */
declare const setMatchFn: (fn: (pattern: Pattern$1, haystack: Cbor) => boolean) => void;
/**
 * Sets the pattern paths function.
 * Called by pattern/index.ts during module initialization.
 */
declare const setPathsFn: (fn: (pattern: Pattern$1, haystack: Cbor) => Path[]) => void;
/**
 * Sets the pattern paths with captures function.
 * Called by pattern/index.ts during module initialization.
 */
declare const setPathsWithCapturesFn: (fn: (pattern: Pattern$1, haystack: Cbor) => MatchResultInternal) => void;
/**
 * Sets the direct pattern paths with captures function (non-VM).
 * Called by pattern/index.ts during module initialization.
 */
declare const setPathsWithCapturesDirectFn: (fn: (pattern: Pattern$1, haystack: Cbor) => MatchResultInternal) => void;
/**
 * Matches a pattern against a CBOR value using the registered function.
 * @throws Error if the match function hasn't been registered yet.
 */
declare const matchPattern: (pattern: Pattern$1, haystack: Cbor) => boolean;
/**
 * Gets paths for a pattern against a CBOR value using the registered function.
 * @throws Error if the paths function hasn't been registered yet.
 */
declare const getPatternPaths: (pattern: Pattern$1, haystack: Cbor) => Path[];
/**
 * Gets paths with captures for a pattern against a CBOR value (VM-based).
 * @throws Error if the function hasn't been registered yet.
 */
declare const getPatternPathsWithCaptures: (pattern: Pattern$1, haystack: Cbor) => MatchResultInternal;
/**
 * Gets paths with captures directly without the VM (non-recursive).
 * This is used by the VM to avoid infinite recursion.
 * @throws Error if the function hasn't been registered yet.
 */
declare const getPatternPathsWithCapturesDirect: (pattern: Pattern$1, haystack: Cbor) => MatchResultInternal;
//#endregion
//#region src/pattern/index.d.ts
/**
 * The main Pattern type - a discriminated union of all pattern variants.
 */
type Pattern = {
  readonly kind: "Value";
  readonly pattern: ValuePattern;
} | {
  readonly kind: "Structure";
  readonly pattern: StructurePattern;
} | {
  readonly kind: "Meta";
  readonly pattern: MetaPattern;
};
/**
 * Result of pattern matching with captures.
 */
interface MatchResult {
  readonly paths: Path[];
  readonly captures: Map<string, Path[]>;
}
/**
 * Returns paths to matching elements in a CBOR value.
 *
 * @param pattern - The pattern to match
 * @param haystack - The CBOR value to search
 * @returns Array of paths to matching elements
 */
declare const patternPaths: (pattern: Pattern, haystack: Cbor) => Path[];
/**
 * Tests if a pattern matches a CBOR value.
 *
 * @param pattern - The pattern to match
 * @param haystack - The CBOR value to test
 * @returns true if the pattern matches
 */
declare const patternMatches: (pattern: Pattern, haystack: Cbor) => boolean;
/**
 * Formats a pattern as a string.
 *
 * @param pattern - The pattern to format
 * @returns String representation of the pattern
 */
declare const patternDisplay: (pattern: Pattern) => string;
/**
 * Matches a pattern against a CBOR value and returns all matching paths.
 *
 * @param pattern - The pattern to match
 * @param haystack - The CBOR value to search
 * @returns Array of paths to matching elements
 */
declare const paths: (pattern: Pattern, haystack: Cbor) => Path[];
/**
 * Checks if a pattern matches a CBOR value.
 *
 * @param pattern - The pattern to match
 * @param haystack - The CBOR value to test
 * @returns true if the pattern matches
 */
declare const matches: (pattern: Pattern, haystack: Cbor) => boolean;
/**
 * Computes paths with captures directly without using the VM.
 * This is used internally by the VM to avoid infinite recursion.
 *
 * Note: This function delegates capture collection to the pattern's
 * own matching mechanism. The VM has its own capture tracking, so
 * this just returns paths with any captures found during matching.
 *
 * @param pattern - The pattern to match
 * @param haystack - The CBOR value to search
 * @returns Match result with paths and captures
 */
declare const pathsWithCapturesDirect: (pattern: Pattern, haystack: Cbor) => MatchResult;
/**
 * Matches a pattern against a CBOR value and returns paths with captures.
 *
 * @param pattern - The pattern to match
 * @param haystack - The CBOR value to search
 * @returns Match result with paths and captures
 */
declare const pathsWithCaptures: (pattern: Pattern, haystack: Cbor) => MatchResult;
/**
 * Alias for pathsWithCaptures for internal VM use.
 */
declare const patternPathsWithCaptures: (pattern: Pattern, haystack: Cbor) => MatchResult;
/**
 * Creates a pattern that matches any value.
 */
declare const any: () => Pattern;
/**
 * Creates a pattern that matches any boolean.
 */
declare const anyBool: () => Pattern;
/**
 * Creates a pattern that matches a specific boolean value.
 */
declare const bool: (value: boolean) => Pattern;
/**
 * Creates a pattern that matches null.
 */
declare const nullPattern: () => Pattern;
/**
 * Creates a pattern that matches any number.
 */
declare const anyNumber: () => Pattern;
/**
 * Creates a pattern that matches a specific number.
 */
declare const number: (value: number) => Pattern;
/**
 * Creates a pattern that matches numbers in a range.
 */
declare const numberRange: (min: number, max: number) => Pattern;
/**
 * Creates a pattern that matches any text.
 */
declare const anyText: () => Pattern;
/**
 * Creates a pattern that matches specific text.
 */
declare const text: (value: string) => Pattern;
/**
 * Creates a pattern that matches text using a regex.
 */
declare const textRegex: (pattern: RegExp) => Pattern;
/**
 * Creates a pattern that matches any byte string.
 */
declare const anyByteString: () => Pattern;
/**
 * Creates a pattern that matches a specific byte string.
 */
declare const byteString: (value: Uint8Array) => Pattern;
/**
 * Creates a pattern that matches byte strings using a binary regex.
 *
 * The regex matches against raw bytes converted to a Latin-1 string.
 * Use escape sequences like `\x00` to match specific byte values.
 *
 * @example
 * ```typescript
 * // Match bytes starting with 0x00
 * byteStringRegex(/^\x00/)
 *
 * // Match ASCII "Hello"
 * byteStringRegex(/Hello/)
 * ```
 */
declare const byteStringRegex: (pattern: RegExp) => Pattern;
/**
 * Creates a pattern that matches any array.
 */
declare const anyArray: () => Pattern;
/**
 * Creates a pattern that matches any map.
 */
declare const anyMap: () => Pattern;
/**
 * Creates a pattern that matches any tagged value.
 */
declare const anyTagged: () => Pattern;
/**
 * Creates an AND pattern that matches if all patterns match.
 */
declare const and: (...patterns: Pattern[]) => Pattern;
/**
 * Creates an OR pattern that matches if any pattern matches.
 */
declare const or: (...patterns: Pattern[]) => Pattern;
/**
 * Creates a NOT pattern that matches if the pattern does not match.
 */
declare const not: (pattern: Pattern) => Pattern;
/**
 * Creates a capture pattern with a name.
 */
declare const capture: (name: string, pattern: Pattern) => Pattern;
/**
 * Creates a search pattern for recursive matching.
 */
declare const search: (pattern: Pattern) => Pattern;
/**
 * Creates a sequence pattern for ordered matching.
 */
declare const sequence: (...patterns: Pattern[]) => Pattern;
/**
 * Creates a pattern that matches numbers greater than a value.
 */
declare const numberGreaterThan: (value: number) => Pattern;
/**
 * Creates a pattern that matches numbers greater than or equal to a value.
 */
declare const numberGreaterThanOrEqual: (value: number) => Pattern;
/**
 * Creates a pattern that matches numbers less than a value.
 */
declare const numberLessThan: (value: number) => Pattern;
/**
 * Creates a pattern that matches numbers less than or equal to a value.
 */
declare const numberLessThanOrEqual: (value: number) => Pattern;
/**
 * Creates a pattern that matches NaN.
 */
declare const numberNaN: () => Pattern;
/**
 * Creates a pattern that matches positive infinity.
 */
declare const numberInfinity: () => Pattern;
/**
 * Creates a pattern that matches negative infinity.
 */
declare const numberNegInfinity: () => Pattern;
/**
 * Creates a pattern that matches any date.
 */
declare const anyDate: () => Pattern;
/**
 * Creates a pattern that matches a specific date.
 */
declare const date: (value: CborDate) => Pattern;
/**
 * Creates a pattern that matches dates within a range (inclusive).
 */
declare const dateRange: (min: CborDate, max: CborDate) => Pattern;
/**
 * Creates a pattern that matches dates on or after the specified date.
 */
declare const dateEarliest: (value: CborDate) => Pattern;
/**
 * Creates a pattern that matches dates on or before the specified date.
 */
declare const dateLatest: (value: CborDate) => Pattern;
/**
 * Creates a pattern that matches dates by their ISO-8601 string representation.
 */
declare const dateIso8601: (value: string) => Pattern;
/**
 * Creates a pattern that matches dates by regex on their ISO-8601 string.
 */
declare const dateRegex: (pattern: RegExp) => Pattern;
/**
 * Creates a pattern that matches any digest.
 */
declare const anyDigest: () => Pattern;
/**
 * Creates a pattern that matches a specific digest.
 */
declare const digest: (value: Digest) => Pattern;
/**
 * Creates a pattern that matches digests with a prefix.
 */
declare const digestPrefix: (prefix: Uint8Array) => Pattern;
/**
 * Creates a pattern that matches digests by binary regex.
 */
declare const digestBinaryRegex: (pattern: RegExp) => Pattern;
/**
 * Creates a pattern that matches any known value.
 */
declare const anyKnownValue: () => Pattern;
/**
 * Creates a pattern that matches a specific known value.
 */
declare const knownValue: (value: KnownValue) => Pattern;
/**
 * Creates a pattern that matches a known value by name.
 */
declare const knownValueNamed: (name: string) => Pattern;
/**
 * Creates a pattern that matches known values by regex on their name.
 */
declare const knownValueRegex: (pattern: RegExp) => Pattern;
/**
 * Creates a pattern that matches tagged values with a specific tag.
 */
declare const tagged: (tag: Tag, pattern: Pattern) => Pattern;
/**
 * Creates a pattern that matches tagged values by tag name.
 */
declare const taggedName: (name: string, pattern: Pattern) => Pattern;
/**
 * Creates a pattern that matches tagged values by tag name regex.
 */
declare const taggedRegex: (regex: RegExp, pattern: Pattern) => Pattern;
/**
 * Creates a repeat pattern with the given pattern and quantifier.
 */
declare const repeat: (pattern: Pattern, quantifier: Quantifier) => Pattern;
/**
 * Creates a grouped pattern (equivalent to repeat with exactly 1).
 * This is useful for precedence grouping in pattern expressions.
 */
declare const group: (pattern: Pattern) => Pattern;
//#endregion
//#region src/parse/value/bool-parser.d.ts
/**
 * Parse a boolean pattern from the `bool` keyword.
 */
declare const parseBool: (_lexer: Lexer) => Result<Pattern>;
/**
 * Parse a `true` literal.
 */
declare const parseBoolTrue: (_lexer: Lexer) => Result<Pattern>;
/**
 * Parse a `false` literal.
 */
declare const parseBoolFalse: (_lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/value/null-parser.d.ts
/**
 * Parse a null pattern from the `null` keyword.
 */
declare const parseNull: (_lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/value/number-parser.d.ts
/**
 * Parse a number pattern from the `number` keyword.
 */
declare const parseNumber: (_lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/value/text-parser.d.ts
/**
 * Parse a text pattern from the `text` keyword.
 *
 * Mirrors Rust `parse_text`
 * (`bc-dcbor-pattern-rust/src/parse/value/text_parser.rs`):
 *
 * ```rust
 * pub(crate) fn parse_text(_lexer: &mut logos::Lexer<Token>) -> Result<Pattern> {
 *     Ok(Pattern::any_text())
 * }
 * ```
 *
 * The `text` keyword always means "match any text"; literal strings
 * and regexes are parsed as standalone primaries (`StringLiteral` /
 * `SingleQuoted` tokens that hit `parse_primary` directly). Earlier
 * revisions of this port consumed a following `SingleQuoted` /
 * `StringLiteral` token here, which silently accepted patterns Rust
 * rejects (e.g. `text "foo"` would be parsed as `text("foo")` in TS
 * but raise `ExtraData` in Rust).
 */
declare const parseText: (_lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/value/bytestring-parser.d.ts
/**
 * Parse a bytestring pattern from the `bytes` keyword.
 */
declare const parseByteString: (_lexer: Lexer) => Result<Pattern>;
/**
 * Parse a hex string token result into a pattern.
 */
declare const parseHexStringToken: (hexResult: Result<Uint8Array>) => Result<Pattern>;
/**
 * Parse a hex regex token result into a pattern.
 *
 * In TypeScript, binary regex matching is implemented by converting bytes to Latin-1 strings.
 * This mimics Rust's regex::bytes::Regex behavior where each byte 0-255 maps to a character.
 */
declare const parseHexRegexToken: (regexResult: Result<RegExp>) => Result<Pattern>;
//#endregion
//#region src/parse/value/date-parser.d.ts
/**
 * Parse a date pattern from the `date` keyword.
 */
declare const parseDate: (_lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/value/digest-parser.d.ts
/**
 * Parse a digest pattern from the `digest` keyword.
 */
declare const parseDigest: (_lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/value/known-value-parser.d.ts
/**
 * Parse a known value pattern from the `known` keyword.
 */
declare const parseKnownValue: (_lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/structure/array-parser.d.ts
/**
 * Parse a bracket array pattern: [pattern] or [{n}] etc.
 */
declare const parseBracketArray: (lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/structure/map-parser.d.ts
/**
 * Parse a bracket map pattern: {pattern: pattern} or {{n}} etc.
 *
 * Mirrors Rust `parse_bracket_map`
 * (`bc-dcbor-pattern-rust/src/parse/structure/map_parser.rs:18-55`):
 *
 * - `{{n}}` / `{{n,m}}` / `{{n,}}` — length constraint via the `Range`
 *   token.
 * - `{pattern: pattern, ...}` — key/value constraints.
 *
 * `{}` (immediate close brace) is **not** accepted — Rust falls through
 * to `parse_key_value_constraints`, which calls `parse_or` on `}` and
 * surfaces `UnexpectedToken`. Earlier revisions of this port short-
 * circuited on `BraceClose` and returned `anyMap()`, which silently
 * accepted patterns Rust rejects. Use the `map` keyword for
 * "any map".
 */
declare const parseBracketMap: (lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/structure/tagged-parser.d.ts
/**
 * Parse a tagged pattern from the `tagged` keyword.
 *
 * Supports:
 * - `tagged` - matches any tagged value
 * - `tagged(value, pattern)` - matches tagged value with specific tag number
 * - `tagged(name, pattern)` - matches tagged value with named tag
 * - `tagged(/regex/, pattern)` - matches tagged value with tag name matching regex
 */
declare const parseTagged: (lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/meta/or-parser.d.ts
/**
 * Parse an OR pattern - the top-level pattern parser.
 */
declare const parseOr: (lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/meta/and-parser.d.ts
/**
 * Parse an AND pattern.
 */
declare const parseAnd: (lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/meta/not-parser.d.ts
/**
 * Parse a NOT pattern or delegate to primary parser.
 */
declare const parseNot: (lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/meta/repeat-parser.d.ts
/**
 * Parse quantifier tokens that follow a grouped pattern.
 */
declare const parseQuantifier: (pattern: Pattern, lexer: Lexer, forceRepeat: boolean) => Result<Pattern>;
//#endregion
//#region src/parse/meta/primary-parser.d.ts
/**
 * Parse a primary pattern - the most basic unit of pattern matching.
 */
declare const parsePrimary: (lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/meta/capture-parser.d.ts
/**
 * Parse a capture pattern of the form `@name(pattern)`.
 */
declare const parseCapture: (lexer: Lexer, name: string) => Result<Pattern>;
//#endregion
//#region src/parse/meta/search-parser.d.ts
/**
 * Parse a search pattern `...(pattern)`.
 */
declare const parseSearch: (lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/parse-registry.d.ts
/**
 * The registered parseOr function.
 */
declare let parseOrFn: ((lexer: Lexer) => Result<Pattern>) | undefined;
/**
 * Registers the parseOr function.
 */
declare const setParseOrFn: (fn: (lexer: Lexer) => Result<Pattern>) => void;
/**
 * Calls the registered parseOr function.
 */
declare const parseOrFromRegistry: (lexer: Lexer) => Result<Pattern>;
//#endregion
//#region src/parse/index.d.ts
/**
 * Parses a complete dCBOR pattern expression.
 *
 * @param input - The pattern string to parse
 * @returns A Result containing the parsed Pattern or an error
 *
 * @example
 * ```typescript
 * const result = parse("number");
 * if (result.ok) {
 *   console.log(result.value);
 * }
 * ```
 */
declare const parse: (input: string) => Result<Pattern>;
/**
 * Parses a partial dCBOR pattern expression, returning the parsed pattern
 * and the number of characters consumed.
 *
 * Unlike `parse()`, this function succeeds even if additional characters
 * follow the first pattern. The returned index points to the first unparsed
 * character after the pattern.
 *
 * @param input - The pattern string to parse
 * @returns A Result containing a tuple of [Pattern, consumedLength] or an error
 *
 * @example
 * ```typescript
 * const result = parsePartial("true rest");
 * if (result.ok) {
 *   const [pattern, consumed] = result.value;
 *   console.log(consumed); // 4 or 5 (includes whitespace)
 * }
 * ```
 */
declare const parsePartial: (input: string) => Result<[Pattern, number]>;
//#endregion
export { AndPattern, AnyPattern, ArrayPattern, AssignmentBacktrackState, Axis, BacktrackState, BoolPattern, BooleanBacktrackState, ByteStringPattern, CapturePattern, DEFAULT_FORMAT_OPTS, DEFAULT_INTERVAL, DEFAULT_QUANTIFIER, DEFAULT_RELUCTANCE, DatePattern, DigestPattern, Err, Error, FormatPathsOpts, FormatPathsOptsBuilder, GenericBacktracker, Instr, Interval, KnownValuePattern, Lexer, MapPattern, MatchResult, MatchResultInternal, MatchWithCaptures, Matcher, MatcherDefaults, MetaPattern, NotPattern, NullPattern, NumberPattern, Ok, OrPattern, Path, PathElementFormat, Pattern, PatternError, Program, Quantifier, Reluctance, RepeatPattern, Result, SearchPattern, SearchWithCaptures, SequenceAssigner, SequencePattern, Span, SpannedToken, StructurePattern, TaggedPattern, TextPattern, Token, ValuePattern, Vm, adjustSpan, and, andPattern, andPatternDisplay, andPatternMatches, andPatternPaths, any, anyArray, anyBool, anyByteString, anyDate, anyDigest, anyKnownValue, anyMap, anyNumber, anyPattern, anyPatternDisplay, anyPatternMatches, anyPatternPaths, anyTagged, anyText, arrayPatternAny, arrayPatternDisplay, arrayPatternEquals, arrayPatternMatches, arrayPatternPaths, arrayPatternPathsWithCaptures, arrayPatternWithElements, arrayPatternWithLength, arrayPatternWithLengthInterval, arrayPatternWithLengthRange, atomicPaths, axisChildren, bool, boolPatternAny, boolPatternDisplay, boolPatternMatches, boolPatternPaths, boolPatternValue, buildExtendedArrayContextPath, buildSimpleArrayContextPath, byteString, byteStringPatternAny, byteStringPatternBinaryRegex, byteStringPatternDisplay, byteStringPatternMatches, byteStringPatternPaths, byteStringPatternValue, byteStringRegex, calculateRepeatBounds, canRepeatMatch, capture, capturePattern, capturePatternDisplay, capturePatternMatches, capturePatternPaths, collectPatternCaptureNames, compilePattern, date, dateEarliest, dateIso8601, dateLatest, datePatternAny, datePatternDisplay, datePatternEarliest, datePatternLatest, datePatternMatches, datePatternPaths, datePatternRange, datePatternRegex, datePatternStringValue, datePatternValue, dateRange, dateRegex, digest, digestBinaryRegex, digestPatternAny, digestPatternBinaryRegex, digestPatternDisplay, digestPatternMatches, digestPatternPaths, digestPatternPrefix, digestPatternValue, digestPrefix, errorToString, extractCaptureWithRepeat, extractRepeatPattern, formatArrayElementPattern, formatPath, formatPathOpt, formatPaths, formatPathsOpt, formatPathsWithCaptures, getPatternPaths, getPatternPathsWithCaptures, getPatternPathsWithCapturesDirect, group, hasRepeatPatternsInSlice, isRepeatPattern, knownValue, knownValueNamed, knownValuePatternAny, knownValuePatternDisplay, knownValuePatternMatches, knownValuePatternNamed, knownValuePatternPaths, knownValuePatternRegex, knownValuePatternValue, knownValueRegex, map, mapPatternAny, mapPatternDisplay, mapPatternEquals, mapPatternMatches, mapPatternPaths, mapPatternPathsWithCaptures, mapPatternWithConstraints, mapPatternWithLength, mapPatternWithLengthInterval, mapPatternWithLengthRange, matchFn, matchPattern, matches, metaAnd, metaAny, metaCapture, metaNot, metaOr, metaPatternDisplay, metaPatternMatches, metaPatternPaths, metaRepeat, metaSearch, metaSequence, not, notPattern, notPatternDisplay, notPatternMatches, notPatternPaths, nullPattern, nullPatternDisplay, nullPatternMatches, nullPatternPaths, number, numberGreaterThan, numberGreaterThanOrEqual, numberInfinity, numberLessThan, numberLessThanOrEqual, numberNaN, numberNegInfinity, numberPatternAny, numberPatternDisplay, numberPatternGreaterThan, numberPatternGreaterThanOrEqual, numberPatternInfinity, numberPatternLessThan, numberPatternLessThanOrEqual, numberPatternMatches, numberPatternNaN, numberPatternNegInfinity, numberPatternPaths, numberPatternRange, numberPatternValue, numberRange, or, orPattern, orPatternDisplay, orPatternMatches, orPatternPaths, parse, parseAnd, parseBool, parseBoolFalse, parseBoolTrue, parseBracketArray, parseBracketMap, parseByteString, parseCapture, parseDate, parseDigest, parseHexRegexToken, parseHexStringToken, parseKnownValue, parseNot, parseNull, parseNumber, parseOr, parseOrFn, parseOrFromRegistry, parsePartial, parsePrimary, parseQuantifier, parseSearch, parseTagged, parseText, paths, pathsFn, pathsWithCaptures, pathsWithCapturesDirect, pathsWithCapturesDirectFn, pathsWithCapturesFn, patternDisplay, patternMatches, patternPaths, patternPathsWithCaptures, reluctanceSuffix, repeat, repeatExact, repeatOneOrMore, repeatOptional, repeatPattern, repeatPatternDisplay, repeatPatternMatches, repeatPatternPaths, repeatRange, repeatZeroOrMore, run, search, searchPattern, searchPatternDisplay, searchPatternMatches, searchPatternPaths, searchPatternPathsWithCaptures, sequence, sequencePattern, sequencePatternDisplay, sequencePatternMatches, sequencePatternPaths, sequencePatternPatterns, setMatchFn, setParseOrFn, setPathsFn, setPathsWithCapturesDirectFn, setPathsWithCapturesFn, span, structureArray, structureMap, structurePatternDisplay, structurePatternMatches, structurePatternPaths, structurePatternPathsWithCaptures, structureTagged, tagged, taggedName, taggedPatternAny, taggedPatternDisplay, taggedPatternMatches, taggedPatternPaths, taggedPatternPathsWithCaptures, taggedPatternWithName, taggedPatternWithRegex, taggedPatternWithTag, taggedRegex, text, textPatternAny, textPatternDisplay, textPatternMatches, textPatternPaths, textPatternRegex, textPatternValue, textRegex, transformCapturesWithArrayContext, unwrap, unwrapOr, valueBool, valueByteString, valueDate, valueDigest, valueKnownValue, valueNull, valueNumber, valuePatternDisplay, valuePatternMatches, valuePatternPaths, valueText };
//# sourceMappingURL=index.d.mts.map