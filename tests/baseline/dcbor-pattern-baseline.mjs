//#region src/error.ts
/**
* Creates a new Span.
*/
const span = (start, end) => ({
	start,
	end
});
/**
* Creates a successful Result.
*/
const Ok = (value) => ({
	ok: true,
	value
});
/**
* Creates a failed Result.
*/
const Err = (error) => ({
	ok: false,
	error
});
/**
* Converts an Error to a human-readable string.
*/
const failureMessage = (error) => {
	switch (error.type) {
		case "EmptyInput": return "Empty input";
		case "UnexpectedEndOfInput": return "Unexpected end of input";
		case "ExtraData": return `Extra data at end of input at ${error.span.start}..${error.span.end}`;
		case "UnexpectedToken": return `Unexpected token at ${error.span.start}..${error.span.end}`;
		case "UnrecognizedToken": return `Unrecognized token at position ${error.span.start}..${error.span.end}`;
		case "InvalidRegex": return `Invalid regex pattern at ${error.span.start}..${error.span.end}`;
		case "UnterminatedRegex": return `Unterminated regex pattern at ${error.span.start}..${error.span.end}`;
		case "UnterminatedString": return `Unterminated string literal at ${error.span.start}..${error.span.end}`;
		case "InvalidRange": return `Invalid range at ${error.span.start}..${error.span.end}`;
		case "InvalidHexString": return `Invalid hex string at ${error.span.start}..${error.span.end}`;
		case "UnterminatedHexString": return `Unterminated hex string at ${error.span.start}..${error.span.end}`;
		case "InvalidDateFormat": return `Invalid date format at ${error.span.start}..${error.span.end}`;
		case "InvalidNumberFormat": return `Invalid number format at ${error.span.start}..${error.span.end}`;
		case "InvalidUr": return `Invalid UR: ${error.message} at ${error.span.start}..${error.span.end}`;
		case "ExpectedOpenParen": return `Expected opening parenthesis at ${error.span.start}..${error.span.end}`;
		case "ExpectedCloseParen": return `Expected closing parenthesis at ${error.span.start}..${error.span.end}`;
		case "ExpectedCloseBracket": return `Expected closing bracket at ${error.span.start}..${error.span.end}`;
		case "ExpectedCloseBrace": return `Expected closing brace at ${error.span.start}..${error.span.end}`;
		case "ExpectedColon": return `Expected colon at ${error.span.start}..${error.span.end}`;
		case "ExpectedPattern": return `Expected pattern after operator at ${error.span.start}..${error.span.end}`;
		case "UnmatchedParentheses": return `Unmatched parentheses at ${error.span.start}..${error.span.end}`;
		case "UnmatchedBraces": return `Unmatched braces at ${error.span.start}..${error.span.end}`;
		case "InvalidCaptureGroupName": return `Invalid capture group name '${error.name}' at ${error.span.start}..${error.span.end}`;
		case "InvalidDigestPattern": return `Invalid digest pattern: ${error.message} at ${error.span.start}..${error.span.end}`;
		case "UnterminatedDigestQuoted": return `Unterminated digest quoted pattern at ${error.span.start}..${error.span.end}`;
		case "UnterminatedDateQuoted": return `Unterminated date quoted pattern at ${error.span.start}..${error.span.end}`;
		case "Unknown": return "Unknown error";
	}
};
/** The codes a `DcborPatternError` carries, one per parse failure. */
const DcborPatternErrorCode = {
	EmptyInput: "EmptyInput",
	UnexpectedEndOfInput: "UnexpectedEndOfInput",
	ExtraData: "ExtraData",
	UnexpectedToken: "UnexpectedToken",
	UnrecognizedToken: "UnrecognizedToken",
	InvalidRegex: "InvalidRegex",
	UnterminatedRegex: "UnterminatedRegex",
	UnterminatedString: "UnterminatedString",
	InvalidRange: "InvalidRange",
	InvalidHexString: "InvalidHexString",
	UnterminatedHexString: "UnterminatedHexString",
	InvalidDateFormat: "InvalidDateFormat",
	InvalidNumberFormat: "InvalidNumberFormat",
	InvalidUr: "InvalidUr",
	ExpectedOpenParen: "ExpectedOpenParen",
	ExpectedCloseParen: "ExpectedCloseParen",
	ExpectedCloseBracket: "ExpectedCloseBracket",
	ExpectedCloseBrace: "ExpectedCloseBrace",
	ExpectedColon: "ExpectedColon",
	ExpectedPattern: "ExpectedPattern",
	UnmatchedParentheses: "UnmatchedParentheses",
	UnmatchedBraces: "UnmatchedBraces",
	InvalidCaptureGroupName: "InvalidCaptureGroupName",
	InvalidDigestPattern: "InvalidDigestPattern",
	UnterminatedDigestQuoted: "UnterminatedDigestQuoted",
	UnterminatedDateQuoted: "UnterminatedDateQuoted",
	Unknown: "Unknown"
};
/**
* A pattern failed to parse. `code` names the failure, `details` holds its
* span (UTF-16 code units) and, per code, the token, name or message.
*/
var DcborPatternError = class DcborPatternError extends Error {
	code;
	details;
	constructor(failure) {
		super(failureMessage(failure));
		this.name = "DcborPatternError";
		const { type, ...details } = failure;
		this.code = type;
		this.details = details;
	}
	static isDcborPatternError(value) {
		return value instanceof DcborPatternError;
	}
};
//#endregion
//#region src/reluctance.ts
/**
* Copyright © 2023-2026 Blockchain Commons, LLC
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
const Reluctance = {
	/**
	* Grabs as many repetitions as possible, then backtracks if the rest of
	* the pattern cannot match.
	*/
	Greedy: "greedy",
	/**
	* Starts with as few repetitions as possible, adding more only if the rest
	* of the pattern cannot match.
	*/
	Lazy: "lazy",
	/**
	* Grabs as many repetitions as possible and never backtracks; if the rest
	* of the pattern cannot match, the whole match fails.
	*/
	Possessive: "possessive"
};
/**
* Default reluctance is Greedy.
*/
const DEFAULT_RELUCTANCE = Reluctance.Greedy;
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
const reluctanceSuffix = (reluctance) => {
	switch (reluctance) {
		case Reluctance.Greedy: return "";
		case Reluctance.Lazy: return "?";
		case Reluctance.Possessive: return "+";
	}
};
//#endregion
//#region src/interval.ts
/**
* Copyright © 2023-2026 Blockchain Commons, LLC
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
var Interval = class Interval {
	_min;
	_max;
	/**
	* Creates a new Interval.
	*
	* @param min - The minimum value (inclusive)
	* @param max - The maximum value (inclusive), or undefined for unbounded
	*/
	constructor(min, max) {
		this._min = min;
		this._max = max;
	}
	/**
	* Creates an interval from a range specification.
	*
	* @param start - The start of the range (inclusive)
	* @param end - The end of the range (inclusive), or undefined for unbounded
	* @returns A new Interval
	*/
	static from(start, end) {
		return new Interval(start, end);
	}
	/**
	* Creates an interval for exactly n occurrences.
	*
	* @param n - The exact count
	* @returns A new Interval with min = max = n
	*/
	static exactly(n) {
		return new Interval(n, n);
	}
	/**
	* Creates an interval for at least n occurrences.
	*
	* @param n - The minimum count
	* @returns A new Interval with min = n and no maximum
	*/
	static atLeast(n) {
		return new Interval(n, void 0);
	}
	/**
	* Creates an interval for at most n occurrences.
	*
	* @param n - The maximum count
	* @returns A new Interval with min = 0 and max = n
	*/
	static atMost(n) {
		return new Interval(0, n);
	}
	/**
	* Creates an interval for zero or more occurrences (0..).
	*
	* @returns A new Interval representing *
	*/
	static zeroOrMore() {
		return new Interval(0, void 0);
	}
	/**
	* Creates an interval for one or more occurrences (1..).
	*
	* @returns A new Interval representing +
	*/
	static oneOrMore() {
		return new Interval(1, void 0);
	}
	/**
	* Creates an interval for zero or one occurrence (0..=1).
	*
	* @returns A new Interval representing ?
	*/
	static zeroOrOne() {
		return new Interval(0, 1);
	}
	/**
	* Returns the minimum value of the interval.
	*/
	min() {
		return this._min;
	}
	/**
	* Returns the maximum value of the interval, or `undefined` if unbounded.
	*/
	max() {
		return this._max;
	}
	/**
	* Checks if the given count falls within this interval.
	*
	* @param count - The count to check
	* @returns true if count is within the interval
	*/
	contains(count) {
		return count >= this._min && (this._max === void 0 || count <= this._max);
	}
	/**
	* Checks if the interval represents a single value (i.e., min equals max).
	*/
	isSingle() {
		return this._max !== void 0 && this._min === this._max;
	}
	/**
	* Checks if the interval is unbounded (i.e., has no maximum value).
	*/
	isUnbounded() {
		return this._max === void 0;
	}
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
	rangeNotation() {
		if (this._max !== void 0 && this._min === this._max) return `{${this._min}}`;
		if (this._max !== void 0) return `{${this._min},${this._max}}`;
		return `{${this._min},}`;
	}
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
	shorthandNotation() {
		if (this._min === 0 && this._max === 1) return "?";
		if (this._max !== void 0 && this._min === this._max) return `{${this._min}}`;
		if (this._max !== void 0) return `{${this._min},${this._max}}`;
		if (this._min === 0) return "*";
		if (this._min === 1) return "+";
		return `{${this._min},}`;
	}
	/**
	* Returns a string representation using range notation.
	*/
	toString() {
		return this.rangeNotation();
	}
	/**
	* Checks equality with another Interval.
	*/
	equals(other) {
		return this._min === other._min && this._max === other._max;
	}
};
/**
* Default interval is exactly 1 occurrence.
*/
const DEFAULT_INTERVAL = Interval.exactly(1);
//#endregion
//#region src/quantifier.ts
/**
* Copyright © 2023-2026 Blockchain Commons, LLC
*
*
* Quantifier for pattern repetition.
*
* This module provides the Quantifier class which combines an interval
* (how many times to match) with a reluctance (matching strategy).
*
* @module quantifier
*/
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
var Quantifier = class Quantifier {
	_interval;
	_reluctance;
	/**
	* Creates a new Quantifier.
	*
	* @param interval - The interval defining how many times to match
	* @param reluctance - The matching strategy (default: Greedy)
	*/
	constructor(interval, reluctance = DEFAULT_RELUCTANCE) {
		this._interval = interval;
		this._reluctance = reluctance;
	}
	/**
	* Creates a quantifier from min/max values.
	*
	* @param min - Minimum occurrences
	* @param max - Maximum occurrences (undefined for unbounded)
	* @param reluctance - The matching strategy
	*/
	static from(min, max, reluctance = DEFAULT_RELUCTANCE) {
		return new Quantifier(new Interval(min, max), reluctance);
	}
	/**
	* Creates a quantifier for exactly n occurrences.
	*/
	static exactly(n, reluctance = DEFAULT_RELUCTANCE) {
		return new Quantifier(Interval.exactly(n), reluctance);
	}
	/**
	* Creates a quantifier for at least n occurrences.
	*/
	static atLeast(n, reluctance = DEFAULT_RELUCTANCE) {
		return new Quantifier(Interval.atLeast(n), reluctance);
	}
	/**
	* Creates a quantifier for at most n occurrences.
	*/
	static atMost(n, reluctance = DEFAULT_RELUCTANCE) {
		return new Quantifier(Interval.atMost(n), reluctance);
	}
	/**
	* Creates a quantifier for between min and max occurrences.
	*/
	static between(min, max, reluctance = DEFAULT_RELUCTANCE) {
		return new Quantifier(new Interval(min, max), reluctance);
	}
	/**
	* Creates a quantifier for zero or more occurrences (*).
	*/
	static zeroOrMore(reluctance = DEFAULT_RELUCTANCE) {
		return new Quantifier(Interval.zeroOrMore(), reluctance);
	}
	/**
	* Creates a quantifier for one or more occurrences (+).
	*/
	static oneOrMore(reluctance = DEFAULT_RELUCTANCE) {
		return new Quantifier(Interval.oneOrMore(), reluctance);
	}
	/**
	* Creates a quantifier for zero or one occurrence (?).
	*/
	static zeroOrOne(reluctance = DEFAULT_RELUCTANCE) {
		return new Quantifier(Interval.zeroOrOne(), reluctance);
	}
	/**
	* Returns the minimum number of occurrences.
	*/
	min() {
		return this._interval.min();
	}
	/**
	* Returns the maximum number of occurrences, or undefined if unbounded.
	*/
	max() {
		return this._interval.max();
	}
	/**
	* Returns the interval.
	*/
	interval() {
		return this._interval;
	}
	/**
	* Returns the reluctance (matching strategy).
	*/
	reluctance() {
		return this._reluctance;
	}
	/**
	* Checks if the given count is within the quantifier's range.
	*/
	contains(count) {
		return this._interval.contains(count);
	}
	/**
	* Checks if the quantifier is unbounded (no maximum).
	*/
	isUnbounded() {
		return this._interval.isUnbounded();
	}
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
	toString() {
		return `${this._interval.shorthandNotation()}${reluctanceSuffix(this._reluctance)}`;
	}
	/**
	* Checks equality with another Quantifier.
	*/
	equals(other) {
		return this._interval.equals(other._interval) && this._reluctance === other._reluctance;
	}
	/**
	* Converts to an Interval (discarding reluctance).
	*/
	toInterval() {
		return this._interval;
	}
};
/**
* Default quantifier is exactly 1 occurrence, greedy.
*/
const DEFAULT_QUANTIFIER = Quantifier.exactly(1);
//#endregion
//#region src/pattern/match-registry.ts
/**
* Registry for the pattern matching function.
* This gets set by pattern/index.ts after all modules are loaded.
*/
let matchFn;
/**
* Registry for the pattern paths function.
* This gets set by pattern/index.ts after all modules are loaded.
*/
let pathsFn;
/**
* Registry for the pattern paths with captures function (VM-based).
* This gets set by pattern/index.ts after all modules are loaded.
*/
let pathsWithCapturesFn;
/**
* Registry for the direct pattern paths with captures function (non-VM).
* This is used by the VM to avoid infinite recursion.
*/
let pathsWithCapturesDirectFn;
/**
* Sets the pattern matching function.
* Called by pattern/index.ts during module initialization.
*/
const setMatchFn = (fn) => {
	matchFn = fn;
};
/**
* Sets the pattern paths function.
* Called by pattern/index.ts during module initialization.
*/
const setPathsFn = (fn) => {
	pathsFn = fn;
};
/**
* Sets the pattern paths with captures function.
* Called by pattern/index.ts during module initialization.
*/
const setPathsWithCapturesFn = (fn) => {
	pathsWithCapturesFn = fn;
};
/**
* Sets the direct pattern paths with captures function (non-VM).
* Called by pattern/index.ts during module initialization.
*/
const setPathsWithCapturesDirectFn = (fn) => {
	pathsWithCapturesDirectFn = fn;
};
/**
* Matches a pattern against a CBOR value using the registered function.
* @throws Error if the match function hasn't been registered yet.
*/
const matchPattern = (pattern, haystack) => {
	if (matchFn === void 0) throw new Error("Pattern match function not initialized");
	return matchFn(pattern, haystack);
};
/**
* Gets paths for a pattern against a CBOR value using the registered function.
* @throws Error if the paths function hasn't been registered yet.
*/
const getPatternPaths = (pattern, haystack) => {
	if (pathsFn === void 0) throw new Error("Pattern paths function not initialized");
	return pathsFn(pattern, haystack);
};
/**
* Gets paths with captures for a pattern against a CBOR value (VM-based).
* @throws Error if the function hasn't been registered yet.
*/
const getPatternPathsWithCaptures = (pattern, haystack) => {
	if (pathsWithCapturesFn === void 0) throw new Error("Pattern paths with captures function not initialized");
	return pathsWithCapturesFn(pattern, haystack);
};
/**
* Gets paths with captures directly without the VM (non-recursive).
* This is used by the VM to avoid infinite recursion.
* @throws Error if the function hasn't been registered yet.
*/
const getPatternPathsWithCapturesDirect = (pattern, haystack) => {
	if (pathsWithCapturesDirectFn === void 0) throw new Error("Direct pattern paths with captures function not initialized");
	return pathsWithCapturesDirectFn(pattern, haystack);
};
let displayFn;
/** Registers the pattern display function (called by pattern/index.ts). */
const setDisplayFn = (fn) => {
	displayFn = fn;
};
/** Displays a pattern through the registered function. */
const getPatternDisplay = (pattern) => {
	if (displayFn === void 0) throw new Error("Pattern display function not initialized");
	return displayFn(pattern);
};
//#endregion
//#region ../bc-dcbor-ts/dist/error-BM_wVk_h.mjs
const MajorType = {
	Unsigned: 0,
	Negative: 1,
	ByteString: 2,
	Text: 3,
	Array: 4,
	Map: 5,
	Tagged: 6,
	Simple: 7
};
const isCborNumber = (value) => {
	return typeof value === "number" || typeof value === "bigint";
};
const isCbor = (value) => {
	return value !== null && typeof value === "object" && "isCbor" in value && value.isCbor === true;
};
/**
* Compare two tag values for equality, normalizing `number` vs `bigint`.
* A raw `===` would treat `100n` and `100` as unequal, so a large tag that
* decoded to a `bigint` wouldn't match the same value written as a `number`.
*
* @internal Exported for cross-module use; not part of the public surface -
* use `Tag.equals` instead.
*/
const tagValuesEqual = (a, b) => {
	if (typeof a === "bigint" || typeof b === "bigint") return BigInt(a) === BigInt(b);
	return a === b;
};
/**
* Value-type companion for the `Tag` interface: an interface plus a merged
* `const` with a handful of members. It stays small and must not import the
* encode/format graph.
*/
const Tag = {
	/**
	* Create a Tag from its numeric value, optionally with a name.
	*
	* The returned object is frozen: a `Tag` is a value, as in the reference,
	* and a store keeps the tags it is given by identity when they are frozen.
	*
	* ```typescript
	* Tag.from(1, "date");
	* Tag.from(12345);
	* ```
	*/
	from(value, name) {
		if (name !== void 0) return Object.freeze({
			value,
			name
		});
		return Object.freeze({ value });
	},
	/**
	* Compare two tags for equality: compares by `value` only (normalizing
	* `number` vs `bigint`) and ignores the optional `name`.
	*/
	equals(a, b) {
		return tagValuesEqual(a.value, b.value);
	}
};
/**
* Get the string representation of a tag.
* Internal function used for error messages.
*
* @param tag - The tag to represent
* @returns String representation (name if available, otherwise value)
*
* @internal
*/
const tagToString = (tag) => tag.name ?? tag.value.toString();
const captureStackTrace = Error.captureStackTrace;
/**
* The single error type thrown by dCBOR encoding, decoding, and extraction.
*
* @example
* ```typescript
* try {
*   decodeCbor(bytes);
* } catch (e) {
*   if (CborError.isCborError(e) && e.code === "WrongTag") {
*     console.log(e.details.expectedTag, e.details.actualTag);
*   }
* }
* ```
*/
var CborError = class CborError extends Error {
	/** Machine-readable discriminant; switch on this to handle errors. */
	code;
	/** Structured, code-specific data (see {@link CborErrorDetails}). */
	details;
	constructor(code, message, details = {}) {
		super(message);
		this.name = "CborError";
		this.code = code;
		this.details = details;
		Object.setPrototypeOf(this, new.target.prototype);
		if (typeof captureStackTrace === "function") captureStackTrace(this, CborError);
	}
	/** Type guard: is `value` a {@link CborError}? Narrows to the
	* code-discriminated {@link CborErrorTyped} union. */
	static isCborError(value) {
		return value instanceof CborError;
	}
	/** The CBOR data ended before a complete item could be decoded. */
	static underrun() {
		return new CborError("Underrun", "early end of CBOR data");
	}
	/** An unsupported/invalid value was found in a CBOR header byte. */
	static unsupportedHeaderValue(headerValue) {
		return new CborError("UnsupportedHeaderValue", "unsupported value in CBOR header", { headerValue });
	}
	/** A numeric value was not in its shortest/canonical dCBOR form. */
	static nonCanonicalNumeric() {
		return new CborError("NonCanonicalNumeric", "a CBOR numeric value was encoded in non-canonical form");
	}
	/** A major-type-7 simple value other than false/true/null/float. */
	static invalidSimpleValue() {
		return new CborError("InvalidSimpleValue", "an invalid CBOR simple value was encountered");
	}
	/** A text string was not valid UTF-8 (with the underlying reason). */
	static invalidString(cause) {
		return new CborError("InvalidString", `an invalidly-encoded UTF-8 string was encountered in the CBOR (${cause})`, { cause });
	}
	/** A text string was not in Unicode NFC. */
	static nonCanonicalString() {
		return new CborError("NonCanonicalString", "a CBOR string was not encoded in Unicode Canonical Normalization Form C");
	}
	/** The decoded item left `count` trailing bytes unconsumed. */
	static unusedData(count) {
		return new CborError("UnusedData", `the decoded CBOR had ${count} extra bytes at the end`, { count });
	}
	/** Map keys were not in canonical ascending byte order. */
	static misorderedMapKey() {
		return new CborError("MisorderedMapKey", "the decoded CBOR map has keys that are not in canonical order");
	}
	/** A map contained a duplicate key. */
	static duplicateMapKey() {
		return new CborError("DuplicateMapKey", "the decoded CBOR map has a duplicate key");
	}
	/** A requested map key was not present. */
	static missingMapKey() {
		return new CborError("MissingMapKey", "missing CBOR map key");
	}
	/** A numeric value could not be represented in the target type. */
	static outOfRange() {
		return new CborError("OutOfRange", "the CBOR numeric value could not be represented in the specified numeric type");
	}
	/** The CBOR value was not the type expected by a conversion. */
	static wrongType() {
		return new CborError("WrongType", "the decoded CBOR value was not the expected type");
	}
	/** A tagged value had a tag other than the one expected. */
	static wrongTag(expected, actual) {
		return new CborError("WrongTag", `expected CBOR tag ${tagToString(expected)}, but got ${tagToString(actual)}`, {
			expectedTag: expected,
			actualTag: actual
		});
	}
	/** Invalid UTF-8 in a text string (with the underlying reason). */
	static invalidUtf8(cause) {
		return new CborError("InvalidUtf8", `invalid UTF‑8 string: ${cause}`, { cause });
	}
	/** Invalid ISO 8601 / RFC 3339 date string (with the underlying reason). */
	static invalidDate(cause) {
		return new CborError("InvalidDate", `invalid ISO 8601 date string: ${cause}`, { cause });
	}
	/** An arbitrary error carrying a custom message. */
	static custom(message) {
		return new CborError("Custom", message);
	}
};
//#endregion
//#region ../bc-dcbor-ts/dist/tags-store-BSBP9gpt.mjs
/**
* Byte-array utilities shared across the library.
*
* @module stdlib
*/
/**
* Check if two byte arrays are equal.
*/
const areBytesEqual = (a, b) => {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
};
/**
* Lexicographically compare two byte arrays.
* Returns: -1 if a < b, 0 if a == b, 1 if a > b
*/
const lexicographicallyCompareBytes = (a, b) => {
	const minLen = Math.min(a.length, b.length);
	for (let i = 0; i < minLen; i++) {
		const aVal = a[i];
		const bVal = b[i];
		if (aVal === void 0 || bVal === void 0) throw CborError.custom("Unexpected undefined byte in array");
		if (aVal < bVal) return -1;
		if (aVal > bVal) return 1;
	}
	if (a.length < b.length) return -1;
	if (a.length > b.length) return 1;
	return 0;
};
/**
* A map keyed by encoded CBOR key bytes, kept in canonical (lexicographic)
* byte order.
*
* dCBOR needs exactly one specialised container: keys are the encoded bytes of
* a CBOR value, and the map must iterate in ascending lexicographic byte order
* (that ordering is the deterministic wire contract). This is a thin,
* dependency-free structure over a sorted array with binary-search insertion -
* it gives the exact ordering dCBOR requires, and lets the decode hot path
* append in O(1) since canonical input already arrives sorted.
*
* @module sorted-byte-map
*/
var SortedByteMap = class {
	items = [];
	/** Number of entries. */
	get size() {
		return this.items.length;
	}
	/**
	* Binary search for `key`. Returns the index of an exact match, or the
	* negative value `-(insertionPoint) - 1` when absent, so a single search both
	* tests membership and locates where an insert would go (Java
	* `Arrays.binarySearch` convention).
	*/
	indexOf(key) {
		let lo = 0;
		let hi = this.items.length - 1;
		while (lo <= hi) {
			const mid = lo + hi >>> 1;
			const cmp = lexicographicallyCompareBytes(this.items[mid].key, key);
			if (cmp < 0) lo = mid + 1;
			else if (cmp > 0) hi = mid - 1;
			else return mid;
		}
		return -(lo + 1);
	}
	/** Insert or replace the entry for `key`. */
	set(key, value) {
		const i = this.indexOf(key);
		if (i >= 0) this.items[i] = {
			key,
			value
		};
		else this.items.splice(-i - 1, 0, {
			key,
			value
		});
	}
	/**
	* Append an entry whose key is strictly greater than every existing key.
	* Used by canonical decode, where keys arrive already sorted; the caller must
	* guarantee the ordering (this skips the search + shift that {@link set} does).
	*/
	appendGreatest(key, value) {
		this.items.push({
			key,
			value
		});
	}
	/** The value for `key`, or `undefined` if absent. */
	get(key) {
		const i = this.indexOf(key);
		return i >= 0 ? this.items[i].value : void 0;
	}
	/** Whether `key` is present. */
	has(key) {
		return this.indexOf(key) >= 0;
	}
	/** Remove `key`; returns whether it was present. */
	delete(key) {
		const i = this.indexOf(key);
		if (i < 0) return false;
		this.items.splice(i, 1);
		return true;
	}
	/** The greatest key currently stored (ascending order), or `undefined`. */
	maxKey() {
		const n = this.items.length;
		return n > 0 ? this.items[n - 1].key : void 0;
	}
	/**
	* The key at position `i` in ascending key order. Positional access lets
	* two maps be walked in lockstep, and a single map be encoded, without
	* materializing an entries array; the caller keeps `i` within `[0, size)`.
	*/
	keyAt(i) {
		return this.items[i].key;
	}
	/** The value at position `i` in ascending key order (see {@link keyAt}). */
	valueAt(i) {
		return this.items[i].value;
	}
	/** Map over each value (with its key) in ascending key order. */
	map(fn) {
		return this.items.map((e) => fn(e.value, e.key));
	}
};
/**
* Numeric boundary contract and helpers.
*
* ## The `number` / `bigint` contract
*
* dCBOR integers span `[-(2^64), 2^64)`, which exceeds JavaScript's safe
* integer range (`±(2^53 − 1)`). The rule is:
*
* - An integer that fits in the IEEE-754 **safe** range is represented as a
*   `number`; anything larger (in magnitude) is a `bigint`.
* - Decoding returns the **narrowest exact** representation via
*   {@link narrowInteger}, so small values are ergonomic `number`s and large
*   ones remain lossless `bigint`s.
* - Encoding accepts either at the public edge and normalises once.
*
* The integer range constants and the saturating float casts live here.
*
* @module numeric
*/
/** `BigInt(Number.MAX_SAFE_INTEGER)` - largest integer exact as a `number`. */
const SAFE_MAX_BIG = BigInt(Number.MAX_SAFE_INTEGER);
/** `BigInt(Number.MIN_SAFE_INTEGER)`. */
const SAFE_MIN_BIG = BigInt(Number.MIN_SAFE_INTEGER);
/** Smallest dCBOR-encodable integer: −(2^64). */
const CBOR_INT_MIN = -(1n << 64n);
/**
* Return the narrowest exact representation of an integer: a `number` when it
* fits the safe-integer range, otherwise the `bigint` unchanged. This is the
* canonical way to hand an integer back to callers.
*/
const narrowInteger = (value) => value >= SAFE_MIN_BIG && value <= SAFE_MAX_BIG ? Number(value) : value;
/**
* A growable output buffer for encoding.
*
* The encoder writes a whole CBOR tree into a single `BufWriter` rather than
* allocating a fresh `Uint8Array` per node and concatenating them (which
* re-copies every subtree at every level): one buffer, geometric growth, one
* final right-sized copy.
*
* @module buf-writer
*/
var BufWriter = class {
	buf;
	view;
	pos = 0;
	constructor(initialCapacity = 64) {
		this.buf = new Uint8Array(initialCapacity);
		this.view = new DataView(this.buf.buffer);
	}
	/** Number of bytes written so far. */
	get length() {
		return this.pos;
	}
	/** Grow the backing store so at least `extra` more bytes fit. */
	ensure(extra) {
		const needed = this.pos + extra;
		if (needed <= this.buf.length) return;
		let capacity = this.buf.length * 2;
		while (capacity < needed) capacity *= 2;
		const next = new Uint8Array(capacity);
		next.set(this.buf.subarray(0, this.pos));
		this.buf = next;
		this.view = new DataView(next.buffer);
	}
	writeByte(byte) {
		this.ensure(1);
		this.buf[this.pos] = byte;
		this.pos += 1;
	}
	writeUint16(value) {
		this.ensure(2);
		this.view.setUint16(this.pos, value, false);
		this.pos += 2;
	}
	writeUint32(value) {
		this.ensure(4);
		this.view.setUint32(this.pos, value, false);
		this.pos += 4;
	}
	writeBigUint64(value) {
		this.ensure(8);
		this.view.setBigUint64(this.pos, value, false);
		this.pos += 8;
	}
	writeBytes(bytes) {
		this.ensure(bytes.length);
		this.buf.set(bytes, this.pos);
		this.pos += bytes.length;
	}
	/** Return the written region as a right-sized copy. */
	toBytes() {
		return this.buf.slice(0, this.pos);
	}
};
const typeBits = (t) => {
	return t << 5;
};
/**
* Write a CBOR head (major type + argument) straight into `writer`, avoiding
* the intermediate `Uint8Array` that {@link encodeVarInt} allocates. This is
* the encoder hot path (every node emits a head). It must stay byte-identical
* to {@link encodeVarInt}; the golden vectors cover both.
*/
const writeVarInt = (writer, value, majorType) => {
	if (value < 0) throw CborError.outOfRange();
	if (typeof value === "number" && hasFractionalPart(value)) throw CborError.outOfRange();
	const type = typeBits(majorType);
	if (isCborNumber(value) && value <= Number.MAX_SAFE_INTEGER) {
		const n = Number(value);
		if (n <= 23) writer.writeByte(n | type);
		else if (n <= 255) {
			writer.writeByte(24 | type);
			writer.writeByte(n);
		} else if (n <= 65535) {
			writer.writeByte(25 | type);
			writer.writeUint16(n);
		} else if (n <= 4294967295) {
			writer.writeByte(26 | type);
			writer.writeUint32(n);
		} else {
			writer.writeByte(27 | type);
			writer.writeBigUint64(BigInt(n));
		}
	} else {
		const big = BigInt(value);
		if (big > 18446744073709551615n) throw CborError.outOfRange();
		writer.writeByte(27 | type);
		writer.writeBigUint64(big);
	}
};
/**
* Encode a CBOR head (major type + argument) in its shortest form.
*
* @throws {CborError} `OutOfRange` for a negative, fractional, or
*   above-u64 argument.
*/
const encodeVarInt = (value, majorType) => {
	if (value < 0) throw CborError.outOfRange();
	if (typeof value === "number" && hasFractionalPart(value)) throw CborError.outOfRange();
	const type = typeBits(majorType);
	if (isCborNumber(value) && value <= Number.MAX_SAFE_INTEGER) {
		value = Number(value);
		if (value <= 23) return new Uint8Array([value | type]);
		else if (value <= 255) return new Uint8Array([24 | type, value]);
		else if (value <= 65535) {
			const buffer = /* @__PURE__ */ new ArrayBuffer(3);
			const view = new DataView(buffer);
			view.setUint8(0, 25 | type);
			view.setUint16(1, value);
			return new Uint8Array(buffer);
		} else if (value <= 4294967295) {
			const buffer = /* @__PURE__ */ new ArrayBuffer(5);
			const view = new DataView(buffer);
			view.setUint8(0, 26 | type);
			view.setUint32(1, value);
			return new Uint8Array(buffer);
		} else {
			const buffer = /* @__PURE__ */ new ArrayBuffer(9);
			const view = new DataView(buffer);
			view.setUint8(0, 27 | type);
			view.setBigUint64(1, BigInt(value));
			return new Uint8Array(buffer);
		}
	} else {
		const big = BigInt(value);
		if (big > 18446744073709551615n) throw CborError.outOfRange();
		const buffer = /* @__PURE__ */ new ArrayBuffer(9);
		const view = new DataView(buffer);
		view.setUint8(0, 27 | type);
		view.setBigUint64(1, big);
		return new Uint8Array(buffer);
	}
};
const hasFract = (n) => {
	return n % 1 !== 0;
};
/**
* Shared float→integer exactness gate for every `Exact<Int>.exactFromF*`. A
* float is an exact integer of a width iff it is finite, whole, and inside that
* width's exclusive `(loEx, hiEx)` bounds (use ±Infinity to skip a side). The
* bounds encode the per-width / per-source-precision limits. The three typed
* wrappers below shape the truncated result.
*/
const isExactIntFloat = (source, loEx, hiEx) => Number.isFinite(source) && source > loEx && source < hiEx && !hasFract(source);
/** float → small integer (`number`). */
const intFromFloatNum = (source, loEx, hiEx) => isExactIntFloat(source, loEx, hiEx) ? Math.trunc(source) : void 0;
/** float → 64-bit integer (`number` if safe, else `bigint`). */
const intFromFloatNarrow = (source, loEx, hiEx) => isExactIntFloat(source, loEx, hiEx) ? narrowInteger(BigInt(Math.trunc(source))) : void 0;
/** float → 128-bit integer (`bigint`). */
const intFromFloatBig = (source, loEx, hiEx) => isExactIntFloat(source, loEx, hiEx) ? BigInt(Math.trunc(source)) : void 0;
/**
* Exact conversions for i128 (JavaScript bigint).
*/
var ExactI128 = class {
	static MIN = -(2n ** 127n);
	static MAX = 2n ** 127n - 1n;
	static exactFromF16(source) {
		return intFromFloatBig(source, -Infinity, Infinity);
	}
	static exactFromF32(source) {
		return intFromFloatBig(source, -Infinity, Infinity);
	}
	static exactFromF64(source) {
		return intFromFloatBig(source, -Infinity, Infinity);
	}
	static exactFromU64(source) {
		return BigInt(source);
	}
	static exactFromI64(source) {
		return BigInt(source);
	}
	static exactFromU128(source) {
		if (source > 2n ** 127n - 1n) return void 0;
		return source;
	}
	static exactFromI128(source) {
		return source;
	}
};
/**
* Exact conversions for u16 (0 to 65535).
*/
var ExactU16 = class {
	static MIN = 0;
	static MAX = 65535;
	static exactFromF16(source) {
		return intFromFloatNum(source, -1, Infinity);
	}
	static exactFromF32(source) {
		return intFromFloatNum(source, -1, 65536);
	}
	static exactFromF64(source) {
		return intFromFloatNum(source, -1, 65536);
	}
	static exactFromU64(source) {
		const n = typeof source === "bigint" ? Number(source) : source;
		if (n > 65535) return void 0;
		return n;
	}
	static exactFromI64(source) {
		const n = typeof source === "bigint" ? Number(source) : source;
		if (n < 0 || n > 65535) return void 0;
		return n;
	}
	static exactFromU128(source) {
		if (source > 65535n) return void 0;
		return Number(source);
	}
	static exactFromI128(source) {
		if (source < 0n || source > 65535n) return void 0;
		return Number(source);
	}
};
/**
* Exact conversions for u32 (0 to 4294967295).
*/
var ExactU32 = class {
	static MIN = 0;
	static MAX = 4294967295;
	static exactFromF16(source) {
		return intFromFloatNum(source, -1, Infinity);
	}
	static exactFromF32(source) {
		return intFromFloatNum(source, -1, 4294967296);
	}
	static exactFromF64(source) {
		return intFromFloatNum(source, -1, 4294967296);
	}
	static exactFromU64(source) {
		const n = typeof source === "bigint" ? Number(source) : source;
		if (n > 4294967295) return void 0;
		return n;
	}
	static exactFromI64(source) {
		const n = typeof source === "bigint" ? Number(source) : source;
		if (n < 0 || n > 4294967295) return void 0;
		return n;
	}
	static exactFromU128(source) {
		if (source > 4294967295n) return void 0;
		return Number(source);
	}
	static exactFromI128(source) {
		if (source < 0n || source > 4294967295n) return void 0;
		return Number(source);
	}
};
/**
* Exact conversions for u64 (0 to 18446744073709551615).
*/
var ExactU64 = class {
	static MIN = 0n;
	static MAX = 18446744073709551615n;
	static exactFromF16(source) {
		return intFromFloatNarrow(source, -1, Infinity);
	}
	static exactFromF32(source) {
		return intFromFloatNarrow(source, -1, 0x10000000000000000);
	}
	static exactFromF64(source) {
		return intFromFloatNarrow(source, -1, 0x10000000000000000);
	}
	static exactFromU64(source) {
		return source;
	}
	static exactFromI64(source) {
		if ((typeof source === "bigint" ? source : BigInt(source)) < 0n) return void 0;
		return source;
	}
	static exactFromU128(source) {
		if (source > 18446744073709551615n) return void 0;
		return narrowInteger(source);
	}
	static exactFromI128(source) {
		if (source < 0n || source > 18446744073709551615n) return void 0;
		return narrowInteger(source);
	}
};
/**
* Float encoding and conversion utilities for dCBOR.
*
* The dCBOR canonical encoding rules for floating point values:
*
* - Numeric reduction: a float with zero fractional part in
*   [-2^64, 2^64-1] is encoded as an integer (42.0 becomes 42)
* - Other values use the smallest width (f16, f32, f64) that preserves them
* - Every NaN is encoded as the single representation 0xf97e00
* - Positive and negative infinity are encoded as half-precision floats
*
* @module float
*/
/**
* Canonical NaN representation in CBOR: 0xf97e00
*/
const CBOR_NAN = new Uint8Array([
	249,
	126,
	0
]);
/**
* Check if a number has a fractional part.
*/
const hasFractionalPart = (n) => n !== Math.floor(n);
/**
* Read a big-endian IEEE-754 double from the first 8 bytes of `data`.
* @internal
*/
const binary64ToNumber = (data) => new DataView(data.buffer, data.byteOffset, data.byteLength).getFloat64(0, false);
/**
* Encode a number as 4 big-endian bytes of an IEEE-754 single (f32).
*/
const numberToBinary32 = (n) => {
	const data = /* @__PURE__ */ new Uint8Array(4);
	new DataView(data.buffer).setFloat32(0, n, false);
	return data;
};
/**
* Read a big-endian IEEE-754 single (f32) from the first 4 bytes of `data`.
*/
const binary32ToNumber = (data) => new DataView(data.buffer, data.byteOffset, data.byteLength).getFloat32(0, false);
const f32ScratchView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(4));
/**
* Compute the 16-bit pattern of the IEEE-754 half-precision value nearest `n`,
* rounding ties to even.
*
* A value is only stored as a half after the round-trip probe
* (`binary16ToNumber(numberToBinary16(n)) === n`) succeeds, so stored values
* never round; the rounding makes that probe, and the reference's
* `f16::from_f32` in `validateCanonicalF32`, answer correctly for any input.
*/
const float16Bits = (n) => {
	f32ScratchView.setFloat32(0, n, false);
	const f = f32ScratchView.getUint32(0, false);
	const sign = f >>> 16 & 32768;
	const exp = f >>> 23 & 255;
	const mant = f & 8388607;
	if (exp === 255) return sign | (mant !== 0 ? 32256 : 31744);
	const e = exp - 127 + 15;
	if (e >= 31) return sign | 31744;
	if (e <= 0) {
		if (e < -10) return sign;
		const significand = mant | 8388608;
		const shift = 14 - e;
		let result = significand >>> shift;
		const remainder = significand & (1 << shift) - 1;
		const halfway = 1 << shift - 1;
		if (remainder > halfway || remainder === halfway && (result & 1) === 1) result += 1;
		return sign | result;
	}
	let fraction = mant >>> 13;
	const remainder = mant & 8191;
	let exponent = e;
	if (remainder > 4096 || remainder === 4096 && (fraction & 1) === 1) {
		fraction += 1;
		if (fraction === 1024) {
			fraction = 0;
			exponent += 1;
			if (exponent >= 31) return sign | 31744;
		}
	}
	return sign | exponent << 10 | fraction;
};
/**
* Encode a number as 2 big-endian bytes of an IEEE-754 half (f16).
*/
const numberToBinary16 = (n) => {
	const bits = float16Bits(n);
	return new Uint8Array([bits >> 8 & 255, bits & 255]);
};
/**
* Read a big-endian IEEE-754 half (f16) from the first 2 bytes of `data`.
*/
const binary16ToNumber = (data) => {
	const bits = data[0] << 8 | data[1];
	const sign = (bits & 32768) !== 0 ? -1 : 1;
	const exponent = bits >> 10 & 31;
	const fraction = bits & 1023;
	if (exponent === 0) return sign * fraction * 2 ** -24;
	if (exponent === 31) return fraction !== 0 ? NaN : sign * Infinity;
	return sign * (1 + fraction / 1024) * 2 ** (exponent - 15);
};
/**
* Encode f64 value to CBOR data bytes.
* Implements numeric reduction and canonical encoding rules.
* @internal
*/
const f64CborData = (value) => {
	const n = value;
	const f32Bytes = numberToBinary32(n);
	const f = binary32ToNumber(f32Bytes);
	if (f === n) return f32CborData(f);
	if (n < 0) {
		const i128 = ExactI128.exactFromF64(n);
		if (i128 !== void 0) {
			const i = ExactU64.exactFromI128(-1n - i128);
			if (i !== void 0) return encodeVarInt(i, MajorType.Negative);
		}
	}
	const u = ExactU64.exactFromF64(n);
	if (u !== void 0) return encodeVarInt(u, MajorType.Unsigned);
	if (Number.isNaN(value)) return CBOR_NAN;
	const buffer = /* @__PURE__ */ new ArrayBuffer(8);
	new DataView(buffer).setFloat64(0, n, false);
	const bytes = new Uint8Array(buffer);
	return new Uint8Array([251, ...bytes]);
};
/**
* Encode f32 value to CBOR data bytes.
* Implements numeric reduction and canonical encoding rules.
* @internal
*/
const f32CborData = (value) => {
	const n = value;
	const f16Bytes = numberToBinary16(n);
	const f = binary16ToNumber(f16Bytes);
	if (f === n) return f16CborData(f);
	if (n < 0) {
		const u = ExactU64.exactFromF32(Math.fround(-1 - n));
		if (u !== void 0) return encodeVarInt(u, MajorType.Negative);
	}
	const u = ExactU32.exactFromF32(n);
	if (u !== void 0) return encodeVarInt(u, MajorType.Unsigned);
	if (Number.isNaN(value)) return CBOR_NAN;
	const bytes = numberToBinary32(n);
	return new Uint8Array([250, ...bytes]);
};
/**
* Encode f16 value to CBOR data bytes.
* Implements numeric reduction and canonical encoding rules.
* @internal
*/
const f16CborData = (value) => {
	const n = value;
	if (n < 0) {
		const u = ExactU64.exactFromF64(-1 - n);
		if (u !== void 0) return encodeVarInt(u, MajorType.Negative);
	}
	const u = ExactU16.exactFromF64(n);
	if (u !== void 0) return encodeVarInt(u, MajorType.Unsigned);
	if (Number.isNaN(value)) return CBOR_NAN;
	const bytes = numberToBinary16(value);
	return new Uint8Array([249, ...bytes]);
};
const TWO_POW_63 = 2 ** 63;
/**
* Rust `n as i64 as f64`: NaN → 0; saturates at the i64 bounds. `i64::MAX`
* (2^63 - 1) is not a double, so the saturated image converts back to 2^63,
* and every double at or above 2^63 saturates to it.
*/
const saturatingI64AsF64 = (n) => {
	if (Number.isNaN(n)) return 0;
	if (n >= TWO_POW_63) return TWO_POW_63;
	if (n <= -TWO_POW_63) return -TWO_POW_63;
	return Math.trunc(n);
};
/** Rust `n as i32 as f32` for an f32 value: NaN → 0; saturates at the i32 bounds. */
const saturatingI32AsF32 = (n) => {
	if (Number.isNaN(n)) return 0;
	if (n >= 2147483647) return Math.fround(2147483647);
	if (n <= -2147483648) return -2147483648;
	return Math.fround(Math.trunc(n));
};
/**
* `validate_canonical_f16`: a half head is non-canonical when it is
* whole-valued (must be an integer) or a NaN other than `0x7e00`.
* @internal
*/
const validateCanonicalF16 = (bits, n) => {
	if (n === saturatingI64AsF64(n) || Number.isNaN(n) && bits !== 32256) throw CborError.nonCanonicalNumeric();
};
/**
* `validate_canonical_f32`: a single head is non-canonical when it fits a half
* (including ±0 and ±Infinity), equals its saturating `i32` image, or is NaN.
* @internal
*/
const validateCanonicalF32 = (n) => {
	if (n === binary16ToNumber(numberToBinary16(n)) || n === saturatingI32AsF32(n) || Number.isNaN(n)) throw CborError.nonCanonicalNumeric();
};
/**
* `validate_canonical_f64`: a double head is non-canonical when it fits a
* single, equals its saturating `i64` image, or is NaN.
* @internal
*/
const validateCanonicalF64 = (n) => {
	if (n === Math.fround(n) || n === saturatingI64AsF64(n) || Number.isNaN(n)) throw CborError.nonCanonicalNumeric();
};
const unsignedNode = (value) => ({
	isCbor: true,
	type: MajorType.Unsigned,
	value
});
const negativeNode = (magnitude) => ({
	isCbor: true,
	type: MajorType.Negative,
	value: magnitude
});
const floatNode = (value) => ({
	isCbor: true,
	type: MajorType.Simple,
	value: {
		type: "Float",
		value
	}
});
/** `From<f16> for CBOR`. @internal */
const cborNodeFromF16 = (n) => {
	if (n < 0) {
		const i = ExactU64.exactFromF64(-1 - n);
		if (i !== void 0) return negativeNode(i);
	}
	const u = ExactU16.exactFromF64(n);
	if (u !== void 0) return unsignedNode(u);
	return floatNode(n);
};
/**
* `From<f32> for CBOR`. The negative magnitude is computed in f32 arithmetic
* (`-1f32 - n`): `Math.fround(-1 - n)` is exactly that, since a double holds
* the difference of two singles with at most one rounding.
* @internal
*/
const cborNodeFromF32 = (n) => {
	if (n < 0) {
		const i = ExactU64.exactFromF32(Math.fround(-1 - n));
		if (i !== void 0) return negativeNode(i);
	}
	const u = ExactU32.exactFromF32(n);
	if (u !== void 0) return unsignedNode(u);
	return floatNode(n);
};
/** `From<f64> for CBOR`. @internal */
const cborNodeFromF64 = (n) => {
	if (n < 0) {
		const i128 = ExactI128.exactFromF64(n);
		if (i128 !== void 0) {
			const i = ExactU64.exactFromI128(-1n - i128);
			if (i !== void 0) return negativeNode(i);
		}
	}
	const u = ExactU64.exactFromF64(n);
	if (u !== void 0) return unsignedNode(u);
	return floatNode(n);
};
/**
* Shortest round-trip decimal digits of a finite positive double, as the pair
* (significant digits without trailing zeros, scientific exponent), where the
* value is `d1.d2…dk × 10^exp10`.
*
* `String(x)` already yields the shortest digit string; this only re-shapes
* it (ECMAScript picks between "123.45", "1.5e-7", "1e+21" and "0.000001" by
* magnitude) so the caller can apply Rust's notation rules.
*/
const shortestDigits = (abs) => {
	const text = String(abs);
	const eIndex = text.indexOf("e");
	const mantissa = eIndex === -1 ? text : text.slice(0, eIndex);
	const exponent = eIndex === -1 ? 0 : Number(text.slice(eIndex + 1));
	const dot = mantissa.indexOf(".");
	let digits = dot === -1 ? mantissa : mantissa.slice(0, dot) + mantissa.slice(dot + 1);
	let pointPos = dot === -1 ? mantissa.length : dot;
	while (digits.length > 1 && digits.startsWith("0")) {
		digits = digits.slice(1);
		pointPos--;
	}
	digits = digits.replace(/0+$/, "");
	if (digits === "") digits = "0";
	return {
		digits,
		exp10: pointPos - 1 + exponent
	};
};
/** The exact value of a finite positive double as `mantissa × 2^exp2`. */
const exactBinary = (abs) => {
	const view = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
	view.setFloat64(0, abs, false);
	const hi = view.getUint32(0, false);
	const lo = view.getUint32(4, false);
	const biasedExp = hi >>> 20 & 2047;
	const fraction = BigInt(hi & 1048575) << 32n | BigInt(lo);
	return biasedExp === 0 ? {
		mantissa: fraction,
		exp2: -1074
	} : {
		mantissa: fraction | 1n << 52n,
		exp2: biasedExp - 1075
	};
};
/**
* The exact decimal expansion of a finite positive double, as its significant
* digits (no trailing zeros). Every double is a dyadic rational, so
* `m × 2^q = m × 5^-q / 10^-q` for negative `q` gives the digits exactly.
*/
const exactDecimalDigits = (abs) => {
	const { mantissa, exp2 } = exactBinary(abs);
	return (exp2 >= 0 ? mantissa << BigInt(exp2) : mantissa * 5n ** BigInt(-exp2)).toString().replace(/0+$/, "");
};
/**
* Shortest round-trip digits the way Rust's `{:?}` produces them.
*
* JS and Rust agree on the shortest digit string except when the exact value
* sits precisely halfway between the two shortest candidates: ECMAScript
* (`Number::toString`) picks the even candidate, Rust's `flt2dec` rounds the
* magnitude up. `10 × 2^-24` is exactly `5.9604644775390625e-7`, which JS
* prints as `…062e-7` and Rust as `…063e-7`. Detect the tie exactly and take
* the upper candidate when it also round-trips.
*/
const rustShortestDigits = (abs) => {
	const shortest = shortestDigits(abs);
	const k = shortest.digits.length;
	const probe = abs.toPrecision(k + 1);
	const probeIndex = probe.indexOf("e");
	if (!(probeIndex === -1 ? probe : probe.slice(0, probeIndex)).endsWith("5")) return shortest;
	const exact = exactDecimalDigits(abs);
	if (exact.length !== k + 1 || !exact.endsWith("5")) return shortest;
	let upper = (BigInt(exact.slice(0, k)) + 1n).toString();
	let exp10 = shortest.exp10;
	if (upper.length > k) exp10 += 1;
	upper = upper.replace(/0+$/, "");
	if (upper === "") upper = "0";
	return Number(`${upper[0]}.${upper.slice(1)}e${exp10}`) === abs ? {
		digits: upper,
		exp10
	} : shortest;
};
/**
* Render a float to its diagnostic string, the reference's `Display for
* Simple` (`simple.rs`) - the rendering `diagnostic()` and `hexAnnotated()`
* use.
*
* Non-finite values print as `NaN`, `Infinity` and `-Infinity`, exactly as the
* reference's `Display` does - not the `inf`/`-inf` of Rust's `{:?}`, which is
* `Simple::name()`'s rendering and is ported as `simpleName` (`simple.ts`).
*
* Finite values match Rust's `{:?}` for `f64`: non-zero values with magnitude
* in [1e-4, 1e16) print in decimal with at least one fractional digit (whole
* values get a trailing `.0`); everything else prints in exponential form
* (`1.5e20`, `5e-324` - no `+`, no padding). Zero prints as `0.0`/`-0.0`.
* Digits are the shortest round-trip sequence, with exact decimal ties rounded
* up like Rust (see {@link rustShortestDigits}).
*/
const floatDisplayString = (value) => {
	if (Number.isNaN(value)) return "NaN";
	if (!Number.isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";
	if (value === 0) return Object.is(value, -0) ? "-0.0" : "0.0";
	const sign = value < 0 ? "-" : "";
	const { digits, exp10 } = rustShortestDigits(Math.abs(value));
	if (exp10 >= -4 && exp10 < 16) {
		if (exp10 < 0) return `${sign}0.${"0".repeat(-exp10 - 1)}${digits}`;
		const intLen = exp10 + 1;
		return `${sign}${digits.length >= intLen ? digits.slice(0, intLen) : digits.padEnd(intLen, "0")}.${digits.length > intLen ? digits.slice(intLen) : "0"}`;
	}
	return `${sign}${digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits}e${exp10}`;
};
/**
* UTF-8 validation failure description, mirroring `core::str::Utf8Error`.
*
* The decoder rejects malformed text with the WHATWG `TextDecoder` (fatal
* mode), whose error text is host-defined. To report the same message as the
* reference (`str::from_utf8` → `Utf8Error` → `Display`), the failing bytes
* are re-scanned here with a port of `core::str::validations::
* run_utf8_validation`, which yields the reference's `(valid_up_to,
* error_len)` pair.
*
* @module utf8
* @internal
*/
/**
* `core::str::validations::utf8_char_width`: the sequence length a lead byte
* announces, or 0 for a byte that can never start a sequence (a continuation
* byte `80-bf`, the overlong leads `c0`/`c1`, or `f5-ff`).
*/
const utf8CharWidth = (lead) => {
	if (lead < 128) return 1;
	if (lead < 194) return 0;
	if (lead < 224) return 2;
	if (lead < 240) return 3;
	if (lead < 245) return 4;
	return 0;
};
/** A byte that is not a UTF-8 continuation byte (`80-bf`). */
const isNotContinuation = (byte) => byte < 128 || byte > 191;
/**
* Locate the first UTF-8 error in `bytes` the way `run_utf8_validation`
* does, or return `undefined` when the bytes are valid.
*
* `validUpTo` is the index of the offending lead byte. `errorLength` is the
* number of bytes to skip (1, 2 or 3) when an invalid byte is present, or
* `undefined` when the input ends inside a sequence. A present invalid byte
* always beats "incomplete": the continuation bytes are checked one at a
* time as they are read.
*/
const findUtf8Error = (bytes) => {
	const len = bytes.length;
	let index = 0;
	while (index < len) {
		const first = bytes[index];
		if (first < 128) {
			index++;
			continue;
		}
		const start = index;
		const next = () => {
			index++;
			return index < len ? bytes[index] : void 0;
		};
		const err = (errorLength) => ({
			validUpTo: start,
			errorLength
		});
		const width = utf8CharWidth(first);
		if (width === 2) {
			const b1 = next();
			if (b1 === void 0) return err(void 0);
			if (isNotContinuation(b1)) return err(1);
		} else if (width === 3) {
			const b1 = next();
			if (b1 === void 0) return err(void 0);
			if (!(first === 224 && b1 >= 160 && b1 <= 191 || first >= 225 && first <= 236 && b1 >= 128 && b1 <= 191 || first === 237 && b1 >= 128 && b1 <= 159 || first >= 238 && first <= 239 && b1 >= 128 && b1 <= 191)) return err(1);
			const b2 = next();
			if (b2 === void 0) return err(void 0);
			if (isNotContinuation(b2)) return err(2);
		} else if (width === 4) {
			const b1 = next();
			if (b1 === void 0) return err(void 0);
			if (!(first === 240 && b1 >= 144 && b1 <= 191 || first >= 241 && first <= 243 && b1 >= 128 && b1 <= 191 || first === 244 && b1 >= 128 && b1 <= 143)) return err(1);
			const b2 = next();
			if (b2 === void 0) return err(void 0);
			if (isNotContinuation(b2)) return err(2);
			const b3 = next();
			if (b3 === void 0) return err(void 0);
			if (isNotContinuation(b3)) return err(3);
		} else return err(1);
		index++;
	}
};
/**
* `Utf8Error`'s `Display` text for `bytes`, which must be invalid UTF-8:
* `invalid utf-8 sequence of N bytes from index I` or `incomplete utf-8 byte
* sequence from index I`.
*/
const utf8ErrorDescription = (bytes) => {
	const info = findUtf8Error(bytes);
	if (info === void 0) return "invalid utf-8 sequence";
	return info.errorLength === void 0 ? `incomplete utf-8 byte sequence from index ${info.validUpTo}` : `invalid utf-8 sequence of ${info.errorLength} bytes from index ${info.validUpTo}`;
};
const utf8Decoder = new TextDecoder("utf-8", {
	fatal: true,
	ignoreBOM: true
});
/**
* A forward-only cursor over the input bytes.
*
* Decoding advances a single `pos` through one shared `DataView` rather than
* slicing a fresh sub-view per nested item and threading a consumed-length back
* up the recursion. Every read is bounds-checked against the remaining bytes.
*/
var ByteReader = class {
	view;
	pos = 0;
	constructor(data) {
		this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	}
	get byteLength() {
		return this.view.byteLength;
	}
	get remaining() {
		return this.view.byteLength - this.pos;
	}
	/** Read the byte at `offset` relative to the current position (no advance). */
	peek(offset) {
		return this.view.getUint8(this.pos + offset);
	}
	/** Advance the cursor by `count` bytes. */
	advance(count) {
		this.pos += count;
	}
	/** A zero-copy view of `len` bytes at the given absolute offset. */
	bytesAt(offset, len) {
		return new Uint8Array(this.view.buffer, this.view.byteOffset + offset, len);
	}
};
/**
* Decode a single dCBOR item from `data`, enforcing every deterministic
* encoding rule (canonical numeric forms, NFC text, map-key order, no
* trailing bytes). Throws {@link CborError} on any violation.
*
* @example
* ```typescript
* const value = decodeCbor(hexToBytes("a1616101")); // {"a": 1}
* expectMap(value).size; // 1
* ```
*
* @throws {CborError} `Underrun` | `UnsupportedHeaderValue` |
*   `NonCanonicalNumeric` | `InvalidSimpleValue` | `InvalidUtf8` |
*   `NonCanonicalString` | `UnusedData` | `MisorderedMapKey` |
*   `DuplicateMapKey` - see {@link CborErrorDetailsByCode}.
* @public
*
* @remarks Decoded byte strings are zero-copy views aliasing the input
* buffer - mutating the input after decoding (or mutating the returned
* bytes) changes the other side. Call `.slice()` first if you need an
* independent copy.
*/
function decodeCbor(data) {
	const reader = new ByteReader(data);
	const cbor = readCbor(reader);
	const remaining = reader.byteLength - reader.pos;
	if (remaining !== 0) throw CborError.unusedData(remaining);
	return cbor;
}
function parseHeader(header) {
	return {
		majorType: header >> 5,
		headerValue: header & 31
	};
}
/**
* Read a CBOR head (major type + argument) at the cursor, advancing past it.
* `varIntLen` is the head length (1/2/3/5/9); the argument value is validated
* for canonical minimal-length encoding.
*/
function readHeaderVarint(reader) {
	if (reader.remaining < 1) throw CborError.underrun();
	const header = reader.peek(0);
	const { majorType, headerValue } = parseHeader(header);
	const dataRemaining = reader.remaining - 1;
	let value;
	let varIntLen;
	if (headerValue <= 23) {
		value = headerValue;
		varIntLen = 1;
	} else if (headerValue === 24) {
		if (dataRemaining < 1) throw CborError.underrun();
		value = reader.peek(1);
		if (value < 24) throw CborError.nonCanonicalNumeric();
		varIntLen = 2;
	} else if (headerValue === 25) {
		if (dataRemaining < 2) throw CborError.underrun();
		value = (reader.peek(1) << 8 | reader.peek(2)) >>> 0;
		if (value <= 255 && header !== 249) throw CborError.nonCanonicalNumeric();
		varIntLen = 3;
	} else if (headerValue === 26) {
		if (dataRemaining < 4) throw CborError.underrun();
		value = (reader.peek(1) << 24 | reader.peek(2) << 16 | reader.peek(3) << 8 | reader.peek(4)) >>> 0;
		if (value <= 65535 && header !== 250) throw CborError.nonCanonicalNumeric();
		varIntLen = 5;
	} else if (headerValue === 27) {
		if (dataRemaining < 8) throw CborError.underrun();
		const a = BigInt(reader.peek(1)) << 56n;
		const b = BigInt(reader.peek(2)) << 48n;
		const c = BigInt(reader.peek(3)) << 40n;
		const d = BigInt(reader.peek(4)) << 32n;
		const e = BigInt(reader.peek(5)) << 24n;
		const f = BigInt(reader.peek(6)) << 16n;
		const g = BigInt(reader.peek(7)) << 8n;
		const h = BigInt(reader.peek(8));
		value = narrowInteger(a | b | c | d | e | f | g | h);
		if (value <= 4294967295 && header !== 251) throw CborError.nonCanonicalNumeric();
		varIntLen = 9;
	} else throw CborError.unsupportedHeaderValue(headerValue);
	reader.advance(varIntLen);
	return {
		majorType,
		value,
		varIntLen
	};
}
function readCbor(reader) {
	if (reader.remaining < 1) throw CborError.underrun();
	const headStart = reader.pos;
	const { majorType, value, varIntLen } = readHeaderVarint(reader);
	switch (majorType) {
		case MajorType.Unsigned: {
			const cbor = attachMethods({
				isCbor: true,
				type: MajorType.Unsigned,
				value
			});
			checkCanonicalEncoding(cbor, reader.bytesAt(headStart, varIntLen));
			return cbor;
		}
		case MajorType.Negative: {
			const cbor = attachMethods({
				isCbor: true,
				type: MajorType.Negative,
				value
			});
			checkCanonicalEncoding(cbor, reader.bytesAt(headStart, varIntLen));
			return cbor;
		}
		case MajorType.ByteString: {
			if (typeof value === "bigint") throw CborError.underrun();
			if (reader.remaining < value) throw CborError.underrun();
			const bytes = reader.bytesAt(reader.pos, value);
			reader.advance(value);
			return attachMethods({
				isCbor: true,
				type: MajorType.ByteString,
				value: bytes
			});
		}
		case MajorType.Text: {
			if (typeof value === "bigint") throw CborError.underrun();
			if (reader.remaining < value) throw CborError.underrun();
			const textBytes = reader.bytesAt(reader.pos, value);
			reader.advance(value);
			let text;
			try {
				text = utf8Decoder.decode(textBytes);
			} catch {
				throw CborError.invalidUtf8(utf8ErrorDescription(textBytes));
			}
			if (text.normalize("NFC") !== text) throw CborError.nonCanonicalString();
			return attachMethods({
				isCbor: true,
				type: MajorType.Text,
				value: text
			});
		}
		case MajorType.Array: {
			const items = [];
			for (let i = 0; i < value; i++) items.push(readCbor(reader));
			return attachMethods({
				isCbor: true,
				type: MajorType.Array,
				value: items
			});
		}
		case MajorType.Map: {
			const map = new CborMap();
			for (let i = 0; i < value; i++) {
				const key = readCbor(reader);
				const val = readCbor(reader);
				map.setNext(key, val);
			}
			return attachMethods({
				isCbor: true,
				type: MajorType.Map,
				value: map
			});
		}
		case MajorType.Tagged: {
			const item = readCbor(reader);
			return attachMethods({
				isCbor: true,
				type: MajorType.Tagged,
				tag: value,
				value: item
			});
		}
		case MajorType.Simple: switch (varIntLen) {
			case 3: {
				const f = binary16ToNumber(reader.bytesAt(headStart + 1, 2));
				validateCanonicalF16(Number(value), f);
				return attachMethods(cborNodeFromF16(f));
			}
			case 5: {
				const f = binary32ToNumber(reader.bytesAt(headStart + 1, 4));
				validateCanonicalF32(f);
				return attachMethods(cborNodeFromF32(f));
			}
			case 9: {
				const f = binary64ToNumber(reader.bytesAt(headStart + 1, 8));
				validateCanonicalF64(f);
				return attachMethods(cborNodeFromF64(f));
			}
			default: switch (value) {
				case 20: return attachMethods({
					isCbor: true,
					type: MajorType.Simple,
					value: { type: "False" }
				});
				case 21: return attachMethods({
					isCbor: true,
					type: MajorType.Simple,
					value: { type: "True" }
				});
				case 22: return attachMethods({
					isCbor: true,
					type: MajorType.Simple,
					value: { type: "Null" }
				});
				default: throw CborError.invalidSimpleValue();
			}
		}
	}
}
function checkCanonicalEncoding(cbor, buf) {
	const buf2 = encodeCbor(cbor);
	if (!areBytesEqual(buf, buf2)) throw CborError.nonCanonicalNumeric();
}
/**
* Extract the native JavaScript value from a CBOR value, decoding it first
* when given bytes. Maps come back as `CborMap` and tagged values as `Cbor`
* (see {@link CborNative}).
*/
const extractCbor = (cbor) => {
	let c;
	if (cbor instanceof Uint8Array) c = decodeCbor(cbor);
	else c = cbor;
	switch (c.type) {
		case MajorType.Unsigned: return c.value;
		case MajorType.Negative: if (typeof c.value === "bigint") return -c.value - 1n;
		else return -c.value - 1;
		case MajorType.ByteString: return c.value;
		case MajorType.Text: return c.value;
		case MajorType.Array: return c.value.map(extractCbor);
		case MajorType.Map: return c.value;
		case MajorType.Tagged: return c;
		case MajorType.Simple: {
			const simple = c.value;
			switch (simple.type) {
				case "True": return true;
				case "False": return false;
				case "Null": return null;
				case "Float": return simple.value;
				default: return simple;
			}
		}
		default: return c;
	}
};
/**
* A deterministic CBOR map: maps with the same content encode identically,
* regardless of insertion order.
*
* - Entries are kept in lexicographic order of their encoded key bytes
* - Setting a key whose encoding is already present replaces that entry
* - Keys and values can be any type that can be converted to CBOR
*
* `CborMap` mirrors the JS `Map` protocol: `set`, `get`, `getOrThrow`, `has`,
* `delete`, `clear`, `size`, `keys()`, `values()`, `entries()`, `forEach`,
* iteration. `get` returns the stored `Cbor` node, like `entries()`; extract
* natives explicitly with `extractCbor(map.getOrThrow(k))`.
*
* @module map
*/
/**
* A deterministic CBOR map implementation.
*
* Maps are always encoded with keys sorted lexicographically by their
* encoded CBOR representation, ensuring deterministic encoding.
*/
var CborMap = class {
	/** Debug label: `Object.prototype.toString` reports `[object CborMap]`. */
	get [Symbol.toStringTag]() {
		return "CborMap";
	}
	_dict;
	/**
	* Creates a new, empty CBOR Map.
	* Optionally initializes from a JavaScript Map (every key and value must
	* itself be encodable).
	*/
	constructor(map) {
		this._dict = new SortedByteMap();
		if (map !== void 0) for (const [key, value] of map.entries()) this.set(key, value);
	}
	/**
	* Inserts a key-value pair into the map (replacing any entry whose key has
	* the same canonical encoding). Any insertion order is accepted - entries
	* are kept in canonical ascending encoded-key order.
	*
	* @example
	* ```typescript
	* const m = new CborMap();
	* m.set("z", 1);
	* m.set(10, "ten"); // sorts before "z" in the encoding
	* encodeCbor(m);    // deterministic regardless of insertion order
	* ```
	* @public
	*/
	set(key, value) {
		const keyCbor = cbor(key);
		const valueCbor = cbor(value);
		const keyData = encodeCbor(keyCbor);
		this._dict.set(keyData, {
			key: keyCbor,
			value: valueCbor
		});
	}
	_makeKey(key) {
		return encodeCbor(cbor(key));
	}
	/**
	* Get the stored `Cbor` node for a key, or `undefined` if absent.
	*
	* To read a native value, compose explicitly:
	*
	* ```typescript
	* asNumber(map.get("age"));          // number | undefined, checked
	* extractCbor(map.getOrThrow("age")); // CborNative, throws if absent
	* ```
	* @public
	*/
	get(key) {
		return this._dict.get(this._makeKey(key))?.value;
	}
	/**
	* Get the stored `Cbor` node for a key.
	*
	* @throws {CborError} `MissingMapKey` - the key is not present.
	*/
	getOrThrow(key) {
		const value = this.get(key);
		if (value === void 0) throw CborError.missingMapKey();
		return value;
	}
	delete(key) {
		const keyData = this._makeKey(key);
		const existed = this._dict.has(keyData);
		this._dict.delete(keyData);
		return existed;
	}
	has(key) {
		return this._dict.has(this._makeKey(key));
	}
	clear() {
		this._dict = new SortedByteMap();
	}
	/** The number of entries in the map. */
	get size() {
		return this._dict.size;
	}
	/**
	* Get the entries of the map as an array, sorted in canonical ascending
	* encoded-key order.
	*
	* @internal Public because the encoder, diagnostic formatter, and hex
	* annotator consume it cross-module; not part of the supported surface.
	*/
	get entriesArray() {
		return this._dict.map((value, _key) => ({
			key: value.key,
			value: value.value
		}));
	}
	/**
	* The stored entry at position `i` in canonical ascending encoded-key
	* order; the caller keeps `i` within `[0, size)`.
	*
	* @internal Positional access for the encoder and for structural equality,
	* which walk a map (or two maps in lockstep) without materializing
	* `entriesArray`; not part of the supported surface.
	*/
	entryAt(i) {
		return this._dict.valueAt(i);
	}
	/**
	* The encoded CBOR bytes of the key at position `i` - the bytes the entry
	* is sorted by, computed once when it was inserted.
	*
	* @internal The encoder writes these directly, as the reference's
	* `Map::cbor_data` writes its stored `MapKey`, instead of re-encoding the
	* key node; not part of the supported surface.
	*/
	encodedKeyAt(i) {
		return this._dict.keyAt(i);
	}
	/** Iterate keys in canonical (sorted encoded-key) order. */
	*keys() {
		for (const entry of this.entriesArray) yield entry.key;
	}
	/** Iterate values in canonical key order. */
	*values() {
		for (const entry of this.entriesArray) yield entry.value;
	}
	/**
	* Iterate `[key, value]` tuples in canonical key order (the JS
	* `Map.entries()` shape).
	*/
	*entries() {
		for (const entry of this.entriesArray) yield [entry.key, entry.value];
	}
	/** JS `Map.forEach` mirror (value first, then key, then the map). */
	forEach(callback, thisArg) {
		for (const entry of this.entriesArray) callback.call(thisArg, entry.value, entry.key, this);
	}
	*[Symbol.iterator]() {
		for (const entry of this.entriesArray) yield [entry.key, entry.value];
	}
	/**
	* Append a key-value pair whose encoded key must sort strictly after every
	* existing key.
	*
	* @internal The decoder's append path; not part of the supported surface.
	* @throws {CborError} `DuplicateMapKey` for a repeated key,
	*   `MisorderedMapKey` for a key out of ascending order.
	*/
	setNext(key, value) {
		const keyCbor = cbor(key);
		const newKey = encodeCbor(keyCbor);
		if (this._dict.has(newKey)) throw CborError.duplicateMapKey();
		const greatest = this._dict.maxKey();
		if (greatest !== void 0) {
			if (lexicographicallyCompareBytes(newKey, greatest) <= 0) throw CborError.misorderedMapKey();
		}
		this._dict.appendGreatest(newKey, {
			key: keyCbor,
			value: cbor(value)
		});
	}
	/**
	* Convert to a plain JavaScript `Map` of extracted native values.
	* Tagged values come back as `Cbor` nodes and nested maps as `CborMap`
	* (the {@link CborNative} asymmetries).
	*/
	toMap() {
		const map = /* @__PURE__ */ new Map();
		for (const entry of this.entriesArray) map.set(extractCbor(entry.key), extractCbor(entry.value));
		return map;
	}
};
/**
* Checks if the simple value is a floating point number.
*/
const isFloat = (simple) => simple.type === "Float";
/**
* Encodes the simple value to its raw CBOR byte representation.
*
* Returns the CBOR bytes that represent this simple value according to the
* dCBOR deterministic encoding rules:
* - `False` encodes as `0xf4`
* - `True` encodes as `0xf5`
* - `Null` encodes as `0xf6`
* - `Float` values reduce to an integer when whole, otherwise encode in the
*   shortest IEEE 754 width that preserves the value.
*/
const simpleCborData = (simple) => {
	switch (simple.type) {
		case "False": return encodeVarInt(20, MajorType.Simple);
		case "True": return encodeVarInt(21, MajorType.Simple);
		case "Null": return encodeVarInt(22, MajorType.Simple);
		case "Float": return f64CborData(simple.value);
	}
};
/**
* Compare two Simple values for equality.
*
* Two `Simple` values are equal if they're the same variant. For `Float`
* variants, the contained floating point values are compared for equality,
* with NaN values considered equal to each other.
*/
const simpleEquals = (a, b) => {
	if (a.type !== b.type) return false;
	switch (a.type) {
		case "False":
		case "True":
		case "Null": return true;
		case "Float": {
			if (!isFloat(b)) return false;
			const v1 = a.value;
			const v2 = b.value;
			return v1 === v2 || Number.isNaN(v1) && Number.isNaN(v2);
		}
	}
};
/**
* Hex encoding/decoding for byte arrays.
*
* The names deliberately match the platform's `Uint8Array.prototype.toHex` /
* `Uint8Array.fromHex` proposal, and both functions delegate to the native
* implementations when present.
*
* @module hex
*/
/** Feature-detected native `Uint8Array.fromHex` (ES proposal / Node >= 24). */
const nativeFromHex = Uint8Array.fromHex;
/**
* Convert bytes to a lowercase hex string.
*
* Delegates to the native `Uint8Array.prototype.toHex` where available.
*/
const bytesToHex$2 = (bytes) => {
	const native = bytes.toHex;
	if (typeof native === "function") return native.call(bytes);
	let out = "";
	for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
	return out;
};
/**
* Convert a hex string to bytes.
*
* **Whitespace tolerance.** ASCII whitespace is stripped before decoding so
* users can paste annotated hex dumps directly.
*
* **Validation.** After whitespace stripping, the input must have even length
* and contain only `[0-9a-fA-F]`; anything else throws `CborError` with code
* `Custom`.
*
* @throws {CborError} `Custom` - invalid hex string.
*/
const hexToBytes$3 = (hexString) => {
	const hex = hexString.replace(/\s/g, "");
	if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) throw CborError.custom("invalid hex string");
	if (nativeFromHex !== void 0) return nativeFromHex(hex);
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
	return bytes;
};
/**
* The dCBOR value core: the `Cbor` union type, the polymorphic constructor
* `cbor()`, the encoder entry `encodeCbor()`, and the tagged-value
* constructor `taggedValue()`.
*
* ## The API in one paragraph
*
* Construct with `cbor(input)` (the single polymorphic constructor) or
* `taggedValue(tag, content)` (the only explicit tagged-value constructor);
* custom types participate by implementing the one structural protocol
* `ToCbor { toCbor(): Cbor }`. Encode with `encodeCbor(value)`. Decode with
* `decodeCbor(bytes)` (throws) or `tryDecode(bytes)` (returns `Result`).
* Read with the free `isX`/`asX`/`expectX` accessor functions. The only
* instance conveniences on a `Cbor` value are `toData()`, `toHex()`, and a
* cheap `toString()`.
*
* @module cbor
*/
/**
* The instance methods shared by every `Cbor` value: exactly three cheap
* conveniences (plus debug symbols below). Everything else is a free function
* so decode-only bundles never carry the diagnostic formatter, hex annotator,
* tag store, or walker.
*
* `String(c)`/template literals/`console.log` produce `Cbor(0x…)`. Diagnostic
* rendering lives in `@blockchaincommons/dcbor/diagnostic`; opt-in diag-flavored debug
* output lives in `@blockchaincommons/dcbor/debug` (`installDebugHooks()`).
*/
const CBOR_METHODS = {
	toData() {
		return encodeCbor(this);
	},
	toHex() {
		return bytesToHex$2(encodeCbor(this));
	},
	toString() {
		return `Cbor(0x${bytesToHex$2(encodeCbor(this))})`;
	},
	[Symbol.toStringTag]: "Cbor",
	[Symbol.for("nodejs.util.inspect.custom")]() {
		return this.toString();
	}
};
/**
* Decorate a bare CBOR value (`{ isCbor, type, value[, tag] }`) with the shared
* instance methods. The methods live on {@link CBOR_METHODS} and are installed
* via the prototype - constructed with `Object.create` (not `setPrototypeOf`,
* which would drop the object off V8's fast path). Only the handful of data
* properties are own-properties; the methods are shared, not per-object.
*
* @internal
*/
const attachMethods = (obj) => {
	const decorated = Object.create(CBOR_METHODS);
	return Object.assign(decorated, obj);
};
const CBOR_FALSE = attachMethods({
	isCbor: true,
	type: MajorType.Simple,
	value: { type: "False" }
});
const CBOR_TRUE = attachMethods({
	isCbor: true,
	type: MajorType.Simple,
	value: { type: "True" }
});
const CBOR_NULL = attachMethods({
	isCbor: true,
	type: MajorType.Simple,
	value: { type: "Null" }
});
/**
* Structural CBOR value equality, the reference's `PartialEq for CBOR`
* (`cbor.rs`): two values are equal when they have the same major type and
* equal contents, compared recursively.
*
* This is not "encode to the same bytes": a float node whose value is whole
* (`Float(2.0)`, reachable through a bare node) encodes as the integer `2`
* but is not equal to the integer node; a text node keeps the string it was
* built from, so a decomposed `"é"` is not equal to the composed one although
* both encode composed. Integers compare by value across `number`/`bigint`;
* tags compare by value only (the carried name is ignored); NaN equals NaN;
* maps compare entry by entry in canonical key order, keys and values both
* structurally.
*
* Use this rather than `===` (which compares JS object references) when
* you need value equality across two `Cbor` instances built independently.
*/
const cborEquals$1 = (a, b) => {
	if (a === b) return true;
	switch (a.type) {
		case MajorType.Unsigned: return b.type === MajorType.Unsigned && BigInt(a.value) === BigInt(b.value);
		case MajorType.Negative: return b.type === MajorType.Negative && BigInt(a.value) === BigInt(b.value);
		case MajorType.ByteString: return b.type === MajorType.ByteString && areBytesEqual(a.value, b.value);
		case MajorType.Text: return b.type === MajorType.Text && a.value === b.value;
		case MajorType.Array: return b.type === MajorType.Array && a.value.length === b.value.length && a.value.every((item, i) => cborEquals$1(item, b.value[i]));
		case MajorType.Map: return b.type === MajorType.Map && mapEquals(a.value, b.value);
		case MajorType.Tagged: return b.type === MajorType.Tagged && tagValuesEqual(a.tag, b.tag) && cborEquals$1(a.value, b.value);
		case MajorType.Simple: return b.type === MajorType.Simple && simpleEquals(a.value, b.value);
	}
};
/**
* `PartialEq for Map` (`map.rs`): the same entries in canonical key order,
* each with a structurally equal stored key node and value node. Both maps
* iterate in encoded-key order, so a lockstep walk is exact, and like the
* reference's `BTreeMap` equality it stops at the first mismatch. (The
* reference also compares the stored key bytes; that is implied here, since
* structurally equal key nodes always encode to the same bytes.)
*/
const mapEquals = (a, b) => {
	const n = a.size;
	if (n !== b.size) return false;
	for (let i = 0; i < n; i++) {
		const l = a.entryAt(i);
		const r = b.entryAt(i);
		if (!cborEquals$1(l.key, r.key) || !cborEquals$1(l.value, r.value)) return false;
	}
	return true;
};
const hasTaggedCbor = (value) => {
	return typeof value === "object" && value !== null && "taggedCbor" in value && typeof value.taggedCbor === "function";
};
const hasToCbor = (value) => {
	return typeof value === "object" && value !== null && "toCbor" in value && typeof value.toCbor === "function";
};
/**
* Convert any supported value to its CBOR representation - the single
* polymorphic constructor.
*
* Custom types participate by implementing {@link ToCbor}
* (`toCbor(): Cbor` - the `toJSON` precedent). Tagged values are built with
* {@link taggedValue}.
*
* @example
* ```typescript
* cbor(42);                          // integer
* cbor("héllo");                     // text (NFC-normalized when encoded)
* cbor([1, "two", true, null]);      // array
* cbor(new Map([["k", 1]]));         // map (canonical key order)
* cbor({ name: "Alice", age: 30 });  // plain object -> map
* ```
*
* @throws {CborError} `OutOfRange` - bigint outside `[-(2^64), 2^64 - 1]`.
* @throws {CborError} `Custom` - unsupported input type, or one of the two
*   directive errors below.
* @public
*
* ## Directive errors
*
* Two input shapes throw a directive `CborError` because encoding them
* silently would produce ambiguous or divergent bytes:
*
* - plain objects shaped exactly `{tag, value}`: use
*   `taggedValue(tag, content)` for a tagged value, or add/rename a key for
*   a map;
* - objects implementing `taggedCbor()` but not `toCbor()`: add
*   `toCbor() { return this.taggedCbor(); }`.
*/
const cbor = (value) => {
	if (isCbor(value) && "toData" in value) return value;
	if (isCbor(value)) return attachMethods(value);
	let result;
	if (isCborNumber(value)) {
		if (typeof value === "number" && Number.isNaN(value)) result = {
			isCbor: true,
			type: MajorType.Simple,
			value: {
				type: "Float",
				value: NaN
			}
		};
		else if (typeof value === "number" && hasFractionalPart(value)) result = {
			isCbor: true,
			type: MajorType.Simple,
			value: {
				type: "Float",
				value
			}
		};
		else if (value == Infinity) result = {
			isCbor: true,
			type: MajorType.Simple,
			value: {
				type: "Float",
				value: Infinity
			}
		};
		else if (value == -Infinity) result = {
			isCbor: true,
			type: MajorType.Simple,
			value: {
				type: "Float",
				value: -Infinity
			}
		};
		else if (typeof value === "number" && !Number.isSafeInteger(value)) {
			const big = BigInt(value);
			if (big >= 0n && big <= 18446744073709551615n) result = {
				isCbor: true,
				type: MajorType.Unsigned,
				value: big
			};
			else if (big < 0n && big >= CBOR_INT_MIN) result = {
				isCbor: true,
				type: MajorType.Negative,
				value: -big - 1n
			};
			else result = {
				isCbor: true,
				type: MajorType.Simple,
				value: {
					type: "Float",
					value
				}
			};
		} else if (typeof value === "bigint" && (value > 18446744073709551615n || value < CBOR_INT_MIN)) throw CborError.outOfRange();
		else if (value < 0) {
			if (typeof value === "bigint") result = {
				isCbor: true,
				type: MajorType.Negative,
				value: -value - 1n
			};
			else result = {
				isCbor: true,
				type: MajorType.Negative,
				value: -value - 1
			};
		} else result = {
			isCbor: true,
			type: MajorType.Unsigned,
			value
		};
	} else if (typeof value === "string") result = {
		isCbor: true,
		type: MajorType.Text,
		value
	};
	else if (value === null || value === void 0) return CBOR_NULL;
	else if (value === true) return CBOR_TRUE;
	else if (value === false) return CBOR_FALSE;
	else if (Array.isArray(value)) result = {
		isCbor: true,
		type: MajorType.Array,
		value: value.map(cbor)
	};
	else if (value instanceof Uint8Array) result = {
		isCbor: true,
		type: MajorType.ByteString,
		value
	};
	else if (value instanceof CborMap) result = {
		isCbor: true,
		type: MajorType.Map,
		value
	};
	else if (value instanceof Map) result = {
		isCbor: true,
		type: MajorType.Map,
		value: new CborMap(value)
	};
	else if (value instanceof Set) result = {
		isCbor: true,
		type: MajorType.Array,
		value: Array.from(value).map(cbor)
	};
	else if (hasToCbor(value)) return value.toCbor();
	else if (hasTaggedCbor(value)) throw CborError.custom("objects implementing taggedCbor() are not auto-wrapped by cbor(); implement toCbor() (e.g. `toCbor() { return this.taggedCbor(); }`)");
	else if (typeof value === "object" && "tag" in value && "value" in value) {
		const keys = Object.keys(value);
		if (keys.length === 2 && keys.includes("tag") && keys.includes("value")) throw CborError.custom("plain { tag, value } objects are ambiguous and do not encode as tagged values; use taggedValue(tag, content) for a tagged value, or add/rename a key to encode a map");
		const map = new CborMap();
		for (const [key, val] of Object.entries(value)) map.set(cbor(key), cbor(val));
		result = {
			isCbor: true,
			type: MajorType.Map,
			value: map
		};
	} else if (typeof value === "object") {
		const map = new CborMap();
		for (const [key, val] of Object.entries(value)) map.set(cbor(key), cbor(val));
		result = {
			isCbor: true,
			type: MajorType.Map,
			value: map
		};
	} else throw CborError.custom("Unsupported type for CBOR encoding");
	return attachMethods(result);
};
const textEncoder$1 = new TextEncoder();
/**
* dCBOR requires every encoded text string to be in Unicode Normalization
* Form C. Like the reference (`cbor.rs`: `x.nfc().collect()` inside
* `cbor_data`), normalization happens here at encode time, so the node keeps
* the string it was built from. Strings whose code units are all below U+0300
* (the first combining mark) contain nothing that can compose or decompose
* and are already NFC; skipping `normalize` for them keeps the ASCII/Latin-1
* hot path allocation-free.
*/
const toNfc = (text) => {
	for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) >= 768) return text.normalize("NFC");
	return text;
};
/**
* Write a CBOR value into `writer`. The whole tree encodes into one growable
* buffer, so nested containers don't allocate-and-concatenate a fresh array
* per level.
*/
const writeCborInto = (writer, value) => {
	const c = cbor(value);
	switch (c.type) {
		case MajorType.Unsigned:
			writeVarInt(writer, c.value, MajorType.Unsigned);
			return;
		case MajorType.Negative:
			writeVarInt(writer, c.value, MajorType.Negative);
			return;
		case MajorType.ByteString:
			if (c.value instanceof Uint8Array) {
				writeVarInt(writer, c.value.length, MajorType.ByteString);
				writer.writeBytes(c.value);
				return;
			}
			break;
		case MajorType.Text:
			if (typeof c.value === "string") {
				const utf8Bytes = textEncoder$1.encode(toNfc(c.value));
				writeVarInt(writer, utf8Bytes.length, MajorType.Text);
				writer.writeBytes(utf8Bytes);
				return;
			}
			break;
		case MajorType.Tagged:
			if (typeof c.tag === "bigint" || typeof c.tag === "number") {
				writeVarInt(writer, c.tag, MajorType.Tagged);
				writeCborInto(writer, c.value);
				return;
			}
			break;
		case MajorType.Simple:
			writer.writeBytes(simpleCborData(c.value));
			return;
		case MajorType.Array:
			writeVarInt(writer, c.value.length, MajorType.Array);
			for (const item of c.value) writeCborInto(writer, item);
			return;
		case MajorType.Map: {
			const map = c.value;
			const n = map.size;
			writeVarInt(writer, n, MajorType.Map);
			for (let i = 0; i < n; i++) {
				writer.writeBytes(map.encodedKeyAt(i));
				writeCborInto(writer, map.entryAt(i).value);
			}
			return;
		}
	}
	throw CborError.wrongType();
};
/**
* Encode a value to deterministic CBOR bytes. Accepts anything `cbor()`
* accepts; equal values always produce identical bytes (dCBOR determinism).
*
* @example
* ```typescript
* encodeCbor({ a: 1 });            // Uint8Array [0xa1, 0x61, 0x61, 0x01]
* bytesToHex(encodeCbor("Hello")); // "6548656c6c6f"
* ```
*
* @throws {CborError} Whatever `cbor(value)` throws for unsupported inputs
*   (`OutOfRange`, `Custom`).
* @remarks The decoder's canonicality check re-encodes every decoded value
*   through this function, so it is wire-critical.
* @public
*/
const encodeCbor = (value) => {
	const c = cbor(value);
	switch (c.type) {
		case MajorType.Unsigned: return encodeVarInt(c.value, MajorType.Unsigned);
		case MajorType.Negative: return encodeVarInt(c.value, MajorType.Negative);
		case MajorType.Simple: return simpleCborData(c.value);
		default: {
			const writer = new BufWriter();
			writeCborInto(writer, c);
			return writer.toBytes();
		}
	}
};
/**
* Construct a tagged value - the only explicit tagged-value constructor.
*
* @example
* ```typescript
* taggedValue(1, 1675854714);        // epoch date, tag 1
* taggedValue(Tag.from(32), "https://example.com/"); // URI, tag 32
* ```
*
* @param tag - The tag number (`number | bigint`) or a `Tag` object. Its
*   `.value` goes on the wire; a `.name` is kept on the node (see
*   `CborTaggedType.tagName`) so a `WrongTag` error can name the tag that
*   was found, as the reference does.
* @param content - Anything `cbor()` accepts.
* @public
*/
const taggedValue = (tag, content) => {
	if (typeof tag === "object" && "value" in tag) {
		if (tag.name !== void 0) return attachMethods({
			isCbor: true,
			type: MajorType.Tagged,
			tag: tag.value,
			tagName: tag.name,
			value: cbor(content)
		});
		return attachMethods({
			isCbor: true,
			type: MajorType.Tagged,
			tag: tag.value,
			value: cbor(content)
		});
	}
	return attachMethods({
		isCbor: true,
		type: MajorType.Tagged,
		tag,
		value: cbor(content)
	});
};
/**
* Tag registry implementation.
*
* Stores tags with their names and optional summarizer functions.
*/
var TagsStore = class TagsStore {
	/** Debug label: `Object.prototype.toString` reports `[object TagsStore]`. */
	get [Symbol.toStringTag]() {
		return "TagsStore";
	}
	_tagsByValue = /* @__PURE__ */ new Map();
	_tagsByName = /* @__PURE__ */ new Map();
	_summarizers = /* @__PURE__ */ new Map();
	constructor() {}
	/**
	* Insert a tag into the registry.
	*
	* - Throws if the tag name is undefined or empty
	* - Throws if a tag with the same value exists with a different name
	* - Allows re-registering the same tag value with the same name
	*
	* The store holds frozen tags, as the reference stores clones it owns: a
	* frozen argument (every `Tag.from` result) is kept by identity, an
	* unfrozen object literal is copied, so later mutation of the caller's
	* object never changes a lookup.
	*
	* @param tag - The tag to register (must have a non-empty name)
	* @throws {CborError} `Custom` if the tag has no name, an empty name, or
	*   conflicts with an existing registration
	*
	* @example
	* ```typescript
	* const store = new TagsStore();
	* store.register(Tag.from(12345, 'myCustomTag'));
	* ```
	*/
	register(tag) {
		const name = tag.name;
		if (name === void 0 || name === "") throw CborError.custom(`Tag ${tag.value} must have a non-empty name`);
		const key = this._valueKey(tag.value);
		const existing = this._tagsByValue.get(key);
		if (existing?.name !== void 0 && existing.name !== name) throw CborError.custom(`Attempt to register tag: ${tag.value} '${existing.name}' with different name: '${name}'`);
		const stored = Object.isFrozen(tag) ? tag : Tag.from(tag.value, name);
		this._tagsByValue.set(key, stored);
		this._tagsByName.set(name, stored);
	}
	/**
	* Register multiple tags; the conflict-throwing validation in `register()`
	* applies per tag. Accepts any iterable, including a `readonly` array.
	*/
	registerAll(tags) {
		for (const tag of tags) this.register(tag);
	}
	/**
	* An independent copy of this store (the reference's `#[derive(Clone)]`
	* on `TagsStore`).
	*
	* The clone holds the same frozen tags by identity and shares the
	* summarizer functions, as the reference's `Arc` summarizers are shared.
	* Registering a tag or setting a summarizer on either store leaves the
	* other unchanged. The clone is a plain store; it never replaces the
	* global store.
	*/
	clone() {
		const copy = new TagsStore();
		for (const [key, tag] of this._tagsByValue) copy._tagsByValue.set(key, tag);
		for (const [name, tag] of this._tagsByName) copy._tagsByName.set(name, tag);
		for (const [key, summarizer] of this._summarizers) copy._summarizers.set(key, summarizer);
		return copy;
	}
	/**
	* Register a custom summarizer function for a tag.
	*
	* @param tagValue - The numeric tag value
	* @param summarizer - The summarizer function
	*
	* @example
	* ```typescript
	* store.setSummarizer(1, (cbor, flat) => ({
	*   ok: true,
	*   value: `Date(${extractCbor(cbor)})`,
	* }));
	* ```
	*/
	setSummarizer(tagValue, summarizer) {
		const key = this._valueKey(tagValue);
		this._summarizers.set(key, summarizer);
	}
	assignedNameForTag(tag) {
		const key = this._valueKey(tag.value);
		return this._tagsByValue.get(key)?.name;
	}
	nameForTag(tag) {
		return this.assignedNameForTag(tag) ?? tag.value.toString();
	}
	tagForValue(value) {
		const key = this._valueKey(value);
		return this._tagsByValue.get(key);
	}
	tagForName(name) {
		return this._tagsByName.get(name);
	}
	nameForValue(value) {
		const tag = this.tagForValue(value);
		return tag !== void 0 ? this.nameForTag(tag) : value.toString();
	}
	summarizer(tag) {
		const key = this._valueKey(tag);
		return this._summarizers.get(key);
	}
	/** Map key for a tag value, equal for a `number` and the same `bigint`. */
	_valueKey(value) {
		return value.toString();
	}
};
/**
* The slot the global store lives in. It is keyed on `globalThis` by a
* registered symbol rather than held in a module variable so that every copy
* of this module in a process - the ESM and CommonJS builds, or two bundled
* copies - resolves the SAME store, the way the reference's `GLOBAL_TAGS`
* static is one per process. The `@1` names the store's major version; bump
* it on a breaking `TagsStore` change so incompatible copies do not share.
*/
const GLOBAL_TAGS_KEY = Symbol.for("@blockchaincommons/dcbor/global-tags-store@1");
/**
* Get the global tags store instance.
*
* Creates the instance on first access. One store per process for dcbor
* 1.x, shared by the ESM and CommonJS builds (see `GLOBAL_TAGS_KEY`).
*
* @returns The global TagsStore instance
*
* @example
* ```typescript
* const store = getGlobalTagsStore();
* store.register(Tag.from(999, 'myTag'));
* ```
*/
const getGlobalTagsStore = () => globalThis[GLOBAL_TAGS_KEY] ??= new TagsStore();
//#endregion
//#region ../bc-dcbor-ts/dist/index.mjs
/**
* Validate that a CBOR value has one of the expected tags.
*
* @param cbor - CBOR value to validate
* @param expectedTags - Array of valid tags
* @returns The matching tag
* @throws {CborError} `WrongType` if the value is not tagged; `WrongTag` if
*   the tag matches none of `expectedTags`.
*/
const validateTag = (cbor, expectedTags) => {
	if (cbor.type !== MajorType.Tagged) throw CborError.wrongType();
	const tagValue = cbor.tag;
	const matchingTag = expectedTags.find((t) => tagValuesEqual(t.value, tagValue));
	if (matchingTag === void 0) throw CborError.wrongTag(expectedTags[0], Tag.from(tagValue, cbor.tagName));
	return matchingTag;
};
/**
* Extract the content from a tagged CBOR value.
*
* @param cbor - Tagged CBOR value
* @returns The untagged content
* @throws {CborError} `WrongType` if the value is not tagged.
*/
const extractTaggedContent = (cbor) => {
	if (cbor.type !== MajorType.Tagged) throw CborError.wrongType();
	return cbor.value;
};
/**
* The reference's representable range: chrono's `NaiveDateTime::MIN`
* (−262143-01-01T00:00:00) and `MAX` (262142-12-31T23:59:59.999999999) as
* Unix seconds. Beyond it `Date::from_timestamp` panics (`timestamp_opt(…)
* .unwrap()`); here it is `InvalidDate`. JS `Date` reaches further (±8.64e12
* s), so `toDate()` can represent every accepted value.
*/
const MIN_TIMESTAMP_SECONDS = -8334601228800;
const MAX_TIMESTAMP_SECONDS = 8210266876799;
/** `f64::exact_from_u64`: the magnitude as a number, or `OutOfRange` when inexact. */
function exactNumber(magnitude) {
	const n = Number(magnitude);
	if (!Number.isFinite(n) || BigInt(n) !== magnitude) throw CborError.outOfRange();
	return n;
}
/** chrono's `NaiveDate` year range (`MIN_YEAR` / `MAX_YEAR`). */
const MIN_YEAR = -262143;
const MAX_YEAR = 262142;
const isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
const DAYS_IN_MONTH = [
	31,
	28,
	31,
	30,
	31,
	30,
	31,
	31,
	30,
	31,
	30,
	31
];
const daysInMonth = (year, month) => month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1] ?? 0;
/**
* Days since 1970-01-01 of a proleptic-Gregorian civil date (the components
* must already be valid). Pure integer arithmetic, as chrono computes it: JS
* `Date.UTC` would map years 0–99 to 1900–1999.
*/
function daysFromCivil(year, month, day) {
	const y = month <= 2 ? year - 1 : year;
	const era = Math.floor(y / 400);
	const yoe = y - era * 400;
	const doy = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
	const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
	return era * 146097 + doe - 719468;
}
/** The civil date of a day count since 1970-01-01 (inverse of `daysFromCivil`). */
function civilFromDays(days) {
	const z = days + 719468;
	const era = Math.floor(z / 146097);
	const doe = z - era * 146097;
	const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
	const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
	const mp = Math.floor((5 * doy + 2) / 153);
	const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
	const month = mp < 10 ? mp + 3 : mp - 9;
	return [
		yoe + era * 400 + (month <= 2 ? 1 : 0),
		month,
		day
	];
}
/**
* Whole seconds since the Unix epoch of the given UTC components, or
* `undefined` when they are not a valid date-time. The checks are chrono's
* (`NaiveDate::from_ymd_opt`, `NaiveTime::from_hms_opt`): the year within
* −262143…+262142, a calendar-valid month and day, and `hh:mm:ss` within 23:59:59.
*/
function civilSeconds(year, month, day, hour, minute, second) {
	if (![
		year,
		month,
		day,
		hour,
		minute,
		second
	].every(Number.isInteger)) return void 0;
	if (year < MIN_YEAR || year > MAX_YEAR) return void 0;
	if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return void 0;
	if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return;
	return daysFromCivil(year, month, day) * 86400 + hour * 3600 + minute * 60 + second;
}
/** Rust's `char::is_whitespace` (Unicode `White_Space`), as a character class. */
const WHITESPACE = "[\\t\\n\\v\\f\\r \\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]";
/**
* chrono's fixed-layout RFC 3339 grammar (`DateTime::parse_from_rfc3339`):
* `YYYY-MM-DD`, a `T`/`t`/space separator, `hh:mm:ss`, an optional fraction
* of which the first nine digits count, then `Z`/`z` or `±hh:mm` (U+2212 is
* accepted as the minus sign). Nothing may follow.
*/
const RFC3339 = /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9})\d*)?(?:[Zz]|([+\-\u2212])(\d{2}):(\d{2}))$/;
/**
* chrono's strftime `%Y-%m-%d` (`NaiveDate::parse_from_str`): each number may
* be preceded by whitespace; `%Y` is one to four digits, or a sign followed by
* any number of digits; `%m` and `%d` are one or two digits; nothing may
* follow.
*/
const YMD = new RegExp(`^${WHITESPACE}*(?:([+-])(\\d+)|(\\d{1,4}))-${WHITESPACE}*(\\d{1,2})-${WHITESPACE}*(\\d{1,2})$`);
/**
* Split a timestamp (seconds since the Unix epoch) into the (whole seconds,
* nanoseconds) pair the reference's `Date::from_timestamp` builds:
*
* - `trunc() as i64` for the seconds - NaN saturates to 0 (the epoch);
*   ±Infinity saturates to the `i64` bounds, which chrono rejects and the
*   reference then panics on, so here it is `InvalidDate`;
* - `(fract() * 1e9) as u32` for the nanoseconds - truncated toward zero and
*   saturated to `[0, u32::MAX]`, so a negative fraction is dropped (`-1.5`
*   becomes `-1`) and sub-nanosecond precision is lost;
* - `timestamp_opt(...)` then requires the whole seconds inside chrono's
*   range (the fraction does not take part, so `MIN - 0.5` is `MIN`).
*
* @internal
*/
function timestampParts(seconds) {
	if (Number.isNaN(seconds)) return [0, 0];
	if (!Number.isFinite(seconds)) throw CborError.invalidDate("non-finite timestamp");
	const whole = Math.trunc(seconds);
	if (whole < MIN_TIMESTAMP_SECONDS || whole > MAX_TIMESTAMP_SECONDS) throw CborError.invalidDate("timestamp outside the representable range");
	let nanoseconds = Math.trunc((seconds - whole) * 1e9);
	if (nanoseconds < 0) nanoseconds = 0;
	else if (nanoseconds > 4294967295) nanoseconds = 4294967295;
	return [whole, nanoseconds];
}
let dateCodec;
/**
* A UTC date and time, encoded as CBOR tag 1 (RFC 8949 epoch-based
* date/time).
*
* The instant is held as whole seconds since the Unix epoch plus nanoseconds.
* On the wire it is tag 1 followed by the seconds since (or before)
* 1970-01-01T00:00:00Z: an integer for whole seconds, a float otherwise.
* Implements the `CborTagged` interface and the `ToCbor` protocol.
*
* @example
* ```typescript
* import { CborDate } from "@blockchaincommons/dcbor";
*
* // Create a date from a timestamp (seconds since Unix epoch)
* const date = CborDate.fromEpochSeconds(1675854714.0);
*
* // Create a date from year, month, day
* const date2 = CborDate.fromYmd(2023, 2, 8);
*
* // Convert to CBOR
* const cborValue = date.taggedCbor();
*
* // Decode from CBOR
* const decoded = CborDate.fromTaggedCbor(cborValue);
* ```
*/
var CborDate = class CborDate {
	/** Debug label: `Object.prototype.toString` reports `[object CborDate]`. */
	get [Symbol.toStringTag]() {
		return "CborDate";
	}
	/**
	* The instant as the reference's `chrono::DateTime<Utc>` holds it: whole
	* seconds since the Unix epoch plus a nanosecond part in
	* `[0, 1_999_999_999]` (values from 10⁹ up represent a leap second, e.g.
	* `23:59:60`, as chrono does). Keeping the pair rather than one `f64`
	* means display, equality and ordering see exactly what the reference
	* sees; the wire value is derived from it as `timestamp()` does.
	*/
	_seconds;
	_nanoseconds;
	/**
	* Creates a new `CborDate` from the given JavaScript `Date`.
	*
	* @param dateTime - A `Date` instance
	*
	* @returns A new `CborDate` instance
	*
	* @throws `InvalidDate` for an invalid `Date` (`NaN` time) or one outside
	*   the reference's representable range (years −262143 to 262142), which a chrono
	*   value handed to `Date::from_datetime` can never be.
	*
	* @example
	* ```typescript
	* const datetime = new Date();
	* const date = CborDate.fromDate(datetime);
	* ```
	*/
	static fromDate(dateTime) {
		const ms = dateTime.getTime();
		if (!Number.isFinite(ms)) throw CborError.invalidDate("non-finite timestamp");
		const whole = Math.floor(ms / 1e3);
		if (whole < MIN_TIMESTAMP_SECONDS || whole > MAX_TIMESTAMP_SECONDS) throw CborError.invalidDate("timestamp outside the representable range");
		return new CborDate(whole, (ms - whole * 1e3) * 1e6);
	}
	/**
	* Creates a new `CborDate` from year, month, and day components, at
	* 00:00:00 UTC.
	*
	* @param year - The year component (e.g., 2023)
	* @param month - The month component (1-12)
	* @param day - The day component (1-31)
	*
	* @returns A new `CborDate` instance
	*
	* @example
	* ```typescript
	* // Create February 8, 2023
	* const date = CborDate.fromYmd(2023, 2, 8);
	* ```
	*
	* @throws `InvalidDate` if the components do not form a valid date (the
	*   reference panics there).
	*/
	static fromYmd(year, month, day) {
		return CborDate.fromYmdHms(year, month, day, 0, 0, 0);
	}
	/**
	* Creates a new `CborDate` from year, month, day, hour, minute, and second
	* components.
	*
	* @param year - The year component (e.g., 2023)
	* @param month - The month component (1-12)
	* @param day - The day component (1-31)
	* @param hour - The hour component (0-23)
	* @param minute - The minute component (0-59)
	* @param second - The second component (0-59)
	*
	* @returns A new `CborDate` instance
	*
	* @example
	* ```typescript
	* // Create February 8, 2023, 15:30:45 UTC
	* const date = CborDate.fromYmdHms(2023, 2, 8, 15, 30, 45);
	* ```
	*
	* @throws `InvalidDate` if the components do not form a valid date and time
	*   — the checks the reference's `with_ymd_and_hms(…).unwrap()` panics on:
	*   a year outside −262143…+262142, an impossible month or day, or a time past
	*   23:59:59 (no leap second here; `fromString` accepts `:60`).
	*/
	static fromYmdHms(year, month, day, hour, minute, second) {
		const seconds = civilSeconds(year, month, day, hour, minute, second);
		if (seconds === void 0) throw CborError.invalidDate("Invalid date components");
		return new CborDate(seconds, 0);
	}
	/**
	* Creates a new `CborDate` from seconds since the Unix epoch
	* (1970-01-01T00:00:00Z); negative values are before the epoch.
	*
	* The value is split as the reference's `from_timestamp` splits it: whole
	* seconds by truncation toward zero, then the fraction in nanoseconds
	* (truncated, never negative), so `-1.5` is the instant `-1` and
	* `1.0000000001` is `1`. `NaN` is the epoch, as the reference's saturating
	* cast makes it.
	*
	* @param secondsSinceUnixEpoch - Seconds from the Unix epoch (positive or
	*   negative), which can include a fractional part for sub-second
	*   precision
	*
	* @returns A new `CborDate` instance
	*
	* @throws `InvalidDate` for ±Infinity, or when the whole seconds fall
	*   outside the reference's representable range (years −262143 to 262142),
	*   where the reference panics.
	*
	* @example
	* ```typescript
	* // Create a date from a timestamp
	* const date = CborDate.fromEpochSeconds(1675854714.0);
	*
	* // Create a date one second before the Unix epoch
	* const beforeEpoch = CborDate.fromEpochSeconds(-1.0);
	*
	* // Create a date with fractional seconds
	* const withFraction = CborDate.fromEpochSeconds(1675854714.5);
	* ```
	*/
	static fromEpochSeconds(secondsSinceUnixEpoch) {
		const [seconds, nanoseconds] = timestampParts(secondsSinceUnixEpoch);
		return new CborDate(seconds, nanoseconds);
	}
	/**
	* Creates a new `CborDate` from a string containing an ISO-8601 (RFC-3339)
	* date (with or without time).
	*
	* Accepts exactly what the reference's `Date::from_string` accepts:
	*
	* - An RFC 3339 date-time (`2023-02-08T15:30:45Z`, `…45.123456789+05:30`),
	*   with `T`, `t` or a space between date and time, up to nine fraction
	*   digits kept (further digits are ignored), `Z`/`z` or an offset within
	*   ±23:59, and the `:60` leap second (read as second 59 plus one second,
	*   as chrono represents it).
	* - A bare date read as UTC midnight, in chrono's `%Y-%m-%d` form: one to
	*   four year digits or a signed year of any length (`-0001-01-01`,
	*   `+12023-02-08`), one- or two-digit month and day, with whitespace
	*   allowed before each number (`2023-2-8`, ` 2023-02-08`).
	*
	* The fraction is kept exactly as nanoseconds, so a decimal fraction
	* encodes to the same bytes on both sides (`timestamp()`: whole seconds
	* plus nanoseconds over 10⁹) and a leap second still displays as `:60`.
	*
	* @param value - A string containing a date or date-time in ISO-8601/RFC-3339
	*   format
	*
	* @returns A new `CborDate` instance if parsing succeeds
	*
	* @throws `InvalidDate` if the string cannot be parsed as a valid date or
	*   date-time (an impossible calendar date, a time past `23:59:60`, an
	*   offset beyond ±23:59, a missing offset, or trailing characters).
	*
	* @example
	* ```typescript
	* // Parse a date-time string
	* const date = CborDate.fromString("2023-02-08T15:30:45Z");
	*
	* // Parse a date-only string (time will be set to 00:00:00)
	* const date2 = CborDate.fromString("2023-02-08");
	* ```
	*/
	static fromString(value) {
		const invalidDate = () => CborError.invalidDate("Invalid date string");
		const dt = RFC3339.exec(value);
		if (dt !== null) {
			const [, y, mo, d, h, mi, sec, frac = "", sign, oh, om] = dt;
			let second = Number(sec);
			let nanoseconds = frac === "" ? 0 : Number(frac.padEnd(9, "0"));
			if (second === 60) {
				second = 59;
				nanoseconds += 1e9;
			}
			const offsetHours = sign === void 0 ? 0 : Number(oh);
			const offsetMinutes = sign === void 0 ? 0 : Number(om);
			if (offsetHours > 23 || offsetMinutes > 59) throw invalidDate();
			const offset = (sign === "+" ? 1 : -1) * (offsetHours * 3600 + offsetMinutes * 60);
			const whole = civilSeconds(Number(y), Number(mo), Number(d), Number(h), Number(mi), second);
			if (whole === void 0) throw invalidDate();
			return new CborDate(whole - offset, nanoseconds);
		}
		const ymd = YMD.exec(value);
		if (ymd !== null) {
			const [, sign, signedYear, plainYear, mo, d] = ymd;
			const whole = civilSeconds(sign === void 0 ? Number(plainYear) : Number(`${sign}${signedYear}`), Number(mo), Number(d), 0, 0, 0);
			if (whole === void 0) throw invalidDate();
			return new CborDate(whole, 0);
		}
		throw invalidDate();
	}
	/**
	* Creates a new `CborDate` containing the current date and time.
	*
	* @returns A new `CborDate` instance representing the current UTC date and time
	*
	* @example
	* ```typescript
	* const now = CborDate.now();
	* ```
	*/
	static now() {
		return CborDate.fromDate(/* @__PURE__ */ new Date());
	}
	/**
	* Creates a new `CborDate` containing the current date and time plus the given
	* duration.
	*
	* @param durationMs - The duration in milliseconds to add to the current time
	*
	* @returns A new `CborDate` instance representing the current UTC date and time plus
	* the duration
	*
	* @example
	* ```typescript
	* // Get a date 1 hour from now
	* const oneHourLater = CborDate.withDurationFromNow(3600 * 1000);
	* ```
	*/
	static withDurationFromNow(durationMs) {
		const future = new Date((/* @__PURE__ */ new Date()).getTime() + durationMs);
		return CborDate.fromDate(future);
	}
	/**
	* Returns a new JavaScript `Date` for this instant (millisecond precision;
	* sub-millisecond digits are lost).
	*
	* @returns A new `Date` instance
	*
	* @example
	* ```typescript
	* const date = CborDate.now();
	* const datetime = date.toDate();
	* const year = datetime.getFullYear();
	* ```
	*/
	toDate() {
		return /* @__PURE__ */ new Date(this.epochSeconds * 1e3);
	}
	/**
	* The date as the number of seconds since the Unix epoch
	* (1970-01-01T00:00:00Z), as a floating-point `number`. Negative values
	* represent times before the epoch; the fractional part is sub-second
	* precision.
	*
	* This is the reference's `timestamp()`: whole seconds plus nanoseconds
	* over 10⁹, computed in `f64`, and it is the value that goes on the wire.
	*
	* @example
	* ```typescript
	* const date = CborDate.fromYmd(2023, 2, 8);
	* const timestamp = date.epochSeconds;
	* ```
	*/
	get epochSeconds() {
		return this._seconds + this._nanoseconds / 1e9;
	}
	/**
	* Add seconds to this date.
	*
	* @param seconds - Seconds to add (can be fractional)
	* @returns New CborDate instance
	*
	* @example
	* ```typescript
	* const date = CborDate.fromYmd(2022, 3, 21);
	* const tomorrow = date.add(24 * 60 * 60);
	* ```
	*/
	add(seconds) {
		return CborDate.fromEpochSeconds(this.epochSeconds + seconds);
	}
	/**
	* Subtract seconds from this date.
	*
	* @param seconds - Seconds to subtract (can be fractional)
	* @returns New CborDate instance
	*
	* @example
	* ```typescript
	* const date = CborDate.fromYmd(2022, 3, 21);
	* const yesterday = date.subtract(24 * 60 * 60);
	* ```
	*/
	subtract(seconds) {
		return CborDate.fromEpochSeconds(this.epochSeconds - seconds);
	}
	/**
	* Get the difference in seconds between this date and another.
	*
	* @param other - Other CborDate to compare with
	* @returns Difference in seconds (this - other)
	*
	* @example
	* ```typescript
	* const date1 = CborDate.fromYmd(2022, 3, 22);
	* const date2 = CborDate.fromYmd(2022, 3, 21);
	* const diff = date1.difference(date2);
	* // Returns 86400 (one day in seconds)
	* ```
	*/
	difference(other) {
		return this.epochSeconds - other.epochSeconds;
	}
	/**
	* The CBOR tags for `CborDate`: tag 1, the RFC 8949 epoch-based date/time.
	*
	* The tag carries whatever name the global tags store has for 1 at the
	* time of the call (`tags_for_values` in the reference): `date` once
	* `registerStandardTags()` has run, otherwise none. That name is what a
	* `WrongTag` error prints as the expected tag.
	*
	* @returns An array containing tag 1
	*/
	cborTags() {
		return [getGlobalTagsStore().tagForValue(1) ?? Tag.from(1)];
	}
	/**
	* Converts this `CborDate` to its untagged CBOR content: the epoch-seconds
	* numeric value. It may be an integer or a floating-point number,
	* depending on whether the date has fractional seconds.
	*
	* @returns A CBOR value representing the timestamp
	*/
	untaggedCbor() {
		return cbor(this.epochSeconds);
	}
	/**
	* Converts this `CborDate` to a tagged CBOR value with tag 1.
	*
	* @returns Tagged CBOR value
	*/
	taggedCbor() {
		const tag = this.cborTags()[0];
		if (tag === void 0) throw CborError.custom("No tags defined for this type");
		return taggedValue(tag, this.untaggedCbor());
	}
	/**
	* The `ToCbor` protocol: dates encode as their tagged form.
	*/
	toCbor() {
		return this.taggedCbor();
	}
	/**
	* Creates a `CborDate` from an untagged CBOR value, which must be a number
	* (integer or floating-point) of seconds since the Unix epoch. The static
	* `CborDate.fromUntaggedCbor` is the usual entry point; this instance form
	* exists for the `CborTagged` protocol and returns a new instance.
	*
	* @param cbor - The untagged CBOR value
	*
	* @returns The decoded date
	*
	* @throws `WrongType` for a non-numeric value, `OutOfRange` for an integer
	*   `f64` cannot hold exactly, `InvalidDate` beyond the representable
	*   range. A float `NaN` is the epoch, as in the reference.
	*/
	fromUntaggedCbor(cbor) {
		let timestamp;
		switch (cbor.type) {
			case MajorType.Unsigned:
				timestamp = typeof cbor.value === "number" ? cbor.value : exactNumber(cbor.value);
				break;
			case MajorType.Negative:
				if (typeof cbor.value === "bigint") timestamp = -exactNumber(cbor.value) - 1;
				else timestamp = -cbor.value - 1;
				break;
			case MajorType.Simple:
				if (cbor.value.type === "Float") timestamp = cbor.value.value;
				else throw CborError.wrongType();
				break;
			default: throw CborError.wrongType();
		}
		return CborDate.fromEpochSeconds(timestamp);
	}
	/**
	* Creates a `CborDate` from a tag-1 CBOR value (the `CborTagged`
	* protocol's instance form; returns a new instance).
	*
	* @param cbor - Tagged CBOR value
	*
	* @returns The decoded date
	*
	* @throws {CborError} `WrongType` if the value is not tagged, `WrongTag`
	*   for a tag other than 1, or what `fromUntaggedCbor` throws for the content
	*/
	fromTaggedCbor(cbor) {
		const expectedTags = this.cborTags();
		validateTag(cbor, expectedTags);
		const content = extractTaggedContent(cbor);
		return this.fromUntaggedCbor(content);
	}
	/**
	* Static method to create a CborDate from tagged CBOR.
	*
	* @param cbor - Tagged CBOR value
	* @returns New CborDate instance
	*/
	static fromTaggedCbor(cbor) {
		return CborDate.EPOCH.fromTaggedCbor(cbor);
	}
	/**
	* The {@link CborCodec} exemplar: a runtime witness that binds
	* `T = CborDate` for `decodeWith(bytes, CborDate.codec)`.
	*
	* A lazy getter (memoized) rather than a static field: the date ↔ tags
	* module cycle makes an eager initializer hit the temporal dead zone.
	*
	* @beta
	*/
	static get codec() {
		dateCodec ??= {
			get tags() {
				return CborDate.EPOCH.cborTags();
			},
			decode: (c) => CborDate.fromTaggedCbor(c),
			encode: (value) => value.taggedCbor()
		};
		return dateCodec;
	}
	static fromUntaggedCbor(cbor) {
		return CborDate.EPOCH.fromUntaggedCbor(cbor);
	}
	/** 1970-01-01T00:00:00Z: the receiver for the protocol's instance decoders. */
	static EPOCH = new CborDate(0, 0);
	/**
	* The date in ISO-8601 format: only the date part when the time is exactly
	* midnight (00:00:00), otherwise a date-time to the second with `Z`.
	*
	* @returns String representation in ISO-8601 format
	*
	* @example
	* ```typescript
	* // A date at midnight will display as just the date
	* const date = CborDate.fromYmd(2023, 2, 8);
	* // Returns "2023-02-08"
	* console.log(date.toString());
	*
	* // A date with time will display as date and time
	* const date2 = CborDate.fromYmdHms(2023, 2, 8, 15, 30, 45);
	* // Returns "2023-02-08T15:30:45Z"
	* console.log(date2.toString());
	* ```
	*/
	toString() {
		const total = this._seconds;
		const days = Math.floor(total / 86400);
		const secondOfDay = total - days * 86400;
		const [year, month, day] = civilFromDays(days);
		const pad = (n, width = 2) => String(n).padStart(width, "0");
		const date = `${year >= 0 && year <= 9999 ? pad(year, 4) : `${year < 0 ? "-" : "+"}${pad(Math.abs(year), 4)}`}-${pad(month)}-${pad(day)}`;
		if (secondOfDay === 0) return date;
		const hour = Math.floor(secondOfDay / 3600);
		const minute = Math.floor(secondOfDay % 3600 / 60);
		const second = secondOfDay % 60 + (this._nanoseconds >= 1e9 ? 1 : 0);
		return `${date}T${pad(hour)}:${pad(minute)}:${pad(second)}Z`;
	}
	/**
	* Compare two dates for equality: the same whole seconds and the same
	* nanoseconds (chrono's `PartialEq`). A leap second `23:59:60` is a
	* different instant from the following `00:00:00`, although both encode
	* to the same wire value.
	*
	* @param other - Other CborDate to compare
	* @returns true if dates represent the same moment in time
	*/
	equals(other) {
		return this._seconds === other._seconds && this._nanoseconds === other._nanoseconds;
	}
	/**
	* Compare two dates: by whole seconds, then by nanoseconds (chrono's
	* `Ord`, so a leap second sorts after `:59.999999999` and before the next
	* `:00`).
	*
	* @param other - Other CborDate to compare
	* @returns -1 if this < other, 0 if equal, 1 if this > other
	*/
	compare(other) {
		if (this._seconds !== other._seconds) return this._seconds < other._seconds ? -1 : 1;
		if (this._nanoseconds !== other._nanoseconds) return this._nanoseconds < other._nanoseconds ? -1 : 1;
		return 0;
	}
	/**
	* Convert to JSON (returns ISO 8601 string).
	*
	* @returns ISO 8601 string
	*/
	toJSON() {
		return this.toString();
	}
	constructor(seconds, nanoseconds) {
		this._seconds = seconds;
		this._nanoseconds = nanoseconds;
	}
};
/**
* Validates that a bignum magnitude byte string is in shortest canonical form.
*
* Rules:
* - For positive bignums (tag 2): empty byte string represents zero;
*   non-empty must not have leading zero bytes.
* - For negative bignums (tag 3): byte string must not be empty
*   (magnitude zero is encoded as `0x00`); must not have leading zero bytes
*   except when the magnitude is zero (single `0x00`).
*
* @param bytes - The magnitude byte string to validate
* @param isNegative - Whether this is for a negative bignum (tag 3)
* @throws {CborError} `NonCanonicalNumeric` on validation failure
*/
function validateBignumMagnitude(bytes, isNegative) {
	if (isNegative) {
		if (bytes.length === 0) throw CborError.nonCanonicalNumeric();
		if (bytes.length > 1 && bytes[0] === 0) throw CborError.nonCanonicalNumeric();
	} else if (bytes.length > 0 && bytes[0] === 0) throw CborError.nonCanonicalNumeric();
}
/**
* Convert a big-endian byte array to a bigint.
*
* Empty array returns 0n.
*
* @param bytes - Big-endian byte representation
* @returns The bigint value
*/
function bytesToBigint(bytes) {
	if (bytes.length === 0) return 0n;
	let result = 0n;
	for (const byte of bytes) result = result << 8n | BigInt(byte);
	return result;
}
/**
* Decode a BigUint from an untagged CBOR byte string.
*
* This function is intended for use in tag summarizers where the tag has
* already been stripped. It expects a CBOR byte string representing the
* big-endian magnitude of a positive bignum (tag 2 content).
*
* Enforces canonical encoding: no leading zero bytes (except empty for zero).
*
* @param cbor - A CBOR value that should be a byte string
* @returns Non-negative bigint
* @throws {CborError} `WrongType` if not a byte string
* @throws {CborError} `NonCanonicalNumeric` if encoding is non-canonical
*/
function biguintFromUntaggedCbor(cbor) {
	if (cbor.type !== MajorType.ByteString) throw CborError.wrongType();
	const bytes = cbor.value;
	validateBignumMagnitude(bytes, false);
	return bytesToBigint(bytes);
}
/**
* Decode a BigInt from an untagged CBOR byte string for a negative bignum.
*
* This function is intended for use in tag summarizers where the tag has
* already been stripped. It expects a CBOR byte string representing `n` where
* the actual value is `-1 - n` (tag 3 content per RFC 8949).
*
* Enforces canonical encoding: no leading zero bytes (except single `0x00`
* for -1).
*
* @param cbor - A CBOR value that should be a byte string
* @returns Negative bigint
* @throws {CborError} `WrongType` if not a byte string
* @throws {CborError} `NonCanonicalNumeric` if encoding is non-canonical
*/
function bigintFromNegativeUntaggedCbor(cbor) {
	if (cbor.type !== MajorType.ByteString) throw CborError.wrongType();
	const bytes = cbor.value;
	validateBignumMagnitude(bytes, true);
	return -(bytesToBigint(bytes) + 1n);
}
/**
* Name for tag 2 (positive bignum).
*/
const TAG_NAME_POSITIVE_BIGNUM = "positive-bignum";
/**
* Name for tag 3 (negative bignum).
*/
const TAG_NAME_NEGATIVE_BIGNUM = "negative-bignum";
/**
* Name for tag 1 (date).
*/
const TAG_NAME_DATE = "date";
/**
* Register the standard tags (date, and the bignums with `bignum`) and their
* summarizers into `store`.
*
* Re-registering is idempotent and moves each standard name back to its
* standard value, as the reference's `insert_all` does: a store that had
* named tag 99 `date` names tag 1 `date` afterwards. Registering tag 1 (or
* 2/3 with `bignum`) under a different name throws `CborError` `Custom`
* from the store's conflict validation, before any summarizer is set.
*
* @param store - Target store; defaults to the global tags store.
*/
const registerStandardTags = (store = getGlobalTagsStore(), options = {}) => {
	const bignum = options.bignum ?? false;
	const tagsStore = store;
	tagsStore.registerAll([Tag.from(1, TAG_NAME_DATE)]);
	tagsStore.setSummarizer(1, (untaggedCbor, _flat) => {
		try {
			return {
				ok: true,
				value: CborDate.fromUntaggedCbor(untaggedCbor).toString()
			};
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return {
				ok: false,
				error: CborError.custom(message)
			};
		}
	});
	if (!bignum) return;
	tagsStore.registerAll([Tag.from(2, TAG_NAME_POSITIVE_BIGNUM), Tag.from(3, TAG_NAME_NEGATIVE_BIGNUM)]);
	tagsStore.setSummarizer(2, (untaggedCbor, _flat) => {
		try {
			return {
				ok: true,
				value: `bignum(${biguintFromUntaggedCbor(untaggedCbor)})`
			};
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return {
				ok: false,
				error: CborError.custom(message)
			};
		}
	});
	tagsStore.setSummarizer(3, (untaggedCbor, _flat) => {
		try {
			return {
				ok: true,
				value: `bignum(${bigintFromNegativeUntaggedCbor(untaggedCbor)})`
			};
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return {
				ok: false,
				error: CborError.custom(message)
			};
		}
	});
};
/**
* Resolve tag values through the global tags store. A value the store does
* not know becomes an unnamed `Tag`.
*
* @example
* ```typescript
* registerStandardTags();
* const tags = tagsForValues([1, 42]);
* tags[0].name; // "date"
* tags[1].name; // undefined
* ```
*/
const tagsForValues = (values) => {
	const globalStore = getGlobalTagsStore();
	return values.map((value) => {
		const tag = globalStore.tagForValue(value);
		if (tag !== void 0) return tag;
		return Tag.from(value);
	});
};
/**
* Check if CBOR value is an array.
*
* @param cbor - CBOR value to check
* @returns True if value is array
*/
const isArray = (cbor) => {
	return cbor.type === MajorType.Array;
};
/**
* Check if CBOR value is a map.
*
* @param cbor - CBOR value to check
* @returns True if value is map
*/
const isMap = (cbor) => {
	return cbor.type === MajorType.Map;
};
/**
* Check if CBOR value is tagged.
*
* @param cbor - CBOR value to check
* @returns True if value is tagged
*/
const isTagged = (cbor) => {
	return cbor.type === MajorType.Tagged;
};
/**
* Check if CBOR value is null.
*
* @param cbor - CBOR value to check
* @returns True if value is null
*/
const isNull = (cbor) => {
	if (cbor.type !== MajorType.Simple) return false;
	return cbor.value.type === "Null";
};
/**
* Check if CBOR value is any numeric type (unsigned, negative, or float).
*
* @param cbor - CBOR value
* @returns True if value is numeric
*/
const isNumber = (cbor) => {
	if (cbor.type === MajorType.Unsigned || cbor.type === MajorType.Negative) return true;
	if (cbor.type === MajorType.Simple) return isFloat(cbor.value);
	return false;
};
/**
* Extract unsigned integer value if type matches.
*
* @param cbor - CBOR value
* @returns Unsigned integer or undefined
*/
const asUnsigned = (cbor) => {
	if (cbor.type === MajorType.Unsigned) return cbor.value;
};
/**
* Extract byte string value if type matches.
*
* Decoded byte strings are zero-copy views aliasing the input buffer -
* mutating the input after decoding (or mutating the returned bytes) changes
* the other side. Call `.slice()` first if you need an independent copy.
*
* @param cbor - CBOR value
* @returns Byte string or undefined
*/
const asBytes = (cbor) => {
	if (cbor.type === MajorType.ByteString) return cbor.value;
};
/**
* Extract text string value if type matches.
*
* @param cbor - CBOR value
* @returns Text string or undefined
*/
const asText = (cbor) => {
	if (cbor.type === MajorType.Text) return cbor.value;
};
/**
* Extract array value if type matches.
*
* @param cbor - CBOR value
* @returns Array or undefined
*/
const asArray = (cbor) => {
	if (cbor.type === MajorType.Array) return cbor.value;
};
/**
* Extract map value if type matches.
*
* @param cbor - CBOR value
* @returns Map or undefined
*/
const asMap = (cbor) => {
	if (cbor.type === MajorType.Map) return cbor.value;
};
/**
* Extract boolean value if type matches.
*
* @param cbor - CBOR value
* @returns Boolean or undefined
*/
const asBoolean = (cbor) => {
	if (cbor.type !== MajorType.Simple) return;
	if (cbor.value.type === "True") return true;
	if (cbor.value.type === "False") return false;
};
/**
* Extract any numeric value (integer or float).
*
* @param cbor - CBOR value
* @returns Number or undefined
*/
const asNumber = (cbor) => {
	if (cbor.type === MajorType.Unsigned) return cbor.value;
	if (cbor.type === MajorType.Negative) {
		if (typeof cbor.value === "bigint") return -cbor.value - 1n;
		else return -cbor.value - 1;
	}
	if (cbor.type === MajorType.Simple) {
		const simple = cbor.value;
		if (isFloat(simple)) return simple.value;
	}
};
/**
* Get array item at index.
*
* @param cbor - CBOR value (must be array)
* @param index - Array index
* @returns Item at index or undefined
*/
const arrayItem = (cbor, index) => {
	if (cbor.type !== MajorType.Array) return;
	const array = cbor.value;
	if (index < 0 || index >= array.length) return;
	return array[index];
};
/**
* Get array length.
*
* @param cbor - CBOR value (must be array)
* @returns Array length or undefined
*/
const arrayLength = (cbor) => {
	if (cbor.type !== MajorType.Array) return;
	return cbor.value.length;
};
/**
* Get map value by key.
*
* @param cbor - CBOR value (must be map)
* @param key - Map key
* @returns Value for key or undefined
*/
function mapValue(cbor, key) {
	if (cbor.type !== MajorType.Map) return;
	return cbor.value.get(key);
}
/**
* Get all map keys.
*
* @param cbor - CBOR value (must be map)
* @returns Array of keys or undefined
*/
const mapKeys = (cbor) => {
	if (cbor.type !== MajorType.Map) return;
	return cbor.value.entriesArray.map((e) => e.key);
};
/**
* Get all map values.
*
* @param cbor - CBOR value (must be map)
* @returns Array of values or undefined
*/
const mapValues = (cbor) => {
	if (cbor.type !== MajorType.Map) return;
	return cbor.value.entriesArray.map((e) => e.value);
};
/**
* Get map size.
*
* @param cbor - CBOR value (must be map)
* @returns Map size or undefined
*/
const mapSize = (cbor) => {
	if (cbor.type !== MajorType.Map) return;
	return cbor.value.size;
};
/**
* Get tag value from tagged CBOR.
*
* @param cbor - CBOR value (must be tagged)
* @returns Tag value or undefined
*/
const tagValue = (cbor) => {
	if (cbor.type !== MajorType.Tagged) return;
	return cbor.tag;
};
/**
* Extract tagged value as tuple [Tag, Cbor] if CBOR is tagged.
*
* @param cbor - CBOR value
* @returns [Tag, Cbor] tuple or undefined
*/
const asTaggedValue = (cbor) => {
	if (cbor.type !== MajorType.Tagged) return;
	return [getGlobalTagsStore().tagForValue(cbor.tag) ?? { value: cbor.tag }, cbor.value];
};
/**
* Extract unsigned integer value, throwing if type doesn't match.
*
* With `options`, the value is checked against a fixed width and, when
* `wrapNegative` is set, a negative node is wrapped exactly as the
* reference's `u*::try_from` wraps it (see {@link ExpectUnsignedOptions}).
*
* @param cbor - CBOR value
* @param options - Fixed-width extraction (optional; without it the
*   behaviour is the plain `Unsigned`-or-`WrongType` check)
* @returns Unsigned integer (`bigint` above `Number.MAX_SAFE_INTEGER`)
* @throws {CborError} `WrongType` if cbor is not an unsigned integer (or,
*   with `wrapNegative`, not an integer); `OutOfRange` when the value does
*   not fit `width`
*/
const expectUnsigned = (cbor, options) => {
	if (options === void 0) {
		const value = asUnsigned(cbor);
		if (value === void 0) throw CborError.wrongType();
		return value;
	}
	const max = (1n << BigInt(options.width)) - 1n;
	if (cbor.type === MajorType.Unsigned) {
		const value = BigInt(cbor.value);
		if (value > max) throw CborError.outOfRange();
		return narrowInteger(value);
	}
	if (cbor.type === MajorType.Negative && options.wrapNegative === true) {
		const magnitude = BigInt(cbor.value);
		if (magnitude > max) throw CborError.outOfRange();
		return narrowInteger(max - magnitude);
	}
	throw CborError.wrongType();
};
/**
* Extract byte string value, throwing if type doesn't match.
*
* Decoded byte strings are zero-copy views aliasing the input buffer -
* mutating the input after decoding (or mutating the returned bytes) changes
* the other side. Call `.slice()` first if you need an independent copy.
*
* @param cbor - CBOR value
* @returns Byte string
* @throws {CborError} `WrongType` if cbor is not a byte string
*/
const expectBytes$1 = (cbor) => {
	const value = asBytes(cbor);
	if (value === void 0) throw CborError.wrongType();
	return value;
};
/**
* Extract content if has specific tag, throwing if not (the reference's
* `try_into_expected_tagged_value`).
*
* The `WrongTag` error names the expected tag as it was given (a `Tag` keeps
* its name; a number or bigint stays unnamed) and the actual tag as the node
* carries it.
*
* @param cbor - CBOR value
* @param tag - Expected tag value, or a `Tag`
* @returns Tagged content
* @throws {CborError} `WrongType` if `cbor` is not tagged; `WrongTag` (with
*   `details.expectedTag` and `details.actualTag`) if the tag doesn't match
*/
const expectTaggedContent = (cbor, tag) => {
	if (cbor.type !== MajorType.Tagged) throw CborError.wrongType();
	const expected = typeof tag === "object" ? tag : Tag.from(tag);
	if (!tagValuesEqual(cbor.tag, expected.value)) throw CborError.wrongTag(expected, Tag.from(cbor.tag, cbor.tagName));
	return cbor.value;
};
//#endregion
//#region src/pattern/value/bool-pattern.ts
/**
* Creates a BoolPattern that matches any boolean value.
*/
const boolPatternAny = () => ({ variant: "Any" });
/**
* Creates a BoolPattern that matches a specific boolean value.
*/
const boolPatternValue = (value) => ({
	variant: "Value",
	value
});
/**
* Tests if a CBOR value matches this boolean pattern.
*/
const boolPatternMatches = (pattern, haystack) => {
	const value = asBoolean(haystack);
	if (value === void 0) return false;
	switch (pattern.variant) {
		case "Any": return true;
		case "Value": return value === pattern.value;
	}
};
/**
* Returns paths to matching boolean values.
*/
const boolPatternPaths = (pattern, haystack) => {
	if (boolPatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Formats a BoolPattern as a string.
*/
const boolPatternDisplay = (pattern) => {
	switch (pattern.variant) {
		case "Any": return "bool";
		case "Value": return pattern.value ? "true" : "false";
	}
};
//#endregion
//#region src/pattern/value/null-pattern.ts
/**
* Creates a NullPattern.
*/
const nullPattern = () => ({ variant: "Null" });
/**
* Tests if a CBOR value matches the null pattern.
*/
const nullPatternMatches = (_pattern, haystack) => {
	return isNull(haystack);
};
/**
* Returns paths to matching null values.
*/
const nullPatternPaths = (pattern, haystack) => {
	if (nullPatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Formats a NullPattern as a string.
*/
const nullPatternDisplay = (_pattern) => {
	return "null";
};
//#endregion
//#region src/pattern/value/number-pattern.ts
/**
* Creates a NumberPattern that matches any number.
*/
const numberPatternAny = () => ({ variant: "Any" });
/**
* Creates a NumberPattern that matches a specific number.
*/
const numberPatternValue = (value) => ({
	variant: "Value",
	value
});
/**
* Creates a NumberPattern that matches numbers within a range (inclusive).
*/
const numberPatternRange = (min, max) => ({
	variant: "Range",
	min,
	max
});
/**
* Creates a NumberPattern that matches numbers greater than a value.
*/
const numberPatternGreaterThan = (value) => ({
	variant: "GreaterThan",
	value
});
/**
* Creates a NumberPattern that matches numbers greater than or equal to a value.
*/
const numberPatternGreaterThanOrEqual = (value) => ({
	variant: "GreaterThanOrEqual",
	value
});
/**
* Creates a NumberPattern that matches numbers less than a value.
*/
const numberPatternLessThan = (value) => ({
	variant: "LessThan",
	value
});
/**
* Creates a NumberPattern that matches numbers less than or equal to a value.
*/
const numberPatternLessThanOrEqual = (value) => ({
	variant: "LessThanOrEqual",
	value
});
/**
* Creates a NumberPattern that matches NaN.
*/
const numberPatternNaN = () => ({ variant: "NaN" });
/**
* Creates a NumberPattern that matches positive infinity.
*/
const numberPatternInfinity = () => ({ variant: "Infinity" });
/**
* Creates a NumberPattern that matches negative infinity.
*/
const numberPatternNegInfinity = () => ({ variant: "NegInfinity" });
/**
* Tests if a CBOR value matches this number pattern.
*/
const numberPatternMatches = (pattern, haystack) => {
	switch (pattern.variant) {
		case "Any": return isNumber(haystack);
		case "Value": {
			const value = asNumber(haystack);
			return value !== void 0 && value === pattern.value;
		}
		case "Range": {
			const value = asNumber(haystack);
			return value !== void 0 && value >= pattern.min && value <= pattern.max;
		}
		case "GreaterThan": {
			const value = asNumber(haystack);
			return value !== void 0 && value > pattern.value;
		}
		case "GreaterThanOrEqual": {
			const value = asNumber(haystack);
			return value !== void 0 && value >= pattern.value;
		}
		case "LessThan": {
			const value = asNumber(haystack);
			return value !== void 0 && value < pattern.value;
		}
		case "LessThanOrEqual": {
			const value = asNumber(haystack);
			return value !== void 0 && value <= pattern.value;
		}
		case "NaN": {
			const value = asNumber(haystack);
			return value !== void 0 && Number.isNaN(value);
		}
		case "Infinity": {
			const value = asNumber(haystack);
			return value !== void 0 && value === Number.POSITIVE_INFINITY;
		}
		case "NegInfinity": {
			const value = asNumber(haystack);
			return value !== void 0 && value === Number.NEGATIVE_INFINITY;
		}
	}
};
/**
* Returns paths to matching number values.
*/
const numberPatternPaths = (pattern, haystack) => {
	if (numberPatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Formats a NumberPattern as a string.
*/
const numberPatternDisplay = (pattern) => {
	switch (pattern.variant) {
		case "Any": return "number";
		case "Value": return String(pattern.value);
		case "Range": return `${pattern.min}...${pattern.max}`;
		case "GreaterThan": return `>${pattern.value}`;
		case "GreaterThanOrEqual": return `>=${pattern.value}`;
		case "LessThan": return `<${pattern.value}`;
		case "LessThanOrEqual": return `<=${pattern.value}`;
		case "NaN": return "NaN";
		case "Infinity": return "Infinity";
		case "NegInfinity": return "-Infinity";
	}
};
//#endregion
//#region src/pattern/value/text-pattern.ts
/**
* Creates a TextPattern that matches any text.
*/
const textPatternAny = () => ({ variant: "Any" });
/**
* Creates a TextPattern that matches a specific text value.
*/
const textPatternValue = (value) => ({
	variant: "Value",
	value
});
/**
* Creates a TextPattern that matches text by regex.
*/
const textPatternRegex = (pattern) => ({
	variant: "Regex",
	pattern
});
/**
* Tests if a CBOR value matches this text pattern.
*/
const textPatternMatches = (pattern, haystack) => {
	const value = asText(haystack);
	if (value === void 0) return false;
	switch (pattern.variant) {
		case "Any": return true;
		case "Value": return value === pattern.value;
		case "Regex": return pattern.pattern.test(value);
	}
};
/**
* Returns paths to matching text values.
*/
const textPatternPaths = (pattern, haystack) => {
	if (textPatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Formats a TextPattern as a string.
*/
const textPatternDisplay = (pattern) => {
	switch (pattern.variant) {
		case "Any": return "text";
		case "Value": return `"${pattern.value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
		case "Regex": return `/${pattern.pattern.source}/`;
	}
};
//#endregion
//#region src/pattern/value/bytes-utils.ts
/**
* Copyright © 2023-2026 Blockchain Commons, LLC
*
*
* Byte array utility functions.
*
* @module pattern/value/bytes-utils
*/
/**
* Compares two Uint8Arrays for equality.
*/
const bytesEqual = (a, b) => {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
};
/**
* Tests if bytes start with a prefix.
*/
const bytesStartsWith = (bytes, prefix) => {
	if (bytes.length < prefix.length) return false;
	for (let i = 0; i < prefix.length; i++) if (bytes[i] !== prefix[i]) return false;
	return true;
};
/**
* Converts a Uint8Array to a Latin-1 string for regex matching.
* Each byte value (0-255) maps directly to a character code.
* This mimics Rust's regex::bytes::Regex behavior.
*/
const bytesToLatin1 = (bytes) => {
	let result = "";
	for (const byte of bytes) result += String.fromCharCode(byte);
	return result;
};
//#endregion
//#region src/pattern/value/bytestring-pattern.ts
/**
* Creates a ByteStringPattern that matches any byte string.
*/
const byteStringPatternAny = () => ({ variant: "Any" });
/**
* Creates a ByteStringPattern that matches a specific byte string value.
*/
const byteStringPatternValue = (value) => ({
	variant: "Value",
	value
});
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
const byteStringPatternBinaryRegex = (pattern) => ({
	variant: "BinaryRegex",
	pattern
});
/**
* Tests if a CBOR value matches this byte string pattern.
*/
const byteStringPatternMatches = (pattern, haystack) => {
	const value = asBytes(haystack);
	if (value === void 0) return false;
	switch (pattern.variant) {
		case "Any": return true;
		case "Value": return bytesEqual(value, pattern.value);
		case "BinaryRegex": {
			const latin1String = bytesToLatin1(value);
			return pattern.pattern.test(latin1String);
		}
	}
};
/**
* Returns paths to matching byte string values.
*/
const byteStringPatternPaths = (pattern, haystack) => {
	if (byteStringPatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Formats a ByteStringPattern as a string.
*/
const byteStringPatternDisplay = (pattern) => {
	switch (pattern.variant) {
		case "Any": return "bstr";
		case "Value": return `h'${bytesToHex$2(pattern.value)}'`;
		case "BinaryRegex": return `h'/${pattern.pattern.source}/'`;
	}
};
//#endregion
//#region src/pattern/value/date-pattern.ts
/** CBOR tag for date (RFC 8943) */
const DATE_TAG = 1;
/**
* Returns true if the given tag value equals the expected number tag.
* Handles both number and bigint tag values uniformly.
*/
const tagEquals$1 = (actual, expected) => {
	if (actual === void 0) return false;
	return (typeof actual === "bigint" ? actual : BigInt(actual)) === (typeof expected === "bigint" ? expected : BigInt(expected));
};
/**
* Creates a DatePattern that matches any date.
*/
const datePatternAny = () => ({ variant: "Any" });
/**
* Creates a DatePattern that matches a specific date.
*/
const datePatternValue = (value) => ({
	variant: "Value",
	value
});
/**
* Creates a DatePattern that matches dates within a range (inclusive).
*/
const datePatternRange = (min, max) => ({
	variant: "Range",
	min,
	max
});
/**
* Creates a DatePattern that matches dates on or after the specified date.
*/
const datePatternEarliest = (value) => ({
	variant: "Earliest",
	value
});
/**
* Creates a DatePattern that matches dates on or before the specified date.
*/
const datePatternLatest = (value) => ({
	variant: "Latest",
	value
});
/**
* Creates a DatePattern that matches dates by their ISO-8601 string representation.
*/
const datePatternStringValue = (value) => ({
	variant: "StringValue",
	value
});
/**
* Creates a DatePattern that matches dates by regex on their ISO-8601 string.
*/
const datePatternRegex = (pattern) => ({
	variant: "Regex",
	pattern
});
/**
* Extracts a CborDate from a tagged CBOR value if it's a date (tag 1).
*/
const extractDate = (haystack) => {
	if (!isTagged(haystack)) return;
	const tag = tagValue(haystack);
	if (!tagEquals$1(tag, DATE_TAG)) return;
	try {
		return CborDate.fromTaggedCbor(haystack);
	} catch {
		return;
	}
};
/**
* Tests if a CBOR value matches this date pattern.
*/
const datePatternMatches = (pattern, haystack) => {
	const date = extractDate(haystack);
	if (date === void 0) return false;
	switch (pattern.variant) {
		case "Any": return true;
		case "Value": return date.epochSeconds === pattern.value.epochSeconds;
		case "Range": return date.epochSeconds >= pattern.min.epochSeconds && date.epochSeconds <= pattern.max.epochSeconds;
		case "Earliest": return date.epochSeconds >= pattern.value.epochSeconds;
		case "Latest": return date.epochSeconds <= pattern.value.epochSeconds;
		case "StringValue": return date.toString() === pattern.value;
		case "Regex": return pattern.pattern.test(date.toString());
	}
};
/**
* Returns paths to matching date values.
*/
const datePatternPaths = (pattern, haystack) => {
	if (datePatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Formats a DatePattern as a string.
*/
const datePatternDisplay = (pattern) => {
	switch (pattern.variant) {
		case "Any": return "date";
		case "Value": return `date'${pattern.value.toString()}'`;
		case "Range": return `date'${pattern.min.toString()}...${pattern.max.toString()}'`;
		case "Earliest": return `date'${pattern.value.toString()}...'`;
		case "Latest": return `date'...${pattern.value.toString()}'`;
		case "StringValue": return `date'${pattern.value}'`;
		case "Regex": return `date'/${pattern.pattern.source}/'`;
	}
};
//#endregion
//#region src/pattern/value/digest-pattern.ts
/** CBOR tag for digest (BCR-2021-002) */
const DIGEST_TAG = 40001;
/** Expected size of a SHA-256 digest */
const DIGEST_SIZE = 32;
/**
* Creates a DigestPattern that matches any digest.
*/
const digestPatternAny = () => ({ variant: "Any" });
/**
* Creates a DigestPattern that matches a specific digest.
*/
const digestPatternValue = (value) => ({
	variant: "Value",
	value
});
/**
* Creates a DigestPattern that matches digests with a prefix.
*/
const digestPatternPrefix = (prefix) => ({
	variant: "Prefix",
	prefix
});
/**
* Creates a DigestPattern that matches digests by binary regex.
*
* Note: matches against a Latin-1 decoding of the digest bytes (matching
* Rust's `regex::bytes::Regex`-on-`Vec<u8>` semantics for byte-level
* patterns). Use `\xNN` escapes for individual bytes.
*/
const digestPatternBinaryRegex = (pattern) => ({
	variant: "BinaryRegex",
	pattern
});
/**
* Extracts digest bytes from a tagged CBOR value if it's a digest (tag 40001).
*/
const extractDigestBytes = (haystack) => {
	if (!isTagged(haystack)) return;
	const tag = tagValue(haystack);
	if (tag === void 0 || Number(tag) !== DIGEST_TAG) return;
	const content = asTaggedValue(haystack)?.[1];
	if (content === void 0) return;
	const bytes = asBytes(content);
	if (bytes?.length !== DIGEST_SIZE) return;
	return bytes;
};
/**
* Tests if a CBOR value matches this digest pattern.
*/
const digestPatternMatches = (pattern, haystack) => {
	const digestBytes = extractDigestBytes(haystack);
	if (digestBytes === void 0) return false;
	switch (pattern.variant) {
		case "Any": return true;
		case "Value": return bytesEqual(digestBytes, pattern.value.bytes);
		case "Prefix": return bytesStartsWith(digestBytes, pattern.prefix);
		case "BinaryRegex": {
			const latin1 = bytesToLatin1(digestBytes);
			return pattern.pattern.test(latin1);
		}
	}
};
/**
* Returns paths to matching digest values.
*/
const digestPatternPaths = (pattern, haystack) => {
	if (digestPatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Formats a DigestPattern as a string.
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
const digestPatternDisplay = (pattern) => {
	switch (pattern.variant) {
		case "Any": return "digest";
		case "Value": return `digest'${pattern.value.toUR().toString()}'`;
		case "Prefix": return `digest'${bytesToHex$2(pattern.prefix)}'`;
		case "BinaryRegex": return `digest'/${pattern.pattern.source}/'`;
	}
};
//#endregion
//#region ../bc-tags-ts/dist/index.mjs
/**
* The Blockchain Commons CBOR tag registry.
*
* Values are the CBOR tag numbers on the wire; names are wire too, since
* `uniform-resources` derives UR types from them (`ur:envelope`). Neither
* may change without a specification change. Every constant is frozen.
*
* Tags compare by value: `TAG_ENVELOPE === Tag.from(200, "envelope")` is
* `false` (two objects), `Tag.equals(a, b)` and `a.value === b.value` are
* the comparisons to write.
*
* @see https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-006-urtypes.md
* @module tags
*/
/**
* One immutable tag. dcbor's `Tag.from` returns a frozen object (since
* 1.0.0-beta.3, as the reference's `Tag` is a value); the freeze here is
* kept as defence in depth so the constants stay frozen on any dcbor the
* floor admits. The names are wire, so nothing may rewrite them
* process-wide.
*/
const tag = (value, name) => Object.freeze(Tag.from(value, name));
/** #6.32: URI (RFC 8949 §3.4.5.3), named `url` in this stack. */
const TAG_URI = tag(32, "url");
/** #6.37: binary UUID (RFC 4122). */
const TAG_UUID = tag(37, "uuid");
/** #6.24: encoded CBOR data item; the pre-#6.201 Envelope leaf header, accepted on decode only. */
const TAG_ENCODED_CBOR = tag(24, "encoded-cbor");
/** #6.200: Gordian Envelope. */
const TAG_ENVELOPE = tag(200, "envelope");
/** #6.201: dCBOR data item; the Envelope leaf case. */
const TAG_LEAF = tag(201, "leaf");
/** #6.262: byte string holding UTF-8 JSON text. */
const TAG_JSON = tag(262, "json");
/** #6.40000: known value, a registered unsigned integer with a fixed meaning. */
const TAG_KNOWN_VALUE = tag(4e4, "known-value");
/** #6.40001: SHA-256 digest. */
const TAG_DIGEST = tag(40001, "digest");
/** #6.40002: encrypted message (IETF ChaCha20-Poly1305). */
const TAG_ENCRYPTED = tag(40002, "encrypted");
/** #6.40003: DEFLATE-compressed data with the digest of the original. */
const TAG_COMPRESSED = tag(40003, "compressed");
/** #6.40004: request. */
const TAG_REQUEST = tag(40004, "request");
/** #6.40005: response. */
const TAG_RESPONSE = tag(40005, "response");
/** #6.40006: function identifier. */
const TAG_FUNCTION = tag(40006, "function");
/** #6.40007: parameter identifier. */
const TAG_PARAMETER = tag(40007, "parameter");
/** #6.40008: placeholder. */
const TAG_PLACEHOLDER = tag(40008, "placeholder");
/** #6.40009: replacement. */
const TAG_REPLACEMENT = tag(40009, "replacement");
/** #6.40010: X25519 key-agreement private key. */
const TAG_X25519_PRIVATE_KEY = tag(40010, "agreement-private-key");
/** #6.40011: X25519 key-agreement public key. */
const TAG_X25519_PUBLIC_KEY = tag(40011, "agreement-public-key");
/** #6.40012: apparently random identifier (32 bytes). */
const TAG_ARID = tag(40012, "arid");
/** #6.40013: a signing and an encapsulation private key together. */
const TAG_PRIVATE_KEYS = tag(40013, "crypto-prvkeys");
/** #6.40014: nonce. */
const TAG_NONCE = tag(40014, "nonce");
/** #6.40015: password. */
const TAG_PASSWORD = tag(40015, "password");
/** #6.40016: private key base, the material every other key derives from. */
const TAG_PRIVATE_KEY_BASE = tag(40016, "crypto-prvkey-base");
/** #6.40017: a signing and an encapsulation public key together. */
const TAG_PUBLIC_KEYS = tag(40017, "crypto-pubkeys");
/** #6.40018: salt. */
const TAG_SALT = tag(40018, "salt");
/** #6.40019: sealed message, encrypted to a recipient's public keys. */
const TAG_SEALED_MESSAGE = tag(40019, "crypto-sealed");
/** #6.40020: signature. */
const TAG_SIGNATURE = tag(40020, "signature");
/** #6.40021: signing private key. */
const TAG_SIGNING_PRIVATE_KEY = tag(40021, "signing-private-key");
/** #6.40022: signing public key. */
const TAG_SIGNING_PUBLIC_KEY = tag(40022, "signing-public-key");
/** #6.40023: symmetric encryption key. */
const TAG_SYMMETRIC_KEY = tag(40023, "crypto-key");
/** #6.40024: extensible identifier (XID). */
const TAG_XID = tag(40024, "xid");
/** #6.40025: reference to an identifier by a prefix of it. */
const TAG_REFERENCE = tag(40025, "reference");
/** #6.40026: distributed function call event. */
const TAG_EVENT = tag(40026, "event");
/** #6.40027: symmetric key wrapped for a recipient. */
const TAG_ENCRYPTED_KEY = tag(40027, "encrypted-key");
/** #6.40100: ML-KEM (FIPS 203) private key. */
const TAG_MLKEM_PRIVATE_KEY = tag(40100, "mlkem-private-key");
/** #6.40101: ML-KEM (FIPS 203) public key. */
const TAG_MLKEM_PUBLIC_KEY = tag(40101, "mlkem-public-key");
/** #6.40102: ML-KEM (FIPS 203) encapsulated ciphertext. */
const TAG_MLKEM_CIPHERTEXT = tag(40102, "mlkem-ciphertext");
/** #6.40103: ML-DSA (FIPS 204) private key. */
const TAG_MLDSA_PRIVATE_KEY = tag(40103, "mldsa-private-key");
/** #6.40104: ML-DSA (FIPS 204) public key. */
const TAG_MLDSA_PUBLIC_KEY = tag(40104, "mldsa-public-key");
/** #6.40105: ML-DSA (FIPS 204) signature. */
const TAG_MLDSA_SIGNATURE = tag(40105, "mldsa-signature");
/** #6.40300: cryptographic seed. */
const TAG_SEED = tag(40300, "seed");
/** #6.40303: BIP-32 hierarchical deterministic key. */
const TAG_HDKEY = tag(40303, "hdkey");
/** #6.40304: BIP-32 derivation path. */
const TAG_DERIVATION_PATH = tag(40304, "keypath");
/** #6.40305: coin type and network (`coin-info`). */
const TAG_USE_INFO = tag(40305, "coin-info");
/** #6.40306: elliptic-curve key. */
const TAG_EC_KEY = tag(40306, "eckey");
/** #6.40307: address. */
const TAG_ADDRESS = tag(40307, "address");
/** #6.40308: output descriptor. */
const TAG_OUTPUT_DESCRIPTOR = tag(40308, "output-descriptor");
/** #6.40309: SSKR share. */
const TAG_SSKR_SHARE = tag(40309, "sskr");
/** #6.40310: partially signed Bitcoin transaction. */
const TAG_PSBT = tag(40310, "psbt");
/** #6.40311: account descriptor. */
const TAG_ACCOUNT_DESCRIPTOR = tag(40311, "account-descriptor");
/** #6.40800: OpenSSH text-format private key. */
const TAG_SSH_TEXT_PRIVATE_KEY = tag(40800, "ssh-private");
/** #6.40801: OpenSSH text-format public key. */
const TAG_SSH_TEXT_PUBLIC_KEY = tag(40801, "ssh-public");
/** #6.40802: OpenSSH text-format signature. */
const TAG_SSH_TEXT_SIGNATURE = tag(40802, "ssh-signature");
/** #6.40803: OpenSSH text-format certificate. */
const TAG_SSH_TEXT_CERTIFICATE = tag(40803, "ssh-certificate");
/** #6.1347571542: provenance mark. */
const TAG_PROVENANCE_MARK = tag(1347571542, "provenance");
/** #6.400: output descriptor `sh` (script hash). */
const TAG_OUTPUT_SCRIPT_HASH = tag(400, "output-script-hash");
/** #6.401: output descriptor `wsh` (witness script hash). */
const TAG_OUTPUT_WITNESS_SCRIPT_HASH = tag(401, "output-witness-script-hash");
/** #6.402: output descriptor `pk` (public key). */
const TAG_OUTPUT_PUBLIC_KEY = tag(402, "output-public-key");
/** #6.403: output descriptor `pkh` (public key hash). */
const TAG_OUTPUT_PUBLIC_KEY_HASH = tag(403, "output-public-key-hash");
/** #6.404: output descriptor `wpkh` (witness public key hash). */
const TAG_OUTPUT_WITNESS_PUBLIC_KEY_HASH = tag(404, "output-witness-public-key-hash");
/** #6.405: output descriptor `combo`. */
const TAG_OUTPUT_COMBO = tag(405, "output-combo");
/** #6.406: output descriptor `multi` (multisig). */
const TAG_OUTPUT_MULTISIG = tag(406, "output-multisig");
/** #6.407: output descriptor `sortedmulti` (sorted multisig). */
const TAG_OUTPUT_SORTED_MULTISIG = tag(407, "output-sorted-multisig");
/** #6.408: output descriptor `raw` (raw script). */
const TAG_OUTPUT_RAW_SCRIPT = tag(408, "output-raw-script");
/** #6.409: output descriptor `tr` (taproot). */
const TAG_OUTPUT_TAPROOT = tag(409, "output-taproot");
/** #6.410: output descriptor cosigner. */
const TAG_OUTPUT_COSIGNER = tag(410, "output-cosigner");
/**
* Superseded tags, accepted on decode only. They sit in IANA's
* "Specification Required" range (300–311) and were replaced by the
* first-come-first-served 40300+ tags above; existing data still uses them.
* Never emit these for new data. Frozen, like every entry in it.
*/
const LEGACY_TAGS = Object.freeze({
	SEED_V1: tag(300, "crypto-seed"),
	EC_KEY_V1: tag(306, "crypto-eckey"),
	SSKR_SHARE_V1: tag(309, "crypto-sskr"),
	HDKEY_V1: tag(303, "crypto-hdkey"),
	DERIVATION_PATH_V1: tag(304, "crypto-keypath"),
	USE_INFO_V1: tag(305, "crypto-coin-info"),
	OUTPUT_DESCRIPTOR_V1: tag(307, "crypto-output"),
	PSBT_V1: tag(310, "crypto-psbt"),
	ACCOUNT_V1: tag(311, "crypto-account")
});
/**
* Every tag this package defines, in registration order (the order the
* Rust reference registers them). Iterate this rather than the constants.
* Frozen, like every entry in it.
*/
const ALL_TAGS = Object.freeze([
	TAG_URI,
	TAG_UUID,
	TAG_ENCODED_CBOR,
	TAG_ENVELOPE,
	TAG_LEAF,
	TAG_JSON,
	TAG_KNOWN_VALUE,
	TAG_DIGEST,
	TAG_ENCRYPTED,
	TAG_COMPRESSED,
	TAG_REQUEST,
	TAG_RESPONSE,
	TAG_FUNCTION,
	TAG_PARAMETER,
	TAG_PLACEHOLDER,
	TAG_REPLACEMENT,
	TAG_EVENT,
	LEGACY_TAGS.SEED_V1,
	LEGACY_TAGS.EC_KEY_V1,
	LEGACY_TAGS.SSKR_SHARE_V1,
	TAG_SEED,
	TAG_EC_KEY,
	TAG_SSKR_SHARE,
	TAG_X25519_PRIVATE_KEY,
	TAG_X25519_PUBLIC_KEY,
	TAG_ARID,
	TAG_PRIVATE_KEYS,
	TAG_NONCE,
	TAG_PASSWORD,
	TAG_PRIVATE_KEY_BASE,
	TAG_PUBLIC_KEYS,
	TAG_SALT,
	TAG_SEALED_MESSAGE,
	TAG_SIGNATURE,
	TAG_SIGNING_PRIVATE_KEY,
	TAG_SIGNING_PUBLIC_KEY,
	TAG_SYMMETRIC_KEY,
	TAG_XID,
	TAG_REFERENCE,
	TAG_ENCRYPTED_KEY,
	TAG_MLKEM_PRIVATE_KEY,
	TAG_MLKEM_PUBLIC_KEY,
	TAG_MLKEM_CIPHERTEXT,
	TAG_MLDSA_PRIVATE_KEY,
	TAG_MLDSA_PUBLIC_KEY,
	TAG_MLDSA_SIGNATURE,
	LEGACY_TAGS.HDKEY_V1,
	LEGACY_TAGS.DERIVATION_PATH_V1,
	LEGACY_TAGS.USE_INFO_V1,
	LEGACY_TAGS.OUTPUT_DESCRIPTOR_V1,
	LEGACY_TAGS.PSBT_V1,
	LEGACY_TAGS.ACCOUNT_V1,
	TAG_HDKEY,
	TAG_DERIVATION_PATH,
	TAG_USE_INFO,
	TAG_ADDRESS,
	TAG_OUTPUT_DESCRIPTOR,
	TAG_PSBT,
	TAG_ACCOUNT_DESCRIPTOR,
	TAG_SSH_TEXT_PRIVATE_KEY,
	TAG_SSH_TEXT_PUBLIC_KEY,
	TAG_SSH_TEXT_SIGNATURE,
	TAG_SSH_TEXT_CERTIFICATE,
	TAG_OUTPUT_SCRIPT_HASH,
	TAG_OUTPUT_WITNESS_SCRIPT_HASH,
	TAG_OUTPUT_PUBLIC_KEY,
	TAG_OUTPUT_PUBLIC_KEY_HASH,
	TAG_OUTPUT_WITNESS_PUBLIC_KEY_HASH,
	TAG_OUTPUT_COMBO,
	TAG_OUTPUT_MULTISIG,
	TAG_OUTPUT_SORTED_MULTISIG,
	TAG_OUTPUT_RAW_SCRIPT,
	TAG_OUTPUT_TAPROOT,
	TAG_OUTPUT_COSIGNER,
	TAG_PROVENANCE_MARK
]);
/**
* Registration into a dCBOR tags store.
*
* @module register
*/
/**
* Register dcbor's standard tags and every tag in {@link ALL_TAGS} into
* `store` (default: the global store), in the reference's order: `date`
* (tag 1) with its summarizer, then the 75 tags of this package.
*
* Idempotent: a value already registered under the same name is a no-op,
* and a name already registered under another value moves to this
* package's value, as the reference's `insert_all` does. Tags 2 and 3 stay
* unnamed, as in the reference's default build; for the `num-bigint`
* registry call `registerStandardTags(store, { bignum: true })` before this
* function.
*
* @param store - The store to register into; defaults to dcbor's global store.
* @throws {CborError} Code `Custom` (dcbor's store) when a value is already
* registered under a different name; the message is the reference's panic
* text, e.g. `Attempt to register tag: 200 'foo' with different name: 'envelope'`.
* Tags registered earlier in the same call stay registered, and the rejected
* entry is unchanged.
*/
function registerTags(store = getGlobalTagsStore()) {
	registerStandardTags(store);
	store.registerAll(ALL_TAGS);
}
//#endregion
//#region ../bc-components-ts/dist/domain-CD4Y4F3r.mjs
/**
* Error raised by every component operation.
*
* ```ts
* try {
*   Digest.from(bytes);
* } catch (e) {
*   if (ComponentsError.isComponentsError(e) && e.code === "InvalidSize") {
*     console.log(e.details.expected, e.details.actual);
*   }
* }
* ```
*/
var ComponentsError = class ComponentsError extends Error {
	/** Always `"ComponentsError"`; the cross-copy identity `isComponentsError` checks. */
	name = "ComponentsError";
	/** The failure code. */
	code;
	/** Structured details, discriminated by `code`. */
	details;
	constructor(message, details, cause) {
		super(message, cause === void 0 ? void 0 : { cause });
		this.code = details.code;
		this.details = details;
	}
	/** `true` for a `ComponentsError` from any copy of this package. */
	static isComponentsError(value) {
		return value instanceof Error && value.name === "ComponentsError" && "code" in value;
	}
	/** `true` when this error carries `code`. */
	is(code) {
		return this.code === code;
	}
	/**
	* `InvalidSize`: `invalid <dataType> size: expected <expected>, got
	* <actual>`, with the reference's `data_type` (`"digest"`, `"nonce"`,
	* `"symmetric key"`, `"ECDSA public key"`, …).
	*/
	static invalidSize(dataType, expected, actual) {
		return new ComponentsError(`invalid ${dataType} size: expected ${expected}, got ${actual}`, {
			code: "InvalidSize",
			dataType,
			expected,
			actual
		});
	}
	/** `InvalidData` for unnamed data. */
	static invalidData(reason, cause) {
		return ComponentsError.invalidDataForType("data", reason, cause);
	}
	/** `InvalidData` naming the type or parameter. */
	static invalidDataForType(dataType, reason, cause) {
		return new ComponentsError(`invalid ${dataType}: ${reason}`, {
			code: "InvalidData",
			dataType,
			reason
		}, cause);
	}
	/** `DataTooShort`: fewer bytes than the type's minimum. */
	static dataTooShort(dataType, minimum, actual) {
		return new ComponentsError(`data too short: ${dataType} expected at least ${minimum}, got ${actual}`, {
			code: "DataTooShort",
			dataType,
			minimum,
			actual
		});
	}
	/** `InvalidData` for a malformed text form (an SSH PEM, a URI). */
	static invalidFormat(reason, cause) {
		return ComponentsError.invalidDataForType("format", reason, cause);
	}
	/** `Crypto`: a cryptographic operation failed (authentication, signing). */
	static crypto(message, cause) {
		return ComponentsError.of("Crypto", `cryptographic operation failed: ${message}`, message, cause);
	}
	/**
	* `Cbor` with the `CBOR error: ` prefix: a dcbor failure inside an
	* operation whose reference error type is the component `Error`
	* (`Error::Cbor`), or a dcbor failure met outside a decoder.
	*/
	static cbor(message, cause) {
		return ComponentsError.of("Cbor", `CBOR error: ${message}`, message, cause);
	}
	/**
	* `Cbor` as a decoder reports it: the message is the dcbor `Display` of
	* `cause` with no prefix, as the reference's `from_tagged_cbor` returns a
	* `dcbor::Error`; `cause` is that `CborError`.
	*/
	static cborDecode(cause) {
		return ComponentsError.of("Cbor", cause.message, cause.message, cause);
	}
	/** `Sskr`: a failure from the sskr package. */
	static sskr(message, cause) {
		return ComponentsError.of("Sskr", `SSKR error: ${message}`, message, cause);
	}
	/** `Ssh`: an SSH key, signature or certificate could not be parsed or used. */
	static ssh(message, cause) {
		return ComponentsError.of("Ssh", `SSH operation failed: ${message}`, message, cause);
	}
	/** `SshAgent`: an SSH-agent operation is not available. */
	static sshAgent(message, cause) {
		return ComponentsError.of("SshAgent", `SSH agent error: ${message}`, message, cause);
	}
	/** `Uri`: not a valid URI. */
	static uri(message, cause) {
		return ComponentsError.of("Uri", `invalid URI: ${message}`, message, cause);
	}
	/** `Compression`: a DEFLATE stream or its checksum is corrupt. */
	static compression(message, cause) {
		return ComponentsError.of("Compression", `compression error: ${message}`, message, cause);
	}
	/** `PostQuantum`: an ML-DSA / ML-KEM level or key is invalid. */
	static postQuantum(message, cause) {
		return ComponentsError.of("PostQuantum", `post-quantum cryptography error: ${message}`, message, cause);
	}
	/** `LevelMismatch`: an ML-DSA signature and key of different levels. */
	static levelMismatch() {
		const message = "signature level does not match key level";
		return ComponentsError.of("LevelMismatch", message, message);
	}
	/** `Hex`: a malformed hex string (`hex decoding error: <reason>`, the `hex` crate's texts). */
	static hex(message, cause) {
		return ComponentsError.of("Hex", `hex decoding error: ${message}`, message, cause);
	}
	/** `Utf8`: bytes that are not valid UTF-8 (`UTF-8 conversion error: <reason>`). */
	static utf8(message, cause) {
		return ComponentsError.of("Utf8", `UTF-8 conversion error: ${message}`, message, cause);
	}
	/** `Env`: an environment variable an SSH-agent transport needs is missing or unreadable. */
	static env(message, cause) {
		return ComponentsError.of("Env", `environment variable error: ${message}`, message, cause);
	}
	/** `SshAgentClient`: the SSH-agent transport failed (socket, protocol). */
	static sshAgentClient(message, cause) {
		return ComponentsError.of("SshAgentClient", `SSH agent client error: ${message}`, message, cause);
	}
	/** `General`: anything the other codes do not name. */
	static general(message, cause) {
		return ComponentsError.of("General", message, message, cause);
	}
	static of(code, fullMessage, message, cause) {
		return new ComponentsError(fullMessage, {
			code,
			message
		}, cause);
	}
};
Object.freeze({
	width: 8,
	wrapNegative: true
});
Object.freeze({
	width: 32,
	wrapNegative: true
});
Object.freeze({
	width: 64,
	wrapNegative: true
});
const HEX_VALUE = (/* @__PURE__ */ new Int8Array(256)).fill(-1);
for (let i = 0; i < 10; i++) HEX_VALUE[48 + i] = i;
for (let i = 0; i < 6; i++) {
	HEX_VALUE[65 + i] = 10 + i;
	HEX_VALUE[97 + i] = 10 + i;
}
/**
* Rust's `char::escape_debug` for the Latin-1 range, the way `{:?}`
* prints the offending byte of a hex string: `\0`, `\t`, `\n`, `\r`, `\'`
* and `\\` by name, the other controls (U+0001–U+001F, U+007F–U+00A0) and
* U+00AD as `\u{..}`, everything else as itself.
*/
function rustCharDebug(byte) {
	switch (byte) {
		case 0: return "\\0";
		case 9: return "\\t";
		case 10: return "\\n";
		case 13: return "\\r";
		case 39: return "\\'";
		case 92: return "\\\\";
		default:
			if (byte < 32 || byte >= 127 && byte <= 160 || byte === 173) return `\\u{${byte.toString(16)}}`;
			return String.fromCharCode(byte);
	}
}
/**
* Bytes from a hex string, as the reference's `hex::decode` (hex 0.4.3)
* reads it: over the UTF-8 bytes of `text`, an odd byte count first
* (`Odd number of digits`), then the first byte outside `[0-9a-fA-F]`
* (`Invalid character '<c>' at position <index>`), as `Hex` failures with
* the crate's `Display`. Whitespace is not tolerated. The reference
* `unwrap`s this in most `from_hex`s (a panic) and returns it for the
* Ed25519 keys.
*/
function decodeHexStrict(text) {
	const bytes = new TextEncoder().encode(text);
	if (bytes.length % 2 !== 0) throw ComponentsError.hex("Odd number of digits");
	const out = new Uint8Array(bytes.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		const v = HEX_VALUE[bytes[i]];
		if (v < 0) throw ComponentsError.hex(`Invalid character '${rustCharDebug(bytes[i])}' at position ${i}`);
		if (i % 2 === 0) out[i >> 1] = v << 4;
		else out[i >> 1] |= v;
	}
	return out;
}
/** {@link decodeHexStrict}, the door every `fromHex` uses. */
function bytesFromHex(hex) {
	return decodeHexStrict(hex);
}
//#endregion
//#region ../bc-components-ts/dist/utils-P9RTxqwn.mjs
/**
* The one codable mechanism of this package.
*
* Every value type exposes a `codec` (a dcbor `CborCodec` over its tagged
* form; `decode` requires one of the type's tags), `toCbor()` (tagged),
* `toUR()`, and `fromCbor(cbor)`. Bytes and UR strings compose with dcbor
* and uniform-resources: `decodeWith(bytes, X.codec)`,
* `decodeURWith(UR.parse(s), X.codec)`, `x.toCbor().toData()`,
* `x.toUR().toString()`.
*
* Tags are held by value. Their names come from dcbor's global tags store
* at the moment they are asked for (`codec.tags`, `cborTags()`, the
* expected tag in a `WrongTag` message), as the reference's `cbor_tags()`
* calls `tags_for_values`: call `registerTags()` (`/tags`) first to name
* them, as the reference's `register_tags()`. A UR needs the name.
*
* Every decode failure is a `ComponentsError` with code `Cbor` whose
* message is the dcbor `Display` and whose `cause` is the `CborError`, the
* reference's `dcbor::Error` from `from_tagged_cbor`; see {@link decodeWith}.
*
* @module codable
*/
/**
* Build a type's codec once. `decode` validates the tag against the store
* (dcbor's `validateTag`: an untagged value is `WrongType`, a foreign tag
* `WrongTag` naming the expected tag as the store names it) and hands the
* content to `decodeTagged` or `decodeUntagged`; every failure inside goes
* through {@link decodeWith}.
*/
function defineCodec(spec) {
	const tagValues = Object.freeze(spec.tags.map((t) => t.value));
	const first = tagValues[0];
	if (first === void 0) throw new Error("defineCodec: a codec needs at least one tag");
	return {
		tagValues,
		get tags() {
			return tagsForValues([...tagValues]);
		},
		decodeUntagged: spec.decodeUntagged,
		encodeUntagged: spec.encodeUntagged,
		encode: spec.encode ?? ((value) => taggedValue(tagsForValues([first])[0] ?? first, spec.encodeUntagged(value))),
		decode: (cbor) => decodeWith(() => {
			if (spec.decodeAny !== void 0) return spec.decodeAny(cbor);
			const tag = validateTag(cbor, tagsForValues([...tagValues]));
			const content = extractTaggedContent(cbor);
			return spec.decodeTagged === void 0 ? spec.decodeUntagged(content) : spec.decodeTagged(tag, content, cbor);
		})
	};
}
/**
* Runs a decoder under the reference's error rule for a `dcbor::Error`
* result (`from_tagged_cbor`, and every `TryFrom<CBOR>` whose error type is
* `dcbor::Error`): the failure is a `ComponentsError` with code `Cbor`, the
* bare dcbor message and the `CborError` as `cause`.
*
* - a `CborError` is wrapped as is;
* - a `ComponentsError` with code `Cbor` (a nested decoder, or a
*   `CBOR error: …` from a component-typed site) contributes its
*   `CborError` cause, as `From<Error> for dcbor::Error` unwraps
*   `Error::Cbor`;
* - any other `ComponentsError` (a size or format check inside the decoder)
*   becomes `CborError.custom(<its message>)`, with the inner error kept as
*   that cause's `cause`, as `dcbor::Error::msg(err.to_string())` does.
*
* Anything else (an engine error from a JS-only input) propagates.
*/
function decodeWith(f) {
	try {
		return f();
	} catch (e) {
		if (CborError.isCborError(e)) throw ComponentsError.cborDecode(e);
		if (ComponentsError.isComponentsError(e)) {
			if (e.code === "Cbor") {
				const inner = e.cause;
				if (CborError.isCborError(inner)) throw ComponentsError.cborDecode(inner);
				throw e;
			}
			const custom = CborError.custom(e.message);
			custom.cause = e;
			throw ComponentsError.cborDecode(custom);
		}
		throw e;
	}
}
/**
* Tagged CBOR memo, keyed by the value object. Every codable type here is an
* immutable value (readonly fields, no setters) except `Seed`, whose setters
* call `forgetTaggedCbor`. The memo makes repeated `toCbor().toData()` /
* `Digest.fromImage(...)` calls on the same object (references, XIDs,
* envelope leaf digests) free after the first.
*/
const TAGGED_CBOR = /* @__PURE__ */ new WeakMap();
/** The value's untagged CBOR wrapped in its first tag; memoised per object. */
function taggedCborOf(value) {
	const memo = TAGGED_CBOR.get(value);
	if (memo !== void 0) return memo;
	const tag = value.cborTags()[0];
	if (tag === void 0) throw new Error("No tags defined for this type");
	const out = taggedValue(tag, value.untaggedCbor());
	TAGGED_CBOR.set(value, out);
	return out;
}
/**
* Convert a Uint8Array to a base64-encoded string.
*
* This function works in both browser and Node.js environments.
* Uses btoa which is available in browsers and Node.js 16+.
*
* @param data - The byte array to encode
* @returns A base64-encoded string
*
* @example
* ```typescript
* const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
* toBase64(bytes); // "SGVsbG8="
* ```
*/
function toBase64(data) {
	let binary = "";
	for (const byte of data) binary += String.fromCharCode(byte);
	return btoa(binary);
}
//#endregion
//#region ../bc-ur-ts/dist/domain-BEYQUr-y.mjs
/** The received value of an `InvalidParameter`, rendered so that no two values read alike. */
function render$1(value) {
	if (typeof value === "bigint") return `${value}n`;
	if (typeof value === "number") return Number.isInteger(value) && !Number.isSafeInteger(value) ? BigInt(value).toString() : String(value);
	if (typeof value === "string") return JSON.stringify(value);
	if (typeof value === "function") return "function";
	if (Array.isArray(value)) return "Array";
	if (typeof value === "object" && value !== null) {
		const name = value.constructor?.name;
		return typeof name === "string" && name !== "" ? name : "object";
	}
	return String(value);
}
/**
* Thrown for malformed UR strings (`InvalidScheme`, `TypeUnspecified`,
* `InvalidType`, `NotSinglePart`), a type other than the one expected
* (`UnexpectedType`), a bytewords failure in `decodeBytewords`
* (`Bytewords`), CBOR failures (`Cbor`), anything the reference's `ur`
* crate rejects inside a UR string or a part (`Decoder`: bytewords inside a
* UR string, the header, the part CBOR, the fountain decoder), an argument
* outside its domain (`InvalidParameter`) and a tag with no name to build a
* UR type from (`TagUnnamed`). Codes and messages are the reference's
* wherever it has an outcome; branch on `code`.
*
* Instances come from the static factories only; a wrapped CBOR or part
* error is the `cause`.
*
* @example
* ```ts
* try {
*   UR.parse(s);
* } catch (e) {
*   if (URError.isURError(e) && e.is("UnexpectedType")) {
*     // e.details.expected, e.details.found
*   }
* }
* ```
*/
var URError = class URError extends Error {
	/** Always `"URError"`; the cross-copy identity {@link URError.isURError} checks. */
	name = "URError";
	/** The discriminant; equals `details.code`. */
	code;
	/** The structured payload, discriminated by `code`. */
	details;
	constructor(message, details, cause) {
		super(message, cause === void 0 ? void 0 : { cause });
		this.code = details.code;
		this.details = details;
	}
	/** Type guard for a `URError`, including one from another copy of this package. */
	static isURError(value) {
		return value instanceof Error && value.name === "URError" && "code" in value;
	}
	/** `true` when `code` is this error's code. */
	is(code) {
		return this.code === code;
	}
	/** The string does not start with `ur:`. */
	static invalidScheme() {
		return new URError("invalid UR scheme", { code: "InvalidScheme" });
	}
	/** The string has no `/` after the scheme, so no type. */
	static typeUnspecified() {
		return new URError("no UR type specified", { code: "TypeUnspecified" });
	}
	/** The type uses a character outside `[a-z0-9-]`. */
	static invalidType() {
		return new URError("invalid UR type", { code: "InvalidType" });
	}
	/** A well-formed multipart header where a single-part UR was required. */
	static notSinglePart() {
		return new URError("UR is not a single-part", { code: "NotSinglePart" });
	}
	/** The UR's type is `found` where `expected` was required. */
	static unexpectedType(expected, found) {
		return new URError(`expected UR type ${expected}, but found ${found}`, {
			code: "UnexpectedType",
			expected,
			found
		});
	}
	/** A `decodeBytewords` failure, in the reference's words. */
	static bytewords(message) {
		return new URError(`Bytewords error (${message})`, { code: "Bytewords" });
	}
	/** A CBOR failure; the dcbor error is the `cause` when one was caught. */
	static cbor(message, cause) {
		return new URError(`CBOR error (${message})`, { code: "Cbor" }, cause);
	}
	/** Anything the reference's `ur` crate rejects, in its words (its `Error::UR`). */
	static decoder(message, cause) {
		return new URError(`UR decoder error (${message})`, { code: "Decoder" }, cause);
	}
	/** `parameter` must be `requirement`; `value` is what was received, rendered exactly. */
	static invalidParameter(parameter, value, requirement) {
		return new URError(`${parameter} must be ${requirement}, got ${render$1(value)}`, {
			code: "InvalidParameter",
			parameter,
			value
		});
	}
	/** `tag` has no registered name, or (`undefined`) the codec has no tag at all. */
	static tagUnnamed(tag) {
		return new URError(tag === void 0 ? "the codec has no tags; a UR type needs a named tag" : `CBOR tag ${String(tag)} must have a name; register the tags first`, {
			code: "TagUnnamed",
			tag
		});
	}
};
/** A `Uint8Array` from any realm (`Buffer` included), never another typed array. */
function isBytes$4(value) {
	return value instanceof Uint8Array || ArrayBuffer.isView(value) && value.constructor.name === "Uint8Array";
}
/** Throws `InvalidParameter` unless `value` is a `Uint8Array`. */
function expectBytes(parameter, value) {
	if (!isBytes$4(value)) throw URError.invalidParameter(parameter, value, "a Uint8Array");
	return value;
}
/** Throws `InvalidParameter` unless `value` is a string. */
function expectString(parameter, value) {
	if (typeof value !== "string") throw URError.invalidParameter(parameter, value, "a string");
	return value;
}
/** `value` when it is one of `allowed`, `fallback` when it is `undefined`; `InvalidParameter` otherwise. */
function expectChoice(parameter, value, allowed, fallback) {
	if (value === void 0) return fallback;
	if (typeof value === "string" && allowed.includes(value)) return value;
	throw URError.invalidParameter(parameter, value, `one of ${allowed.map((s) => JSON.stringify(s)).join(", ")}`);
}
//#endregion
//#region ../../node_modules/@noble/hashes/utils.js
/**
* Checks if something is Uint8Array. Be careful: nodejs Buffer will return true.
* @param a - value to test
* @returns `true` when the value is a Uint8Array-compatible view.
* @example
* Check whether a value is a Uint8Array-compatible view.
* ```ts
* isBytes(new Uint8Array([1, 2, 3]));
* ```
*/
function isBytes$3(a) {
	return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
const atitle$2 = (title) => title ? `"${title}" ` : "";
/**
* Asserts something is a non-negative integer.
* @param n - number to validate
* @param title - label included in thrown errors
* @returns The validated number.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate a non-negative integer option.
* ```ts
* anumber(32, 'length');
* ```
*/
function anumber$2(n, title = "") {
	if (typeof n !== "number") throw new TypeError(atitle$2(title) + "expected number, got " + typeof n);
	if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(atitle$2(title) + "expected integer >= 0, got " + n);
	return n;
}
/**
* Asserts something is Uint8Array.
* @param value - value to validate
* @param length - optional exact length constraint
* @param title - label included in thrown errors
* @returns The validated byte array.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate that a value is a byte array.
* ```ts
* abytes(new Uint8Array([1, 2, 3]));
* ```
*/
function abytes$2(value, length, title = "") {
	if (isBytes$3(value) && (length === void 0 || value.length === length)) return value;
	if (length !== void 0) anumber$2(length, "length");
	const bytes = isBytes$3(value);
	const ofLen = length !== void 0 ? ` of length ${length}` : "";
	const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
	const message = atitle$2(title) + "expected Uint8Array" + ofLen + ", got " + got;
	if (!bytes) throw new TypeError(message);
	throw new RangeError(message);
}
/**
* Asserts something is a wrapped hash constructor.
* @param h - hash constructor to validate
* @throws On wrong argument types or invalid hash wrapper shape. {@link TypeError}
* @throws On invalid hash metadata ranges or values. {@link RangeError}
* @throws If the hash metadata allows empty outputs or block sizes. {@link Error}
* @example
* Validate a callable hash wrapper.
* ```ts
* import { ahash } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* ahash(sha256);
* ```
*/
function ahash(h) {
	if (typeof h !== "function" || typeof h.create !== "function") throw new TypeError("expected hash wrapped by utils.createHasher");
	anumber$2(h.outputLen);
	anumber$2(h.blockLen);
	if (h.outputLen < 1 || h.blockLen < 1) throw new Error("hash blockLen / outputLen must be >= 1");
}
const aobject$2 = (value, label) => {
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError((label === "object" ? "" : `"${label}" `) + "expected object, got type=" + typeof value);
};
const aopts = (value, label) => {
	aobject$2(value, label);
	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto !== null) throw new TypeError(`"${label}" expected plain object`);
	if (Object.hasOwn(value, "__proto__")) throw new TypeError(`"${label}.__proto__" is not allowed`);
};
/**
* Asserts a hash instance has not been destroyed or finished.
* @param instance - hash instance to validate
* @param checkFinished - whether to reject finalized instances
* @throws If the hash instance has already been destroyed or finalized. {@link Error}
* @example
* Validate that a hash instance is still usable.
* ```ts
* import { aexists } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const hash = sha256.create();
* aexists(hash);
* ```
*/
function aexists$1(instance, checkFinished = true) {
	if (instance.destroyed) throw new Error("hash was destroyed");
	if (checkFinished && instance.finished) throw new Error("digest() was already called");
}
/**
* Asserts output is a sufficiently-sized byte array.
* @param out - destination buffer
* @param instance - hash instance providing output length
* Oversized buffers are allowed; downstream code only promises to fill the first `outputLen` bytes.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate a caller-provided digest buffer.
* ```ts
* import { aoutput } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const hash = sha256.create();
* aoutput(new Uint8Array(hash.outputLen), hash);
* ```
*/
function aoutput$1(out, instance) {
	abytes$2(out, void 0, "output");
	const min = instance.outputLen;
	if (!(out.length >= min)) throw new RangeError("\"output\" expected length >= " + min);
}
/**
* Zeroizes typed arrays in place. Warning: JS provides no guarantees.
* @param arrays - arrays to overwrite with zeros
* @example
* Zeroize sensitive buffers in place.
* ```ts
* clean(new Uint8Array([1, 2, 3]));
* ```
*/
function clean$1(...arrays) {
	for (let i = 0; i < arrays.length; i++) arrays[i].fill(0);
}
/**
* Creates a DataView for byte-level manipulation.
* @param arr - source typed array
* @returns DataView over the same buffer region.
* @example
* Create a DataView over an existing buffer.
* ```ts
* createView(new Uint8Array(4));
* ```
*/
function createView$1(arr) {
	return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
/**
* Rotate-right operation for uint32 values.
* @param word - source word
* @param shift - shift amount in bits
* @returns Rotated word.
* @example
* Rotate a 32-bit word to the right.
* ```ts
* rotr(0x12345678, 8);
* ```
*/
function rotr(word, shift) {
	return word << 32 - shift | word >>> shift;
}
const hasHexBuiltin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function")();
const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
/**
* Convert byte array to hex string.
* Uses the built-in function when available and assumes it matches the tested
* fallback semantics.
* @param bytes - bytes to encode
* @returns Lowercase hexadecimal string.
* @throws On wrong argument types. {@link TypeError}
* @example
* Convert bytes to lowercase hexadecimal.
* ```ts
* bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])); // 'cafe0123'
* ```
*/
function bytesToHex$1(bytes) {
	abytes$2(bytes);
	if (hasHexBuiltin) return bytes.toHex();
	let hex = "";
	for (let i = 0; i < bytes.length; i++) hex += hexes[bytes[i]];
	return hex;
}
function asciiToBase16(ch) {
	return ch >= 48 && ch <= 57 ? ch - 48 : ch >= 65 && ch <= 70 ? ch - 55 : ch >= 97 && ch <= 102 ? ch - 87 : void 0;
}
/**
* Convert hex string to byte array. Uses built-in function, when available.
* @param hex - hexadecimal string to decode
* @returns Decoded bytes.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Decode lowercase hexadecimal into bytes.
* ```ts
* hexToBytes('cafe0123'); // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
* ```
*/
function hexToBytes$2(hex) {
	if (typeof hex !== "string") throw new TypeError("hex string expected, got " + typeof hex);
	if (hasHexBuiltin) try {
		return Uint8Array.fromHex(hex);
	} catch (error) {
		if (error instanceof SyntaxError) throw new RangeError(error.message);
		throw error;
	}
	const hl = hex.length;
	const al = hl / 2;
	if (hl % 2) throw new RangeError("hex string expected, got unpadded hex of length " + hl);
	const array = new Uint8Array(al);
	for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
		const n1 = asciiToBase16(hex.charCodeAt(hi));
		const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
		if (n1 === void 0 || n2 === void 0) {
			const char = hex[hi] + hex[hi + 1];
			throw new RangeError("hex string expected, got non-hex character \"" + char + "\" at index " + hi);
		}
		array[ai] = n1 * 16 + n2;
	}
	return array;
}
/**
* Copies several Uint8Arrays into one.
* @param arrays - arrays to concatenate
* @returns Concatenated byte array.
* @throws On wrong argument types. {@link TypeError}
* @example
* Concatenate multiple byte arrays.
* ```ts
* concatBytes(new Uint8Array([1]), new Uint8Array([2]));
* ```
*/
function concatBytes$1(...arrays) {
	let sum = 0;
	for (let i = 0; i < arrays.length; i++) {
		const a = arrays[i];
		abytes$2(a);
		sum += a.length;
	}
	const res = new Uint8Array(sum);
	for (let i = 0, pad = 0; i < arrays.length; i++) {
		const a = arrays[i];
		res.set(a, pad);
		pad += a.length;
	}
	return res;
}
/**
* Merges default options and passed options.
* @param defaults - base option object
* @param opts - user overrides
* @param title - label included in thrown override errors
* @returns Fresh merged option object with a null prototype.
* @throws On wrong argument types. {@link TypeError}
* @example
* Merge user overrides onto default options.
* ```ts
* checkOpts({ dkLen: 32 }, { asyncTick: 10 });
* ```
*/
function checkOpts$1(defaults, opts, title = "opts") {
	aopts(defaults, "defaults");
	if (opts !== void 0) aopts(opts, title);
	return Object.assign(Object.create(null), defaults, opts);
}
/**
* Creates a callable hash function from a stateful class constructor.
* @param hashCons - hash constructor or factory
* @param info - optional metadata such as DER OID
* @returns Frozen callable hash wrapper with `.create()`.
*   Wrapper construction eagerly calls `hashCons(undefined)` once to read
*   `outputLen` / `blockLen`, so constructor side effects happen at module
*   init time.
* @throws On wrong argument types. {@link TypeError}
* @example
* Wrap a stateful hash constructor into a callable helper.
* ```ts
* import { createHasher } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const wrapped = createHasher(sha256.create, { oid: sha256.oid });
* wrapped(new Uint8Array([1]));
* ```
*/
function createHasher(hashCons, info = {}) {
	if (typeof hashCons !== "function") throw new TypeError("\"hashCons\" expected function, got type=" + typeof hashCons);
	info = checkOpts$1({}, info, "info");
	const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
	const tmp = hashCons(void 0);
	hashC.outputLen = tmp.outputLen;
	hashC.blockLen = tmp.blockLen;
	hashC.canXOF = tmp.canXOF;
	hashC.create = (opts) => hashCons(opts);
	Object.assign(hashC, info);
	return Object.freeze(hashC);
}
/**
* Cryptographically secure PRNG backed by `crypto.getRandomValues`.
* @param bytesLength - number of random bytes to generate
* @returns Random bytes.
* The platform `getRandomValues()` implementation still defines any
* single-call length cap, and this helper rejects oversize requests
* with a stable library `RangeError` instead of host-specific errors.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @throws If the current runtime does not provide `crypto.getRandomValues`. {@link Error}
* @example
* Generate a fresh random key or nonce.
* ```ts
* const key = randomBytes(16);
* ```
*/
function randomBytes$2(bytesLength = 32) {
	anumber$2(bytesLength, "bytesLength");
	const cr = typeof globalThis === "object" ? globalThis.crypto : null;
	if (typeof cr?.getRandomValues !== "function") throw new Error("crypto.getRandomValues must be defined");
	if (bytesLength > 65536) throw new RangeError(`"bytesLength" expected <= 65536, got ${bytesLength}`);
	return cr.getRandomValues(new Uint8Array(bytesLength));
}
/**
* Creates OID metadata for NIST hashes with prefix `06 09 60 86 48 01 65 03 04 02`.
* @param suffix - final OID byte for the selected hash.
*   The helper accepts any byte even though only the documented NIST hash
*   suffixes are meaningful downstream.
* @returns Object containing the DER-encoded OID.
* @example
* Build OID metadata for a NIST hash.
* ```ts
* oidNist(0x01);
* ```
*/
const oidNist = (suffix) => ({ oid: Uint8Array.from([
	6,
	9,
	96,
	134,
	72,
	1,
	101,
	3,
	4,
	2,
	suffix
]) });
//#endregion
//#region ../../node_modules/@noble/hashes/_u64.js
const fromNumH = (n) => n / 2 ** 32 | 0;
const fromNumL = (n) => n >>> 0;
function setU64FromNum(view, byteOffset, n, isLE) {
	const h = fromNumH(n);
	const l = fromNumL(n);
	view.setUint32(byteOffset, isLE ? l : h, isLE);
	view.setUint32(byteOffset + 4, isLE ? h : l, isLE);
}
//#endregion
//#region ../../node_modules/@noble/hashes/_md.js
/**
* Internal Merkle-Damgard hash utils.
* @module
*/
/**
* Shared 32-bit conditional boolean primitive reused by SHA-256, SHA-1, and MD5 `F`.
* Returns bits from `b` when `a` is set, otherwise from `c`.
* The XOR form is equivalent to MD5's `F(X,Y,Z) = XY v not(X)Z` because the masked terms never
* set the same bit.
* @param a - selector word
* @param b - word chosen when selector bit is set
* @param c - word chosen when selector bit is clear
* @returns Mixed 32-bit word.
* @example
* Combine three words with the shared 32-bit choice primitive.
* ```ts
* Chi(0xffffffff, 0x12345678, 0x87654321);
* ```
*/
function Chi(a, b, c) {
	return a & b ^ ~a & c;
}
/**
* Shared 32-bit majority primitive reused by SHA-256 and SHA-1.
* Returns bits shared by at least two inputs.
* @param a - first input word
* @param b - second input word
* @param c - third input word
* @returns Mixed 32-bit word.
* @example
* Combine three words with the shared 32-bit majority primitive.
* ```ts
* Maj(0xffffffff, 0x12345678, 0x87654321);
* ```
*/
function Maj(a, b, c) {
	return a & b ^ a & c ^ b & c;
}
/**
* Merkle-Damgard hash construction base class.
* Could be used to create MD5, RIPEMD, SHA1, SHA2.
* Accepts only byte-aligned `Uint8Array` input, even when the underlying spec describes bit
* strings with partial-byte tails.
* @param blockLen - internal block size in bytes
* @param outputLen - digest size in bytes
* @param padOffset - trailing length field size in bytes
* @param isLE - whether length and state words are encoded in little-endian
* @example
* Use a concrete subclass to get the shared Merkle-Damgard update/digest flow.
* ```ts
* import { _SHA1 } from '@noble/hashes/legacy.js';
* const hash = new _SHA1();
* hash.update(new Uint8Array([97, 98, 99]));
* hash.digest();
* ```
*/
var HashMD = class {
	blockLen;
	outputLen;
	canXOF = false;
	padOffset;
	isLE;
	buffer;
	view;
	finished = false;
	length = 0;
	pos = 0;
	destroyed = false;
	constructor(blockLen, outputLen, padOffset, isLE) {
		this.blockLen = blockLen;
		this.outputLen = outputLen;
		this.padOffset = padOffset;
		this.isLE = isLE;
		this.buffer = new Uint8Array(blockLen);
		this.view = createView$1(this.buffer);
	}
	update(data) {
		aexists$1(this);
		abytes$2(data);
		const { view, buffer, blockLen } = this;
		const len = data.length;
		let processed = false;
		for (let pos = 0; pos < len;) {
			const take = Math.min(blockLen - this.pos, len - pos);
			if (take === blockLen) {
				const dataView = createView$1(data);
				for (; blockLen <= len - pos; pos += blockLen) this.process(dataView, pos);
				processed = true;
				continue;
			}
			buffer.set(pos === 0 && take === len ? data : data.subarray(pos, pos + take), this.pos);
			this.pos += take;
			pos += take;
			if (this.pos === blockLen) {
				this.process(view, 0);
				this.pos = 0;
				processed = true;
			}
		}
		this.length += data.length;
		if (processed) this.roundClean();
		return this;
	}
	digestInto(out) {
		aexists$1(this);
		aoutput$1(out, this);
		this.finished = true;
		const { buffer, view, blockLen, isLE } = this;
		let { pos } = this;
		buffer[pos++] = 128;
		buffer.fill(0, pos);
		if (this.padOffset > blockLen - pos) {
			this.process(view, 0);
			buffer.fill(0);
		}
		setU64FromNum(view, blockLen - 8, this.length * 8, isLE);
		this.process(view, 0);
		this.roundClean();
		const oview = out === buffer ? view : createView$1(out);
		const len = this.outputLen;
		const outLen = len / 4;
		const state = this.get();
		if (len % 4 || outLen > state.length) throw new Error("invalid outputLen");
		for (let i = 0; i < outLen; i++) oview.setUint32(4 * i, state[i], isLE);
	}
	digest() {
		const { buffer, outputLen } = this;
		this.digestInto(buffer);
		const res = buffer.slice(0, outputLen);
		this.destroy();
		return res;
	}
	_cloneIntoMeta(to) {
		const { buffer, length, finished, destroyed, pos } = this;
		to.destroyed = destroyed;
		to.finished = finished;
		to.length = length;
		to.pos = pos;
		if (pos) to.buffer.set(buffer);
		return to;
	}
	clone() {
		return this._cloneInto();
	}
};
/**
* Initial SHA-2 state: fractional parts of square roots of first 16 primes 2..53.
* Check out `test/misc/sha2-gen-iv.js` for recomputation guide.
*/
/** Initial SHA256 state from RFC 6234 §6.1: the first 32 bits of the fractional parts of the
* square roots of the first eight prime numbers. Exported as a shared table; callers must treat
* it as read-only because constructors copy words from it by index. */
const SHA256_IV = /* @__PURE__ */ Uint32Array.from([
	1779033703,
	3144134277,
	1013904242,
	2773480762,
	1359893119,
	2600822924,
	528734635,
	1541459225
]);
//#endregion
//#region ../../node_modules/@noble/hashes/sha2.js
/**
* SHA2 hash function. A.k.a. sha256, sha384, sha512, sha512_224, sha512_256.
* SHA256 is the fastest hash implementable in JS, even faster than Blake3.
* Check out {@link https://www.rfc-editor.org/rfc/rfc4634 | RFC 4634} and
* {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf | FIPS 180-4}.
* @module
*/
/**
* SHA-224 / SHA-256 round constants from RFC 6234 §5.1: the first 32 bits
* of the cube roots of the first 64 primes (2..311).
*/
const SHA256_K = /* @__PURE__ */ Uint32Array.from([
	1116352408,
	1899447441,
	3049323471,
	3921009573,
	961987163,
	1508970993,
	2453635748,
	2870763221,
	3624381080,
	310598401,
	607225278,
	1426881987,
	1925078388,
	2162078206,
	2614888103,
	3248222580,
	3835390401,
	4022224774,
	264347078,
	604807628,
	770255983,
	1249150122,
	1555081692,
	1996064986,
	2554220882,
	2821834349,
	2952996808,
	3210313671,
	3336571891,
	3584528711,
	113926993,
	338241895,
	666307205,
	773529912,
	1294757372,
	1396182291,
	1695183700,
	1986661051,
	2177026350,
	2456956037,
	2730485921,
	2820302411,
	3259730800,
	3345764771,
	3516065817,
	3600352804,
	4094571909,
	275423344,
	430227734,
	506948616,
	659060556,
	883997877,
	958139571,
	1322822218,
	1537002063,
	1747873779,
	1955562222,
	2024104815,
	2227730452,
	2361852424,
	2428436474,
	2756734187,
	3204031479,
	3329325298
]);
/** Reusable SHA-224 / SHA-256 message schedule buffer `W_t` from RFC 6234 §6.2 step 1. */
const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
/** Internal SHA-224 / SHA-256 compression engine from RFC 6234 §6.2. */
var SHA2_32B = class extends HashMD {
	A = 0;
	B = 0;
	C = 0;
	D = 0;
	E = 0;
	F = 0;
	G = 0;
	H = 0;
	constructor(outputLen, IV) {
		super(64, outputLen, 8, false);
		this.A = IV[0] | 0;
		this.B = IV[1] | 0;
		this.C = IV[2] | 0;
		this.D = IV[3] | 0;
		this.E = IV[4] | 0;
		this.F = IV[5] | 0;
		this.G = IV[6] | 0;
		this.H = IV[7] | 0;
	}
	get() {
		const { A, B, C, D, E, F, G, H } = this;
		return [
			A,
			B,
			C,
			D,
			E,
			F,
			G,
			H
		];
	}
	set(A, B, C, D, E, F, G, H) {
		this.A = A | 0;
		this.B = B | 0;
		this.C = C | 0;
		this.D = D | 0;
		this.E = E | 0;
		this.F = F | 0;
		this.G = G | 0;
		this.H = H | 0;
	}
	_cloneInto(to) {
		(to ||= new this.constructor()).set(...this.get());
		return this._cloneIntoMeta(to);
	}
	process(view, offset) {
		for (let i = 0; i < 16; i++, offset += 4) SHA256_W[i] = view.getUint32(offset, false);
		for (let i = 16; i < 64; i++) {
			const W15 = SHA256_W[i - 15];
			const W2 = SHA256_W[i - 2];
			const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
			const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
			SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
		}
		let { A, B, C, D, E, F, G, H } = this;
		for (let i = 0; i < 64; i++) {
			const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
			const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
			const T2 = (rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22)) + Maj(A, B, C) | 0;
			H = G;
			G = F;
			F = E;
			E = D + T1 | 0;
			D = C;
			C = B;
			B = A;
			A = T1 + T2 | 0;
		}
		A = A + this.A | 0;
		B = B + this.B | 0;
		C = C + this.C | 0;
		D = D + this.D | 0;
		E = E + this.E | 0;
		F = F + this.F | 0;
		G = G + this.G | 0;
		H = H + this.H | 0;
		this.set(A, B, C, D, E, F, G, H);
	}
	roundClean() {
		clean$1(SHA256_W);
	}
	destroy() {
		this.destroyed = true;
		this.set(0, 0, 0, 0, 0, 0, 0, 0);
		clean$1(this.buffer);
	}
};
/** Internal SHA-256 hash class grounded in RFC 6234 §6.2. */
var _SHA256 = class extends SHA2_32B {
	constructor() {
		super(32, SHA256_IV);
	}
};
/**
* SHA2-256 hash function from RFC 4634. In JS it's the fastest: even faster than Blake3. Some info:
*
* - Trying 2^128 hashes would get 50% chance of collision, using birthday attack.
* - BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
* - Each sha256 hash is executing 2^18 bit operations.
* - Good 2024 ASICs can do 200Th/sec with 3500 watts of power, corresponding to 2^36 hashes/joule.
* @param msg - message bytes to hash
* @param opts - Reserved hash options.
* @returns Digest bytes.
* @example
* Hash a message with SHA2-256.
* ```ts
* sha256(new Uint8Array([97, 98, 99]));
* ```
*/
const sha256$1 = /* @__PURE__ */ createHasher(() => new _SHA256(), /* @__PURE__ */ oidNist(1));
//#endregion
//#region ../../node_modules/@noble/hashes/hmac.js
/**
* HMAC: RFC2104 message authentication code.
* @module
*/
/**
* Internal class for HMAC.
* Accepts any byte key, although RFC 2104 §3 recommends keys at least
* `HashLen` bytes long.
*/
var _HMAC = class {
	oHash;
	iHash;
	blockLen;
	outputLen;
	canXOF = false;
	finished = false;
	destroyed = false;
	constructor(hash, key) {
		ahash(hash);
		abytes$2(key, void 0, "key");
		this.iHash = hash.create();
		if (typeof this.iHash.update !== "function") throw new Error("expected Hash instance");
		this.blockLen = this.iHash.blockLen;
		this.outputLen = this.iHash.outputLen;
		const blockLen = this.blockLen;
		const pad = new Uint8Array(blockLen);
		pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
		for (let i = 0; i < pad.length; i++) pad[i] ^= 54;
		this.iHash.update(pad);
		this.oHash = hash.create();
		for (let i = 0; i < pad.length; i++) pad[i] ^= 106;
		this.oHash.update(pad);
		clean$1(pad);
	}
	update(buf) {
		aexists$1(this);
		this.iHash.update(buf);
		return this;
	}
	digestInto(out) {
		aexists$1(this);
		aoutput$1(out, this);
		this.finished = true;
		const buf = out.subarray(0, this.outputLen);
		this.iHash.digestInto(buf);
		this.oHash.update(buf);
		this.oHash.digestInto(buf);
		this.destroy();
	}
	digest() {
		const out = new Uint8Array(this.oHash.outputLen);
		this.digestInto(out);
		return out;
	}
	_cloneInto(to) {
		to ||= Object.create(Object.getPrototypeOf(this), {});
		const { oHash, iHash, finished, destroyed, blockLen, outputLen, canXOF } = this;
		to = to;
		to.finished = finished;
		to.destroyed = destroyed;
		to.blockLen = blockLen;
		to.outputLen = outputLen;
		to.canXOF = canXOF;
		to.oHash = oHash._cloneInto(to.oHash);
		to.iHash = iHash._cloneInto(to.iHash);
		return to;
	}
	clone() {
		return this._cloneInto();
	}
	destroy() {
		this.destroyed = true;
		this.oHash.destroy();
		this.iHash.destroy();
	}
};
const hmac = /* @__PURE__ */ (() => {
	const hmac_ = ((hash, key, message) => new _HMAC(hash, key).update(message).digest());
	hmac_.create = (hash, key) => new _HMAC(hash, key);
	return hmac_;
})();
//#endregion
//#region ../../node_modules/@noble/ciphers/utils.js
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
/**
* Checks if something is Uint8Array. Be careful: nodejs Buffer will return true.
* @param a - Value to inspect.
* @returns `true` when the value is a Uint8Array view, including Node's `Buffer`.
* @example
* Guards a value before treating it as raw key material.
*
* ```ts
* isBytes(new Uint8Array());
* ```
*/
function isBytes$2(a) {
	return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
const atitle$1 = (title) => title ? `"${title}" ` : "";
/**
* Asserts something is boolean.
* @param value - Value to validate.
* @returns The validated boolean.
* @throws On wrong argument types. {@link TypeError}
* @example
* Validates a boolean option before branching on it.
*
* ```ts
* abool(true);
* ```
*/
function abool$1(value, title = "") {
	if (typeof value !== "boolean") throw new TypeError(atitle$1(title) + "expected boolean, got type=" + typeof value);
	return value;
}
/**
* Asserts something is a non-negative safe integer.
* @param n - Value to validate.
* @returns The validated number.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validates a non-negative length or counter.
*
* ```ts
* anumber(1);
* ```
*/
function anumber$1(n, title = "") {
	if (typeof n !== "number") throw new TypeError(atitle$1(title) + "expected number, got " + typeof n);
	if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(atitle$1(title) + "expected integer >= 0, got " + n);
	return n;
}
/**
* Asserts something is Uint8Array.
* @param value - Value to validate.
* @param length - Expected byte length.
* @param title - Optional label used in error messages.
* @returns The validated byte array.
* On Node, `Buffer` is accepted too because it is a Uint8Array view.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument lengths. {@link RangeError}
* @example
* Validates a fixed-length nonce or key buffer.
*
* ```ts
* abytes(new Uint8Array([1, 2]), 2);
* ```
*/
function abytes$1(value, length, title = "") {
	if (isBytes$2(value) && (length === void 0 || value.length === length)) return value;
	if (length !== void 0) anumber$1(length, "length");
	const bytes = isBytes$2(value);
	const ofLen = length !== void 0 ? ` of length ${length}` : "";
	const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
	const message = atitle$1(title) + "expected Uint8Array" + ofLen + ", got " + got;
	if (!bytes) throw new TypeError(message);
	throw new RangeError(message);
}
const aobject$1 = (value, label) => {
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(label === "object" ? "expected valid options object" : `"${label}" expected object, got type=${typeof value}`);
};
/**
* Asserts a hash- or MAC-like instance has not been destroyed or finished.
* @param instance - Stateful instance to validate.
* @param checkFinished - Whether to reject finished instances.
* When `false`, only `destroyed` is checked.
* @throws If the hash instance has already been destroyed or finalized. {@link Error}
* @example
* Guards against calling `update()` or `digest()` on a finished hash.
*
* ```ts
* aexists({ destroyed: false, finished: false });
* ```
*/
function aexists(instance, checkFinished = true) {
	if (instance.destroyed) throw new Error("hash was destroyed");
	if (checkFinished && instance.finished) throw new Error("digest() was already called");
}
/**
* Asserts output is a sufficiently-sized byte array.
* @param out - Output buffer to validate.
* @param instance - Hash-like instance providing `outputLen`.
* This is the relaxed `digestInto()`-style contract: output must be at least `outputLen`,
* unlike one-shot cipher helpers elsewhere in the repo that often require exact lengths.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong output buffer lengths. {@link RangeError}
* @example
* Verifies that a caller-provided output buffer is large enough.
*
* ```ts
* aoutput(new Uint8Array(16), { outputLen: 16 });
* ```
*/
function aoutput(out, instance) {
	abytes$1(out, void 0, "output");
	const min = instance.outputLen;
	if (!(out.length >= min)) throw new RangeError("\"output\" expected length >= " + min);
}
/**
* Casts a typed-array view to Uint32Array.
* @param arr - Typed-array view to reinterpret.
* @returns Uint32Array view over the same bytes. Callers are expected to provide a
* 4-byte-aligned offset; trailing `1..3` bytes are silently dropped.
* @example
* Views a byte buffer as 32-bit words for block processing.
*
* ```ts
* u32(new Uint8Array(4));
* ```
*/
function u32(arr) {
	return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
/**
* Zeroizes typed arrays in place.
* Warning: JS provides no guarantees.
* @param arrays - Arrays to wipe.
* @example
* Wipes a temporary key buffer after use.
*
* ```ts
* const bytes = new Uint8Array([1]);
* clean(bytes);
* ```
*/
function clean(...arrays) {
	for (let i = 0; i < arrays.length; i++) arrays[i].fill(0);
}
/**
* Creates a DataView for byte-level manipulation.
* @param arr - Typed-array view to wrap.
* @returns DataView over the same bytes.
* @example
* Creates an endian-aware view for length encoding.
*
* ```ts
* createView(new Uint8Array(4));
* ```
*/
function createView(arr) {
	return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
/**
* Whether the current platform is little-endian.
* Most are; some IBM systems are not.
*/
const isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
/**
* Reverses byte order of one 32-bit word.
* @param word - Unsigned 32-bit word to swap.
* @returns The same word with bytes reversed.
* @example
* Swaps a big-endian word into little-endian byte order.
*
* ```ts
* byteSwap(0x11223344);
* ```
*/
function byteSwap(word) {
	return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
/**
* Byte-swaps every word of a Uint32Array in place.
* @param arr - Uint32Array whose words should be swapped.
* @returns The same array after in-place byte swapping.
* @example
* Swaps every 32-bit word in a word-view buffer.
*
* ```ts
* byteSwap32(new Uint32Array([0x11223344]));
* ```
*/
function byteSwap32(arr) {
	for (let i = 0; i < arr.length; i++) arr[i] = byteSwap(arr[i]);
	return arr;
}
/**
* Normalizes a Uint32Array view to the little-endian representation expected by cipher cores.
* @param u - Word view to normalize in place.
* @returns Little-endian normalized word view.
* @example
* Normalizes a word-view buffer before block processing.
*
* ```ts
* swap32IfBE(new Uint32Array([0x11223344]));
* ```
*/
const swap32IfBE = isLE ? (u) => u : byteSwap32;
/**
* Checks if two U8A use same underlying buffer and overlaps.
* This is invalid and can corrupt data.
* @param a - First byte view.
* @param b - Second byte view.
* @returns `true` when the views overlap in memory.
* @example
* Detects whether two slices alias the same backing buffer.
*
* ```ts
* overlapBytes(new Uint8Array(4), new Uint8Array(4));
* ```
*/
function overlapBytes(a, b) {
	if (!a.byteLength || !b.byteLength) return false;
	return a.buffer === b.buffer && a.byteOffset < b.byteOffset + b.byteLength && b.byteOffset < a.byteOffset + a.byteLength;
}
/**
* If input and output overlap and input starts before output, we will overwrite end of input before
* we start processing it, so this is not supported by forward-processing ciphers.
* @param input - Input bytes.
* @param output - Output bytes.
* @throws If the output view would overwrite unread input bytes. {@link Error}
* @example
* Rejects an in-place layout that would overwrite unread input bytes.
*
* ```ts
* const buffer = new Uint8Array(8);
* complexOverlapBytes(buffer.subarray(0, 4), buffer.subarray(2, 6));
* ```
*/
function complexOverlapBytes(input, output) {
	if (overlapBytes(input, output) && input.byteOffset < output.byteOffset) throw new Error("complex overlap of input and output is not supported");
}
/**
* Merges user options into defaults.
* @param defaults - Default option values.
* @param opts - User-provided overrides.
* @returns Combined options object.
* `defaults` is a library-owned mutable object; user-provided `opts` only need to be
* object-shaped, since "plain object" checks reject valid proxy/cross-realm containers.
* The merge mutates `defaults` in place and returns the same object, so direct callers
* should pass a fresh defaults object unless they intentionally want shared state updated.
* @throws If options are missing or not an object. {@link Error}
* @example
* Applies user overrides to the default cipher options.
*
* ```ts
* checkOpts({ rounds: 20 }, { rounds: 8 });
* ```
*/
function checkOpts(defaults, opts) {
	aobject$1(defaults, "defaults");
	aobject$1(opts, "opts");
	return Object.assign(defaults, opts);
}
/**
* Compares two byte arrays in kinda constant time once lengths already match.
* @param a - First byte array.
* @param b - Second byte array.
* @returns `true` when the arrays contain the same bytes. Different lengths still return early.
* @example
* Compares an expected authentication tag with the received one.
*
* ```ts
* equalBytes(new Uint8Array([1]), new Uint8Array([1]));
* ```
*/
function equalBytes(a, b) {
	a = abytes$1(a);
	b = abytes$1(b);
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}
/**
* Wraps a keyed MAC constructor into a one-shot helper with `.create()`.
* @param keyLen - Valid probe-key length used to read static metadata once.
* The probe key is only used for `outputLen` / `blockLen`, so callers with several valid key sizes
* can pass any representative size as long as those values stay fixed.
* @param macCons - Keyed MAC constructor or factory.
* @param fromMsg - Optional adapter that derives extra constructor args from the one-shot message.
* @returns Callable MAC helper with `.create()`.
*/
function wrapMacConstructor(keyLen, macCons, fromMsg) {
	const mac = macCons;
	const getArgs = fromMsg || (() => []);
	const macC = (msg, key) => mac(key, ...getArgs(msg)).update(msg).digest();
	const tmp = mac(new Uint8Array(keyLen), ...getArgs(/* @__PURE__ */ new Uint8Array(0)));
	macC.outputLen = tmp.outputLen;
	macC.blockLen = tmp.blockLen;
	macC.create = (key, ...args) => mac(key, ...args);
	return macC;
}
/**
* Wraps a cipher: validates args, ensures encrypt() can only be called once.
* Used internally by the exported cipher constructors.
* Output-buffer support is inferred from the wrapped `encrypt` / `decrypt`
* arity (`fn.length === 2`), so wrapped output-capable methods must use a normal
* second parameter, not a default/rest parameter. AAD support is explicit in
* `params.withAAD`; optional AAD starts after the nonce slot when one is present.
* @__NO_SIDE_EFFECTS__
* @param params - Static cipher metadata. See {@link CipherParams}.
* @param constructor - Cipher constructor.
* @returns Wrapped constructor with validation.
*/
const wrapCipher = (params, constructor) => {
	function wrappedCipher(key, ...args) {
		abytes$1(key, void 0, "key");
		if (params.nonceLength !== void 0) {
			const nonce = args[0];
			abytes$1(nonce, params.varSizeNonce ? void 0 : params.nonceLength, "nonce");
		}
		const tagl = params.tagLength;
		const aadStart = params.nonceLength !== void 0 ? 1 : 0;
		if (!params.withAAD) {
			for (let i = aadStart; i < args.length; i++) if (isBytes$2(args[i])) throw new Error("AAD not supported");
		}
		if (params.withAAD && args[aadStart] !== void 0) abytes$1(args[aadStart], void 0, "AAD");
		const cipher = constructor(key, ...args);
		const checkOutput = (fnLength, output) => {
			if (output !== void 0) {
				if (fnLength !== 2) throw new Error("cipher output not supported");
				abytes$1(output, void 0, "output");
			}
		};
		let called = false;
		return {
			encrypt(data, output) {
				if (called) throw new Error("cannot encrypt() twice with same key + nonce");
				called = true;
				abytes$1(data, void 0, "data");
				checkOutput(cipher.encrypt.length, output);
				return cipher.encrypt(data, output);
			},
			decrypt(data, output) {
				abytes$1(data, void 0, "data");
				if (tagl && data.length < tagl) throw new Error("\"ciphertext\" expected length >= tagLength=" + tagl);
				checkOutput(cipher.decrypt.length, output);
				return cipher.decrypt(data, output);
			}
		};
	}
	Object.assign(wrappedCipher, params);
	return wrappedCipher;
};
/**
* By default, returns u8a of length.
* When out is available, it checks it for validity and uses it.
* @param expectedLength - Required output length.
* @param out - Optional destination buffer.
* @param onlyAligned - Whether `out` must be 4-byte aligned.
* @returns Output buffer ready for writing.
* @throws On wrong argument types. {@link TypeError}
* @throws If the provided output buffer has the wrong size. {@link RangeError}
* @throws If the provided output buffer has the wrong alignment. {@link Error}
* @example
* Reuses a caller-provided output buffer when lengths match.
*
* ```ts
* getOutput(16, new Uint8Array(16));
* ```
*/
function getOutput(expectedLength, out, onlyAligned = true) {
	if (out === void 0) return new Uint8Array(expectedLength);
	abytes$1(out, expectedLength, "output");
	if (onlyAligned && !isAligned32(out)) throw new Error("invalid output, must be aligned");
	return out;
}
/**
* Encodes data and AAD lengths into a 16-byte buffer.
* @param dataLength - Data length. Units are caller-defined: GCM passes bit
* lengths, ChaCha20-Poly1305 passes byte lengths — the helper writes the raw values.
* @param aadLength - AAD length, same unit convention as `dataLength`.
* The serialized block is still `aadLength || dataLength`, matching GCM/Poly1305
* conventions even though the helper parameter order is `(dataLength, aadLength)`.
* @param isLE - Whether to encode lengths as little-endian.
* @returns 16-byte length block.
* @throws On wrong argument types passed to the endian validator. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Builds the length block appended by GCM and Poly1305.
*
* ```ts
* u64Lengths(16, 8, true);
* ```
*/
function u64Lengths(dataLength, aadLength, isLE) {
	anumber$1(dataLength);
	anumber$1(aadLength);
	abool$1(isLE);
	const num = /* @__PURE__ */ new Uint8Array(16);
	const view = createView(num);
	view.setBigUint64(0, BigInt(aadLength), isLE);
	view.setBigUint64(8, BigInt(dataLength), isLE);
	return num;
}
/**
* Checks whether a byte array is aligned to a 4-byte offset.
* @param bytes - Byte array to inspect.
* @returns `true` when the view is 4-byte aligned.
* @example
* Checks whether a buffer can be safely viewed as Uint32Array.
*
* ```ts
* isAligned32(new Uint8Array(4));
* ```
*/
function isAligned32(bytes) {
	return bytes.byteOffset % 4 === 0;
}
/**
* Copies bytes into a new Uint8Array.
* @param bytes - Bytes to copy.
* @returns Copied byte array.
* @throws On wrong argument types. {@link TypeError}
* @example
* Copies input into an aligned Uint8Array before block processing.
*
* ```ts
* copyBytes(new Uint8Array([1, 2]));
* ```
*/
function copyBytes$1(bytes) {
	return Uint8Array.from(abytes$1(bytes));
}
//#endregion
//#region ../../node_modules/@noble/ciphers/_arx.js
/**
* Basic utils for ARX (add-rotate-xor) salsa and chacha ciphers.

RFC8439 requires multi-step cipher stream, where
authKey starts with counter: 0, actual msg with counter: 1.

For this, we need a way to re-use nonce / counter:

const counter = new Uint8Array(4);
chacha(..., counter, ...); // counter is now 1
chacha(..., counter, ...); // counter is now 2

This is complicated:

- 32-bit counters are enough, no need for 64-bit: max ArrayBuffer size in JS is 4GB
- Original papers don't allow mutating counters
- Counter overflow is undefined [^1]
- Idea A: allow providing (nonce | counter) instead of just nonce, re-use it
- Caveat: Cannot be re-used through all cases:
- * chacha has (counter | nonce)
- * xchacha has (nonce16 | counter | nonce16)
- Idea B: separate nonce / counter and provide separate API for counter re-use
- Caveat: there are different counter sizes depending on an algorithm.
- salsa & chacha also differ in structures of key & sigma:
salsa20:      s[0] | k(4) | s[1] | nonce(2) | cnt(2) | s[2] | k(4) | s[3]
chacha:       s(4) | k(8) | cnt(1) | nonce(3)
chacha20orig: s(4) | k(8) | cnt(2) | nonce(2)
- Idea C: helper method such as `setSalsaState(key, nonce, sigma, data)`
- Caveat: we can't re-use counter array

xchacha uses the subkey and remaining 8 byte nonce with ChaCha20 as normal
(prefixed by 4 NUL bytes, since RFC8439 specifies a 12-byte nonce).
Counter overflow is undefined; see {@link https://mailarchive.ietf.org/arch/msg/cfrg/gsOnTJzcbgG6OqD8Sc0GO5aR_tU/ | the CFRG thread}.
Current noble policy is strict non-wrap for the shared 32-bit counter path:
exported ARX ciphers reject initial `0xffffffff` and stop before any implicit
wrap back to zero.
See {@link https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-xchacha#appendix-A.2 | the XChaCha appendix} for the extended-nonce construction.

* @module
*/
const encodeStr = (str) => Uint8Array.from(str.split(""), (c) => c.charCodeAt(0));
const sigma16_32 = /* @__PURE__ */ (() => swap32IfBE(u32(encodeStr("expand 16-byte k"))))();
const sigma32_32 = /* @__PURE__ */ (() => swap32IfBE(u32(encodeStr("expand 32-byte k"))))();
/**
* Rotates a 32-bit word left.
* @param a - Input word.
* @param b - Rotation count in bits.
* @returns Rotated 32-bit word.
* @example
* Moves the top byte of `0x12345678` into the low byte position.
* ```ts
* rotl(0x12345678, 8);
* ```
*/
function rotl(a, b) {
	return a << b | a >>> 32 - b;
}
const BLOCK_LEN = 64;
const BLOCK_LEN32 = 16;
const MAX_COUNTER = /* @__PURE__ */ (() => 2 ** 32 - 1)();
const U32_EMPTY = /* @__PURE__ */ Uint32Array.of();
function runCipher(core, sigma, key, nonce, data, output, counter, rounds) {
	const len = data.length;
	const block = new Uint8Array(BLOCK_LEN);
	const b32 = u32(block);
	const isAligned = isLE && isAligned32(data) && isAligned32(output);
	const d32 = isAligned ? u32(data) : U32_EMPTY;
	const o32 = isAligned ? u32(output) : U32_EMPTY;
	if (!isLE) {
		for (let pos = 0; pos < len; counter++) {
			core(sigma, key, nonce, b32, counter, rounds);
			swap32IfBE(b32);
			if (counter >= MAX_COUNTER) throw new Error("arx: counter overflow");
			const take = Math.min(BLOCK_LEN, len - pos);
			for (let j = 0, posj; j < take; j++) {
				posj = pos + j;
				output[posj] = data[posj] ^ block[j];
			}
			pos += take;
		}
		return;
	}
	for (let pos = 0; pos < len; counter++) {
		core(sigma, key, nonce, b32, counter, rounds);
		if (counter >= MAX_COUNTER) throw new Error("arx: counter overflow");
		const take = Math.min(BLOCK_LEN, len - pos);
		if (isAligned && take === BLOCK_LEN) {
			const pos32 = pos / 4;
			if (pos % 4 !== 0) throw new Error("arx: invalid block position");
			for (let j = 0, posj; j < BLOCK_LEN32; j++) {
				posj = pos32 + j;
				o32[posj] = d32[posj] ^ b32[j];
			}
			pos += BLOCK_LEN;
			continue;
		}
		for (let j = 0, posj; j < take; j++) {
			posj = pos + j;
			output[posj] = data[posj] ^ block[j];
		}
		pos += take;
	}
}
/**
* Creates an ARX stream cipher from a 32-bit core permutation.
* Used internally to build the exported Salsa and ChaCha stream ciphers.
* @param core - Core function that fills one keystream block.
* @param opts - Cipher layout and nonce-extension options. See {@link CipherOpts}.
* @returns Stream cipher function over byte arrays.
* @throws If the core callback, key size, counter, or output sizing is invalid. {@link Error}
*/
function createCipher(core, opts) {
	const { allowShortKeys, extendNonceFn, counterLength, counterRight, rounds } = checkOpts({
		allowShortKeys: false,
		counterLength: 8,
		counterRight: false,
		rounds: 20
	}, opts);
	if (typeof core !== "function") throw new Error("core must be a function");
	anumber$1(counterLength);
	anumber$1(rounds);
	abool$1(counterRight);
	abool$1(allowShortKeys);
	return (key, nonce, data, output, counter = 0) => {
		abytes$1(key, void 0, "key");
		abytes$1(nonce, void 0, "nonce");
		abytes$1(data, void 0, "data");
		const len = data.length;
		const hasOutput = output !== void 0;
		output = getOutput(len, output, false);
		if (hasOutput) complexOverlapBytes(data, output);
		anumber$1(counter);
		if (counter < 0 || counter >= MAX_COUNTER) throw new Error("arx: counter overflow");
		const toClean = [];
		let l = key.length;
		let k;
		let sigma;
		if (l === 32) {
			toClean.push(k = copyBytes$1(key));
			sigma = sigma32_32;
		} else if (l === 16 && allowShortKeys) {
			k = /* @__PURE__ */ new Uint8Array(32);
			k.set(key);
			k.set(key, 16);
			sigma = sigma16_32;
			toClean.push(k);
		} else {
			abytes$1(key, 32, "arx key");
			throw new Error("invalid key size");
		}
		if (!isLE || !isAligned32(nonce)) toClean.push(nonce = copyBytes$1(nonce));
		let k32 = u32(k);
		if (extendNonceFn) {
			if (nonce.length !== 24) throw new Error("arx: extended nonce must be 24 bytes");
			const n16 = nonce.subarray(0, 16);
			if (isLE) extendNonceFn(sigma, k32, u32(n16), k32);
			else {
				const sigmaRaw = swap32IfBE(Uint32Array.from(sigma));
				extendNonceFn(sigmaRaw, k32, u32(n16), k32);
				clean(sigmaRaw);
				swap32IfBE(k32);
			}
			nonce = nonce.subarray(16);
		} else if (!isLE) swap32IfBE(k32);
		const nonceNcLen = 16 - counterLength;
		if (nonceNcLen !== nonce.length) throw new Error(`arx: nonce must be ${nonceNcLen} or 16 bytes`);
		if (nonceNcLen !== 12) {
			const nc = /* @__PURE__ */ new Uint8Array(12);
			nc.set(nonce, counterRight ? 0 : 12 - nonce.length);
			nonce = nc;
			toClean.push(nonce);
		}
		const n32 = swap32IfBE(u32(nonce));
		try {
			runCipher(core, sigma, k32, n32, data, output, counter, rounds);
			return output;
		} finally {
			clean(...toClean);
		}
	};
}
//#endregion
//#region ../../node_modules/@noble/ciphers/_poly1305.js
/**
* Poly1305 ({@link https://cr.yp.to/mac/poly1305-20050329.pdf | PDF},
* {@link https://en.wikipedia.org/wiki/Poly1305 | wiki})
* is a fast and parallel secret-key message-authentication code suitable for
* a wide variety of applications. It was standardized in
* {@link https://www.rfc-editor.org/rfc/rfc8439 | RFC 8439} and is now used in TLS 1.3.
*
* Polynomial MACs are not perfect for every situation:
* they lack Random Key Robustness: the MAC can be forged, and can't be used in PAKE schemes.
* See {@link https://keymaterial.net/2020/09/07/invisible-salamanders-in-aes-gcm-siv/ | the invisible salamanders attack writeup}.
* To combat invisible salamanders, `hash(key)` can be included in ciphertext,
* however, this would violate ciphertext indistinguishability:
* an attacker would know which key was used - so `HKDF(key, i)`
* could be used instead.
*
* Check out the {@link https://cr.yp.to/mac.html | original website}.
* Based on public-domain {@link https://github.com/floodyberry/poly1305-donna | poly1305-donna}.
* @module
*/
function u8to16(a, i) {
	return a[i++] & 255 | (a[i++] & 255) << 8;
}
/**
* Incremental Poly1305 MAC state.
* Prefer `poly1305()` for one-shot use.
* @param key - 32-byte Poly1305 one-time key.
* @example
* Feeds one chunk into an incremental Poly1305 state with a fresh one-time key.
*
* ```ts
* import { Poly1305 } from '@noble/ciphers/_poly1305.js';
* import { randomBytes } from '@noble/ciphers/utils.js';
* const key = randomBytes(32);
* const mac = new Poly1305(key);
* mac.update(new Uint8Array([1, 2, 3]));
* mac.digest();
* ```
*/
var Poly1305 = class {
	blockLen = 16;
	outputLen = 16;
	buffer = /* @__PURE__ */ new Uint8Array(16);
	r = /* @__PURE__ */ new Uint16Array(10);
	h = /* @__PURE__ */ new Uint16Array(10);
	pad = /* @__PURE__ */ new Uint16Array(8);
	pos = 0;
	finished = false;
	destroyed = false;
	constructor(key) {
		key = copyBytes$1(abytes$1(key, 32, "key"));
		const t0 = u8to16(key, 0);
		const t1 = u8to16(key, 2);
		const t2 = u8to16(key, 4);
		const t3 = u8to16(key, 6);
		const t4 = u8to16(key, 8);
		const t5 = u8to16(key, 10);
		const t6 = u8to16(key, 12);
		const t7 = u8to16(key, 14);
		this.r[0] = t0 & 8191;
		this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
		this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
		this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
		this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
		this.r[5] = t4 >>> 1 & 8190;
		this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
		this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
		this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
		this.r[9] = t7 >>> 5 & 127;
		for (let i = 0; i < 8; i++) this.pad[i] = u8to16(key, 16 + 2 * i);
	}
	process(data, offset, isLast = false) {
		const hibit = isLast ? 0 : 2048;
		const { h, r } = this;
		const r0 = r[0];
		const r1 = r[1];
		const r2 = r[2];
		const r3 = r[3];
		const r4 = r[4];
		const r5 = r[5];
		const r6 = r[6];
		const r7 = r[7];
		const r8 = r[8];
		const r9 = r[9];
		const t0 = u8to16(data, offset + 0);
		const t1 = u8to16(data, offset + 2);
		const t2 = u8to16(data, offset + 4);
		const t3 = u8to16(data, offset + 6);
		const t4 = u8to16(data, offset + 8);
		const t5 = u8to16(data, offset + 10);
		const t6 = u8to16(data, offset + 12);
		const t7 = u8to16(data, offset + 14);
		let h0 = h[0] + (t0 & 8191);
		let h1 = h[1] + ((t0 >>> 13 | t1 << 3) & 8191);
		let h2 = h[2] + ((t1 >>> 10 | t2 << 6) & 8191);
		let h3 = h[3] + ((t2 >>> 7 | t3 << 9) & 8191);
		let h4 = h[4] + ((t3 >>> 4 | t4 << 12) & 8191);
		let h5 = h[5] + (t4 >>> 1 & 8191);
		let h6 = h[6] + ((t4 >>> 14 | t5 << 2) & 8191);
		let h7 = h[7] + ((t5 >>> 11 | t6 << 5) & 8191);
		let h8 = h[8] + ((t6 >>> 8 | t7 << 8) & 8191);
		let h9 = h[9] + (t7 >>> 5 | hibit);
		let c = 0;
		let d0 = c + h0 * r0 + h1 * (5 * r9) + h2 * (5 * r8) + h3 * (5 * r7) + h4 * (5 * r6);
		c = d0 >>> 13;
		d0 &= 8191;
		d0 += h5 * (5 * r5) + h6 * (5 * r4) + h7 * (5 * r3) + h8 * (5 * r2) + h9 * (5 * r1);
		c += d0 >>> 13;
		d0 &= 8191;
		let d1 = c + h0 * r1 + h1 * r0 + h2 * (5 * r9) + h3 * (5 * r8) + h4 * (5 * r7);
		c = d1 >>> 13;
		d1 &= 8191;
		d1 += h5 * (5 * r6) + h6 * (5 * r5) + h7 * (5 * r4) + h8 * (5 * r3) + h9 * (5 * r2);
		c += d1 >>> 13;
		d1 &= 8191;
		let d2 = c + h0 * r2 + h1 * r1 + h2 * r0 + h3 * (5 * r9) + h4 * (5 * r8);
		c = d2 >>> 13;
		d2 &= 8191;
		d2 += h5 * (5 * r7) + h6 * (5 * r6) + h7 * (5 * r5) + h8 * (5 * r4) + h9 * (5 * r3);
		c += d2 >>> 13;
		d2 &= 8191;
		let d3 = c + h0 * r3 + h1 * r2 + h2 * r1 + h3 * r0 + h4 * (5 * r9);
		c = d3 >>> 13;
		d3 &= 8191;
		d3 += h5 * (5 * r8) + h6 * (5 * r7) + h7 * (5 * r6) + h8 * (5 * r5) + h9 * (5 * r4);
		c += d3 >>> 13;
		d3 &= 8191;
		let d4 = c + h0 * r4 + h1 * r3 + h2 * r2 + h3 * r1 + h4 * r0;
		c = d4 >>> 13;
		d4 &= 8191;
		d4 += h5 * (5 * r9) + h6 * (5 * r8) + h7 * (5 * r7) + h8 * (5 * r6) + h9 * (5 * r5);
		c += d4 >>> 13;
		d4 &= 8191;
		let d5 = c + h0 * r5 + h1 * r4 + h2 * r3 + h3 * r2 + h4 * r1;
		c = d5 >>> 13;
		d5 &= 8191;
		d5 += h5 * r0 + h6 * (5 * r9) + h7 * (5 * r8) + h8 * (5 * r7) + h9 * (5 * r6);
		c += d5 >>> 13;
		d5 &= 8191;
		let d6 = c + h0 * r6 + h1 * r5 + h2 * r4 + h3 * r3 + h4 * r2;
		c = d6 >>> 13;
		d6 &= 8191;
		d6 += h5 * r1 + h6 * r0 + h7 * (5 * r9) + h8 * (5 * r8) + h9 * (5 * r7);
		c += d6 >>> 13;
		d6 &= 8191;
		let d7 = c + h0 * r7 + h1 * r6 + h2 * r5 + h3 * r4 + h4 * r3;
		c = d7 >>> 13;
		d7 &= 8191;
		d7 += h5 * r2 + h6 * r1 + h7 * r0 + h8 * (5 * r9) + h9 * (5 * r8);
		c += d7 >>> 13;
		d7 &= 8191;
		let d8 = c + h0 * r8 + h1 * r7 + h2 * r6 + h3 * r5 + h4 * r4;
		c = d8 >>> 13;
		d8 &= 8191;
		d8 += h5 * r3 + h6 * r2 + h7 * r1 + h8 * r0 + h9 * (5 * r9);
		c += d8 >>> 13;
		d8 &= 8191;
		let d9 = c + h0 * r9 + h1 * r8 + h2 * r7 + h3 * r6 + h4 * r5;
		c = d9 >>> 13;
		d9 &= 8191;
		d9 += h5 * r4 + h6 * r3 + h7 * r2 + h8 * r1 + h9 * r0;
		c += d9 >>> 13;
		d9 &= 8191;
		c = (c << 2) + c | 0;
		c = c + d0 | 0;
		d0 = c & 8191;
		c = c >>> 13;
		d1 += c;
		h[0] = d0;
		h[1] = d1;
		h[2] = d2;
		h[3] = d3;
		h[4] = d4;
		h[5] = d5;
		h[6] = d6;
		h[7] = d7;
		h[8] = d8;
		h[9] = d9;
	}
	finalize() {
		const { h, pad } = this;
		const g = /* @__PURE__ */ new Uint16Array(10);
		let c = h[1] >>> 13;
		h[1] &= 8191;
		for (let i = 2; i < 10; i++) {
			h[i] += c;
			c = h[i] >>> 13;
			h[i] &= 8191;
		}
		h[0] += c * 5;
		c = h[0] >>> 13;
		h[0] &= 8191;
		h[1] += c;
		c = h[1] >>> 13;
		h[1] &= 8191;
		h[2] += c;
		g[0] = h[0] + 5;
		c = g[0] >>> 13;
		g[0] &= 8191;
		for (let i = 1; i < 10; i++) {
			g[i] = h[i] + c;
			c = g[i] >>> 13;
			g[i] &= 8191;
		}
		g[9] -= 8192;
		let mask = (c ^ 1) - 1;
		for (let i = 0; i < 10; i++) g[i] &= mask;
		mask = ~mask;
		for (let i = 0; i < 10; i++) h[i] = h[i] & mask | g[i];
		h[0] = (h[0] | h[1] << 13) & 65535;
		h[1] = (h[1] >>> 3 | h[2] << 10) & 65535;
		h[2] = (h[2] >>> 6 | h[3] << 7) & 65535;
		h[3] = (h[3] >>> 9 | h[4] << 4) & 65535;
		h[4] = (h[4] >>> 12 | h[5] << 1 | h[6] << 14) & 65535;
		h[5] = (h[6] >>> 2 | h[7] << 11) & 65535;
		h[6] = (h[7] >>> 5 | h[8] << 8) & 65535;
		h[7] = (h[8] >>> 8 | h[9] << 5) & 65535;
		let f = h[0] + pad[0];
		h[0] = f & 65535;
		for (let i = 1; i < 8; i++) {
			f = (h[i] + pad[i] | 0) + (f >>> 16) | 0;
			h[i] = f & 65535;
		}
		clean(g);
	}
	update(data) {
		aexists(this);
		abytes$1(data);
		data = copyBytes$1(data);
		const { buffer, blockLen } = this;
		const len = data.length;
		for (let pos = 0; pos < len;) {
			const take = Math.min(blockLen - this.pos, len - pos);
			if (take === blockLen) {
				for (; blockLen <= len - pos; pos += blockLen) this.process(data, pos);
				continue;
			}
			buffer.set(data.subarray(pos, pos + take), this.pos);
			this.pos += take;
			pos += take;
			if (this.pos === blockLen) {
				this.process(buffer, 0, false);
				this.pos = 0;
			}
		}
		return this;
	}
	destroy() {
		this.destroyed = true;
		clean(this.h, this.r, this.buffer, this.pad);
	}
	digestInto(out) {
		aexists(this);
		aoutput(out, this);
		this.finished = true;
		const { buffer, h } = this;
		let { pos } = this;
		if (pos) {
			buffer[pos++] = 1;
			for (; pos < 16; pos++) buffer[pos] = 0;
			this.process(buffer, 0, true);
		}
		this.finalize();
		let opos = 0;
		for (let i = 0; i < 8; i++) {
			out[opos++] = h[i] >>> 0;
			out[opos++] = h[i] >>> 8;
		}
	}
	digest() {
		const { buffer, outputLen } = this;
		this.digestInto(buffer);
		const res = buffer.slice(0, outputLen);
		this.destroy();
		return res;
	}
};
/**
* Poly1305 MAC from RFC 8439.
* @param msg - Message bytes to authenticate.
* @param key - 32-byte Poly1305 one-time key.
* @returns 16-byte authentication tag.
* @example
* Authenticates one message with a one-shot Poly1305 call and a fresh key.
*
* ```ts
* import { poly1305 } from '@noble/ciphers/_poly1305.js';
* import { randomBytes } from '@noble/ciphers/utils.js';
* const key = randomBytes(32);
* poly1305(new Uint8Array(), key);
* ```
*/
const poly1305 = /* @__PURE__ */ wrapMacConstructor(32, (key) => new Poly1305(key));
//#endregion
//#region ../../node_modules/@noble/ciphers/chacha.js
/**
* ChaCha stream cipher, released
* in 2008. Developed after Salsa20, ChaCha aims to increase diffusion per round.
* It was standardized in
* {@link https://www.rfc-editor.org/rfc/rfc8439 | RFC 8439} and
* is now used in TLS 1.3.
*
* {@link https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-xchacha | XChaCha20}
* extended-nonce variant is also provided. Similar to XSalsa, it's safe to use with
* randomly-generated nonces.
*
* Check out
* {@link http://cr.yp.to/chacha/chacha-20080128.pdf | PDF},
* {@link https://en.wikipedia.org/wiki/Salsa20 | wiki}, and
* {@link https://cr.yp.to/chacha.html | website}.
*
* @module
*/
/**
* ChaCha core function. Uses an unrolled loop (chachaCore, hchacha) - 4x
* faster than a simple loop, but larger & harder to read. A simple-loop
* reference version lives in `test/misc/micro-ciphers.ts`;
* `test/arx.test.ts` keeps the two aligned.
* The specific implementation is selected in `createCipher` below.
*/
/** RFC 8439 §2.3 block core for `state = constants | key | counter | nonce`. */
function chachaCore(s, k, n, out, cnt, rounds = 20) {
	let y00 = s[0], y01 = s[1], y02 = s[2], y03 = s[3], y04 = k[0], y05 = k[1], y06 = k[2], y07 = k[3], y08 = k[4], y09 = k[5], y10 = k[6], y11 = k[7], y12 = cnt, y13 = n[0], y14 = n[1], y15 = n[2];
	let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
	for (let r = 0; r < rounds; r += 2) {
		x00 = x00 + x04 | 0;
		x12 = rotl(x12 ^ x00, 16);
		x08 = x08 + x12 | 0;
		x04 = rotl(x04 ^ x08, 12);
		x00 = x00 + x04 | 0;
		x12 = rotl(x12 ^ x00, 8);
		x08 = x08 + x12 | 0;
		x04 = rotl(x04 ^ x08, 7);
		x01 = x01 + x05 | 0;
		x13 = rotl(x13 ^ x01, 16);
		x09 = x09 + x13 | 0;
		x05 = rotl(x05 ^ x09, 12);
		x01 = x01 + x05 | 0;
		x13 = rotl(x13 ^ x01, 8);
		x09 = x09 + x13 | 0;
		x05 = rotl(x05 ^ x09, 7);
		x02 = x02 + x06 | 0;
		x14 = rotl(x14 ^ x02, 16);
		x10 = x10 + x14 | 0;
		x06 = rotl(x06 ^ x10, 12);
		x02 = x02 + x06 | 0;
		x14 = rotl(x14 ^ x02, 8);
		x10 = x10 + x14 | 0;
		x06 = rotl(x06 ^ x10, 7);
		x03 = x03 + x07 | 0;
		x15 = rotl(x15 ^ x03, 16);
		x11 = x11 + x15 | 0;
		x07 = rotl(x07 ^ x11, 12);
		x03 = x03 + x07 | 0;
		x15 = rotl(x15 ^ x03, 8);
		x11 = x11 + x15 | 0;
		x07 = rotl(x07 ^ x11, 7);
		x00 = x00 + x05 | 0;
		x15 = rotl(x15 ^ x00, 16);
		x10 = x10 + x15 | 0;
		x05 = rotl(x05 ^ x10, 12);
		x00 = x00 + x05 | 0;
		x15 = rotl(x15 ^ x00, 8);
		x10 = x10 + x15 | 0;
		x05 = rotl(x05 ^ x10, 7);
		x01 = x01 + x06 | 0;
		x12 = rotl(x12 ^ x01, 16);
		x11 = x11 + x12 | 0;
		x06 = rotl(x06 ^ x11, 12);
		x01 = x01 + x06 | 0;
		x12 = rotl(x12 ^ x01, 8);
		x11 = x11 + x12 | 0;
		x06 = rotl(x06 ^ x11, 7);
		x02 = x02 + x07 | 0;
		x13 = rotl(x13 ^ x02, 16);
		x08 = x08 + x13 | 0;
		x07 = rotl(x07 ^ x08, 12);
		x02 = x02 + x07 | 0;
		x13 = rotl(x13 ^ x02, 8);
		x08 = x08 + x13 | 0;
		x07 = rotl(x07 ^ x08, 7);
		x03 = x03 + x04 | 0;
		x14 = rotl(x14 ^ x03, 16);
		x09 = x09 + x14 | 0;
		x04 = rotl(x04 ^ x09, 12);
		x03 = x03 + x04 | 0;
		x14 = rotl(x14 ^ x03, 8);
		x09 = x09 + x14 | 0;
		x04 = rotl(x04 ^ x09, 7);
	}
	let oi = 0;
	out[oi++] = y00 + x00 | 0;
	out[oi++] = y01 + x01 | 0;
	out[oi++] = y02 + x02 | 0;
	out[oi++] = y03 + x03 | 0;
	out[oi++] = y04 + x04 | 0;
	out[oi++] = y05 + x05 | 0;
	out[oi++] = y06 + x06 | 0;
	out[oi++] = y07 + x07 | 0;
	out[oi++] = y08 + x08 | 0;
	out[oi++] = y09 + x09 | 0;
	out[oi++] = y10 + x10 | 0;
	out[oi++] = y11 + x11 | 0;
	out[oi++] = y12 + x12 | 0;
	out[oi++] = y13 + x13 | 0;
	out[oi++] = y14 + x14 | 0;
	out[oi++] = y15 + x15 | 0;
}
/**
* ChaCha stream cipher. Conforms to RFC 8439 (IETF, TLS). 12-byte nonce, 4-byte counter.
* With smaller nonce, it's not safe to make it random (CSPRNG), due to collision chance.
* @param key - 32-byte key.
* @param nonce - 12-byte nonce.
* @param data - Input bytes to xor with the keystream.
* @param output - Optional destination buffer.
* @param counter - Initial block counter.
* @returns Encrypted or decrypted bytes.
* @example
* Encrypts bytes with the RFC 8439 ChaCha20 stream cipher and a fresh key/nonce.
*
* ```ts
* import { chacha20 } from '@noble/ciphers/chacha.js';
* import { randomBytes } from '@noble/ciphers/utils.js';
* const key = randomBytes(32);
* const nonce = randomBytes(12);
* chacha20(key, nonce, new Uint8Array(4));
* ```
*/
const chacha20 = /* @__PURE__ */ createCipher(chachaCore, {
	counterRight: false,
	counterLength: 4,
	allowShortKeys: false
});
const ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
const updatePadded = (h, msg) => {
	h.update(msg);
	const leftover = msg.length % 16;
	if (leftover) h.update(ZEROS16.subarray(leftover));
};
const ZEROS32 = /* @__PURE__ */ new Uint8Array(32);
function computeTag(fn, key, nonce, ciphertext, AAD) {
	if (AAD !== void 0) abytes$1(AAD, void 0, "AAD");
	const authKey = fn(key, nonce, ZEROS32);
	const lengths = u64Lengths(ciphertext.length, AAD ? AAD.length : 0, true);
	const h = poly1305.create(authKey);
	if (AAD) updatePadded(h, AAD);
	updatePadded(h, ciphertext);
	h.update(lengths);
	const res = h.digest();
	clean(authKey, lengths);
	return res;
}
/**
* AEAD algorithm from RFC 8439.
* Salsa20 and chacha (RFC 8439) use poly1305 differently.
* We could have composed them, but it's hard because of authKey:
* In salsa20, authKey changes position in salsa stream.
* In chacha, authKey can't be computed inside computeTag, it modifies the counter.
*/
const _poly1305_aead = (xorStream) => (key, nonce, AAD) => {
	const tagLength = 16;
	return {
		encrypt(plaintext, output) {
			const plength = plaintext.length;
			output = getOutput(plength + tagLength, output, false);
			output.set(plaintext);
			const oPlain = output.subarray(0, -16);
			xorStream(key, nonce, oPlain, oPlain, 1);
			const tag = computeTag(xorStream, key, nonce, oPlain, AAD);
			output.set(tag, plength);
			clean(tag);
			return output;
		},
		decrypt(ciphertext, output) {
			output = getOutput(ciphertext.length - tagLength, output, false);
			const data = ciphertext.subarray(0, -16);
			const passedTag = ciphertext.subarray(-16);
			const tag = computeTag(xorStream, key, nonce, data, AAD);
			if (!equalBytes(passedTag, tag)) {
				clean(tag);
				throw new Error("invalid tag");
			}
			output.set(ciphertext.subarray(0, -16));
			xorStream(key, nonce, output, output, 1);
			clean(tag);
			return output;
		}
	};
};
/**
* ChaCha20-Poly1305 from RFC 8439.
*
* Unsafe to use random nonces under the same key, due to collision chance.
* Prefer XChaCha instead.
* @param key - 32-byte key.
* @param nonce - 12-byte nonce.
* @param AAD - Additional authenticated data.
* @returns AEAD cipher instance.
* @example
* Encrypts and authenticates plaintext with a fresh key and nonce.
*
* ```ts
* import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
* import { randomBytes } from '@noble/ciphers/utils.js';
* const key = randomBytes(32);
* const nonce = randomBytes(12);
* const aad = new TextEncoder().encode('session metadata');
* const cipher = chacha20poly1305(key, nonce, aad);
* cipher.encrypt(new Uint8Array([1, 2, 3]));
* ```
*/
const chacha20poly1305 = /* @__PURE__ */ wrapCipher({
	blockSize: 64,
	nonceLength: 12,
	tagLength: 16,
	withAAD: true
}, /* @__PURE__ */ _poly1305_aead(chacha20));
//#endregion
//#region ../../node_modules/@noble/curves/utils.js
/**
* Hex, bytes and number utilities.
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
/**
* Validates that a value is an array, optionally validating each element.
* @param item - Value to validate.
* @param title - Label included in thrown errors.
* @param inner - Optional per-element validator, called with the element and its label.
* @returns The validated array.
* @example
* Validate an array of points before batch processing.
*
* ```ts
* aarray([1n, 2n], 'scalars');
* ```
*/
function aarray(item, title, inner = () => {}) {
	if (!Array.isArray(item)) throw new TypeError(`"${title}" expected array, got type=${typeof item}`);
	for (let i = 0; i < item.length; i++) inner(item[i], `${title}[${i}]`);
	return item;
}
/**
* Validates that a value is a byte array.
* @param value - Value to validate.
* @param length - Optional exact byte length.
* @param title - Optional field name.
* @returns Original byte array.
* @example
* Reject non-byte input before passing data into curve code.
*
* ```ts
* abytes(new Uint8Array(1));
* ```
*/
const abytes = (value, length, title) => abytes$2(value, length, title);
/**
* Validates that a value is a non-negative safe integer.
* @param n - Value to validate.
* @param title - Optional field name.
* @returns The validated number.
* @example
* Validate a numeric length before allocating buffers.
*
* ```ts
* anumber(1);
* ```
*/
const anumber = anumber$2;
/**
* Asserts something is a string.
* @param value - Value to validate.
* @param title - Label included in thrown errors.
* @returns The validated string.
* @throws On wrong argument types. {@link TypeError}
* @example
* Validate a label string.
*
* ```ts
* astring('example', 'label');
* ```
*/
function astring(value, title = "") {
	if (typeof value !== "string") {
		const prefix = title && `"${title}" `;
		throw new TypeError(prefix + "expected string, got type=" + typeof value);
	}
	return value;
}
/**
* Asserts something is a plain object-ish value, not null or array.
* @param value - Value to validate.
* @param title - Label included in thrown errors.
* @returns The validated object.
* @throws On wrong argument types. {@link TypeError}
* @example
* Validate an options object before checking fields.
*
* ```ts
* aobject({ flag: true });
* ```
*/
function aobject(value, title = "object") {
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(title === "object" ? "expected valid options object" : `"${title}" expected object, got type=${typeof value}`);
	return value;
}
/**
* Asserts something is a function.
* @param value - Value to validate.
* @param title - Label included in thrown errors.
* @returns The validated function.
* @throws On wrong argument types. {@link TypeError}
* @example
* Validate a required method before calling it.
*
* ```ts
* afunction(() => true, 'predicate');
* ```
*/
function afunction(value, title) {
	if (typeof value !== "function") throw new TypeError(`"${title}" is invalid: expected function, got ${typeof value}`);
	return value;
}
/**
* Encodes bytes as lowercase hex.
* @param bytes - Bytes to encode.
* @returns Lowercase hex string.
* @example
* Serialize bytes as hex for logging or fixtures.
*
* ```ts
* bytesToHex(Uint8Array.of(1, 2, 3));
* ```
*/
const bytesToHex = bytesToHex$1;
/**
* Concatenates byte arrays.
* @param arrays - Byte arrays to join.
* @returns Concatenated bytes.
* @example
* Join domain-separated chunks into one buffer.
*
* ```ts
* concatBytes(Uint8Array.of(1), Uint8Array.of(2));
* ```
*/
const concatBytes = (...arrays) => concatBytes$1(...arrays);
/**
* Decodes lowercase or uppercase hex into bytes.
* @param hex - Hex string to decode.
* @returns Decoded bytes.
* @example
* Parse fixture hex into bytes before hashing.
*
* ```ts
* hexToBytes('0102');
* ```
*/
const hexToBytes$1 = (hex) => hexToBytes$2(hex);
/**
* Checks whether a value is a Uint8Array.
* @param a - Value to inspect.
* @returns `true` when `a` is a Uint8Array.
* @example
* Branch on byte input before decoding it.
*
* ```ts
* isBytes(new Uint8Array(1));
* ```
*/
const isBytes$1 = isBytes$3;
/**
* Reads random bytes from the platform CSPRNG.
* @param bytesLength - Number of random bytes to read.
* @returns Fresh random bytes.
* @example
* Generate a random seed for a keypair.
*
* ```ts
* randomBytes(2);
* ```
*/
const randomBytes$1 = (bytesLength) => randomBytes$2(bytesLength);
const _0n$4 = /* @__PURE__ */ BigInt(0);
const _1n$3 = /* @__PURE__ */ BigInt(1);
const atitle = (title) => title ? `"${title}" ` : "";
/**
* Validates that a flag is boolean.
* @param value - Value to validate.
* @param title - Optional field name.
* @returns Original value.
* @throws On wrong argument types. {@link TypeError}
* @example
* Reject non-boolean option flags early.
*
* ```ts
* abool(true);
* ```
*/
function abool(value, title = "") {
	if (typeof value !== "boolean") throw new TypeError(atitle(title) + "expected boolean, got type=" + typeof value);
	return value;
}
/**
* Validates that a value is a non-negative bigint or safe integer.
* @param n - Value to validate.
* @returns The same validated value.
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate one integer-like value before serializing it.
*
* ```ts
* abignumber(1n);
* ```
*/
function abignumber(n) {
	if (typeof n === "bigint") {
		if (!isPosBig(n)) throw new RangeError("positive bigint expected, got " + n);
	} else anumber(n);
	return n;
}
/**
* Validates that a value is a safe integer.
* @param value - Integer to validate.
* @param title - Optional field name.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate a window size before scalar arithmetic uses it.
*
* ```ts
* asafenumber(1);
* ```
*/
function asafenumber(value, title = "") {
	if (typeof value !== "number") {
		const prefix = title && `"${title}" `;
		throw new TypeError(prefix + "expected number, got type=" + typeof value);
	}
	if (!Number.isSafeInteger(value)) {
		const prefix = title && `"${title}" `;
		throw new RangeError(prefix + "expected safe integer, got " + value);
	}
}
/**
* Encodes a bigint into even-length big-endian hex.
* The historical "unpadded" name only means "no fixed-width field padding"; odd-length hex still
* gets one leading zero nibble so the result always represents whole bytes.
* @param num - Number to encode.
* @returns Big-endian hex string.
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Encode a scalar into hex without a `0x` prefix.
*
* ```ts
* numberToHexUnpadded(255n);
* ```
*/
function numberToHexUnpadded(num) {
	const hex = abignumber(num).toString(16);
	return hex.length & 1 ? "0" + hex : hex;
}
/**
* Parses a big-endian hex string into bigint.
* Accepts odd-length hex through the native `BigInt('0x' + hex)` parser and currently surfaces the
* same native `SyntaxError` for malformed hex instead of wrapping it in a library-specific error.
* @param hex - Hex string without `0x`.
* @returns Parsed bigint value.
* @throws On wrong argument types. {@link TypeError}
* @example
* Parse a scalar from fixture hex.
*
* ```ts
* hexToNumber('ff');
* ```
*/
function hexToNumber(hex) {
	if (typeof hex !== "string") throw new TypeError("hex string expected, got " + typeof hex);
	return hex === "" ? _0n$4 : BigInt("0x" + hex);
}
/**
* Parses big-endian bytes into bigint.
* @param bytes - Bytes in big-endian order.
* @returns Parsed bigint value.
* @throws On wrong argument types. {@link TypeError}
* @example
* Read a scalar encoded in network byte order.
*
* ```ts
* bytesToNumberBE(Uint8Array.of(1, 0));
* ```
*/
function bytesToNumberBE(bytes) {
	return hexToNumber(bytesToHex$1(bytes));
}
/**
* Parses little-endian bytes into bigint.
* @param bytes - Bytes in little-endian order.
* @returns Parsed bigint value.
* @throws On wrong argument types. {@link TypeError}
* @example
* Read a scalar encoded in little-endian form.
*
* ```ts
* bytesToNumberLE(Uint8Array.of(1, 0));
* ```
*/
function bytesToNumberLE(bytes) {
	return hexToNumber(bytesToHex$1(copyBytes(abytes$2(bytes)).reverse()));
}
/**
* Encodes a bigint into fixed-length big-endian bytes.
* @param n - Number to encode.
* @param len - Output length in bytes. Must be greater than zero.
* @returns Big-endian byte array.
* @throws On wrong argument ranges or values. {@link RangeError}
* @throws If a documented runtime validation or state check fails. {@link Error}
* @example
* Serialize a scalar into a 32-byte field element.
*
* ```ts
* numberToBytesBE(255n, 2);
* ```
*/
function numberToBytesBE(n, len) {
	anumber$2(len);
	if (len === 0) throw new Error("zero output length is invalid");
	n = abignumber(n);
	const expectedLen = len * 2;
	const hex = n.toString(16);
	if (hex.length > expectedLen) throw new RangeError("number is too large");
	return hexToBytes$2(hex.padStart(expectedLen, "0"));
}
/**
* Encodes a bigint into fixed-length little-endian bytes.
* @param n - Number to encode.
* @param len - Output length in bytes.
* @returns Little-endian byte array.
* @throws On wrong argument ranges or values. {@link RangeError}
* @throws If a documented runtime validation or state check fails. {@link Error}
* @example
* Serialize a scalar for little-endian protocols.
*
* ```ts
* numberToBytesLE(255n, 2);
* ```
*/
function numberToBytesLE(n, len) {
	return numberToBytesBE(n, len).reverse();
}
/**
* Copies Uint8Array. We can't use u8a.slice(), because u8a can be Buffer,
* and Buffer#slice creates mutable copy. Never use Buffers!
* @param bytes - Bytes to copy.
* @returns Detached copy.
* @example
* Make an isolated copy before mutating serialized bytes.
*
* ```ts
* copyBytes(Uint8Array.of(1, 2, 3));
* ```
*/
function copyBytes(bytes) {
	return Uint8Array.from(abytes(bytes));
}
/**
* Checks whether n is non-negative bigint. Historical name.
* @param n - candidate value
* @returns `true` when the value is bigint and 0 or larger
* @example
* Check a candidate scalar before range validation.
*
* ```ts
* isPosBig(2n);
* ```
*/
function isPosBig(n) {
	return typeof n === "bigint" && _0n$4 <= n;
}
/**
* Checks whether a bigint lies inside a half-open range.
* @param n - Candidate value.
* @param min - Inclusive lower bound.
* @param max - Exclusive upper bound.
* @returns `true` when the value is inside the range.
* @example
* Check whether a candidate scalar fits the field order.
*
* ```ts
* inRange(2n, 1n, 3n);
* ```
*/
function inRange(n, min, max) {
	return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
/**
* Asserts `min <= n < max`. NOTE: upper bound is exclusive.
* @param title - Value label for error messages.
* @param n - Candidate value.
* @param min - Inclusive lower bound.
* @param max - Exclusive upper bound.
* Wrong-type inputs are not separated from out-of-range values here: they still flow through the
* shared `RangeError` path because this is only a throwing wrapper around `inRange(...)`.
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Assert that a bigint stays within one half-open range.
*
* ```ts
* aInRange('x', 2n, 1n, 256n);
* ```
*/
function aInRange(title, n, min, max) {
	if (!inRange(n, min, max)) throw new RangeError("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
/**
* Calculates amount of bits in a bigint.
* Same as `n.toString(2).length`
* TODO: merge with nLength in modular
* @param n - Value to inspect.
* @returns Bit length.
* @throws If the value is negative. {@link Error}
* @example
* Measure the bit length of a scalar before serialization.
*
* ```ts
* bitLen(8n);
* ```
*/
function bitLen(n) {
	if (n < _0n$4) throw new Error("expected non-negative bigint, got " + n);
	return n === _0n$4 ? 0 : n.toString(2).length;
}
/**
* Calculate mask for N bits. Not using ** operator with bigints because of old engines.
* Same as BigInt(`0b${Array(i).fill('1').join('')}`)
* @param n - Number of bits. Negative widths are currently passed through to raw bigint shift
*   semantics and therefore produce `-1n`.
* @returns Bitmask value.
* @example
* Calculate mask for N bits.
*
* ```ts
* bitMask(4);
* ```
*/
const bitMask = (n) => {
	asafenumber(n, "n");
	return (_1n$3 << BigInt(n)) - _1n$3;
};
/**
* Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
* @param hashLen - Hash output size in bytes. Callers are expected to pass a positive length; `0`
*   is not rejected here and would make the internal generate loop non-progressing.
* @param qByteLen - Requested output size in bytes. Callers are expected to pass a positive length.
* @param hmacFn - HMAC implementation.
* @returns Function that will call DRBG until the predicate returns anything
*   other than `undefined`.
* @throws On wrong argument types. {@link TypeError}
* @example
* Build a deterministic nonce generator for RFC6979-style signing.
*
* ```ts
* import { createHmacDrbg } from '@noble/curves/utils.js';
* import { hmac } from '@noble/hashes/hmac.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const hmacFn = (key: Uint8Array, msg: Uint8Array) => hmac(sha256, key, msg);
* const drbg = createHmacDrbg(32, 32, hmacFn);
* const seed = new Uint8Array(32);
* drbg(seed, (bytes) => bytes);
* ```
*/
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
	anumber$2(hashLen, "hashLen");
	anumber$2(qByteLen, "qByteLen");
	if (typeof hmacFn !== "function") throw new TypeError("hmacFn must be a function");
	const u8n = (len) => new Uint8Array(len);
	const NULL = Uint8Array.of();
	const byte0 = Uint8Array.of(0);
	const byte1 = Uint8Array.of(1);
	const _maxDrbgIters = 1e3;
	let v = u8n(hashLen);
	let k = u8n(hashLen);
	let i = 0;
	const reset = () => {
		v.fill(1);
		k.fill(0);
		i = 0;
	};
	const h = (...msgs) => hmacFn(k, concatBytes(v, ...msgs));
	const reseed = (seed = NULL) => {
		k = h(byte0, seed);
		v = h();
		if (seed.length === 0) return;
		k = h(byte1, seed);
		v = h();
	};
	const gen = () => {
		if (i++ >= _maxDrbgIters) throw new Error("drbg: tried max amount of iterations");
		let len = 0;
		const out = [];
		while (len < qByteLen) {
			v = h();
			const sl = v.slice();
			out.push(sl);
			len += v.length;
		}
		return concatBytes(...out);
	};
	const genUntil = (seed, pred) => {
		reset();
		reseed(seed);
		let res = void 0;
		while ((res = pred(gen())) === void 0) reseed();
		reset();
		return res;
	};
	return genUntil;
}
/**
* Validates declared required and optional field types on a plain object.
* Extra keys are intentionally ignored because many callers validate only the subset they use from
* richer option bags or runtime objects.
* This walks field schemas and formats detailed errors, so avoid it on hot paths; use direct
* one-line guards such as `aobject()`, `afunction()`, `abool()`, or `asafenumber()` instead.
* @param object - Object to validate.
* @param fields - Required field types.
* @param optFields - Optional field types.
* @param title - Object label included in thrown errors.
* @throws On wrong argument types. {@link TypeError}
* @example
* Check user options before building a curve helper.
*
* ```ts
* validateObject({ flag: true }, { flag: 'boolean' });
* ```
*/
function validateObject(object, fields = {}, optFields = {}, title = "object") {
	aobject(object, title);
	aobject(fields, "fields");
	aobject(optFields, "optFields");
	function checkField(fieldName, expectedType, isOpt) {
		const label = title === "object" ? `param "${String(fieldName)}"` : `"${title}.${String(fieldName)}"`;
		const val = object[fieldName];
		if (!Object.hasOwn(object, fieldName) && (isOpt ? val !== void 0 : expectedType !== "function")) throw new TypeError(`${label} is invalid: expected own property`);
		if (isOpt && val === void 0) return;
		const current = typeof val;
		if (current !== expectedType || val === null) throw new TypeError(`${label} is invalid: expected ${expectedType}, got ${current}`);
	}
	const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
	iter(fields, false);
	iter(optFields, true);
}
//#endregion
//#region ../../node_modules/@noble/curves/abstract/modular.js
/**
* Utils for modular division and fields.
* Field over 11 is a finite (Galois) field is integer number operations `mod 11`.
* There is no division: it is replaced by modular multiplicative inverse.
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const _0n$3 = /* @__PURE__ */ BigInt(0);
const _1n$2 = /* @__PURE__ */ BigInt(1);
const _2n$2 = /* @__PURE__ */ BigInt(2);
const _3n$1 = /* @__PURE__ */ BigInt(3);
const _4n$2 = /* @__PURE__ */ BigInt(4);
const _5n = /* @__PURE__ */ BigInt(5);
const _7n = /* @__PURE__ */ BigInt(7);
const _8n = /* @__PURE__ */ BigInt(8);
const _9n = /* @__PURE__ */ BigInt(9);
const _15n = /* @__PURE__ */ BigInt(15);
const _16n = /* @__PURE__ */ BigInt(16);
const POW_WINDOWED_MIN = /* @__PURE__ */ BigInt("0x10000000000000000");
/**
* @param a - Dividend value.
* @param b - Positive modulus.
* @returns Reduced value in `[0, b)` only when `b` is positive.
* @throws If the modulus is not positive. {@link Error}
* @example
* Normalize a bigint into one field residue.
*
* ```ts
* mod(-1n, 5n);
* ```
*/
function mod(a, b) {
	if (b <= _0n$3) throw new Error("mod: expected positive modulus, got " + b);
	const result = a % b;
	return result >= _0n$3 ? result : b + result;
}
/**
* Efficiently raise num to a power with modular reduction.
* Unsafe in some contexts: uses ladder, so can expose bigint bits.
* Low-level helper: callers that need canonical residues must pass a valid `num` for the chosen
* modulus instead of relying on the `power===0/1` fast paths to normalize it.
* @param num - Base value.
* @param power - Exponent value.
* @param modulo - Reduction modulus.
* @returns Modular exponentiation result.
* @throws If the modulus or exponent is invalid. {@link Error}
* @example
* Raise one bigint to a modular power.
*
* ```ts
* pow(2n, 6n, 11n) // 64n % 11n == 9n
* ```
*/
function pow(num, power, modulo) {
	if (modulo <= _1n$2) throw new Error("pow: expected modulus > 1, got " + modulo);
	if (typeof power !== "bigint") throw new TypeError("invalid exponent: expected bigint, got " + typeof power);
	if (power < _0n$3) throw new Error("invalid exponent, negatives unsupported");
	if (power === _0n$3) return _1n$2;
	if (power === _1n$2) return num;
	let d = num % modulo;
	if (d < _0n$3) d += modulo;
	if (power < POW_WINDOWED_MIN) {
		let p = _1n$2;
		while (power > _0n$3) {
			if (power & _1n$2) p = p * d % modulo;
			d = d * d % modulo;
			power >>= _1n$2;
		}
		return p;
	}
	const digits = [];
	while (power > _0n$3) {
		digits.push(Number(power & _15n));
		power >>= _4n$2;
	}
	const table = new Array(16);
	table[0] = _1n$2;
	table[1] = d;
	for (let i = 2; i < 16; i++) table[i] = table[i - 1] * d % modulo;
	let p = table[digits[digits.length - 1]];
	for (let w = digits.length - 2; w >= 0; w--) {
		p = p * p % modulo;
		p = p * p % modulo;
		p = p * p % modulo;
		p = p * p % modulo;
		const digit = digits[w];
		if (digit !== 0) p = p * table[digit] % modulo;
	}
	return p;
}
/**
* Does `x^(2^power)` mod p. `pow2(30, 4)` == `30^(2^4)`.
* Low-level helper: callers that need canonical residues must pass a valid `x` for the chosen
* modulus; the `power===0` fast path intentionally returns the input unchanged.
* @param x - Base value.
* @param power - Number of squarings.
* @param modulo - Reduction modulus.
* @returns Repeated-squaring result.
* @throws If the exponent is negative. {@link Error}
* @example
* Apply repeated squaring inside one field.
*
* ```ts
* pow2(3n, 2n, 11n);
* ```
*/
function pow2(x, power, modulo) {
	if (modulo <= _1n$2) throw new Error("pow2: expected modulus > 1, got " + modulo);
	if (power < _0n$3) throw new Error("pow2: expected non-negative exponent, got " + power);
	let res = x;
	while (power-- > _0n$3) {
		res *= res;
		res %= modulo;
	}
	return res;
}
/**
* Inverses number over modulo.
* Implemented using the {@link https://brilliant.org/wiki/extended-euclidean-algorithm/ | extended Euclidean algorithm}.
* @param number - Value to invert.
* @param modulo - Modulus greater than 1.
* @returns Multiplicative inverse.
* @throws If the modulus is invalid or the inverse does not exist. {@link Error}
* @example
* Compute one modular inverse with the extended Euclidean algorithm.
*
* ```ts
* invert(3n, 11n);
* ```
*/
function invert(number, modulo) {
	if (number === _0n$3) throw new Error("invert: expected non-zero number");
	if (modulo <= _1n$2) throw new Error("invert: expected modulus > 1, got " + modulo);
	let a = mod(number, modulo);
	let b = modulo;
	let x = _0n$3, u = _1n$2;
	while (a !== _0n$3) {
		const q = b / a;
		const r = b - a * q;
		const m = x - u * q;
		b = a, a = r, x = u, u = m;
	}
	if (b !== _1n$2) throw new Error("invert: does not exist");
	return mod(x, modulo);
}
/**
* Inverses number over modulo using Fermat's little theorem: `a^(p-2) ≡ a⁻¹ (mod p)`.
*
* Unlike {@link invert} (extended Euclidean), the exponent `p-2` is a public constant, so the
* underlying square-and-multiply has the same control flow for every secret `a`: there is no
* data-dependent branching or loop count that could leak `a` through timing (e.g. Minerva-style
* ECDSA nonce-inversion attacks). This is only "algorithmically" constant-time — JS bigint
* multiplication/reduction is still value-dependent — and it is roughly 4x slower than
* {@link invert}.
*
* REQUIRES a prime modulus; Fermat's theorem does not hold otherwise. The result is verified to be
* a real inverse, so a non-prime modulus (or a non-invertible input) fails closed with an error
* instead of returning a wrong value.
* @param a - Value to invert.
* @param prime - Prime modulus.
* @returns Multiplicative inverse in `[1, prime)`.
* @throws If the modulus is below 2, the input reduces to zero, or the inverse does not exist.
*   {@link Error}
* @example
* Compute one modular inverse without secret-dependent branching.
*
* ```ts
* invertCt(3n, 11n); // 4n, since 3 * 4 = 12 ≡ 1 (mod 11)
* ```
*/
function invertCt(a, prime) {
	if (prime <= _1n$2) throw new Error("invertCt: expected prime modulus > 1, got " + prime);
	const an = mod(a, prime);
	if (an === _0n$3) throw new Error("invertCt: expected non-zero number");
	const inverse = pow(an, prime - _2n$2, prime);
	if (mod(an * inverse, prime) !== _1n$2) throw new Error("invertCt: does not exist");
	return inverse;
}
function assertIsSquare(Fp, root, n) {
	const F = Fp;
	if (!F.eql(F.sqr(root), n)) throw new Error("Cannot find square root");
}
function aoddModulus(order, fnName) {
	if ((order & _1n$2) === _0n$3) throw new Error(fnName + ": expected odd modulus, got " + order);
}
function sqrt3mod4(Fp, n) {
	const F = Fp;
	const p1div4 = (F.ORDER + _1n$2) / _4n$2;
	const root = F.pow(n, p1div4);
	assertIsSquare(F, root, n);
	return root;
}
function sqrt5mod8(Fp, n) {
	const F = Fp;
	const p5div8 = (F.ORDER - _5n) / _8n;
	const n2 = F.mul(n, _2n$2);
	const v = F.pow(n2, p5div8);
	const nv = F.mul(n, v);
	const i = F.mul(F.mul(nv, _2n$2), v);
	const root = F.mul(nv, F.sub(i, F.ONE));
	assertIsSquare(F, root, n);
	return root;
}
function sqrt9mod16(P) {
	const Fp_ = Field(P);
	const tn = tonelliShanks(P);
	const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
	const c2 = tn(Fp_, c1);
	const c3 = tn(Fp_, Fp_.neg(c1));
	const c4 = (P + _7n) / _16n;
	return ((Fp, n) => {
		const F = Fp;
		let tv1 = F.pow(n, c4);
		let tv2 = F.mul(tv1, c1);
		const tv3 = F.mul(tv1, c2);
		const tv4 = F.mul(tv1, c3);
		const e1 = F.eql(F.sqr(tv2), n);
		const e2 = F.eql(F.sqr(tv3), n);
		tv1 = F.cmov(tv1, tv2, e1);
		tv2 = F.cmov(tv4, tv3, e2);
		const e3 = F.eql(F.sqr(tv2), n);
		const root = F.cmov(tv1, tv2, e3);
		assertIsSquare(F, root, n);
		return root;
	});
}
/**
* Tonelli-Shanks square root search algorithm.
* This implementation is variable-time: it searches data-dependently for the first non-residue `Z`
* and for the smallest `i` in the main loop, unlike RFC 9380 Appendix I.4's constant-time shape.
* 1. {@link https://eprint.iacr.org/2012/685.pdf | eprint 2012/685}, page 12
* 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
* @param P - field order
* @returns function that takes field Fp (created from P) and number n
* @throws If the field is too small, non-prime, or the square root does not exist. {@link Error}
* @example
* Construct a square-root helper for primes that need Tonelli-Shanks.
*
* ```ts
* import { Field, tonelliShanks } from '@noble/curves/abstract/modular.js';
* const Fp = Field(17n);
* const sqrt = tonelliShanks(17n)(Fp, 4n);
* ```
*/
function tonelliShanks(P) {
	if (P < _3n$1) throw new Error("sqrt is not defined for small field");
	aoddModulus(P, "tonelliShanks");
	let Q = P - _1n$2;
	let S = 0;
	while (Q % _2n$2 === _0n$3) {
		Q /= _2n$2;
		S++;
	}
	let Z = _2n$2;
	const _Fp = Field(P);
	while (FpLegendre(_Fp, Z) === 1) if (Z++ > 1e3) throw new Error("Cannot find square root: probably non-prime P");
	if (S === 1) return sqrt3mod4;
	let cc = _Fp.pow(Z, Q);
	const Q1div2 = (Q + _1n$2) / _2n$2;
	return function tonelliSlow(Fp, n) {
		const F = Fp;
		if (F.is0(n)) return n;
		if (FpLegendre(F, n) !== 1) throw new Error("Cannot find square root");
		let M = S;
		let c = F.mul(F.ONE, cc);
		let t = F.pow(n, Q);
		let R = F.pow(n, Q1div2);
		while (!F.eql(t, F.ONE)) {
			if (F.is0(t)) throw new Error("Cannot find square root: probably non-prime P");
			let i = 1;
			let t_tmp = F.sqr(t);
			while (!F.eql(t_tmp, F.ONE)) {
				i++;
				t_tmp = F.sqr(t_tmp);
				if (i === M) throw new Error("Cannot find square root");
			}
			const exponent = _1n$2 << BigInt(M - i - 1);
			const b = F.pow(c, exponent);
			M = i;
			c = F.sqr(b);
			t = F.mul(t, c);
			R = F.mul(R, b);
		}
		return R;
	};
}
/**
* Square root for a finite field. Will try optimized versions first:
*
* 1. P ≡ 3 (mod 4)
* 2. P ≡ 5 (mod 8)
* 3. P ≡ 9 (mod 16)
* 4. Tonelli-Shanks algorithm
*
* Different algorithms can give different roots, it is up to user to decide which one they want.
* For example there is FpSqrtOdd/FpSqrtEven to choose a root by oddness
* (used for hash-to-curve).
* @param P - Field order.
* @returns Square-root helper. The generic fallback inherits Tonelli-Shanks' variable-time
*   behavior and this selector assumes prime-field-style integer moduli.
* @throws If the field is unsupported or the square root does not exist. {@link Error}
* @example
* Choose the square-root helper appropriate for one field modulus.
*
* ```ts
* import { Field, FpSqrt } from '@noble/curves/abstract/modular.js';
* const Fp = Field(17n);
* const sqrt = FpSqrt(17n)(Fp, 4n);
* ```
*/
function FpSqrt(P) {
	aoddModulus(P, "Fp.sqrt");
	if (P % _4n$2 === _3n$1) return sqrt3mod4;
	if (P % _8n === _5n) return sqrt5mod8;
	if (P % _16n === _9n) return sqrt9mod16(P);
	return tonelliShanks(P);
}
const FIELD_FIELDS = [
	"create",
	"isValid",
	"is0",
	"neg",
	"inv",
	"sqrt",
	"sqr",
	"eql",
	"add",
	"sub",
	"mul",
	"pow",
	"div",
	"addN",
	"subN",
	"mulN",
	"sqrN"
];
/**
* @param field - Field implementation.
* @returns Validated field. This only checks the arithmetic subset needed by generic helpers; it
*   does not guarantee full runtime-method coverage for serialization, batching, `cmov`, or
*   field-specific extras beyond positive `BYTES` / `BITS`.
* @throws If the field shape or numeric metadata are invalid. {@link Error}
* @example
* Check that a field implementation exposes the operations curve code expects.
*
* ```ts
* import { Field, validateField } from '@noble/curves/abstract/modular.js';
* const Fp = validateField(Field(17n));
* ```
*/
function validateField(field) {
	aobject(field, "field");
	if (typeof field.ORDER !== "bigint") throw new TypeError("param \"ORDER\" is invalid: expected bigint, got " + typeof field.ORDER);
	asafenumber(field.BYTES, "BYTES");
	asafenumber(field.BITS, "BITS");
	for (const name of FIELD_FIELDS) afunction(field[name], "field." + name);
	if (field.BYTES < 1 || field.BITS < 1) throw new Error("invalid field: expected BYTES/BITS > 0");
	if (field.ORDER <= _1n$2) throw new Error("invalid field: expected ORDER > 1, got " + field.ORDER);
	return field;
}
function FpInvertBatch(Fp, nums, passZero = false) {
	validateField(Fp);
	aarray(nums, "nums");
	abool(passZero, "passZero");
	const F = Fp;
	const inverted = new Array(nums.length).fill(passZero ? F.ZERO : void 0);
	const multipliedAcc = nums.reduce((acc, num, i) => {
		if (F.is0(num)) return acc;
		inverted[i] = acc;
		return F.mul(acc, num);
	}, F.ONE);
	const invertedAcc = F.inv(multipliedAcc);
	nums.reduceRight((acc, num, i) => {
		if (F.is0(num)) return acc;
		inverted[i] = F.mul(acc, inverted[i]);
		return F.mul(acc, num);
	}, invertedAcc);
	return inverted;
}
/**
* Legendre symbol.
* Legendre constant is used to calculate Legendre symbol (a | p)
* which denotes the value of a^((p-1)/2) (mod p).
*
* * (a | p) ≡ 1    if a is a square (mod p), quadratic residue
* * (a | p) ≡ -1   if a is not a square (mod p), quadratic non residue
* * (a | p) ≡ 0    if a ≡ 0 (mod p)
* @param Fp - Field implementation.
* @param n - Value to inspect.
* @returns Legendre symbol.
* @throws If the powered value does not match a valid Legendre symbol. {@link Error}
* @example
* Compute the Legendre symbol of one field element.
*
* ```ts
* import { Field, FpLegendre } from '@noble/curves/abstract/modular.js';
* const Fp = Field(17n);
* const symbol = FpLegendre(Fp, 4n);
* ```
*/
function FpLegendre(Fp, n) {
	validateField(Fp);
	const F = Fp;
	aoddModulus(F.ORDER, "FpLegendre");
	const p1mod2 = (F.ORDER - _1n$2) / _2n$2;
	const powered = F.pow(n, p1mod2);
	const yes = F.eql(powered, F.ONE);
	const zero = F.eql(powered, F.ZERO);
	const no = F.eql(powered, F.neg(F.ONE));
	if (!yes && !zero && !no) throw new Error("invalid Legendre symbol result");
	return yes ? 1 : zero ? 0 : -1;
}
/**
* @param n - Curve order. Callers are expected to pass a positive order.
* @param nBitLength - Optional cached bit length. Callers are expected to pass a positive cached
*   value when overriding the derived bit length.
* @returns Byte and bit lengths.
* @throws If the order or cached bit length is invalid. {@link Error}
* @example
* Measure the encoding sizes needed for one modulus.
*
* ```ts
* nLength(255n);
* ```
*/
function nLength(n, nBitLength) {
	if (nBitLength !== void 0) anumber(nBitLength);
	if (n <= _0n$3) throw new Error("invalid n length: expected positive n, got " + n);
	if (nBitLength !== void 0 && nBitLength < 1) throw new Error("invalid n length: expected positive bit length, got " + nBitLength);
	const bits = bitLen(n);
	if (nBitLength !== void 0 && nBitLength < bits) throw new Error(`invalid n length: expected nBitLength (${nBitLength}) >= bitLen(n) (${bits})`);
	const _nBitLength = nBitLength !== void 0 ? nBitLength : bits;
	return {
		nBitLength: _nBitLength,
		nByteLength: Math.ceil(_nBitLength / 8)
	};
}
const FIELD_SQRT = /* @__PURE__ */ new WeakMap();
var _Field = class {
	ORDER;
	BITS;
	BYTES;
	isLE;
	ZERO = _0n$3;
	ONE = _1n$2;
	_lengths;
	_mod;
	constructor(ORDER, opts = {}) {
		if (ORDER <= _1n$2) throw new Error("invalid field: expected ORDER > 1, got " + ORDER);
		let _nbitLength = void 0;
		this.isLE = false;
		if (opts != null && typeof opts === "object") {
			if (typeof opts.BITS === "number") _nbitLength = opts.BITS;
			if (typeof opts.sqrt === "function") Object.defineProperty(this, "sqrt", {
				value: opts.sqrt,
				enumerable: true
			});
			if (typeof opts.isLE === "boolean") this.isLE = opts.isLE;
			if (opts.allowedLengths) this._lengths = Object.freeze(opts.allowedLengths.slice());
			if (typeof opts.modFromBytes === "boolean") this._mod = opts.modFromBytes;
		}
		const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
		if (nByteLength > 2048) throw new Error("invalid field: expected ORDER of <= 2048 bytes");
		this.ORDER = ORDER;
		this.BITS = nBitLength;
		this.BYTES = nByteLength;
		Object.freeze(this);
	}
	create(num) {
		return mod(num, this.ORDER);
	}
	isValid(num) {
		if (typeof num !== "bigint") throw new TypeError("invalid field element: expected bigint, got " + typeof num);
		return _0n$3 <= num && num < this.ORDER;
	}
	is0(num) {
		return num === _0n$3;
	}
	isValidNot0(num) {
		return !this.is0(num) && this.isValid(num);
	}
	isOdd(num) {
		return (num & _1n$2) === _1n$2;
	}
	neg(num) {
		return mod(-num, this.ORDER);
	}
	eql(lhs, rhs) {
		return lhs === rhs;
	}
	sqr(num) {
		return mod(num * num, this.ORDER);
	}
	add(lhs, rhs) {
		return mod(lhs + rhs, this.ORDER);
	}
	sub(lhs, rhs) {
		return mod(lhs - rhs, this.ORDER);
	}
	mul(lhs, rhs) {
		return mod(lhs * rhs, this.ORDER);
	}
	pow(num, power) {
		return pow(num, power, this.ORDER);
	}
	div(lhs, rhs) {
		return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
	}
	sqrN(num) {
		return num * num;
	}
	addN(lhs, rhs) {
		return lhs + rhs;
	}
	subN(lhs, rhs) {
		return lhs - rhs;
	}
	mulN(lhs, rhs) {
		return lhs * rhs;
	}
	inv(num) {
		return invert(num, this.ORDER);
	}
	sqrt(num) {
		let sqrt = FIELD_SQRT.get(this);
		if (!sqrt) FIELD_SQRT.set(this, sqrt = FpSqrt(this.ORDER));
		return sqrt(this, num);
	}
	toBytes(num) {
		return this.isLE ? numberToBytesLE(num, this.BYTES) : numberToBytesBE(num, this.BYTES);
	}
	fromBytes(bytes, skipValidation = false) {
		abytes(bytes);
		const { _lengths: allowedLengths, BYTES, isLE, ORDER, _mod: modFromBytes } = this;
		if (allowedLengths) {
			if (bytes.length < 1 || !allowedLengths.includes(bytes.length) || bytes.length > BYTES) throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
			const padded = new Uint8Array(BYTES);
			padded.set(bytes, isLE ? 0 : padded.length - bytes.length);
			bytes = padded;
		}
		if (bytes.length !== BYTES) throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
		let scalar = isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
		if (modFromBytes) scalar = mod(scalar, ORDER);
		if (!skipValidation) {
			if (!this.isValid(scalar)) throw new Error("invalid field element: outside of range 0..ORDER");
		}
		return scalar;
	}
	invertBatch(lst) {
		return FpInvertBatch(this, lst, true);
	}
	cmov(a, b, condition) {
		abool(condition, "condition");
		return condition ? b : a;
	}
};
/**
* Creates a finite field. Major performance optimizations:
* * 1. Denormalized operations like mulN instead of mul.
* * 2. Identical object shape: never add or remove keys.
* * 3. Frozen stable object shape; the lazy sqrt cache lives in a module-level `WeakMap`.
* Fragile: always run a benchmark on a change.
* Security note: operations and low-level serializers like `toBytes` don't check `isValid` for
* all elements for performance and protocol-flexibility reasons; callers are responsible for
* supplying valid elements when they need canonical field behavior.
* This is low-level code, please make sure you know what you're doing.
*
* Note about field properties:
* * CHARACTERISTIC p = prime number, number of elements in main subgroup.
* * ORDER q = similar to cofactor in curves, may be composite `q = p^m`.
*
* @param ORDER - field order, probably prime, or could be composite
* @param opts - Field options such as bit length or endianness. See {@link FieldOpts}.
* @returns Frozen field instance with a stable object shape. This wrapper forwards `opts` straight
*   into `_Field`, so it inherits `_Field`'s assumptions about cached sizes and `allowedLengths`.
* @example
* Construct one prime field with optional overrides.
*
* ```ts
* Field(11n);
* ```
*/
function Field(ORDER, opts = {}) {
	Object.freeze(_Field.prototype);
	return new _Field(ORDER, opts);
}
/**
* Returns total number of bytes consumed by the field element.
* For example, 32 bytes for usual 256-bit weierstrass curve.
* @param fieldOrder - number of field elements, usually CURVE.n. Callers are expected to pass an
*   order greater than 1.
* @returns byte length of field
* @throws If the field order is not a bigint. {@link Error}
* @example
* Read the fixed-width byte length of one field.
*
* ```ts
* getFieldBytesLength(255n);
* ```
*/
function getFieldBytesLength(fieldOrder) {
	if (typeof fieldOrder !== "bigint") throw new Error("field order must be bigint");
	if (fieldOrder <= _1n$2) throw new Error("field order must be greater than 1");
	const bitLength = bitLen(fieldOrder - _1n$2);
	return Math.ceil(bitLength / 8);
}
/**
* Returns minimal amount of bytes that can be safely reduced
* by field order.
* Should be 2^-128 for 128-bit curve such as P256.
* This is the reduction / modulo-bias lower bound; higher-level helpers may still impose a larger
* absolute floor for policy reasons.
* @param fieldOrder - number of field elements greater than 1, usually CURVE.n.
* @returns byte length of target hash
* @throws If the field order is invalid. {@link Error}
* @example
* Compute the minimum hash length needed for field reduction.
*
* ```ts
* getMinHashLength(255n);
* ```
*/
function getMinHashLength(fieldOrder) {
	const length = getFieldBytesLength(fieldOrder);
	return length + Math.ceil(length / 2);
}
/**
* "Constant-time" private key generation utility.
* Can take (n + n/2) or more bytes of uniform input e.g. from CSPRNG or KDF
* and convert them into private scalar, with the modulo bias being negligible.
* Needs at least 48 bytes of input for 32-byte private key. The implementation also keeps a hard
* 16-byte minimum even when `getMinHashLength(...)` is smaller, so toy-small inputs do not look
* accidentally acceptable for real scalar derivation.
* See {@link https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/ | Kudelski's modulo-bias guide},
* {@link https://csrc.nist.gov/publications/detail/fips/186/5/final | FIPS 186-5 appendix A.2}, and
* {@link https://www.rfc-editor.org/rfc/rfc9380#section-5 | RFC 9380 section 5}. Unlike RFC 9380
* `hash_to_field`, this helper intentionally maps into the non-zero private-scalar range `1..n-1`.
* @param key - Uniform input bytes.
* @param fieldOrder - Size of subgroup.
* @param isLE - interpret hash bytes as LE num
* @returns valid private scalar
* @throws If the hash length or field order is invalid for scalar reduction. {@link Error}
* @example
* Map hash output into a private scalar range.
*
* ```ts
* mapHashToField(new Uint8Array(48).fill(1), 255n);
* ```
*/
function mapHashToField(key, fieldOrder, isLE = false) {
	abytes(key);
	const len = key.length;
	const fieldLen = getFieldBytesLength(fieldOrder);
	const minLen = Math.max(getMinHashLength(fieldOrder), 16);
	if (len < minLen || len > 1024) throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
	const reduced = mod(isLE ? bytesToNumberLE(key) : bytesToNumberBE(key), fieldOrder - _1n$2) + _1n$2;
	return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}
//#endregion
//#region ../../node_modules/@noble/curves/abstract/curve.js
/**
* Methods for elliptic curve multiplication by scalars.
* Contains wNAF-based ScalarMultiplier, pippenger.
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const _0n$2 = /* @__PURE__ */ BigInt(0);
const _1n$1 = /* @__PURE__ */ BigInt(1);
const _4n$1 = /* @__PURE__ */ BigInt(4);
const BLIND_BYTES = 16;
const BLIND_BITS = 128;
const FW_WINDOW = 5;
const TABLE_BYTES_MAX = /* @__PURE__ */ (() => 2 ** 31)();
/**
* Validates the static surface of a point constructor.
* This is only a cheap sanity check for the constructor hooks and fields consumed by generic
* factories; it does not certify `BASE`/`ZERO` semantics or prove the curve implementation itself.
* @param Point - Runtime point constructor.
* @throws On missing constructor hooks or malformed field metadata. {@link TypeError}
* @example
* Check that one point constructor exposes the static hooks generic helpers need.
*
* ```ts
* import { ed25519 } from '@noble/curves/ed25519.js';
* import { validatePointCons } from '@noble/curves/abstract/curve.js';
* validatePointCons(ed25519.Point);
* ```
*/
function validatePointCons(Point) {
	const pc = Point;
	if (typeof pc !== "function") throw new TypeError("\"Point\" expected constructor, got type=" + typeof Point);
	afunction(pc.fromAffine, "Point.fromAffine");
	afunction(pc.fromBytes, "Point.fromBytes");
	afunction(pc.fromHex, "Point.fromHex");
	aobject(pc.BASE, "Point.BASE");
	aobject(pc.ZERO, "Point.ZERO");
	validateField(pc.Fp);
	validateField(pc.Fn);
}
/**
* Takes a bunch of Projective Points but executes only one
* inversion on all of them. Inversion is very slow operation,
* so this improves performance massively.
* Optimization: converts a list of projective points to a list of identical points with Z=1.
* Input points are left unchanged; the normalized points are returned as fresh instances.
* @param c - Point constructor.
* @param points - Projective points.
* @returns Fresh projective points reconstructed from normalized affine coordinates.
* @example
* Batch-normalize projective points with a single shared inversion.
*
* ```ts
* import { normalizeZ } from '@noble/curves/abstract/curve.js';
* import { p256 } from '@noble/curves/nist.js';
* const points = normalizeZ(p256.Point, [p256.Point.BASE, p256.Point.BASE.double()]);
* ```
*/
function normalizeZ(c, points) {
	validatePointCons(c);
	validateMSMPoints(points, c);
	const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
	return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits, min = 1) {
	if (!Number.isSafeInteger(W) || W < min || W > bits) throw new Error("invalid window size, expected [" + min + ".." + bits + "], got W=" + W);
}
function validateTableBytes(numPoints, fpBytes) {
	const bytes = numPoints * (4 * fpBytes + 128);
	if (bytes > TABLE_BYTES_MAX) throw new Error("invalid window size: table would need ~" + Math.ceil(bytes / 2 ** 20) + " MiB, max " + TABLE_BYTES_MAX / 2 ** 20 + " MiB");
}
/**
* Probes an RNG once, at construction time: returns `undefined` when it is unavailable —
* throws or returns malformed bytes — so callers can downgrade to their unblinded /
* deterministic constant-time fallback. Blinding is defense-in-depth (DPA/template
* hardening), not a correctness or key-secrecy requirement, so availability-based
* downgrade is acceptable.
*
* The downgrade decision is deliberately static. After a successful probe the RNG becomes
* part of the trusted contract: later misbehavior must fail closed in per-call validation
* (throw), never downgrade — a dynamic fallback would let a tampered RNG silently strip
* blinding on demand. A probe can only ever classify broken environments, not adversarial
* RNGs: a stateful RNG can always behave while probed and misbehave later.
* @param randomBytes - RNG to probe, or `undefined` when the environment provides none.
* @param length - Byte length requested from the probe call.
* @returns The RNG when the probe produced `length` valid bytes; `undefined` otherwise.
* @example
* Probe an RNG once before enabling scalar blinding.
*
* ```ts
* import { probeRandomBytes } from '@noble/curves/abstract/curve.js';
* import { randomBytes } from '@noble/hashes/utils.js';
* const rng = probeRandomBytes(randomBytes, 16);
* ```
*/
function probeRandomBytes(randomBytes, length) {
	if (randomBytes === void 0) return void 0;
	afunction(randomBytes, "randomBytes");
	try {
		const probe = randomBytes(length);
		if (!isBytes$1(probe) || probe.length !== length) return void 0;
	} catch {
		return;
	}
	return randomBytes;
}
function validateMSMPoints(points, c) {
	aarray(points, "points");
	points.forEach((p, i) => {
		if (!(p instanceof c)) throw new Error("invalid point at index " + i);
	});
}
function validateMSMScalars(scalars, field, maxScalar) {
	if (!Array.isArray(scalars)) throw new Error("array of scalars expected");
	scalars.forEach((s, i) => {
		if (!(maxScalar === void 0 ? field.isValid(s) : isPosBig(s) && s < maxScalar)) throw new Error("invalid scalar at index " + i);
	});
}
const pointWindowSizes = /* @__PURE__ */ new WeakMap();
function getWindowSize(P) {
	return pointWindowSizes.get(P) || 1;
}
/** Table of odd multiples [1P, 3P, ..., (2⋅size−1)P]; width-W wNAF uses size = 2^(W−2). */
function oddMultiples(p, size) {
	const dbl = p.double();
	const t = [p];
	for (let j = 1; j < size; j++) t.push(t[j - 1].add(dbl));
	return t;
}
/**
* Width-W wNAF signed-digit recoding (W >= 2), LSB-first: digits are 0 or odd with
* |digit| < 2^(W−1); nonzero density ~1/(W+1) (a nonzero digit is followed by W−1 zeros).
*/
function wnafDigits(n, W) {
	const size = 2 ** W;
	const half = size / 2;
	const mask = BigInt(size - 1);
	const d = [];
	while (n > _0n$2) {
		let w = 0;
		if (n & _1n$1) {
			w = Number(n & mask);
			if (w >= half) w -= size;
			n -= BigInt(w);
		}
		d.push(w);
		n >>= _1n$1;
	}
	return d;
}
/**
* Fixed-position signed-window recoding for precomputed wNAF: `n = Σ digits[w]⋅2^(w⋅W)` with
* digits in `[−2^(W−1)+1, 2^(W−1)]`. Digit count is fixed by `windows` (callers reserve one
* extra window for the final carry), so recoding length does not depend on the scalar.
*/
function signedWindowDigits(n, W, windows) {
	const size = 2 ** W;
	const half = size / 2;
	const mask = BigInt(size - 1);
	const shiftBy = BigInt(W);
	const d = [];
	for (let w = 0; w < windows; w++) {
		let v = Number(n & mask);
		n >>= shiftBy;
		if (v > half) {
			v -= size;
			n += _1n$1;
		}
		d.push(v);
	}
	if (n !== _0n$2) throw new Error("invalid wnaf");
	return d;
}
/**
* Shared vartime walk over per-scalar wNAF digit streams: one doubling of a single shared
* accumulator per bit position of the longest recoding, one signed table addition per
* nonzero digit. `tables[i]` must hold the odd multiples of the i-th point.
*/
function wnafWalk(zero, tables, digits) {
	let max = 0;
	for (const d of digits) max = Math.max(max, d.length);
	let acc = zero;
	for (let bit = max - 1; bit >= 0; bit--) {
		if (bit !== max - 1) acc = acc.double();
		for (let i = 0; i < digits.length; i++) {
			const w = digits[i][bit];
			if (w) {
				const item = tables[i][Math.abs(w) - 1 >> 1];
				acc = acc.add(w < 0 ? item.negate() : item);
			}
		}
	}
	return acc;
}
/**
* Elliptic curve multiplication of Point by scalar.
* Routes between cached-table, fixed-window, and one-shot wNAF paths; entry points validate
* their own scalars (`mulCT`/`mulCTBlinded`: `1 <= s < Fn.ORDER`; `mulUnsafe`: up to the
* `Fn.ORDER^4` DoS cap via {@link mulAddUnsafe}).
* Table generation is expensive and happens on first call of `multiply()`
* (or eagerly via `precompute(W, false)`). By default, `BASE` point is precomputed.
*
* Cached algorithm is signed fixed-window wNAF:
* - table stores, for every window w, the multiples `[1..2^(W−1)]⋅2^(w⋅W)⋅P` — all doublings
*   are baked in, so a multiplication is exactly one table addition per window
* - window count is fixed (`ceil(bits/W) + 1`), so the point-operation count is scalar-independent
*   (basis of the constant-time path)
* - for a 256-bit curve and W=6: 44⋅32 = 1408 table points, 44 additions per multiply
* - secret scalars are additionally blinded (see {@link ScalarMultiplier.mulCTBlinded}), which
*   widens tables by 128 bits
* @param Point - Point constructor.
* @param randomBytes - RNG used for scalar blinding; required by the blinded secret path.
* @example
* Elliptic curve multiplication of Point by scalar.
*
* ```ts
* import { ScalarMultiplier } from '@noble/curves/abstract/curve.js';
* import { p256 } from '@noble/curves/nist.js';
* const mul = new ScalarMultiplier(p256.Point);
* ```
*/
var ScalarMultiplier = class {
	Point;
	BASE;
	ZERO;
	randomBytes;
	wnafPrecomputes = /* @__PURE__ */ new WeakMap();
	baseCanBeBlinded;
	bits;
	constructor(Point, randomBytes) {
		validatePointCons(Point);
		this.randomBytes = probeRandomBytes(randomBytes, BLIND_BYTES);
		this.Point = Point;
		this.BASE = Point.BASE;
		this.ZERO = Point.ZERO;
		this.bits = Point.Fn.BITS;
	}
	/**
	* Creates a signed fixed-window wNAF precomputation table: for every window w, the
	* multiples `[1..2^(W−1)]⋅2^(w⋅W)⋅P`, flattened. All doublings are baked into the table,
	* so cached multiplication is additions-only. `windows = ceil(bits/W) + 1`: the extra
	* window absorbs the final carry of signed-digit recoding.
	* For a 256-bit curve and W=6, the table is 44⋅32 = 1408 points.
	* @param point - Point instance
	* @param W - window size
	* @param bits - scalar bitlength the table must cover
	*/
	buildWnafTable(point, W, bits) {
		const windows = Math.ceil(bits / W) + 1;
		const half = 2 ** (W - 1);
		const comp = [];
		let base = point;
		for (let w = 0; w < windows; w++) {
			let acc = base;
			for (let i = 0; i < half; i++) {
				comp.push(acc);
				acc = acc.add(base);
			}
			base = comp[comp.length - 1].double();
		}
		return {
			W,
			bits,
			windows,
			comp
		};
	}
	/**
	* Implements ec multiplication using precomputed signed fixed-window wNAF tables.
	* Constant-time: fixed window count with one table addition per window — zero digits feed
	* the fake accumulator — and no doublings; the lookup scans the whole window slice.
	* Scalar bounds are validated by the public entry points ({@link ScalarMultiplier.mulCT},
	* {@link ScalarMultiplier.mulCTBlinded}, {@link ScalarMultiplier.mulUnsafe});
	* signedWindowDigits throws if `n` exceeds the table.
	* @returns real and fake (for const-time) points
	*/
	wnafCachedCT(precomputes, n) {
		const { W, windows, comp } = precomputes;
		const half = 2 ** (W - 1);
		const digits = signedWindowDigits(n, W, windows);
		let p = this.ZERO;
		let f = this.BASE;
		for (let w = 0; w < windows; w++) {
			const digit = digits[w];
			const start = w * half;
			const idx = Math.abs(digit) - 1;
			let sel = comp[start];
			for (let i = 1; i < half; i++) sel = i === idx ? comp[start + i] : sel;
			const neg = sel.negate();
			if (digit === 0) f = f.add(comp[start]);
			else p = p.add(digit < 0 ? neg : sel);
		}
		return {
			p,
			f
		};
	}
	getWnafPrecomputes(W, point, bits, transform) {
		let entries = this.wnafPrecomputes.get(point);
		let comp = entries?.find((entry) => entry.W === W && entry.bits === bits);
		if (!comp) {
			comp = this.buildWnafTable(point, W, bits);
			if (typeof transform === "function") comp = {
				...comp,
				comp: transform(comp.comp)
			};
			if (!entries) {
				entries = [];
				this.wnafPrecomputes.set(point, entries);
			}
			entries.push(comp);
		}
		return comp;
	}
	assertPoint(point) {
		if (!(point instanceof this.Point)) throw new TypeError("\"point\" expected Point instance, got type=" + typeof point);
	}
	validateMulInput(point, scalar) {
		this.assertPoint(point);
		if (!inRange(scalar, _1n$1, this.Point.Fn.ORDER)) throw new Error("invalid scalar");
	}
	runCT(point, n, bits, transform) {
		const W = getWindowSize(point);
		if (W === 1) return this.fixedWindowCT(point, n, bits);
		return this.wnafCachedCT(this.getWnafPrecomputes(W, point, bits, transform), n);
	}
	mulCT(point, scalar, transform) {
		this.validateMulInput(point, scalar);
		return this.runCT(point, scalar, this.bits, transform);
	}
	mulCTBlinded(point, scalar, transform) {
		this.validateMulInput(point, scalar);
		if (this.randomBytes === void 0) throw new Error("randomBytes is required for scalar blinding");
		const bits = this.Point.Fn.BITS + BLIND_BITS;
		const blind = this.randomBytes(BLIND_BYTES);
		if (!isBytes$1(blind) || blind.length !== BLIND_BYTES) throw new Error("randomBytes returned invalid byte array");
		blind[0] = blind[0] & 63 | 128;
		const n = scalar + bytesToNumberBE(blind) * this.Point.Fn.ORDER;
		return this.runCT(point, n, bits, transform);
	}
	/**
	* Constant-time multiplication `n*point` for an un-precomputed point, via a small fixed window.
	* A cached wNAF table only pays off when reused; a flat 2^FW_WINDOW table (`size-1` adds) is
	* far cheaper to build for a single use. The point-operation sequence is independent of `n`:
	* build the table, then per window exactly FW_WINDOW doublings, a data-oblivious scan over
	* every table entry, and one addition (adds the identity when the window digit is 0 — never
	* skipped).
	*
	* `n` must be `< 2^bits`. Assumes complete addition (adding the identity costs the same as any
	* add), which holds for the Weierstrass/Edwards point types used here. The table is left in
	* projective form (no normalizeZ): normalizing this small a table costs more than the
	* mixed-add savings it would buy for a single multiply.
	* @returns real point `p`; `f` duplicates it only to match {@link wnafCachedCT}'s return shape
	* (this path needs no fake accumulator — its op-count is already scalar-independent).
	*/
	fixedWindowCT(point, n, bits) {
		const W = FW_WINDOW;
		const size = 32;
		const mask = bitMask(W);
		const table = new Array(size);
		table[0] = this.ZERO;
		for (let i = 1; i < size; i++) table[i] = table[i - 1].add(point);
		const windows = Math.ceil(bits / W);
		let acc = this.ZERO;
		for (let window = windows - 1; window >= 0; window--) {
			if (window !== windows - 1) for (let d = 0; d < W; d++) acc = acc.double();
			const digit = Number(n >> BigInt(window * W) & mask);
			let sel = table[0];
			for (let i = 1; i < size; i++) sel = i === digit ? table[i] : sel;
			acc = acc.add(sel);
		}
		return {
			p: acc,
			f: acc
		};
	}
	shouldBlind(point, cofactor) {
		if (this.randomBytes === void 0) return false;
		if (cofactor === _1n$1) return true;
		if (point !== this.BASE) return false;
		if (this.baseCanBeBlinded === void 0) this.baseCanBeBlinded = this.mulUnsafe(this.BASE, this.Point.Fn.ORDER).is0();
		return this.baseCanBeBlinded;
	}
	mulSecret(point, scalar, cofactor, transform) {
		return this.shouldBlind(point, cofactor) ? this.mulCTBlinded(point, scalar, transform) : this.mulCT(point, scalar, transform);
	}
	mulUnsafe(point, scalar, transform) {
		this.assertPoint(point);
		if (!isPosBig(scalar)) throw new Error("invalid scalar");
		const W = getWindowSize(point);
		if (W === 1 || scalar >= this.Point.Fn.ORDER) return mulAddUnsafe(this.Point, [point], [scalar], true);
		const precomputes = this.getWnafPrecomputes(W, point, this.bits, transform);
		return this.wnafCachedCT(precomputes, scalar).p;
	}
	setWindowSize(point, W) {
		this.assertPoint(point);
		validateW(W, this.bits);
		validateTableBytes((Math.ceil((this.bits + BLIND_BITS) / W) + 1) * 2 ** (W - 1), this.Point.Fp.BYTES);
		pointWindowSizes.set(point, W);
		this.wnafPrecomputes.delete(point);
	}
	hasWindowSize(point) {
		return getWindowSize(point) !== 1;
	}
};
/**
* Combined multi-scalar multiplication `Σ scalars[i]⋅points[i]` via interleaved width-4 wNAF
* (Strauss–Shamir). Every input gets its own table of odd multiples `[1P, 3P, 5P, 7P]` and
* signed-digit recoding, but all walks share one doubling chain, so total cost is
* `~bits` doublings + `L⋅bits/5` additions instead of `L⋅bits` doublings for separate
* multiplications. Intended for the 2-4 point shapes of signature verification
* (`R = u1⋅G + u2⋅P`); use {@link pippenger} for larger batches.
*
* Not constant-time: only for public inputs. Scalars must satisfy `0 <= s < Fn.ORDER`;
* fold negative signs into the points before calling.
* @param c - Point constructor.
* @param points - Array of curve points.
* @param scalars - Array of non-negative scalars, same length as points.
* @param allowOversized - Replace the `s < Fn.ORDER` scalar check with a `Fn.ORDER^4` DoS cap.
*   Off by default. For scalars that must NOT be reduced mod ORDER: torsion checks
*   (`Fn.ORDER⋅P ≟ O`) and cofactor-clearing multiples. Walk length grows with `bitLen(s)`.
* @returns Combined multiplication result; identity for empty input.
* @throws If the point set or scalar set is invalid. {@link Error}
* @example
* Combined multi-scalar multiplication via Strauss–Shamir.
*
* ```ts
* import { mulAddUnsafe } from '@noble/curves/abstract/curve.js';
* import { p256 } from '@noble/curves/nist.js';
* const G = p256.Point.BASE;
* const R = mulAddUnsafe(p256.Point, [G, G.double()], [2n, 3n]); // 2⋅G + 3⋅(2⋅G)
* ```
*/
function mulAddUnsafe(c, points, scalars, allowOversized = false) {
	validatePointCons(c);
	validateMSMPoints(points, c);
	abool(allowOversized, "allowOversized");
	validateMSMScalars(scalars, c.Fn, allowOversized ? c.Fn.ORDER ** _4n$1 : void 0);
	if (points.length !== scalars.length) throw new Error("arrays of points and scalars must have equal length");
	const tables = points.map((p) => oddMultiples(p, 4));
	const digits = scalars.map((n) => wnafDigits(n, 4));
	return wnafWalk(c.ZERO, tables, digits);
}
function createField(order, field, isLE) {
	if (field) {
		if (field.ORDER !== order) throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
		validateField(field);
		return field;
	} else return Field(order, { isLE });
}
/**
* Validates basic CURVE shape and field membership, then creates fields.
* This does not prove that the generator is on-curve, that subgroup/order data are consistent, or
* that the curve equation itself is otherwise sane.
* @param type - Curve family.
* @param CURVE - Curve parameters.
* @param curveOpts - Optional field overrides. See {@link FpFn}:
*   - `Fp` (optional): Optional base-field override.
*   - `Fn` (optional): Optional scalar-field override.
* @param FpFnLE - Whether field encoding is little-endian.
* @returns Frozen curve parameters and fields.
* @throws If the curve parameters or field overrides are invalid. {@link Error}
* @example
* Build curve fields from raw constants before constructing a curve instance.
*
* ```ts
* const curve = createCurveFields('weierstrass', {
*   p: 17n,
*   n: 19n,
*   h: 1n,
*   a: 2n,
*   b: 2n,
*   Gx: 5n,
*   Gy: 1n,
* });
* ```
*/
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
	if (type !== "weierstrass" && type !== "edwards") throw new Error("expected curve type \"weierstrass\" or \"edwards\"");
	if (FpFnLE === void 0) FpFnLE = type === "edwards";
	if (!CURVE || typeof CURVE !== "object") throw new Error(`expected valid ${type} CURVE object`);
	validateObject(curveOpts);
	for (const p of [
		"p",
		"n",
		"h"
	]) {
		const val = CURVE[p];
		if (!(isPosBig(val) && val !== _0n$2)) throw new Error(`CURVE.${p} must be positive bigint`);
	}
	const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
	const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
	const params = [
		"Gx",
		"Gy",
		"a",
		type === "weierstrass" ? "b" : "d"
	];
	for (const p of params) if (!Fp.isValid(CURVE[p])) throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
	CURVE = Object.freeze(Object.assign({}, CURVE));
	return {
		CURVE,
		Fp,
		Fn
	};
}
/**
* @param randomSecretKey - Secret-key generator.
* @param getPublicKey - Public-key derivation helper.
* @returns Keypair generator.
* @example
* Build a `keygen()` helper from existing secret-key and public-key primitives.
*
* ```ts
* import { createKeygen } from '@noble/curves/abstract/curve.js';
* import { p256 } from '@noble/curves/nist.js';
* const keygen = createKeygen(p256.utils.randomSecretKey, p256.getPublicKey);
* const pair = keygen();
* ```
*/
function createKeygen(randomSecretKey, getPublicKey) {
	return function keygen(seed) {
		const secretKey = randomSecretKey(seed);
		return {
			secretKey,
			publicKey: getPublicKey(secretKey)
		};
	};
}
//#endregion
//#region ../bc-rand-ts/dist/domain-aQpVBM5Z.mjs
/**
* A value for a `got …` clause: primitives as `String(value)`, arrays as
* `Array(n)`, other objects by constructor name.
*/
function show(value) {
	if (Array.isArray(value)) return `Array(${value.length})`;
	if (typeof value === "function") return "function";
	if (typeof value === "object" && value !== null) {
		const ctor = value.constructor;
		return typeof ctor?.name === "string" && ctor.name !== "" ? ctor.name : "object";
	}
	return String(value);
}
/**
* Thrown for an argument outside its width, an empty or over-long range, a
* full-width draw that does not fit, a malformed seed or state, a generator
* that breaks the contract, and a missing Web Crypto API. Branch on `code`;
* the messages are the port's own (the reference panics with compiler and
* `core` strings).
*
* Instances come from the static factories only.
*
* @example
* ```ts
* try {
*   nextInClosedRangeI8(rng, -128, 127);
* } catch (e) {
*   if (RandError.isRandError(e) && e.is("RangeTooLong")) {
*     // the length must fit i8, as in the reference
*   }
* }
* ```
*/
var RandError = class RandError extends Error {
	/** Always `"RandError"`; the cross-copy identity {@link RandError.isRandError} checks. */
	name = "RandError";
	/** The discriminant; equals `details.code`. */
	code;
	/** The structured payload, discriminated by `code`. */
	details;
	constructor(message, details) {
		super(message);
		this.code = details.code;
		this.details = details;
	}
	/** Type guard for a `RandError`, including one from another copy of this package. */
	static isRandError(value) {
		return value instanceof Error && value.name === "RandError" && "code" in value;
	}
	/** `true` when `code` is this error's code. */
	is(code) {
		return this.code === code;
	}
	/** `parameter` is not an integer in `[bounds.min, bounds.max]`; `value` is what was received. */
	static invalidArgument(parameter, value, bounds) {
		return new RandError(`${parameter} must be an integer in [${bounds.min}, ${bounds.max}], got ${String(value)}`, {
			code: "InvalidArgument",
			parameter,
			value,
			bounds
		});
	}
	/** `parameter` is not a `Uint8Array`; `value` is what was received. */
	static invalidDest(parameter, value) {
		return new RandError(`${parameter} must be a Uint8Array, got ${show(value)}`, {
			code: "InvalidArgument",
			parameter,
			value
		});
	}
	/** `start >= end` for a half-open range, or `start > end` for a closed one. */
	static emptyRange(start, end, closed) {
		return new RandError(closed ? `start must be less than or equal to end, got ${start} and ${end}` : `start must be less than end, got ${start} and ${end}`, {
			code: "EmptyRange",
			start,
			end,
			closed
		});
	}
	/**
	* A signed range's `end - start` exceeds the width's `MAX` (`[0, MAX]` for a
	* closed range, `[1, MAX]` for a half-open one), where the reference's
	* arithmetic overflows.
	*/
	static rangeTooLong(length, max, closed) {
		return new RandError(`range length must be an integer in [${closed ? 0 : 1}, ${max}], got ${length}`, {
			code: "RangeTooLong",
			length,
			max,
			closed
		});
	}
	/** The full-width early return's raw 64-bit draw does not fit the target width. */
	static valueDoesNotFit() {
		return new RandError("random value does not fit the target width", { code: "ValueDoesNotFit" });
	}
	/** `parameter` is not `expected` (a seed shape, a seed word, or a byte length). */
	static invalidSeed(parameter, expected, value) {
		return new RandError(`${parameter} must be ${expected}, got ${show(value)}`, {
			code: "InvalidSeed",
			parameter,
			value
		});
	}
	/**
	* The generator has no callable `method`; `value` is the member found, or
	* the `undefined`/`null` generator itself. Public so that a consumer calling
	* a member this package does not (`fillBytesPacked`) reports the same error.
	*/
	static invalidGenerator(method, value) {
		return new RandError(`rng.${method} must be a function, got ${show(value)}`, {
			code: "InvalidGenerator",
			method,
			value
		});
	}
	/**
	* `method` returned `value`, which is outside its contract: `nextU64` must
	* return a `bigint` in `[0, 2^64 - 1]`; `nextU32` and `nextU64Low32` an
	* integer in `[0, 2^32 - 1]`.
	*/
	static invalidDraw(method, value) {
		return new RandError(`${method}() must return ${method === "nextU64" ? "a bigint in [0, 18446744073709551615]" : "an integer in [0, 4294967295]"}, got ${String(value)}`, {
			code: "InvalidGenerator",
			method,
			value
		});
	}
	/** No Web Crypto API (`globalThis.crypto`) in this environment. */
	static cryptoUnavailable() {
		return new RandError("no Web Crypto API available in this environment", { code: "CryptoUnavailable" });
	}
};
/**
* Argument-domain checks for the samplers and the byte helpers.
*
* TypeScript has no integer widths: a `u8` bound is a `number` that must be an
* integer in `[1, 255]`. Every check throws `RandError` `InvalidArgument` with
* one message shape, `"<name> must be an integer in [<min>, <max>], got <value>"`.
*
* @module domain
*/
/** Throws unless `value` is an integer `number` in `[min, max]`. Returns it. */
function expectInt(value, min, max, name) {
	if (!Number.isInteger(value) || value < min || value > max) throw RandError.invalidArgument(name, value, {
		min,
		max
	});
	return value;
}
/**
* `value` is a `Uint8Array` (or a subclass such as `Buffer`), including one
* from another realm, whose `instanceof` fails.
*/
function isBytes(value) {
	return value instanceof Uint8Array || ArrayBuffer.isView(value) && value.constructor.name === "Uint8Array";
}
/**
* A generator member read as data, for a presence check (never a detached
* call, so `this` is not at stake).
*
* @internal
*/
function memberOf(rng, name) {
	return rng[name];
}
//#endregion
//#region ../bc-rand-ts/dist/index.mjs
/**
* Cryptographically secure randomness from the platform's Web Crypto API.
*
* @module secure-rng
*/
function getCrypto() {
	const c = globalThis.crypto;
	if (c === void 0) throw RandError.cryptoUnavailable();
	return c;
}
const scratch = /* @__PURE__ */ new Uint8Array(8);
const scratchView = new DataView(scratch.buffer);
/**
* Web Crypto's per-call limit: `getRandomValues` throws `QuotaExceededError`
* for a view longer than this (the spec, browsers and Node; Bun does not
* enforce it). Fills are chunked so that, like the reference's `random_data`,
* any length is accepted.
*/
const GET_RANDOM_VALUES_MAX = 65536;
/**
* A generator backed by Web Crypto (`crypto.getRandomValues`), available in
* every modern browser and in Node >= 15. It holds no state: every instance
* draws from the same platform source. `fillBytes` accepts any length; the
* platform's 65,536-byte per-call quota is handled by filling in chunks.
*
* @throws {RandError} `CryptoUnavailable` from any draw when the environment has no Web Crypto API.
*/
var SecureRng = class {
	/** Debug label: `Object.prototype.toString` reports the class name. */
	get [Symbol.toStringTag]() {
		return "SecureRng";
	}
	/** The low 32 bits of an 8-byte draw. */
	nextU32() {
		getCrypto().getRandomValues(scratch);
		return scratchView.getUint32(0, true);
	}
	/** An 8-byte draw as a little-endian `u64`. */
	nextU64() {
		getCrypto().getRandomValues(scratch);
		return scratchView.getBigUint64(0, true);
	}
	/** The samplers' fast path: one 8-byte draw, low 32 bits, no `bigint`. */
	nextU64Low32() {
		return this.nextU32();
	}
	/**
	* Fill `dest` with secure random bytes. Any length: buffers above 65,536
	* bytes are filled in chunks of at most that size (`subarray` views, no
	* copies); shorter ones take one `getRandomValues` call.
	* @throws {RandError} `InvalidArgument` unless `dest` is a `Uint8Array`.
	*/
	fillBytes(dest) {
		if (!isBytes(dest)) throw RandError.invalidDest("dest", dest);
		const c = getCrypto();
		const n = dest.length;
		if (n <= GET_RANDOM_VALUES_MAX) {
			c.getRandomValues(dest);
			return;
		}
		for (let offset = 0; offset < n; offset += GET_RANDOM_VALUES_MAX) c.getRandomValues(dest.subarray(offset, Math.min(offset + GET_RANDOM_VALUES_MAX, n)));
	}
};
/** A fresh secure generator (the reference's `thread_rng()`). */
function secureRng() {
	return new SecureRng();
}
Object.freeze([
	17295166580085024720n,
	422929670265678780n,
	5577237070365765850n,
	7953171132032326923n
]);
/**
* Byte and boolean helpers over any generator.
*
* @module bytes
*/
/**
* `options.rng`, or the secure generator when it is `undefined` or `null`,
* checked to have the callable member the helper is about to use (the
* generator contract; a primitive or an object without it is a broken
* generator).
*/
function rngFor(options, method) {
	const rng = options?.rng ?? secureRng();
	const member = memberOf(rng, method);
	if (typeof member !== "function") throw RandError.invalidGenerator(method, member);
	return rng;
}
/**
* `size` random bytes from `options.rng` (default: the secure generator).
*
* @throws {RandError} `InvalidArgument` when `size` is not a non-negative safe
*   integer; `InvalidGenerator` when the generator has no callable `fillBytes`.
*/
function randomBytes(size, options) {
	const data = new Uint8Array(expectInt(size, 0, Number.MAX_SAFE_INTEGER, "size"));
	rngFor(options, "fillBytes").fillBytes(data);
	return data;
}
//#endregion
//#region ../../node_modules/@noble/curves/abstract/der.js
/**
* ASN.1 DER (Distinguished Encoding Rules) helpers for ECDSA signatures.
* Only implements the tiny subset needed for `SEQUENCE(INTEGER r, INTEGER s)`.
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const _0n$1 = /* @__PURE__ */ BigInt(0);
/**
* @param m - Error message.
* @example
* Throw a DER-specific error when signature parsing encounters invalid bytes.
*
* ```ts
* new DERErr('bad der');
* ```
*/
var DERErr = class extends Error {
	constructor(m = "") {
		super(m);
	}
};
const _DER = {
	Err: DERErr,
	_tlv: {
		encode: (tag, data) => {
			const { Err: E } = _DER;
			asafenumber(tag, "tag");
			if (tag < 0 || tag > 255) throw new E("tlv.encode: wrong tag");
			astring(data, "data");
			if (data.length & 1) throw new E("tlv.encode: unpadded data");
			const dataLen = data.length / 2;
			const len = numberToHexUnpadded(dataLen);
			if (len.length / 2 & 128) throw new E("tlv.encode: long form length too big");
			const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
			return numberToHexUnpadded(tag) + lenLen + len + data;
		},
		decode(tag, data) {
			const { Err: E } = _DER;
			data = abytes(data, void 0, "DER data");
			let pos = 0;
			if (tag < 0 || tag > 255) throw new E("tlv.decode: wrong tag");
			if (data.length < 2 || data[pos++] !== tag) throw new E("tlv.decode: wrong tlv");
			const first = data[pos++];
			const isLong = !!(first & 128);
			let length = 0;
			if (!isLong) length = first;
			else {
				const lenLen = first & 127;
				if (!lenLen) throw new E("tlv.decode(long): indefinite length not supported");
				if (lenLen > 4) throw new E("tlv.decode(long): byte length is too big");
				const lengthBytes = data.subarray(pos, pos + lenLen);
				if (lengthBytes.length !== lenLen) throw new E("tlv.decode: length bytes not complete");
				if (lengthBytes[0] === 0) throw new E("tlv.decode(long): zero leftmost byte");
				for (const b of lengthBytes) length = length << 8 | b;
				pos += lenLen;
				if (length < 128) throw new E("tlv.decode(long): not minimal encoding");
			}
			const v = data.subarray(pos, pos + length);
			if (v.length !== length) throw new E("tlv.decode: wrong value length");
			return {
				v,
				l: data.subarray(pos + length)
			};
		}
	},
	_int: {
		encode(num) {
			const { Err: E } = _DER;
			abignumber(num);
			if (num < _0n$1) throw new E("integer: negative integers are not allowed");
			let hex = numberToHexUnpadded(num);
			if (Number.parseInt(hex[0], 16) & 8) hex = "00" + hex;
			if (hex.length & 1) throw new E("unexpected DER parsing assertion: unpadded hex");
			return hex;
		},
		decode(data) {
			const { Err: E } = _DER;
			if (data.length < 1) throw new E("invalid signature integer: empty");
			if (data[0] & 128) throw new E("invalid signature integer: negative");
			if (data.length > 1 && data[0] === 0 && !(data[1] & 128)) throw new E("invalid signature integer: unnecessary leading zero");
			return bytesToNumberBE(data);
		}
	},
	toSig(bytes, maxScalarBytes) {
		const { Err: E, _int: int, _tlv: tlv } = _DER;
		if (maxScalarBytes !== void 0) {
			asafenumber(maxScalarBytes, "maxScalarBytes");
			if (maxScalarBytes < 1) throw new E("invalid signature: maxScalarBytes must be positive");
		}
		const data = abytes(bytes, void 0, "signature");
		const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
		if (seqLeftBytes.length) throw new E("invalid signature: left bytes after parsing");
		const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
		const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
		if (sLeftBytes.length) throw new E("invalid signature: left bytes after parsing");
		if (maxScalarBytes !== void 0 && (rBytes.length > maxScalarBytes || sBytes.length > maxScalarBytes)) throw new E("invalid signature: integer too large");
		return {
			r: int.decode(rBytes),
			s: int.decode(sBytes)
		};
	},
	hexFromSig(sig) {
		const { _tlv: tlv, _int: int } = _DER;
		validateObject(sig, {
			r: "bigint",
			s: "bigint"
		}, {}, "sig");
		const seq = tlv.encode(2, int.encode(sig.r)) + tlv.encode(2, int.encode(sig.s));
		return tlv.encode(48, seq);
	}
};
/**
* ASN.1 DER encoding utilities. ASN is very complex & fragile. Format:
*
*     [0x30 (SEQUENCE), bytelength, 0x02 (INTEGER), intLength, R, 0x02 (INTEGER), intLength, S]
*
* Docs: {@link https://letsencrypt.org/docs/a-warm-welcome-to-asn1-and-der/ | Let's Encrypt ASN.1 guide} and
* {@link https://luca.ntop.org/Teaching/Appunti/asn1.html | Luca Deri's ASN.1 notes}.
* @example
* ASN.1 DER encoding utilities.
*
* ```ts
* const der = DER.hexFromSig({ r: 1n, s: 2n });
* ```
*/
const DER = /* @__PURE__ */ (() => {
	Object.freeze(_DER._tlv);
	Object.freeze(_DER._int);
	return Object.freeze(_DER);
})();
//#endregion
//#region ../../node_modules/@noble/curves/abstract/weierstrass.js
/**
* Short Weierstrass curve methods. The formula is: y² = x³ + ax + b.
*
* ### Design rationale for types
*
* * Interaction between classes from different curves should fail:
*   `k256.Point.BASE.add(p256.Point.BASE)`
* * For this purpose we want to use `instanceof` operator, which is fast and works during runtime
* * Different calls of `curve()` would return different classes -
*   `curve(params) !== curve(params)`: if somebody decided to monkey-patch their curve,
*   it won't affect others
*
* TypeScript can't infer types for classes created inside a function. Classes is one instance
* of nominative types in TypeScript and interfaces only check for shape, so it's hard to create
* unique type for every function call.
*
* We can use generic types via some param, like curve opts, but that would:
*     1. Enable interaction between `curve(params)` and `curve(params)` (curves of same params)
*     which is hard to debug.
*     2. Params can be generic and we can't enforce them to be constant value:
*     if somebody creates curve from non-constant params,
*     it would be allowed to interact with other curves with non-constant params
*
* @todo https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#unique-symbol
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const divNearest = (num, den) => (num + (num >= 0 ? den : -den) / _2n$1) / den;
/** Splits scalar for GLV endomorphism. */
function _splitEndoScalar(k, basis, n) {
	aInRange("scalar", k, _0n, n);
	const [[a1, b1], [a2, b2]] = basis;
	const c1 = divNearest(b2 * k, n);
	const c2 = divNearest(-b1 * k, n);
	let k1 = k - c1 * a1 - c2 * a2;
	let k2 = -c1 * b1 - c2 * b2;
	const k1neg = k1 < _0n;
	const k2neg = k2 < _0n;
	if (k1neg) k1 = -k1;
	if (k2neg) k2 = -k2;
	const MAX_NUM = bitMask(Math.ceil(bitLen(n) / 2)) + _1n;
	if (k1 < _0n || k1 >= MAX_NUM || k2 < _0n || k2 >= MAX_NUM) throw new Error("splitScalar (endomorphism): failed for k");
	return {
		k1neg,
		k1,
		k2neg,
		k2
	};
}
function validateSigFormat(format) {
	if (![
		"compact",
		"recovered",
		"der"
	].includes(format)) throw new Error("Signature format must be \"compact\", \"recovered\", or \"der\"");
	return format;
}
function validateSigOpts(opts, def) {
	validateObject(opts);
	const optsn = {};
	for (let optName of Object.keys(def)) optsn[optName] = opts[optName] === void 0 ? def[optName] : opts[optName];
	abool(optsn.lowS, "lowS");
	abool(optsn.prehash, "prehash");
	if (optsn.format !== void 0) validateSigFormat(optsn.format);
	return optsn;
}
const _0n = /* @__PURE__ */ BigInt(0);
const _1n = /* @__PURE__ */ BigInt(1);
const _2n$1 = /* @__PURE__ */ BigInt(2);
const _3n = /* @__PURE__ */ BigInt(3);
const _4n = /* @__PURE__ */ BigInt(4);
/**
* Creates weierstrass Point constructor, based on specified curve options.
*
* See {@link WeierstrassOpts}.
* @param params - Curve parameters. See {@link WeierstrassOpts}.
* @param extraOpts - Optional helpers and overrides. See {@link WeierstrassExtraOpts}.
* @returns Weierstrass point constructor.
* @throws If the curve parameters, overrides, or point codecs are invalid. {@link Error}
*
* @example
* Construct a point type from explicit Weierstrass curve parameters.
*
* ```js
* const opts = {
*   p: 0xfffffffffffffffffffffffffffffffeffffac73n,
*   n: 0x100000000000000000001b8fa16dfab9aca16b6b3n,
*   h: 1n,
*   a: 0n,
*   b: 7n,
*   Gx: 0x3b4c382ce37aa192a4019e763036f4f5dd4d7ebbn,
*   Gy: 0x938cf935318fdced6bc28286531733c3f03c4feen,
* };
* const secp160k1_Point = weierstrass(opts);
* ```
*/
function weierstrass(params, extraOpts = {}) {
	const validated = createCurveFields("weierstrass", params, extraOpts);
	const Fp = validated.Fp;
	const Fn = validated.Fn;
	let CURVE = validated.CURVE;
	const { h: cofactor, n: CURVE_ORDER } = CURVE;
	validateObject(extraOpts, {}, {
		allowInfinityPoint: "boolean",
		clearCofactor: "function",
		isTorsionFree: "function",
		fromBytes: "function",
		toBytes: "function",
		endo: "object",
		randomBytes: "function"
	});
	const { endo: endoOpts, allowInfinityPoint, clearCofactor, isTorsionFree, fromBytes, toBytes } = extraOpts;
	const randomBytes = extraOpts.randomBytes === void 0 ? randomBytes$1 : extraOpts.randomBytes;
	if (endoOpts) {
		if (!Fp.is0(CURVE.a) || typeof endoOpts.beta !== "bigint" || !Array.isArray(endoOpts.basises)) throw new Error("invalid endo: expected \"beta\": bigint and \"basises\": array");
	}
	const endo = endoOpts ? {
		beta: endoOpts.beta,
		basises: endoOpts.basises.map((basis) => [...basis])
	} : void 0;
	const lengths = getWLengths(Fp, Fn);
	function assertCompressionIsSupported() {
		if (!Fp.isOdd) throw new Error("compression is not supported: Field does not have .isOdd()");
	}
	function pointToBytes(_c, point, isCompressed) {
		if (point.is0()) {
			if (!allowInfinityPoint) throw new Error("bad point: ZERO");
			return Uint8Array.of(0);
		}
		const { x, y } = point.toAffine();
		const bx = Fp.toBytes(x);
		abool(isCompressed, "isCompressed");
		if (isCompressed) {
			assertCompressionIsSupported();
			const hasEvenY = !Fp.isOdd(y);
			return concatBytes(pprefix(hasEvenY), bx);
		} else return concatBytes(Uint8Array.of(4), bx, Fp.toBytes(y));
	}
	function pointFromBytes(bytes) {
		abytes(bytes, void 0, "Point");
		const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
		const length = bytes.length;
		const head = bytes[0];
		const tail = bytes.subarray(1);
		if (allowInfinityPoint && length === 1 && head === 0) return {
			x: Fp.ZERO,
			y: Fp.ZERO
		};
		if (length === comp && (head === 2 || head === 3)) {
			const x = Fp.fromBytes(tail);
			if (!Fp.isValid(x)) throw new Error("bad point: is not on curve, wrong x");
			const y2 = weierstrassEquation(x);
			let y;
			try {
				y = Fp.sqrt(y2);
			} catch (sqrtError) {
				const err = sqrtError instanceof Error ? ": " + sqrtError.message : "";
				throw new Error("bad point: is not on curve, sqrt error" + err);
			}
			assertCompressionIsSupported();
			const evenY = Fp.isOdd(y);
			if ((head & 1) === 1 !== evenY) y = Fp.neg(y);
			return {
				x,
				y
			};
		} else if (length === uncomp && head === 4) {
			const L = Fp.BYTES;
			const x = Fp.fromBytes(tail.subarray(0, L));
			const y = Fp.fromBytes(tail.subarray(L, L * 2));
			if (!isValidXY(x, y)) throw new Error("bad point: is not on curve");
			return {
				x,
				y
			};
		} else throw new Error(`bad point: got length ${length}, expected compressed=${comp} or uncompressed=${uncomp}`);
	}
	const encodePoint = toBytes === void 0 ? pointToBytes : toBytes;
	const decodePoint = fromBytes === void 0 ? pointFromBytes : fromBytes;
	const b3 = Fp.mul(CURVE.b, _3n);
	const mulA = Fp.is0(CURVE.a) ? (_) => Fp.ZERO : (x) => Fp.mul(CURVE.a, x);
	function weierstrassEquation(x) {
		const x2 = Fp.sqr(x);
		const x3 = Fp.mul(x2, x);
		return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
	}
	/** Checks whether equation holds for given x, y: y² == x³ + ax + b */
	function isValidXY(x, y) {
		const left = Fp.sqr(y);
		const right = weierstrassEquation(x);
		return Fp.eql(left, right);
	}
	if (!isValidXY(CURVE.Gx, CURVE.Gy)) throw new Error("bad curve params: generator point");
	const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n), _4n);
	const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
	if (Fp.is0(Fp.add(_4a3, _27b2))) throw new Error("bad curve params: a or b");
	/** Asserts coordinate is valid: 0 <= n < Fp.ORDER. */
	function acoord(title, n, banZero = false) {
		if (!Fp.isValid(n) || banZero && Fp.is0(n)) throw new Error(`bad point coordinate ${title}`);
		return typeof n === "object" && n !== null ? Fp.create(n) : n;
	}
	function aprjpoint(other) {
		if (!(other instanceof Point)) throw new Error("Weierstrass Point expected");
	}
	function splitEndoScalarN(k) {
		if (!endo || !endo.basises) throw new Error("no endo");
		return _splitEndoScalar(k, endo.basises, Fn.ORDER);
	}
	/**
	* Appends a (point, scalar) pair to the inputs of a vartime wNAF walk
	* ({@link mulAddUnsafe}). With GLV endomorphism the scalar is split into two half-width
	* pairs against P and ψ(P) = (β⋅x, y), halving the walk's shared doubling chain;
	* split signs fold into the points.
	*/
	function pushWnafPair(points, scalars, p, k) {
		if (!Fn.isValid(k)) throw new RangeError("invalid scalar: out of range");
		if (endo) {
			const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(k);
			const psi = new Point(Fp.mul(p.X, endo.beta), p.Y, p.Z);
			points.push(k1neg ? p.negate() : p, k2neg ? psi.negate() : psi);
			scalars.push(k1, k2);
		} else {
			points.push(p);
			scalars.push(k);
		}
	}
	const validityCache = /* @__PURE__ */ new WeakSet();
	/**
	* Projective Point works in 3d / projective (homogeneous) coordinates:(X, Y, Z) ∋ (x=X/Z, y=Y/Z).
	* Default Point works in 2d / affine coordinates: (x, y).
	* We're doing calculations in projective, because its operations don't require costly inversion.
	*/
	class Point {
		static BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
		static ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
		static Fp = Fp;
		static Fn = Fn;
		X;
		Y;
		Z;
		/** Does NOT validate if the point is valid. Use `.assertValidity()`. */
		constructor(X, Y, Z) {
			this.X = acoord("x", X);
			this.Y = acoord("y", Y, true);
			this.Z = acoord("z", Z);
			Object.freeze(this);
		}
		static CURVE() {
			return CURVE;
		}
		/** Does NOT validate if the point is valid. Use `.assertValidity()`. */
		static fromAffine(p) {
			const { x, y } = p || {};
			if (!p || !Fp.isValid(x) || !Fp.isValid(y)) throw new Error("invalid affine point");
			if (p instanceof Point) throw new Error("projective point not allowed");
			if (Fp.is0(x) && Fp.is0(y)) return Point.ZERO;
			return new Point(x, y, Fp.ONE);
		}
		static fromBytes(bytes) {
			const P = Point.fromAffine(decodePoint(abytes(bytes, void 0, "point")));
			P.assertValidity();
			return P;
		}
		static fromHex(hex) {
			return Point.fromBytes(hexToBytes$1(hex));
		}
		get x() {
			return this.toAffine().x;
		}
		get y() {
			return this.toAffine().y;
		}
		/**
		* @param isLazy - true will defer table computation until the first multiplication
		*/
		precompute(windowSize = 6, isLazy = true) {
			wnaf.setWindowSize(this, windowSize);
			if (!isLazy) this.multiply(_3n);
			return this;
		}
		/** A point on curve is valid if it conforms to equation. */
		assertValidity() {
			const p = this;
			if (p.is0()) {
				if (allowInfinityPoint && Fp.is0(p.X) && Fp.eql(p.Y, Fp.ONE) && Fp.is0(p.Z)) return;
				throw new Error("bad point: ZERO");
			}
			if (validityCache.has(p)) return;
			const { x, y } = p.toAffine();
			if (!Fp.isValid(x) || !Fp.isValid(y)) throw new Error("bad point: x or y not field elements");
			if (!isValidXY(x, y)) throw new Error("bad point: equation left != right");
			if (!p.isTorsionFree()) throw new Error("bad point: not in prime-order subgroup");
			validityCache.add(p);
		}
		hasEvenY() {
			const { y } = this.toAffine();
			if (!Fp.isOdd) throw new Error("Field doesn't support isOdd");
			return !Fp.isOdd(y);
		}
		/** Compare one point to another. */
		equals(other) {
			aprjpoint(other);
			const { X: X1, Y: Y1, Z: Z1 } = this;
			const { X: X2, Y: Y2, Z: Z2 } = other;
			const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
			const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
			return U1 && U2;
		}
		/** Flips point to one corresponding to (x, -y) in Affine coordinates. */
		negate() {
			return new Point(this.X, Fp.neg(this.Y), this.Z);
		}
		double() {
			const { X: X1, Y: Y1, Z: Z1 } = this;
			let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
			let t0 = Fp.mul(X1, X1);
			let t1 = Fp.mul(Y1, Y1);
			let t2 = Fp.mul(Z1, Z1);
			let t3 = Fp.mul(X1, Y1);
			t3 = Fp.add(t3, t3);
			Z3 = Fp.mul(X1, Z1);
			Z3 = Fp.add(Z3, Z3);
			X3 = mulA(Z3);
			Y3 = Fp.mul(b3, t2);
			Y3 = Fp.add(X3, Y3);
			X3 = Fp.sub(t1, Y3);
			Y3 = Fp.add(t1, Y3);
			Y3 = Fp.mul(X3, Y3);
			X3 = Fp.mul(t3, X3);
			Z3 = Fp.mul(b3, Z3);
			t2 = mulA(t2);
			t3 = Fp.sub(t0, t2);
			t3 = mulA(t3);
			t3 = Fp.add(t3, Z3);
			Z3 = Fp.add(t0, t0);
			t0 = Fp.add(Z3, t0);
			t0 = Fp.add(t0, t2);
			t0 = Fp.mul(t0, t3);
			Y3 = Fp.add(Y3, t0);
			t2 = Fp.mul(Y1, Z1);
			t2 = Fp.add(t2, t2);
			t0 = Fp.mul(t2, t3);
			X3 = Fp.sub(X3, t0);
			Z3 = Fp.mul(t2, t1);
			Z3 = Fp.add(Z3, Z3);
			Z3 = Fp.add(Z3, Z3);
			return new Point(X3, Y3, Z3);
		}
		add(other) {
			aprjpoint(other);
			const { X: X1, Y: Y1, Z: Z1 } = this;
			const { X: X2, Y: Y2, Z: Z2 } = other;
			let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
			let t0 = Fp.mul(X1, X2);
			let t1 = Fp.mul(Y1, Y2);
			let t2 = Fp.mul(Z1, Z2);
			let t3 = Fp.add(X1, Y1);
			let t4 = Fp.add(X2, Y2);
			t3 = Fp.mul(t3, t4);
			t4 = Fp.add(t0, t1);
			t3 = Fp.sub(t3, t4);
			t4 = Fp.add(X1, Z1);
			let t5 = Fp.add(X2, Z2);
			t4 = Fp.mul(t4, t5);
			t5 = Fp.add(t0, t2);
			t4 = Fp.sub(t4, t5);
			t5 = Fp.add(Y1, Z1);
			X3 = Fp.add(Y2, Z2);
			t5 = Fp.mul(t5, X3);
			X3 = Fp.add(t1, t2);
			t5 = Fp.sub(t5, X3);
			Z3 = mulA(t4);
			X3 = Fp.mul(b3, t2);
			Z3 = Fp.add(X3, Z3);
			X3 = Fp.sub(t1, Z3);
			Z3 = Fp.add(t1, Z3);
			Y3 = Fp.mul(X3, Z3);
			t1 = Fp.add(t0, t0);
			t1 = Fp.add(t1, t0);
			t2 = mulA(t2);
			t4 = Fp.mul(b3, t4);
			t1 = Fp.add(t1, t2);
			t2 = Fp.sub(t0, t2);
			t2 = mulA(t2);
			t4 = Fp.add(t4, t2);
			t0 = Fp.mul(t1, t4);
			Y3 = Fp.add(Y3, t0);
			t0 = Fp.mul(t5, t4);
			X3 = Fp.mul(t3, X3);
			X3 = Fp.sub(X3, t0);
			t0 = Fp.mul(t3, t1);
			Z3 = Fp.mul(t5, Z3);
			Z3 = Fp.add(Z3, t0);
			return new Point(X3, Y3, Z3);
		}
		subtract(other) {
			aprjpoint(other);
			return this.add(other.negate());
		}
		is0() {
			return this.equals(Point.ZERO);
		}
		/**
		* Constant time multiplication.
		* Uses precomputed tables (signed fixed-window wNAF) when available.
		* Uses scalar blinding and avoids endomorphism splitting in the secret-scalar path.
		* @param scalar - by which the point would be multiplied
		* @returns New point
		*/
		multiply(scalar) {
			if (!Fn.isValidNot0(scalar)) throw new RangeError("invalid scalar: out of range");
			const { p, f } = wnaf.mulSecret(this, scalar, cofactor, normalize);
			return normalize([p, f])[0];
		}
		/**
		* Non-constant-time multiplication. Uses width-4 wNAF with GLV endomorphism splitting
		* when available (two half-width scalars sharing one halved doubling chain).
		* It's faster, but should only be used when you don't care about
		* an exposed secret key e.g. sig verification, which works over *public* keys.
		*/
		multiplyUnsafe(scalar) {
			const p = this;
			const sc = scalar;
			if (!Fn.isValid(sc)) throw new RangeError("invalid scalar: out of range");
			if (sc === _0n || p.is0()) return Point.ZERO;
			if (sc === _1n) return p;
			if (wnaf.hasWindowSize(this)) return wnaf.mulUnsafe(p, sc, normalize);
			const points = [];
			const scalars = [];
			pushWnafPair(points, scalars, p, sc);
			return mulAddUnsafe(Point, points, scalars);
		}
		/**
		* Non-constant-time double-scalar multiplication `a⋅this + b⋅other` (Strauss–Shamir).
		* Both walks share one doubling chain via {@link mulAddUnsafe}, and GLV endomorphism
		* (when available) halves the chain again by splitting each scalar into two half-width
		* parts. Used by ECDSA verification and public-key recovery for `R = u1⋅G + u2⋅P`.
		* Only for public scalars.
		*/
		mulAddUnsafe(a, other, b) {
			aprjpoint(other);
			const points = [];
			const scalars = [];
			pushWnafPair(points, scalars, this, a);
			pushWnafPair(points, scalars, other, b);
			return mulAddUnsafe(Point, points, scalars);
		}
		/**
		* Converts Projective point to affine (x, y) coordinates.
		* (X, Y, Z) ∋ (x=X/Z, y=Y/Z).
		* @param invertedZ - Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
		*/
		toAffine(invertedZ) {
			const p = this;
			let iz = invertedZ;
			if (iz != null && !Fp.isValid(iz)) throw new RangeError("\"invertedZ\" expected valid field element");
			const { X, Y, Z } = p;
			if (Fp.eql(Z, Fp.ONE)) return {
				x: X,
				y: Y
			};
			const is0 = p.is0();
			if (iz == null) iz = is0 ? Fp.ONE : Fp.inv(Z);
			const x = Fp.mul(X, iz);
			const y = Fp.mul(Y, iz);
			const zz = Fp.mul(Z, iz);
			if (is0) return {
				x: Fp.ZERO,
				y: Fp.ZERO
			};
			if (!Fp.eql(zz, Fp.ONE)) throw new Error("invZ was invalid");
			return {
				x,
				y
			};
		}
		/**
		* Checks whether Point is free of torsion elements (is in prime subgroup).
		* Always torsion-free for cofactor=1 curves.
		*/
		isTorsionFree() {
			if (cofactor === _1n) return true;
			if (isTorsionFree) return isTorsionFree(Point, this);
			return wnaf.mulUnsafe(this, CURVE_ORDER).is0();
		}
		clearCofactor() {
			if (cofactor === _1n) return this;
			if (clearCofactor) return clearCofactor(Point, this);
			return this.multiplyUnsafe(cofactor);
		}
		isSmallOrder() {
			if (cofactor === _1n) return this.is0();
			return this.clearCofactor().is0();
		}
		toBytes(isCompressed = true) {
			abool(isCompressed, "isCompressed");
			this.assertValidity();
			return encodePoint(Point, this, isCompressed);
		}
		toHex(isCompressed = true) {
			return bytesToHex(this.toBytes(isCompressed));
		}
		toString() {
			return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
		}
	}
	const normalize = (points) => normalizeZ(Point, points);
	const wnaf = new ScalarMultiplier(Point, randomBytes);
	if (wnaf.bits >= 6) Point.BASE.precompute(6);
	Object.freeze(Point.prototype);
	Object.freeze(Point);
	return Point;
}
function pprefix(hasEvenY) {
	return Uint8Array.of(hasEvenY ? 2 : 3);
}
function getWLengths(Fp, Fn) {
	return {
		secretKey: Fn.BYTES,
		publicKey: 1 + Fp.BYTES,
		publicKeyUncompressed: 1 + 2 * Fp.BYTES,
		publicKeyHasPrefix: true,
		signature: 2 * Fn.BYTES
	};
}
/**
* Sometimes users only need getPublicKey, getSharedSecret, and secret key handling.
* This helper ensures no signature functionality is present. Less code, smaller bundle size.
* @param Point - Weierstrass point constructor.
* @param ecdhOpts - Optional randomness helpers:
*   - `randomBytes` (optional): Optional RNG override.
* @returns ECDH helper namespace.
* @example
* Sometimes users only need getPublicKey, getSharedSecret, and secret key handling.
*
* ```ts
* import { ecdh } from '@noble/curves/abstract/weierstrass.js';
* import { p256 } from '@noble/curves/nist.js';
* const dh = ecdh(p256.Point);
* const alice = dh.keygen();
* const shared = dh.getSharedSecret(alice.secretKey, alice.publicKey);
* ```
*/
function ecdh(Point, ecdhOpts = {}) {
	validatePointCons(Point);
	const { Fn } = Point;
	const randomBytes_ = ecdhOpts.randomBytes === void 0 ? randomBytes$1 : ecdhOpts.randomBytes;
	const lengths = Object.assign(getWLengths(Point.Fp, Fn), { seed: Math.max(getMinHashLength(Fn.ORDER), 16) });
	function isValidSecretKey(secretKey) {
		try {
			const num = Fn.fromBytes(secretKey);
			return Fn.isValidNot0(num);
		} catch (error) {
			return false;
		}
	}
	function isValidPublicKey(publicKey, isCompressed) {
		const { publicKey: comp, publicKeyUncompressed } = lengths;
		try {
			const l = publicKey.length;
			if (isCompressed === true && l !== comp) return false;
			if (isCompressed === false && l !== publicKeyUncompressed) return false;
			return !Point.fromBytes(publicKey).is0();
		} catch (error) {
			return false;
		}
	}
	/**
	* Produces cryptographically secure secret key from random of size
	* (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
	*/
	function randomSecretKey(seed) {
		seed = seed === void 0 ? randomBytes_(lengths.seed) : seed;
		return mapHashToField(abytes(seed, lengths.seed, "seed"), Fn.ORDER);
	}
	/**
	* Computes public key for a secret key. Checks for validity of the secret key.
	* @param isCompressed - whether to return compact (default), or full key
	* @returns Public key, full when isCompressed=false; short when isCompressed=true
	*/
	function getPublicKey(secretKey, isCompressed = true) {
		return Point.BASE.multiply(Fn.fromBytes(secretKey)).toBytes(isCompressed);
	}
	/**
	* Quick and dirty check for item being public key. Does not validate hex, or being on-curve.
	*/
	function isProbPub(item) {
		const { secretKey, publicKey, publicKeyUncompressed } = lengths;
		const allowedLengths = Fn._lengths;
		if (!isBytes$1(item)) return void 0;
		const l = abytes(item, void 0, "key").length;
		const isPub = l === publicKey || l === publicKeyUncompressed;
		const isSec = l === secretKey || !!allowedLengths?.includes(l);
		if (isPub && isSec) return void 0;
		return isPub;
	}
	/**
	* ECDH (Elliptic Curve Diffie Hellman).
	* Computes encoded shared point from secret key A and public key B.
	* Checks: 1) secret key validity 2) shared key is on-curve.
	* Does NOT hash the result or expose the SEC 1 x-coordinate-only `z`.
	* Returns the encoded shared point on purpose: callers that need `x_P`
	* can derive it from the encoded point, but `x_P` alone cannot recover the
	* point/parity back.
	* This helper only exposes the fully validated public-key path, not cofactor DH.
	* @param isCompressed - whether to return compact (default), or full key
	* @returns shared point encoding
	*/
	function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
		if (isProbPub(secretKeyA) === true) throw new Error("first arg must be private key");
		if (isProbPub(publicKeyB) === false) throw new Error("second arg must be public key");
		const s = Fn.fromBytes(secretKeyA);
		const b = Point.fromBytes(publicKeyB);
		if (b.is0()) throw new Error("invalid public key: point at infinity");
		return b.multiply(s).toBytes(isCompressed);
	}
	const utils = {
		isValidSecretKey,
		isValidPublicKey,
		randomSecretKey
	};
	const keygen = createKeygen(randomSecretKey, getPublicKey);
	Object.freeze(utils);
	Object.freeze(lengths);
	return Object.freeze({
		getPublicKey,
		getSharedSecret,
		keygen,
		Point,
		utils,
		lengths
	});
}
/**
* Creates ECDSA signing interface for given elliptic curve `Point` and `hash` function.
*
* @param Point - created using {@link weierstrass} function
* @param hash - used for 1) message prehash-ing 2) k generation in `sign`, using hmac_drbg(hash)
* @param ecdsaOpts - rarely needed, see {@link ECDSAOpts}:
*   - `lowS`: Default low-S policy.
*   - `hmac`: HMAC implementation used by RFC6979 DRBG.
*   - `randomBytes`: Optional RNG override.
*   - `bits2int`: Optional hash-to-int conversion override.
*   - `bits2int_modN`: Optional hash-to-int-mod-n conversion override.
*
* @returns ECDSA helper namespace.
* @example
* Create an ECDSA signer/verifier bundle for one curve implementation.
*
* ```ts
* import { ecdsa } from '@noble/curves/abstract/weierstrass.js';
* import { p256 } from '@noble/curves/nist.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const p256ecdsa = ecdsa(p256.Point, sha256);
* const { secretKey, publicKey } = p256ecdsa.keygen();
* const msg = new TextEncoder().encode('hello noble');
* const sig = p256ecdsa.sign(msg, secretKey);
* const isValid = p256ecdsa.verify(sig, msg, publicKey);
* ```
*/
function ecdsa(Point, hash, ecdsaOpts = {}) {
	validatePointCons(Point);
	const hash_ = hash;
	ahash(hash_);
	validateObject(ecdsaOpts, {}, {
		hmac: "function",
		lowS: "boolean",
		randomBytes: "function",
		bits2int: "function",
		bits2int_modN: "function"
	});
	const opts = Object.assign({}, ecdsaOpts);
	const randomBytes = opts.randomBytes === void 0 ? randomBytes$1 : opts.randomBytes;
	const hmac$1 = opts.hmac === void 0 ? (key, msg) => hmac(hash_, key, msg) : opts.hmac;
	const { Fp, Fn } = Point;
	const { ORDER: CURVE_ORDER, BITS: fnBits } = Fn;
	const blindLength = getMinHashLength(CURVE_ORDER);
	const csprng = probeRandomBytes(randomBytes, blindLength);
	const { keygen, getPublicKey, getSharedSecret, utils, lengths } = ecdh(Point, opts);
	const defaultSigOpts = {
		prehash: true,
		lowS: typeof opts.lowS === "boolean" ? opts.lowS : true,
		format: "compact",
		extraEntropy: false
	};
	const hasLargeRecoveryLifts = CURVE_ORDER * _2n$1 + _1n < Fp.ORDER;
	function isBiggerThanHalfOrder(number) {
		return number > CURVE_ORDER >> _1n;
	}
	function validateRS(title, num) {
		if (!Fn.isValidNot0(num)) throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
		return num;
	}
	function assertFieldSignIsSupported() {
		if (!Fp.isOdd) throw new Error("Field doesn't support isOdd");
	}
	function getRecoveryBit(x, y, r) {
		assertFieldSignIsSupported();
		return (x === r ? 0 : 2) | Number(Fp.isOdd(y));
	}
	function assertRecoverableCurve() {
		if (hasLargeRecoveryLifts) throw new Error("\"recovered\" sig type is not supported for cofactor >2 curves");
	}
	function validateSigLength(bytes, format) {
		validateSigFormat(format);
		const size = lengths.signature;
		const sizer = format === "compact" ? size : format === "recovered" ? size + 1 : void 0;
		return abytes(bytes, sizer);
	}
	/**
	* ECDSA signature with its (r, s) properties. Supports compact, recovered & DER representations.
	*/
	class Signature {
		r;
		s;
		recovery;
		constructor(r, s, recovery) {
			this.r = validateRS("r", r);
			this.s = validateRS("s", s);
			if (recovery != null) {
				assertRecoverableCurve();
				if (![
					0,
					1,
					2,
					3
				].includes(recovery)) throw new Error("invalid recovery id");
				this.recovery = recovery;
			}
			Object.freeze(this);
		}
		static fromBytes(bytes, format = defaultSigOpts.format) {
			validateSigLength(bytes, format);
			let recid;
			if (format === "der") {
				if (bytes.length > 2 * Fn.BYTES + 16) throw new DER.Err("invalid signature: DER signature too long");
				const { r, s } = DER.toSig(abytes(bytes), Fn.BYTES + 1);
				return new Signature(r, s);
			}
			if (format === "recovered") {
				recid = bytes[0];
				format = "compact";
				bytes = bytes.subarray(1);
			}
			const L = lengths.signature / 2;
			const r = bytes.subarray(0, L);
			const s = bytes.subarray(L, L * 2);
			return new Signature(Fn.fromBytes(r), Fn.fromBytes(s), recid);
		}
		static fromHex(hex, format) {
			return this.fromBytes(hexToBytes$1(hex), format);
		}
		assertRecovery() {
			const { recovery } = this;
			if (recovery == null) throw new Error("invalid recovery id: must be present");
			return recovery;
		}
		addRecoveryBit(recovery) {
			return new Signature(this.r, this.s, recovery);
		}
		recoverPublicKey(messageHash) {
			const { r, s } = this;
			const recovery = this.assertRecovery();
			const radj = recovery === 2 || recovery === 3 ? r + CURVE_ORDER : r;
			if (!Fp.isValid(radj)) throw new Error("invalid recovery id: sig.r+curve.n != R.x");
			const x = Fp.toBytes(radj);
			const R = Point.fromBytes(concatBytes(pprefix((recovery & 1) === 0), x));
			const ir = Fn.inv(radj);
			const h = bits2int_modN(abytes(messageHash, void 0, "msgHash"));
			const u1 = Fn.create(-h * ir);
			const u2 = Fn.create(s * ir);
			const Q = Point.BASE.mulAddUnsafe(u1, R, u2);
			if (Q.is0()) throw new Error("invalid recovery: point at infinify");
			Q.assertValidity();
			return Q;
		}
		hasHighS() {
			return isBiggerThanHalfOrder(this.s);
		}
		toBytes(format = defaultSigOpts.format) {
			validateSigFormat(format);
			if (format === "der") return hexToBytes$1(DER.hexFromSig(this));
			const { r, s } = this;
			const rb = Fn.toBytes(r);
			const sb = Fn.toBytes(s);
			if (format === "recovered") {
				assertRecoverableCurve();
				return concatBytes(Uint8Array.of(this.assertRecovery()), rb, sb);
			}
			return concatBytes(rb, sb);
		}
		toHex(format) {
			return bytesToHex(this.toBytes(format));
		}
	}
	Object.freeze(Signature.prototype);
	Object.freeze(Signature);
	const bits2int = opts.bits2int === void 0 ? function bits2int_def(bytes) {
		if (bytes.length > 8192) throw new Error("input is too large");
		const num = bytesToNumberBE(bytes);
		const delta = bytes.length * 8 - fnBits;
		return delta > 0 ? num >> BigInt(delta) : num;
	} : opts.bits2int;
	const bits2int_modN = opts.bits2int_modN === void 0 ? function bits2int_modN_def(bytes) {
		return Fn.create(bits2int(bytes));
	} : opts.bits2int_modN;
	const ORDER_MASK = bitMask(fnBits);
	/** Converts to bytes. Checks if num in `[0..ORDER_MASK-1]` e.g.: `[0..2^256-1]`. */
	function int2octets(num) {
		aInRange("num < 2^" + fnBits, num, _0n, ORDER_MASK);
		return Fn.toBytes(num);
	}
	function validateMsgAndHash(message, prehash) {
		abytes(message, void 0, "message");
		return prehash ? abytes(hash_(message), void 0, "prehashed message") : message;
	}
	/**
	* Steps A, D of RFC6979 3.2.
	* Creates RFC6979 seed; converts msg/privKey to numbers.
	* Used only in sign, not in verify.
	*
	* Warning: we cannot assume here that message has same amount of bytes as curve order,
	* this will be invalid at least for P521. Also it can be bigger for P224 + SHA256.
	*/
	function prepSig(message, secretKey, opts) {
		const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
		message = validateMsgAndHash(message, prehash);
		const h1int = bits2int_modN(message);
		const d = Fn.fromBytes(secretKey);
		if (!Fn.isValidNot0(d)) throw new Error("invalid private key");
		const seedArgs = [int2octets(d), int2octets(h1int)];
		if (extraEntropy != null && extraEntropy !== false) {
			const e = extraEntropy === true ? randomBytes(lengths.secretKey) : extraEntropy;
			seedArgs.push(abytes(e, void 0, "extraEntropy"));
		}
		const seed = concatBytes(...seedArgs);
		const m = h1int;
		function k2sig(kBytes) {
			const k = bits2int(kBytes);
			if (!Fn.isValidNot0(k)) return;
			const q = Point.BASE.multiply(k).toAffine();
			const r = Fn.create(q.x);
			if (r === _0n) return;
			let s;
			if (csprng !== void 0) {
				const b = bytesToNumberBE(mapHashToField(csprng(blindLength), CURVE_ORDER));
				const ibk = Fn.inv(Fn.mul(b, k));
				const bm = Fn.mul(b, m);
				const bd = Fn.mul(b, d);
				s = Fn.create(ibk * Fn.create(bm + bd * r));
			} else {
				const ik = invertCt(k, CURVE_ORDER);
				s = Fn.create(ik * Fn.create(m + r * d));
			}
			if (s === _0n) return;
			let recovery = getRecoveryBit(q.x, q.y, r);
			let normS = s;
			if (lowS && isBiggerThanHalfOrder(s)) {
				normS = Fn.neg(s);
				recovery ^= 1;
			}
			return new Signature(r, normS, hasLargeRecoveryLifts ? void 0 : recovery);
		}
		return {
			seed,
			k2sig
		};
	}
	/**
	* Signs a message or message hash with a secret key.
	* With the default `prehash: true`, raw message bytes are hashed internally;
	* only `{ prehash: false }` expects a caller-supplied digest.
	*
	* ```
	* sign(m, d) where
	*   k = rfc6979_hmac_drbg(m, d)
	*   (x, y) = G × k
	*   r = x mod n
	*   s = (m + dr) / k mod n
	* ```
	*/
	function sign(message, secretKey, opts = {}) {
		const { seed, k2sig } = prepSig(message, secretKey, opts);
		return createHmacDrbg(hash_.outputLen, Fn.BYTES, hmac$1)(seed, k2sig).toBytes(opts.format);
	}
	/**
	* Verifies a signature against message and public key.
	* Rejects lowS signatures by default: see {@link ECDSAVerifyOpts}.
	* Implements section 4.1.4 from https://www.secg.org/sec1-v2.pdf:
	*
	* ```
	* verify(r, s, h, P) where
	*   u1 = hs^-1 mod n
	*   u2 = rs^-1 mod n
	*   R = u1⋅G + u2⋅P
	*   mod(R.x, n) == r
	* ```
	*/
	function verify(signature, message, publicKey, opts = {}) {
		const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
		publicKey = abytes(publicKey, void 0, "publicKey");
		message = validateMsgAndHash(message, prehash);
		if (!isBytes$1(signature)) {
			const end = signature instanceof Signature ? ", use sig.toBytes()" : "";
			throw new Error("verify expects Uint8Array signature" + end);
		}
		validateSigLength(signature, format);
		try {
			const sig = Signature.fromBytes(signature, format);
			const P = Point.fromBytes(publicKey);
			if (P.is0()) return false;
			if (lowS && sig.hasHighS()) return false;
			const { r, s } = sig;
			const h = bits2int_modN(message);
			const is = Fn.inv(s);
			const u1 = Fn.create(h * is);
			const u2 = Fn.create(r * is);
			const R = Point.BASE.mulAddUnsafe(u1, P, u2);
			if (R.is0()) return false;
			const q = R.toAffine();
			if (Fn.create(q.x) !== r) return false;
			if (format === "recovered" && sig.recovery !== getRecoveryBit(q.x, q.y, r)) return false;
			return true;
		} catch (e) {
			return false;
		}
	}
	function recoverPublicKey(signature, message, opts = {}) {
		const { prehash } = validateSigOpts(opts, defaultSigOpts);
		message = validateMsgAndHash(message, prehash);
		return Signature.fromBytes(signature, "recovered").recoverPublicKey(message).toBytes();
	}
	return Object.freeze({
		keygen,
		getPublicKey,
		getSharedSecret,
		utils,
		lengths,
		Point,
		sign,
		verify,
		recoverPublicKey,
		Signature,
		hash: hash_
	});
}
//#endregion
//#region ../../node_modules/@noble/curves/secp256k1.js
/**
* SECG secp256k1. See [pdf](https://www.secg.org/sec2-v2.pdf).
*
* Belongs to Koblitz curves: it has efficiently-computable GLV endomorphism ψ,
* check out {@link EndomorphismOpts}. Seems to be rigid (not backdoored).
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const secp256k1_CURVE = {
	p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
	n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
	h: BigInt(1),
	a: BigInt(0),
	b: BigInt(7),
	Gx: BigInt("0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
	Gy: BigInt("0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
};
const secp256k1_ENDO = {
	beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
	basises: [[BigInt("0x3086d221a7d46bcde86c90e49284eb15"), -BigInt("0xe4437ed6010e88286f547fa90abfe4c3")], [BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), BigInt("0x3086d221a7d46bcde86c90e49284eb15")]]
};
const _2n = /* @__PURE__ */ BigInt(2);
/**
* √n = n^((p+1)/4) for fields p = 3 mod 4. We unwrap the loop and multiply bit-by-bit.
* (P+1n/4n).toString(2) would produce bits [223x 1, 0, 22x 1, 4x 0, 11, 00]
*/
function sqrtMod(y) {
	const P = secp256k1_CURVE.p;
	const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
	const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
	const b2 = y * y * y % P;
	const b3 = b2 * b2 * y % P;
	const b11 = pow2(pow2(pow2(b3, _3n, P) * b3 % P, _3n, P) * b3 % P, _2n, P) * b2 % P;
	const b22 = pow2(b11, _11n, P) * b11 % P;
	const b44 = pow2(b22, _22n, P) * b22 % P;
	const b88 = pow2(b44, _44n, P) * b44 % P;
	const root = pow2(pow2(pow2(pow2(pow2(pow2(b88, _88n, P) * b88 % P, _44n, P) * b44 % P, _3n, P) * b3 % P, _23n, P) * b22 % P, _6n, P) * b2 % P, _2n, P);
	if (!Fpk1.eql(Fpk1.sqr(root), y)) throw new Error("Cannot find square root");
	return root;
}
const Fpk1 = /* @__PURE__ */ Field(secp256k1_CURVE.p, { sqrt: sqrtMod });
/**
* secp256k1 curve: ECDSA and ECDH methods.
*
* Uses sha256 to hash messages. To use a different hash,
* pass `{ prehash: false }` to sign / verify.
*
* @example
* Generate one secp256k1 keypair, sign a message, and verify it.
*
* ```js
* import { secp256k1 } from '@noble/curves/secp256k1.js';
* const { secretKey, publicKey } = secp256k1.keygen();
* // const publicKey = secp256k1.getPublicKey(secretKey);
* const msg = new TextEncoder().encode('hello noble');
* const sig = secp256k1.sign(msg, secretKey);
* const isValid = secp256k1.verify(sig, msg, publicKey);
* // const sigKeccak = secp256k1.sign(keccak256(msg), secretKey, { prehash: false });
* ```
*/
const secp256k1 = /* @__PURE__ */ ecdsa(/* @__PURE__ */ weierstrass(secp256k1_CURVE, {
	Fp: Fpk1,
	endo: secp256k1_ENDO
}), sha256$1);
//#endregion
//#region ../bc-crypto-ts/dist/index.mjs
/**
* The single error type thrown by this package.
*
* @module error
*/
/**
* Thrown for wrong-length keys, nonces, signatures and public keys
* (`InvalidSize`), a key, point or signature of the right length that is not
* valid (`InvalidData`), an argument outside its domain, including a value
* of the wrong type (`InvalidParameter`), and AEAD tag mismatch
* (`AuthenticationFailed`).
*
* Every failure of an argument or of a primitive is a `CryptoError`; when a
* backend error is what was caught, it is the `cause`. Two things propagate
* unwrapped, because they are not this package's: a generator's own error
* (`RandError` from `@blockchaincommons/rand`, including `InvalidGenerator`
* for a generator that lacks a method the draw calls), and an allocation
* failure outside the KDFs (`RangeError` from the engine). Instances come
* from the static factories only.
*
* @example
* ```ts
* try {
*   chacha20Poly1305.decrypt(key, nonce, sealed);
* } catch (e) {
*   if (CryptoError.isCryptoError(e) && e.is("AuthenticationFailed")) {
*     // tampered
*   }
* }
* ```
*/
var CryptoError = class CryptoError extends Error {
	/** Always `"CryptoError"`; the cross-copy identity {@link CryptoError.isCryptoError} checks. */
	name = "CryptoError";
	/** The discriminant; equals `details.code`. */
	code;
	/** The structured payload, discriminated by `code`. */
	details;
	constructor(message, details, cause) {
		super(message, cause === void 0 ? void 0 : { cause });
		this.code = details.code;
		this.details = details;
	}
	/** Type guard for a `CryptoError`, including one from another copy of this package. */
	static isCryptoError(value) {
		return value instanceof Error && value.name === "CryptoError" && "code" in value;
	}
	/** `true` when `code` is this error's code. */
	is(code) {
		return this.code === code;
	}
	/** `what` had `actual` bytes; `expected` were required. */
	static invalidSize(what, expected, actual) {
		return new CryptoError(`${what} must be ${expected} bytes, got ${actual}`, {
			code: "InvalidSize",
			what,
			expected,
			actual
		});
	}
	/** `what` has the right length but is not a valid key, point or signature. */
	static invalidData(what, message, cause) {
		return new CryptoError(message, {
			code: "InvalidData",
			what
		}, cause);
	}
	/** `what` (a number, an options object or a byte argument) is outside its domain. */
	static invalidParameter(what, message, cause) {
		return new CryptoError(message, {
			code: "InvalidParameter",
			what
		}, cause);
	}
	/** AEAD authentication failed (wrong key, nonce, aad, or tampered data). */
	static authenticationFailed(cause) {
		return new CryptoError("AEAD error", { code: "AuthenticationFailed" }, cause);
	}
};
/** @internal A short description of a rejected value for `got …` clauses. */
function describeValue(value) {
	if (value === null) return "null";
	if (Array.isArray(value)) return `Array(${value.length})`;
	if (typeof value !== "object") return typeof value;
	const name = Object.getPrototypeOf(value)?.constructor?.name;
	return typeof name === "string" && name !== "" ? name : "object";
}
/**
* @internal `value` must be a `Uint8Array` (from any realm; a `Buffer` is
* one). Every byte argument is checked this way before any other precondition,
* so a string, array or `ArrayBuffer` is `InvalidParameter` naming `what`.
*/
function requireBytes(what, value) {
	if (!isBytes$3(value)) throw CryptoError.invalidParameter(what, `${what} must be a Uint8Array, got ${describeValue(value)}`);
}
/**
* @internal An options argument must be an object. An optional one may be
* `undefined`; a required one may not.
*/
function requireOptions(what, value, optional) {
	if (value === void 0 && optional) return;
	if (typeof value !== "object" || value === null) throw CryptoError.invalidParameter(what, `${what} must be an object, got ${describeValue(value)}`);
}
/**
* @internal Length precondition shared by the key and signature functions.
* The type check comes first, so a non-`Uint8Array` is `InvalidParameter`
* and a wrong length is `InvalidSize`.
*/
function requireLength(what, bytes, expected) {
	requireBytes(what, bytes);
	if (bytes.length !== expected) throw CryptoError.invalidSize(what, expected, bytes.length);
}
const CRC32_TABLE = /* @__PURE__ */ new Uint32Array(256);
for (let i = 0; i < 256; i++) {
	let crc = i;
	for (let j = 0; j < 8; j++) crc = (crc & 1) !== 0 ? crc >>> 1 ^ 3988292384 : crc >>> 1;
	CRC32_TABLE[i] = crc >>> 0;
}
/**
* CRC-32 (IEEE 802.3 / ISO-HDLC) as an unsigned 32-bit integer.
* @throws {CryptoError} `InvalidParameter` unless `data` is a `Uint8Array`.
*/
function crc32(data) {
	requireBytes("crc32 data", data);
	let crc = 4294967295;
	for (let i = 0; i < data.length; i++) crc = CRC32_TABLE[(crc ^ data[i]) & 255] ^ crc >>> 8;
	return (crc ^ 4294967295) >>> 0;
}
/**
* SHA-256 of `data` (32 bytes).
* @throws {CryptoError} `InvalidParameter` unless `data` is a `Uint8Array`.
*/
function sha256(data) {
	requireBytes("sha256 data", data);
	return sha256$1(data);
}
/**
* ChaCha20-Poly1305 authenticated encryption.
*
* @module aead
*/
const SYMMETRIC_KEY_SIZE = 32;
const SYMMETRIC_NONCE_SIZE = 12;
const SYMMETRIC_AUTH_SIZE = 16;
const EMPTY = /* @__PURE__ */ new Uint8Array(0);
/** The `aad` option, validated: `undefined` means none (the same as empty). */
function aadOf(options) {
	requireOptions("ChaCha20-Poly1305 options", options, true);
	const aad = options?.aad;
	if (aad === void 0) return EMPTY;
	requireBytes("ChaCha20-Poly1305 aad", aad);
	return aad;
}
/** ChaCha20-Poly1305 (RFC 8439). */
const chacha20Poly1305 = {
	KEY_SIZE: 32,
	NONCE_SIZE: 12,
	TAG_SIZE: 16,
	encrypt(key, nonce, plaintext, options) {
		requireLength("ChaCha20-Poly1305 key", key, SYMMETRIC_KEY_SIZE);
		requireLength("ChaCha20-Poly1305 nonce", nonce, SYMMETRIC_NONCE_SIZE);
		requireBytes("ChaCha20-Poly1305 plaintext", plaintext);
		const aad = aadOf(options);
		return chacha20poly1305(key, nonce, aad).encrypt(plaintext);
	},
	decrypt(key, nonce, sealed, options) {
		requireLength("ChaCha20-Poly1305 key", key, SYMMETRIC_KEY_SIZE);
		requireLength("ChaCha20-Poly1305 nonce", nonce, SYMMETRIC_NONCE_SIZE);
		requireBytes("ChaCha20-Poly1305 sealed data", sealed);
		const aad = aadOf(options);
		if (sealed.length < SYMMETRIC_AUTH_SIZE) throw CryptoError.invalidSize("ChaCha20-Poly1305 sealed data", SYMMETRIC_AUTH_SIZE, sealed.length);
		try {
			return chacha20poly1305(key, nonce, aad).decrypt(sealed);
		} catch (error) {
			throw CryptoError.authenticationFailed(error);
		}
	}
};
const textEncoder = new TextEncoder();
textEncoder.encode("agreement");
textEncoder.encode("signing");
secp256k1.Point.Fn.ORDER;
//#endregion
//#region ../bc-ur-ts/dist/bytewords-8tau4TxD.mjs
/**
* The 256 bytewords (BCR-2020-012) and the 256 bytemojis, in byte order.
* Wire: every UR and every bytewords identifier is spelled from these.
*
* @module bytewords-tables
*/
/** Byteword for each byte value; four letters, unique first+last pair. Frozen: the tables are wire. */
const BYTEWORDS = Object.freeze([
	"able",
	"acid",
	"also",
	"apex",
	"aqua",
	"arch",
	"atom",
	"aunt",
	"away",
	"axis",
	"back",
	"bald",
	"barn",
	"belt",
	"beta",
	"bias",
	"blue",
	"body",
	"brag",
	"brew",
	"bulb",
	"buzz",
	"calm",
	"cash",
	"cats",
	"chef",
	"city",
	"claw",
	"code",
	"cola",
	"cook",
	"cost",
	"crux",
	"curl",
	"cusp",
	"cyan",
	"dark",
	"data",
	"days",
	"deli",
	"dice",
	"diet",
	"door",
	"down",
	"draw",
	"drop",
	"drum",
	"dull",
	"duty",
	"each",
	"easy",
	"echo",
	"edge",
	"epic",
	"even",
	"exam",
	"exit",
	"eyes",
	"fact",
	"fair",
	"fern",
	"figs",
	"film",
	"fish",
	"fizz",
	"flap",
	"flew",
	"flux",
	"foxy",
	"free",
	"frog",
	"fuel",
	"fund",
	"gala",
	"game",
	"gear",
	"gems",
	"gift",
	"girl",
	"glow",
	"good",
	"gray",
	"grim",
	"guru",
	"gush",
	"gyro",
	"half",
	"hang",
	"hard",
	"hawk",
	"heat",
	"help",
	"high",
	"hill",
	"holy",
	"hope",
	"horn",
	"huts",
	"iced",
	"idea",
	"idle",
	"inch",
	"inky",
	"into",
	"iris",
	"iron",
	"item",
	"jade",
	"jazz",
	"join",
	"jolt",
	"jowl",
	"judo",
	"jugs",
	"jump",
	"junk",
	"jury",
	"keep",
	"keno",
	"kept",
	"keys",
	"kick",
	"kiln",
	"king",
	"kite",
	"kiwi",
	"knob",
	"lamb",
	"lava",
	"lazy",
	"leaf",
	"legs",
	"liar",
	"limp",
	"lion",
	"list",
	"logo",
	"loud",
	"love",
	"luau",
	"luck",
	"lung",
	"main",
	"many",
	"math",
	"maze",
	"memo",
	"menu",
	"meow",
	"mild",
	"mint",
	"miss",
	"monk",
	"nail",
	"navy",
	"need",
	"news",
	"next",
	"noon",
	"note",
	"numb",
	"obey",
	"oboe",
	"omit",
	"onyx",
	"open",
	"oval",
	"owls",
	"paid",
	"part",
	"peck",
	"play",
	"plus",
	"poem",
	"pool",
	"pose",
	"puff",
	"puma",
	"purr",
	"quad",
	"quiz",
	"race",
	"ramp",
	"real",
	"redo",
	"rich",
	"road",
	"rock",
	"roof",
	"ruby",
	"ruin",
	"runs",
	"rust",
	"safe",
	"saga",
	"scar",
	"sets",
	"silk",
	"skew",
	"slot",
	"soap",
	"solo",
	"song",
	"stub",
	"surf",
	"swan",
	"taco",
	"task",
	"taxi",
	"tent",
	"tied",
	"time",
	"tiny",
	"toil",
	"tomb",
	"toys",
	"trip",
	"tuna",
	"twin",
	"ugly",
	"undo",
	"unit",
	"urge",
	"user",
	"vast",
	"very",
	"veto",
	"vial",
	"vibe",
	"view",
	"visa",
	"void",
	"vows",
	"wall",
	"wand",
	"warm",
	"wasp",
	"wave",
	"waxy",
	"webs",
	"what",
	"when",
	"whiz",
	"wolf",
	"work",
	"yank",
	"yawn",
	"yell",
	"yoga",
	"yurt",
	"zaps",
	"zero",
	"zest",
	"zinc",
	"zone",
	"zoom"
]);
/** Bytemoji for each byte value. Frozen: the tables are wire. */
const BYTEMOJIS = Object.freeze([
	"😀",
	"😂",
	"😆",
	"😉",
	"🙄",
	"😋",
	"😎",
	"😍",
	"😘",
	"😭",
	"🫠",
	"🥱",
	"🤩",
	"😶",
	"🤨",
	"🫥",
	"🥵",
	"🥶",
	"😳",
	"🤪",
	"😵",
	"😡",
	"🤢",
	"😇",
	"🤠",
	"🤡",
	"🥳",
	"🥺",
	"😬",
	"🤑",
	"🙃",
	"🤯",
	"😈",
	"👹",
	"👺",
	"💀",
	"👻",
	"👽",
	"😺",
	"😹",
	"😻",
	"😽",
	"🙀",
	"😿",
	"🫶",
	"🤲",
	"🙌",
	"🤝",
	"👍",
	"👎",
	"👈",
	"👆",
	"💪",
	"👄",
	"🦷",
	"👂",
	"👃",
	"🧠",
	"👀",
	"🤚",
	"🦶",
	"🍎",
	"🍊",
	"🍋",
	"🍌",
	"🍉",
	"🍇",
	"🍓",
	"🫐",
	"🍒",
	"🍑",
	"🍍",
	"🥝",
	"🍆",
	"🥑",
	"🥦",
	"🍅",
	"🌽",
	"🥕",
	"🫒",
	"🧄",
	"🥐",
	"🥯",
	"🍞",
	"🧀",
	"🥚",
	"🍗",
	"🌭",
	"🍔",
	"🍟",
	"🍕",
	"🌮",
	"🥙",
	"🍱",
	"🍜",
	"🍤",
	"🍚",
	"🥠",
	"🍨",
	"🍦",
	"🎂",
	"🪴",
	"🌵",
	"🌱",
	"💐",
	"🍁",
	"🍄",
	"🌹",
	"🌺",
	"🌼",
	"🌻",
	"🌸",
	"💨",
	"🌊",
	"💧",
	"💦",
	"🌀",
	"🌈",
	"🌞",
	"🌝",
	"🌛",
	"🌜",
	"🌙",
	"🌎",
	"💫",
	"⭐",
	"🪐",
	"🌐",
	"💛",
	"💔",
	"💘",
	"💖",
	"💕",
	"🏁",
	"🚩",
	"💬",
	"💯",
	"🚫",
	"🔴",
	"🔷",
	"🟩",
	"🛑",
	"🔺",
	"🚗",
	"🚑",
	"🚒",
	"🚜",
	"🛵",
	"🚨",
	"🚀",
	"🚁",
	"🛟",
	"🚦",
	"🏰",
	"🎡",
	"🎢",
	"🎠",
	"🏠",
	"🔔",
	"🔑",
	"🚪",
	"🪑",
	"🎈",
	"💌",
	"📦",
	"📫",
	"📖",
	"📚",
	"📌",
	"🧮",
	"🔒",
	"💎",
	"📷",
	"⏰",
	"⏳",
	"📡",
	"💡",
	"💰",
	"🧲",
	"🧸",
	"🎁",
	"🎀",
	"🎉",
	"🪭",
	"👑",
	"🫖",
	"🔭",
	"🛁",
	"🏆",
	"🥁",
	"🎷",
	"🎺",
	"🏀",
	"🏈",
	"🎾",
	"🏓",
	"✨",
	"🔥",
	"💥",
	"👕",
	"👚",
	"👖",
	"🩳",
	"👗",
	"👔",
	"🧢",
	"👓",
	"🧶",
	"🧵",
	"💍",
	"👠",
	"👟",
	"🧦",
	"🧤",
	"👒",
	"👜",
	"🐱",
	"🐶",
	"🐭",
	"🐹",
	"🐰",
	"🦊",
	"🐻",
	"🐼",
	"🐨",
	"🐯",
	"🦁",
	"🐮",
	"🐷",
	"🐸",
	"🐵",
	"🐔",
	"🐥",
	"🦆",
	"🦉",
	"🐴",
	"🦄",
	"🐝",
	"🐛",
	"🦋",
	"🐌",
	"🐞",
	"🐢",
	"🐺",
	"🐍",
	"🪽",
	"🐙",
	"🦑",
	"🪼",
	"🦞",
	"🦀",
	"🐚",
	"🦭",
	"🐟",
	"🐬",
	"🐳"
]);
/**
* Bytewords decoding shared by the public `decodeBytewords` and the UR
* parsers, which report a failure under different error codes (`Bytewords`
* from `decodeBytewords`, `Decoder` inside a UR string, as the reference's
* `bytewords::decode` and `ur::decode` do).
*
* @internal
* @module bytewords-decode
*/
/** Byte value by full word. */
const WORD_INDEX = new Map(BYTEWORDS.map((w, i) => [w, i]));
const MINIMAL_INDEX = (/* @__PURE__ */ new Int16Array(65536)).fill(-1);
for (let i = 0; i < 256; i++) {
	const w = BYTEWORDS[i];
	MINIMAL_INDEX[w.charCodeAt(0) << 8 | w.charCodeAt(3)] = i;
}
/**
* Decode `encoded` in `style`, verifying and stripping the CRC-32, or
* return the reason it fails. The checks run in the reference's order:
* non-ASCII input, an odd-length minimal string, an unknown word, then the
* checksum, which a string of fewer than four bytes always fails.
*/
function decodeBytewordsOrReason(encoded, style) {
	for (let i = 0; i < encoded.length; i++) if (encoded.charCodeAt(i) > 127) return "bytewords string contains non-ASCII characters";
	let bytes;
	if (style === "minimal") {
		if (encoded.length % 2 !== 0) return "invalid length";
		bytes = new Uint8Array(encoded.length / 2);
		for (let i = 0; i < encoded.length; i += 2) {
			const index = MINIMAL_INDEX[encoded.charCodeAt(i) << 8 | encoded.charCodeAt(i + 1)];
			if (index < 0) return "invalid word";
			bytes[i / 2] = index;
		}
	} else {
		const words = encoded.split(style === "standard" ? " " : "-");
		bytes = new Uint8Array(words.length);
		for (let i = 0; i < words.length; i++) {
			const index = WORD_INDEX.get(words[i]);
			if (index === void 0) return "invalid word";
			bytes[i] = index;
		}
	}
	if (bytes.length < 4) return "invalid checksum";
	const data = bytes.slice(0, -4);
	const expected = new DataView(bytes.buffer, bytes.length - 4).getUint32(0, false);
	if (crc32(data) !== expected) return "invalid checksum";
	return data;
}
/**
* Bytewords (BCR-2020-012): bytes as four-letter words, dash-joined words,
* or two-letter minimal codes, each with a trailing CRC-32; plus the
* checksum-free identifier encodings (words, minimal, bytemojis).
*
* @module @blockchaincommons/uniform-resources/bytewords
*/
const BYTEWORDS_STYLES = [
	"standard",
	"uri",
	"minimal"
];
const MINIMAL = BYTEWORDS.map((w) => w[0] + w[3]);
new Set(BYTEMOJIS);
new Map(BYTEWORDS.map((w) => [w[0] + w[3], w]));
new Map(BYTEWORDS.map((w) => [w.slice(0, 3), w]));
new Map(BYTEWORDS.map((w) => [w.slice(1), w]));
function withChecksum(data) {
	const out = new Uint8Array(data.length + 4);
	out.set(data);
	new DataView(out.buffer).setUint32(data.length, crc32(data), false);
	return out;
}
/**
* Encode `data` followed by its CRC-32 (big-endian) in `style` (default minimal).
* @throws {URError} `InvalidParameter` unless `data` is a `Uint8Array` and `style` one of the three.
*/
function encodeBytewords(data, style = "minimal") {
	expectBytes("data", data);
	expectChoice("style", style, BYTEWORDS_STYLES, "minimal");
	const bytes = withChecksum(data);
	if (style === "minimal") {
		let out = "";
		for (const b of bytes) out += MINIMAL[b];
		return out;
	}
	const words = [];
	for (const b of bytes) words.push(BYTEWORDS[b]);
	return words.join(style === "standard" ? " " : "-");
}
//#endregion
//#region ../bc-ur-ts/dist/index.mjs
/**
* UR type identifiers.
*
* @module ur-type
*/
const VALID = /^[a-z0-9-]*$/;
/**
* A UR type: lowercase letters, digits and hyphens, as the reference's
* `URType::new` accepts them. The empty string is accepted, so `ur:/…` is
* a valid UR, although BCR-2020-005 asks for one or more characters.
*/
var URType = class URType {
	#name;
	/**
	* @throws {URError} `InvalidType` when `name` has a character outside
	* `[a-z0-9-]`; `InvalidParameter` for a non-string.
	*/
	constructor(name) {
		if (!URType.isValid(name)) throw URError.invalidType();
		this.#name = name;
	}
	/**
	* `name` itself when it is already a `URType`, else a new one.
	* @throws {URError} `InvalidType`; `InvalidParameter` for anything but a string or `URType`.
	*/
	static from(name) {
		if (name instanceof URType) return name;
		if (typeof name !== "string") throw URError.invalidParameter("type", name, "a string or URType");
		return new URType(name);
	}
	/** Non-throwing `from` for a string. @throws {URError} `InvalidParameter` for a non-string. */
	static tryFrom(name) {
		return URType.isValid(name) ? {
			ok: true,
			value: new URType(name)
		} : {
			ok: false,
			error: URError.invalidType()
		};
	}
	/**
	* Whether every character of `name` is in `[a-z0-9-]` (the empty string is valid).
	* @throws {URError} `InvalidParameter` for a non-string.
	*/
	static isValid(name) {
		return VALID.test(expectString("name", name));
	}
	/** The type string, e.g. `"envelope"`. */
	get name() {
		return this.#name;
	}
	/** Same type string. */
	equals(other) {
		return this.#name === other.#name;
	}
	/** The type string. */
	toString() {
		return this.#name;
	}
};
/**
* The multipart `seqNum-seqLen` header, read as the reference's `ur::decode`
* reads it.
*
* @internal
* @module header
*/
/** `u16::from_str`: an optional `+`, ASCII digits, at most 65535. */
const U16 = /^\+?[0-9]+$/;
const isU16 = (s) => U16.test(s) && Number(s) <= 65535;
/**
* Whether `header` is two `u16`s split at its first `-` (`1-2`, `+1-2`,
* `0001-2`); `1-2-3`, `1-x`, `-1-2` and `65536-1` are not.
*/
function isMultipartHeader(header) {
	const dash = header.indexOf("-");
	if (dash === -1) return false;
	return isU16(header.slice(0, dash)) && isU16(header.slice(dash + 1));
}
/**
* Single-part Uniform Resources.
*
* @module ur
*/
/**
* A UR: a {@link URType} and a CBOR payload, spelled
* `ur:<type>/<minimal bytewords of the CBOR>`.
*/
var UR = class UR {
	#type;
	#cbor;
	/** A UR from an already-validated type and a decoded CBOR value. */
	constructor(type, cbor) {
		this.#type = type;
		this.#cbor = cbor;
	}
	/** A UR of `type` over `cbor`. @throws {URError} `InvalidType` for a malformed type string. */
	static from(type, cbor) {
		return new UR(URType.from(type), cbor);
	}
	/**
	* Parse a single-part UR string (any case: the whole string is
	* lower-cased first, as the reference's `UR::from_ur_string` does).
	* @throws {URError} In the reference's order: `InvalidScheme` (no `ur:`),
	* `TypeUnspecified` (no `/`), `InvalidType`, then `Decoder` for what the
	* reference's `ur::decode` rejects (a multipart header that is not two
	* `u16`s, "Invalid indices"; or the payload's bytewords, "invalid word" /
	* "invalid checksum" / "invalid length" / non-ASCII), `NotSinglePart` for
	* a well-formed multipart string, and `Cbor`.
	*/
	static parse(urString) {
		const { type, bytes } = UR.decodeBytes(urString);
		let cbor;
		try {
			cbor = decodeCbor(bytes);
		} catch (error) {
			throw URError.cbor(error instanceof Error ? error.message : String(error), error);
		}
		return new UR(type, cbor);
	}
	/** The string for already-encoded CBOR bytes. @throws {URError} `InvalidType`; `InvalidParameter` for a non-`Uint8Array`. */
	static encodeBytes(type, cborBytes) {
		const urType = URType.from(type);
		expectBytes("cborBytes", cborBytes);
		return `ur:${urType.name}/${encodeBytewords(cborBytes, "minimal")}`;
	}
	/**
	* The type and CBOR bytes of a single-part UR string, without decoding
	* the CBOR; the checks and their order are those of {@link UR.parse}.
	*/
	static decodeBytes(urString) {
		const s = expectString("urString", urString).toLowerCase();
		if (!s.startsWith("ur:")) throw URError.invalidScheme();
		const body = s.slice(3);
		const slash = body.indexOf("/");
		if (slash === -1) throw URError.typeUnspecified();
		const type = new URType(body.slice(0, slash));
		const payload = body.slice(slash + 1);
		const lastSlash = payload.lastIndexOf("/");
		if (lastSlash !== -1 && !isMultipartHeader(payload.slice(0, lastSlash))) throw URError.decoder("Invalid indices");
		const bytes = decodeBytewordsOrReason(payload.slice(lastSlash + 1), "minimal");
		if (typeof bytes === "string") throw URError.decoder(bytes);
		if (lastSlash !== -1) throw URError.notSinglePart();
		return {
			type,
			bytes
		};
	}
	/** The UR type. */
	get type() {
		return this.#type;
	}
	/** The payload. */
	get cbor() {
		return this.#cbor;
	}
	/** `ur:<type>/<bytewords>` */
	toString() {
		return UR.encodeBytes(this.#type, this.#cbor.toData());
	}
	/** Upper-case form for alphanumeric QR encoding. */
	toQRString() {
		return this.toString().toUpperCase();
	}
	/** UTF-8 bytes of `toQRString`. */
	toQRBytes() {
		return new TextEncoder().encode(this.toQRString());
	}
	/** Whether the UR's type is `type`. @throws {URError} `InvalidParameter` for anything but a string or `URType`. */
	isType(type) {
		if (type instanceof URType) return this.#type.equals(type);
		return this.#type.name === expectString("type", type);
	}
	/** Throws unless the UR's type is `type`. @throws {URError} `UnexpectedType` */
	expectType(type) {
		const expected = URType.from(type);
		if (!this.#type.equals(expected)) throw URError.unexpectedType(expected.name, this.#type.name);
	}
	/** Same type and structurally equal CBOR, as the reference's `PartialEq` compares them. */
	equals(other) {
		return this.#type.equals(other.#type) && cborEquals$1(this.#cbor, other.#cbor);
	}
};
/**
* Bridging dcbor-tagged values to URs.
*
* @module codable
*/
/**
* The UR of a tagged dcbor value: the type is the name of its first tag,
* the payload is the tag's content, as the reference's `UREncodable::ur`.
* @throws {URError} `TagUnnamed` when the value has no tag or its first tag
* has no name; `InvalidType` when that name is not a UR type. The
* reference panics at the same three points.
* @throws {CborError} when `toCbor()` is not tagged with the first tag
* (the reference reads `untagged_cbor()` and cannot receive such a value).
*/
function urFor(value) {
	const tag = value.cborTags()[0];
	if (tag === void 0) throw URError.tagUnnamed(void 0);
	if (tag.name === void 0) throw URError.tagUnnamed(tag.value);
	return UR.from(tag.name, expectTaggedContent(value.toCbor(), tag.value));
}
/**
* Decode a UR with a dcbor codec whose first tag names the UR type, as the
* reference's `URDecodable::from_ur`: the UR's type must be the first tag's
* name (a codec's other tags do not name accepted UR types), and the codec
* decodes the content wrapped in that tag.
* @throws {URError} `TagUnnamed` when the codec has no tag or its first tag
* has no name (the reference panics there).
* @throws {CborError} `Custom` when the UR's type is not the first tag's
* name ("expected UR type <name>, but found <type>") or that name is not a
* UR type ("invalid UR type"), as `from_ur` returns a `dcbor::Error`; and
* whatever the codec throws for the content.
*/
function decodeURWith(ur, codec) {
	const first = codec.tags?.[0];
	if (first === void 0) throw URError.tagUnnamed(void 0);
	if (first.name === void 0) throw URError.tagUnnamed(first.value);
	try {
		ur.expectType(first.name);
	} catch (error) {
		throw CborError.custom(error instanceof Error ? error.message : String(error));
	}
	return codec.decode(taggedValue(first, ur.cbor));
}
//#endregion
//#region ../bc-components-ts/dist/symmetric-key-BDzxkqyA.mjs
let DIGEST_CODEC;
/**
* SHA-256 cryptographic digest (32 bytes)
*
* A `Digest` represents the cryptographic hash of some data. In this
* implementation, SHA-256 is used, which produces a 32-byte hash value.
* Digests are used throughout the crate for data verification and as unique
* identifiers derived from data.
*
* # CBOR Serialization
*
* `Digest` implements the CBOR tagged encoding interfaces, which means it can be
* serialized to and deserialized from CBOR with a specific tag (TAG_DIGEST = 40001).
*
* # UR Serialization
*
* When serialized as a Uniform Resource (UR), a `Digest` is represented as a
* binary blob with the type "digest".
*
* @example
* ```typescript
* import { Digest } from '@blockchaincommons/components';
*
* // Create a digest from a string
* const data = new TextEncoder().encode("hello world");
* const digest = Digest.fromImage(data);
*
* // Validate that the digest matches the original data
* console.log(digest.validate(data)); // true
*
* // Create a digest from a hex string
* const hexString = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";
* const digest2 = Digest.fromHex(hexString);
*
* // Retrieve the digest as hex
* console.log(digest2.toHex()); // b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
* ```
*/
var Digest = class Digest {
	/** The byte length of a `Digest`. */
	static DIGEST_SIZE = 32;
	_data;
	constructor(data) {
		if (data.length !== Digest.DIGEST_SIZE) throw ComponentsError.invalidSize("digest", Digest.DIGEST_SIZE, data.length);
		this._data = new Uint8Array(data);
	}
	/** The bytes (a view; do not mutate). */
	/** A copy of the bytes; mutating it does not touch this value. */
	get bytes() {
		return new Uint8Array(this._data);
	}
	/**
	* Create a Digest from a 32-byte array.
	*/
	static from(data) {
		return new Digest(new Uint8Array(data));
	}
	/**
	* Create a Digest from hex string.
	*
	* @throws Error if the hex string is not exactly 64 characters.
	*/
	static fromHex(hex) {
		return new Digest(bytesFromHex(hex));
	}
	/**
	* Compute SHA-256 digest of data (called "image" in the reference implementation).
	*
	* @param image - The data to hash
	*/
	static fromImage(image) {
		const hashData = sha256(image);
		return new Digest(new Uint8Array(hashData));
	}
	/**
	* Compute SHA-256 digest from multiple data parts.
	*
	* The parts are concatenated and then hashed.
	*
	* @param imageParts - Array of byte arrays to concatenate and hash
	*/
	static fromImageParts(imageParts) {
		const totalLength = imageParts.reduce((sum, part) => sum + part.length, 0);
		const buf = new Uint8Array(totalLength);
		let offset = 0;
		for (const part of imageParts) {
			buf.set(part, offset);
			offset += part.length;
		}
		return Digest.fromImage(buf);
	}
	/**
	* Compute SHA-256 digest from an array of Digests.
	*
	* The digest bytes are concatenated and then hashed.
	*
	* @param digests - Array of Digests to combine
	*/
	static fromDigests(digests) {
		const buf = new Uint8Array(digests.length * Digest.DIGEST_SIZE);
		let offset = 0;
		for (const digest of digests) {
			buf.set(digest._data, offset);
			offset += Digest.DIGEST_SIZE;
		}
		return Digest.fromImage(buf);
	}
	/**
	* Compute SHA-256 digest of data (legacy alias for fromImage).
	* @deprecated Use fromImage instead
	*/
	static hash(data) {
		return Digest.fromImage(data);
	}
	/**
	* Get hex string representation.
	*/
	toHex() {
		return bytesToHex$2(this._data);
	}
	/**
	* Get base64 representation.
	*/
	toBase64() {
		return toBase64(this._data);
	}
	/**
	* Get the first four bytes of the digest as a hexadecimal string.
	* Useful for short descriptions.
	*/
	shortDescription() {
		return bytesToHex$2(this._data.slice(0, 4));
	}
	/**
	* Validate the digest against the given image.
	*
	* The image is hashed with SHA-256 and compared to this digest.
	* @returns `true` if the digest matches the image.
	*/
	validate(image) {
		return this.equals(Digest.fromImage(image));
	}
	/**
	* Compare with another Digest.
	*/
	equals(other) {
		if (this._data.length !== other._data.length) return false;
		for (let i = 0; i < this._data.length; i++) if (this._data[i] !== other._data[i]) return false;
		return true;
	}
	/**
	* Compare digests lexicographically.
	*/
	compare(other) {
		for (let i = 0; i < this._data.length; i++) {
			const a = this._data[i];
			const b = other._data[i];
			if (a < b) return -1;
			if (a > b) return 1;
		}
		return 0;
	}
	/**
	* Get string representation.
	*/
	toString() {
		return `Digest(${this.toHex()})`;
	}
	/**
	* A Digest is its own digest provider - returns itself.
	*/
	digest() {
		return this;
	}
	/** Tagged-CBOR codec; `decode` also accepts the untagged form. */
	static get codec() {
		return DIGEST_CODEC ??= defineCodec({
			tags: [TAG_DIGEST],
			decodeUntagged: (cbor) => {
				const data = expectBytes$1(cbor);
				return Digest.from(data);
			},
			encodeUntagged: (value) => value.untaggedCbor()
		});
	}
	/** The CBOR tags this type decodes from; the first one is used to encode. */
	cborTags() {
		return [...Digest.codec.tags];
	}
	/**
	* Returns the untagged CBOR encoding (as a byte string).
	*/
	untaggedCbor() {
		return cbor(this._data);
	}
	/** The tagged CBOR form. */
	toCbor() {
		return taggedCborOf(this);
	}
	/** As a UR, typed by the first tag's name. */
	toUR() {
		return urFor(this);
	}
	/** Decode tagged or untagged CBOR. */
	static fromCbor(cbor) {
		return Digest.codec.decode(cbor);
	}
	/**
	* Validate the given data against the digest, if any.
	*
	* Returns `true` if the digest is `undefined` or if the digest matches the
	* image's digest. Returns `false` if the digest does not match.
	*/
	static validateOpt(image, digest) {
		if (digest === void 0) return true;
		return digest.validate(image);
	}
};
let NONCE_CODEC;
(class Nonce {
	/** The byte length of a `Nonce`. */
	static NONCE_SIZE = chacha20Poly1305.NONCE_SIZE;
	_data;
	constructor(data) {
		if (data.length !== Nonce.NONCE_SIZE) throw ComponentsError.invalidSize("nonce", Nonce.NONCE_SIZE, data.length);
		this._data = new Uint8Array(data);
	}
	/** A fresh random value; pass `rng` to make it deterministic. */
	static random({ rng = secureRng() } = {}) {
		return new Nonce(randomBytes(Nonce.NONCE_SIZE, { rng }));
	}
	/**
	* Restores a nonce from data.
	*/
	static from(data) {
		return new Nonce(new Uint8Array(data));
	}
	/**
	* Create a new nonce from the given hexadecimal string.
	*
	* @throws Error if the string is not exactly 24 hexadecimal digits.
	*/
	static fromHex(hex) {
		return new Nonce(bytesFromHex(hex));
	}
	/** The bytes (a view; do not mutate). */
	/** A copy of the bytes; mutating it does not touch this value. */
	get bytes() {
		return new Uint8Array(this._data);
	}
	/**
	* The data as a hexadecimal string.
	*/
	toHex() {
		return bytesToHex$2(this._data);
	}
	/**
	* Get base64 representation.
	*/
	toBase64() {
		return toBase64(this._data);
	}
	/**
	* Compare with another Nonce.
	*/
	equals(other) {
		if (this._data.length !== other._data.length) return false;
		for (let i = 0; i < this._data.length; i++) if (this._data[i] !== other._data[i]) return false;
		return true;
	}
	/**
	* Get string representation.
	*/
	toString() {
		return `Nonce(${this.toHex()})`;
	}
	/** Tagged-CBOR codec; `decode` also accepts the untagged form. */
	static get codec() {
		return NONCE_CODEC ??= defineCodec({
			tags: [TAG_NONCE],
			decodeUntagged: (cbor) => {
				const data = expectBytes$1(cbor);
				return Nonce.from(data);
			},
			encodeUntagged: (value) => value.untaggedCbor()
		});
	}
	/** The CBOR tags this type decodes from; the first one is used to encode. */
	cborTags() {
		return [...Nonce.codec.tags];
	}
	/**
	* Returns the untagged CBOR encoding (as a byte string).
	*/
	untaggedCbor() {
		return cbor(this._data);
	}
	/** The tagged CBOR form. */
	toCbor() {
		return taggedCborOf(this);
	}
	/** As a UR, typed by the first tag's name. */
	toUR() {
		return urFor(this);
	}
	/** Decode tagged or untagged CBOR. */
	static fromCbor(cbor) {
		return Nonce.codec.decode(cbor);
	}
});
//#endregion
//#region ../bc-known-values-ts/dist/index.mjs
/** What each parameter must be. */
const EXPECTATIONS = {
	value: "an integer in [0, 9007199254740991] or a bigint in [0, 18446744073709551615]",
	name: "a string",
	knownValue: "a KnownValue",
	knownValues: "an iterable of KnownValue",
	assignedName: "a string",
	paths: "an array of strings",
	path: "a string",
	config: "a DirectoryConfig",
	text: "a string"
};
/**
* The received value, rendered exactly: a `bigint` with its `n` suffix, an
* unsafe integer `number` by its exact digits (`String` would round them),
* a string quoted, and objects by their constructor name.
*/
function render(value) {
	if (typeof value === "bigint") return `${value}n`;
	if (typeof value === "number") return Number.isInteger(value) && !Number.isSafeInteger(value) ? BigInt(value).toString() : String(value);
	if (typeof value === "string") return JSON.stringify(value);
	if (typeof value === "function") return "function";
	if (Array.isArray(value)) return "Array";
	if (typeof value === "object" && value !== null) {
		const ctor = value.constructor;
		return typeof ctor?.name === "string" && ctor.name !== "" ? ctor.name : "object";
	}
	return String(value);
}
/**
* Thrown for an argument outside its domain (`InvalidParameter`, JS-only),
* a registry file that cannot be read (`Io`) or parsed (`Json`), and a
* directory configuration changed after the global store was built
* (`AlreadyInitialized`). Branch on `code`; the messages of the last three
* are the reference's `Display` strings.
*
* Instances come from the static factories only.
*
* @example
* ```ts
* try {
*   setDirectoryConfig(new DirectoryConfig());
* } catch (e) {
*   if (KnownValuesError.isKnownValuesError(e) && e.is("AlreadyInitialized")) {
*     // the global store has already been built
*   }
* }
* ```
*/
var KnownValuesError = class KnownValuesError extends Error {
	/** Always `"KnownValuesError"`; the cross-copy identity {@link KnownValuesError.isKnownValuesError} checks. */
	name = "KnownValuesError";
	/** The discriminant; equals `details.code`. */
	code;
	/** The structured payload. */
	details;
	constructor(message, details) {
		super(message);
		this.code = details.code;
		this.details = details;
	}
	/** An argument outside its domain: `<parameter> must be <expectation>, got <value>`. */
	static invalidParameter(parameter, value) {
		const got = parameter === "name" || parameter === "assignedName" ? typeof value : render(value);
		return new KnownValuesError(`${parameter} must be ${EXPECTATIONS[parameter]}, got ${got}`, {
			code: "InvalidParameter",
			parameter,
			value
		});
	}
	/** A registry file or directory that cannot be read; `message` is the reference's `IO error: …` text. */
	static io(message) {
		return new KnownValuesError(message, { code: "Io" });
	}
	/** A registry file that does not parse; `message` is the reference's text (the serde_json message, prefixed by the loader with the file). */
	static json(message) {
		return new KnownValuesError(message, { code: "Json" });
	}
	/** The directory configuration was changed after the global store was built. */
	static alreadyInitialized() {
		return new KnownValuesError("Cannot modify directory configuration after KNOWN_VALUES has been accessed", { code: "AlreadyInitialized" });
	}
	/**
	* Whether `x` is a `KnownValuesError`, from this module copy or another
	* (a CommonJS and an ESM copy in one process): checks the `name` and the
	* presence of `code`, not `instanceof`.
	*/
	static isKnownValuesError(x) {
		return x instanceof Error && x.name === "KnownValuesError" && typeof x.code === "string";
	}
	/** `code === c`. */
	is(c) {
		return this.code === c;
	}
};
/**
* A known value: an unsigned integer that stands for a well-known
* predicate, object or other vocabulary term, encoded as CBOR tag 40000 over
* the integer ([BCR-2023-002](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2023-002-known-value.md)).
*
* @module known-value
*/
const U64_MAX = 18446744073709551615n;
/**
* The one domain check: a `bigint` in `0 ..= 2⁶⁴ − 1`, or a non-negative
* safe integer `number`. A `number` above `Number.MAX_SAFE_INTEGER` is
* refused rather than rounded: the codepoint is the wire value.
*
* @throws KnownValuesError `InvalidParameter` otherwise
*/
function toBigInt(value) {
	if (typeof value === "bigint") {
		if (value >= 0n && value <= U64_MAX) return value;
	} else if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
	throw KnownValuesError.invalidParameter("value", value);
}
/**
* The brand every `KnownValue` carries, whichever copy of this module built
* it (the ESM and CommonJS builds, or two bundled copies, in one process).
*/
const BRAND = Symbol.for("@blockchaincommons/known-values/type");
let CODEC;
/**
* A known value: a codepoint (an unsigned 64-bit integer) with, optionally,
* the name a registry assigns it.
*
* **Equality is by codepoint** (`equals`), whatever the names, and across
* module copies. Compare with `equals`: `===` may hold for the constants the
* global registry is seeded with but is not guaranteed, because directory
* entries and registrations replace the registered objects. Instances are
* frozen (a constant cannot be renamed process-wide) and every constructor
* argument is checked: the codepoint must be a non-negative safe integer
* `number` or a `bigint` in `0 ..= 2⁶⁴ − 1` (use `bigint` for exact
* codepoints above the safe number range), the name a `string`.
*/
var KnownValue = class KnownValue {
	_value;
	_assignedName;
	/**
	* @param value - The codepoint (an unsigned 64-bit integer)
	* @param assignedName - The name the registry gives it, if any
	* @throws KnownValuesError `InvalidParameter` when `value` is not a non-negative safe
	*   integer `number` or a `bigint` in `0 ..= 2⁶⁴ − 1`, or `assignedName` is not a string
	*/
	constructor(value, assignedName) {
		this._value = toBigInt(value);
		if (assignedName !== void 0 && typeof assignedName !== "string") throw KnownValuesError.invalidParameter("name", assignedName);
		this._assignedName = assignedName;
		Object.defineProperty(this, BRAND, { value: true });
		Object.freeze(this);
	}
	/**
	* The same as the constructor, for call chains.
	*
	* @throws KnownValuesError as the constructor does
	*/
	static from(value, assignedName) {
		return new KnownValue(value, assignedName);
	}
	/**
	* Whether `x` is a `KnownValue`, from this module copy or another: checks
	* the brand, not `instanceof`.
	*/
	static isKnownValue(x) {
		return typeof x === "object" && x !== null && x[BRAND] === true;
	}
	/** The codepoint, as a `number` when it is a safe integer and a `bigint` otherwise. */
	get value() {
		return this._value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(this._value) : this._value;
	}
	/** The codepoint as a `bigint`. */
	get valueBigInt() {
		return this._value;
	}
	/** The registry name, if one was assigned. */
	get assignedName() {
		return this._assignedName;
	}
	/** The assigned name, or the decimal codepoint when there is none. */
	get name() {
		return this._assignedName ?? this._value.toString();
	}
	/**
	* Two known values are equal when their codepoints are, whatever their
	* names and whichever module copy built them; anything that is not a
	* `KnownValue` is not equal.
	*/
	equals(other) {
		return KnownValue.isKnownValue(other) && this._value === other.valueBigInt;
	}
	/** `name`. */
	toString() {
		return this.name;
	}
	/** SHA-256 of the tagged CBOR. */
	digest() {
		return Digest.fromImage(this.toCbor().toData());
	}
	/**
	* Tagged-CBOR codec. `decode` requires `#6.40000(n)` — the tag is part of
	* the type, as in the reference's `TryFrom<CBOR>`; use `fromUntaggedCbor`
	* for the bare unsigned integer. `tags` is named from the global tags store
	* at each access, as the reference's `cbor_tags()` is.
	*/
	static get codec() {
		return CODEC ??= {
			get tags() {
				return tagsForValues([TAG_KNOWN_VALUE.value]);
			},
			encode: (kv) => kv.toCbor(),
			decode: (c) => {
				validateTag(c, tagsForValues([TAG_KNOWN_VALUE.value]));
				return KnownValue.fromUntaggedCbor(extractTaggedContent(c));
			}
		};
	}
	/** The known-value tag (40000), named as the global tags store names it at the time. */
	cborTags() {
		return tagsForValues([TAG_KNOWN_VALUE.value]);
	}
	/** The bare unsigned integer. */
	untaggedCbor() {
		return cbor(this._value);
	}
	/** `#6.40000(value)`. */
	toCbor() {
		return taggedValue(TAG_KNOWN_VALUE, this.untaggedCbor());
	}
	/**
	* Decode `#6.40000(n)` (the reference's `TryFrom<CBOR>`). Negative content
	* wraps as {@link KnownValue.fromUntaggedCbor} describes.
	*
	* @throws CborError (dcbor's, with a code) — `WrongType` for an untagged value or a
	*   non-integer content, `WrongTag` for another tag (both tags named as the global
	*   tags store names them)
	*/
	static fromCbor(cborValue) {
		return KnownValue.codec.decode(cborValue);
	}
	/**
	* Decode the bare integer `n` — the content of tag 40000 (the reference's
	* `from_untagged_cbor`), as a tag summariser or a decoder that has already
	* stripped the tag holds it. A negative integer node wraps to `2⁶⁴ + n`,
	* as the reference's `u64::try_from` does (dcbor's negative-to-unsigned
	* wrap), so `40000(-1)` is the codepoint 18446744073709551615; a whole
	* float head that dcbor turns into an integer node follows the same rule.
	*
	* @throws CborError `WrongType` when the CBOR is not an integer (a tagged value, a
	*   bignum, a text), `OutOfRange` for a negative below −2⁶⁴
	*/
	static fromUntaggedCbor(cborValue) {
		return new KnownValue(expectUnsigned(cborValue, {
			width: 64,
			wrapNegative: true
		}));
	}
};
/**
* The slot is keyed on `globalThis` by a registered symbol rather than held
* in a module variable so that every copy of this module in a process — the
* ESM and CommonJS builds, or two bundled copies — resolves the SAME store
* and configuration, as the reference's statics are one per process. The
* `@1` names the slot's major version; bump it on a breaking change of what
* the slot holds so incompatible copies do not share.
*/
const GLOBAL_KEY = Symbol.for("@blockchaincommons/known-values/global-store@1");
/** The process-wide slot, created on first access. */
function globalSlot() {
	return globalThis[GLOBAL_KEY] ??= { locked: false };
}
/**
* Registry-file reader.
*
* A registry file is parsed exactly as the reference parses it with
* `serde_json::from_str::<RegistryFile>`: the same grammar, the same accepted
* inputs, the same resulting values, and on failure the same message with the
* same line and column. The reader is therefore a port of serde_json's
* deserializer (`de.rs`, `read.rs`) and of the visitors serde derives for the
* four structs, not a wrapper around `JSON.parse`.
*
* Positions are byte based: the text is read as UTF-8, `line` counts newline
* bytes and `column` counts bytes since the last newline, like serde_json.
*
* @module registry-file
*/
/**
* A parse error before it becomes a `KnownValuesError`. `line === 0` marks an
* error raised by a visitor (a type, length or field error) whose position is
* filled in by the deserializer that receives it, as serde_json's
* `fix_position` does; every error leaving the deserializer is positioned.
*/
var ParseError = class extends Error {
	line;
	column;
	constructor(message, line, column) {
		super(message);
		this.line = line;
		this.column = column;
	}
	/** The reference's `Display` text of a positioned error. */
	display() {
		return `${this.message} at line ${this.line} column ${this.column}`;
	}
};
/** A visitor error, positioned later. */
function dataError(message) {
	return new ParseError(message, 0, 0);
}
const EOF_WHILE_PARSING_LIST = "EOF while parsing a list";
const EOF_WHILE_PARSING_OBJECT = "EOF while parsing an object";
const EOF_WHILE_PARSING_STRING = "EOF while parsing a string";
const EOF_WHILE_PARSING_VALUE = "EOF while parsing a value";
const EXPECTED_COLON = "expected `:`";
const EXPECTED_LIST_COMMA_OR_END = "expected `,` or `]`";
const EXPECTED_OBJECT_COMMA_OR_END = "expected `,` or `}`";
const EXPECTED_SOME_IDENT = "expected ident";
const EXPECTED_SOME_VALUE = "expected value";
const INVALID_ESCAPE = "invalid escape";
const INVALID_NUMBER = "invalid number";
const NUMBER_OUT_OF_RANGE = "number out of range";
const CONTROL_CHARACTER_WHILE_PARSING_STRING = "control character (\\u0000-\\u001F) found while parsing a string";
const KEY_MUST_BE_A_STRING = "key must be a string";
const LONE_LEADING_SURROGATE_IN_HEX_ESCAPE = "lone leading surrogate in hex escape";
const TRAILING_COMMA = "trailing comma";
const TRAILING_CHARACTERS = "trailing characters";
const UNEXPECTED_END_OF_HEX_ESCAPE = "unexpected end of hex escape";
const RECURSION_LIMIT_EXCEEDED = "recursion limit exceeded";
/**
* An `f64` as serde_json prints it: the shortest digits that round-trip,
* positional notation when the decimal exponent is in `-5..=15` (always with
* a fractional part), otherwise `d.ddde±x` with a signed, unpadded exponent.
*/
function formatFloat$1(value) {
	const negative = value < 0 || Object.is(value, -0);
	const exponential = Math.abs(value).toExponential();
	const e = exponential.indexOf("e");
	const digits = exponential.slice(0, e).replace(".", "");
	const exponent = Number(exponential.slice(e + 1));
	let body;
	if (exponent < -5 || exponent > 15) body = exponential;
	else if (exponent < 0) body = `0.${"0".repeat(-exponent - 1)}${digits}`;
	else if (digits.length - 1 <= exponent) body = `${digits}${"0".repeat(exponent - (digits.length - 1))}.0`;
	else body = `${digits.slice(0, exponent + 1)}.${digits.slice(exponent + 1)}`;
	return negative ? `-${body}` : body;
}
/**
* The code points that Rust's `Debug` for `str` writes as `\u{…}` (the
* non-printable and grapheme-extending characters), as inclusive ranges
* encoded pairwise in base 36: the gap after the previous range, a dot, and
* the range's length; ranges separated by commas.
*/
const DEBUG_ESCAPED_RANGES = "0.v,2.0,1l.0,y.x,c.0,gi.33,8.1,6.3,7.0,1.0,k.0,68.6,4m.0,12.1,1e.1,3.19,1.0,1.1,1.1,1.8,r.3,6.g,a.a,1.0,1a.k,g.0,2t.7,1.5,2.1,1.3,w.1,1.0,u.s,2h.a,1.d,17.8,7.2,o.3,1.8,1.2,1.6,f.0,p.4,1.0,b.4,w.f,16.1k,1j.0,1.0,4.7,4.0,3.6,a.1,t.0,2.0,8.1,2.1,m.0,7.0,1.2,4.2,1.0,2.5,2.1,2.0,1.c,2.0,3.3,o.4,1.0,6.3,2.1,m.0,7.0,2.0,2.0,2.3,3.n,4.0,1.6,a.1,3.0,1.b,1.0,9.0,3.0,m.0,7.0,2.0,5.2,4.7,1.0,2.2,1.e,2.3,c.6,1.7,2.0,8.1,2.1,m.0,7.0,2.0,5.2,1.1,1.5,2.1,2.e,2.0,3.3,i.a,1.0,6.2,3.0,4.2,2.0,1.0,2.2,2.2,3.2,c.4,1.0,2.2,3.0,3.2,1.k,l.5,3.0,8.0,3.0,n.0,g.2,1.2,4.i,3.0,2.1,2.3,a.6,a.0,b.0,3.0,n.0,a.0,5.2,2.1,1.0,2.m,3.0,2.3,a.0,3.d,b.0,3.0,15.1,1.0,2.4,3.0,3.0,2.3,3.0,a.3,q.1,2.0,i.2,o.0,9.0,1.1,7.8,2.5,7.6,a.1,3.b,1c.0,2.a,8.7,d.10,2.0,1.0,5.0,o.0,1.0,a.0,2.8,1.1,5.0,1.8,a.1,4.v,o.1,r.0,1.0,1.0,e.0,10.h,1.4,1.1,5.1c,8.0,6.0,d.10,19.3,1.5,1.1,2.1,p.1,4.2,g.3,d.0,2.1,6.0,f.0,14.0,1.4,1.1,3z.1,6g.0,4.1,7.0,1.0,4.1,15.0,4.1,x.0,4.1,7.0,1.0,4.1,f.0,1l.0,4.1,1v.4,t.2,q.5,2e.1,6.1,hs.0,s.2,2h.6,i.c,j.2,2.8,i.d,d.0,3.e,1g.1,1.6,8.0,2.a,9.2,a.5,a.5,b.4,a.5,2h.6,5.1,y.0,1.4,1y.9,v.3,4.1,3.3,2.0,6.6,1.2,16.1,5.a,18.3,q.5,b.2,1l.1,2.2,1k.0,1.8,1.0,2.7,6.c,a.5,a.5,e.2d,1c.9,4.2,8.0,t.8,c.1,w.3,2.5,1k.0,1.1,3.0,1.c,1c.7,2.4,f.2,1q.4,17.1,b.a,1.c,1.6,4.0,6.0,3.1,1.4,5c.1r,7q.1,6.1,12.1,6.1,8.0,1.0,1.0,1.0,v.1,1h.0,f.0,e.1,6.0,j.1,3.0,9.g,o.7,1b.g,2.1,r.0,d.2,y.1p,3w.3,ii.l,b.k,1ec.1,ah.2,2.4,19.0,1.4,1.1,1k.6,2.e,n.8,7.0,7.0,7.0,7.0,7.0,7.0,7.0,7.w,2m.x,q.0,2h.b,5y.p,g.0,15.5,g.0,2e.3,2t.4,17.0,1f.0,16.0,2e.8,1c.0,mlp.2,1j.8,9o.j,1b.3,1.9,w.1,28.1,6.7,65.j,h.0,3.0,4.0,p.1,5.3,a.5,1k.7,1w.9,c.n,d.0,12.7,p.a,1.b,u.5,1c.0,2.3,2.1,2.0,d.0,b.3,7.0,p.0,15.5,2.1,2.a,3.0,8.0,1.1,a.1,w.0,1f.0,1.2,2.1,5.1,1.0,1.n,h.1,8.a,6.1,6.1,6.8,7.0,7.0,1o.3,39.0,2.0,4.2,a.5,8mc.b,n.3,1d.6ir,a6.1,2y.11,7.b,5.4,1.0,o.0,5.0,1.0,2.0,2.0,i2.v,g.f,a.l,z.0,j.0,4.3,5.0,3r.3,4d.2,u.2,6.1,6.1,6.1,3.2,7.0,7.c,2.1,c.0,q.0,j.0,2.0,f.1,e.x,3f.4,3.3,19.2,2g.0,d.2,1.1a,19.3m,t.2,1d.f,r.3,10.8,u.4,12.9,u.0,11.3,e.15,4e.1,a.5,10.3,10.3,14.7,1g.a,c.0,f.0,7.0,2.0,b.0,f.0,7.0,2.2,1g.b,8n.8,m.9,8.n,6.0,16.0,9.1w,6.1,1.0,18.0,2.2,1.1,n.0,20.7,9.1b,j.0,2.4,x.2,r.4,r.11,1k.3,k.1,1b.e,4.0,3.0,t.9,9.6,9.6,1s.v,11.5,c.8,1i.2,t.1,r.4,q.6,4.b,7.27,21.1i,1f.c,1f.6,16.b,a.5,12.7,o.7,2.5r,v.0,16.2,1.1,2.f,6.7,9.12,14.7,m.a,9.l,i.3,4.11,s.j,n.8,1.0,1i.e,7.3,u.0,2.1,1.b,1d.3,2.1,2.0,4.d,p.6,a.8,10.4,1.8,i.7,z.0,3.a,1g.8,1.0,8.3,2.0,g.0,k.a,i.0,s.2,2.3,6.0,2.1q,7.0,1.0,4.0,f.0,b.5,1b.0,3.c,a.7,2.0,8.1,2.1,m.0,7.0,2.0,5.2,1.0,1.0,4.1,2.1,2.2,1.b,7.r,a.0,1.1,1.0,12.0,1.0,2.e,1.0,2.2,1.0,3.0,2.12,1k.7,2.2,1.0,l.0,1.0,3.t,1c.0,2.5,1.0,2.0,1.1,1.1,4.7,a.4l,1b.0,2.5,4.1,1.1,r.z,1f.7,2.0,1.1,4.a,a.5,d.i,17.0,1.0,2.7,2.5,a.5,k.r,r.2,1.0,2.3,1.8,n.54,1b.8,1.1,1.2r,2b.b,8.1,1.1,8.0,2.0,o.0,5.0,2.5,4.0,3.8,a.1x,8.1,16.7,4.0,4.q,1.9,14.5,2.3,8.8,1.5,2.2,1a.c,1.1,9.c,21.6,a.2e,1.2,1.0,1.2f,y.d,a.5,9.0,12.d,1.0,6.9,t.2,w.o,1.6,1.1,1.22,7.0,2.0,12.k,1.8,a.5,6.0,2.0,11.3,2.0,1.0,1.6,a.5,18.3,a.6t,j.1,4.8,f.0,10.7,2.2,n.2d,1.e,1e.c,pn.2t,33.0,5.a,5g.217,2r.c,ts.g,6.o,32z.4,g7.5a0,u.b,3.2,a.1c5,ft.6,v.0,a.3,29.0,a.5,u.6,1.9,1c.6,f.9,a.0,7.0,l.4,j.bz,1m.5h,2j.4,p.1,p.17,23.4,1k.a,d.1r,4.d,5.8,5p2.14,w.2o,37.6po,4.0,7.0,2.0,83.e,1.s,3.1,1.d,4.7,b0.1s3,2z.4,d.2,9.6,a.1,1.1,1.31b,71.2,c4.5,n.e,h.2m,38.1n,6u.9,13.1,1o.4,3.l,2.6,u.3,1p.k,1u.2,1.3d,k.b,k.b,2f.8,p.3q,2d.0,1z.0,2.1,1.1,2.1,4.0,c.0,1.0,7.0,1t.0,4.1,8.0,7.0,s.0,4.0,5.0,1.2,7.0,9g.1,84.1,fm.1i,4.1d,8.0,e.0,7.vn,v.5,6.78,1q.41,19.9,7.1,a.3,2.8v,u.h,18.3,a.4,1.cv,s.3,a.5x,u.1,b.3,1.5b,v.0,3.0,2.0,7.1,5.8,2.67,7.0,4.0,2.0,f.0,5h.1,9.1b,1w.6,1.3,a.3,2.ls,1w.23,1p.5d,4.0,r.0,2.0,1.1,1.0,a.0,4.0,1.0,1.5,1.3,1.0,1.0,1.0,3.0,2.0,1.1,1.0,1.0,1.0,1.0,1.0,2.0,1.1,4.0,7.0,4.0,4.0,1.0,a.0,h.4,3.0,5.0,h.1f,2.7h,18.3,2s.b,f.1,f.0,f.0,11.9,4u.1j,t.c,18.3,9.6,2.d,6.49,rd.2,h.2,d.2,62.5,c.3,1.e,c.3,1k.7,a.5,14.7,u.1,c.3,2.d,9.12,9k.7,e.1,d.2,b.2,1l.0,1.3,g.1,c.3,a.6,43.0,2v.sk,wyo.v,3dq.1,4ge.1,5rl.e,ha.1wh,f2.15t,3t7.4,6ju.jdl1";
/** The decoded table: `[start0, end0, start1, end1, …]`, ascending. */
let debugEscapedBounds;
function isDebugEscaped(codePoint) {
	if (debugEscapedBounds === void 0) {
		debugEscapedBounds = [];
		let previousEnd = -1;
		for (const pair of DEBUG_ESCAPED_RANGES.split(",")) {
			const dot = pair.indexOf(".");
			const start = previousEnd + 1 + parseInt(pair.slice(0, dot), 36);
			const end = start + parseInt(pair.slice(dot + 1), 36);
			debugEscapedBounds.push(start, end);
			previousEnd = end;
		}
	}
	const bounds = debugEscapedBounds;
	let low = 0;
	let high = bounds.length / 2;
	while (low < high) {
		const middle = low + high >>> 1;
		if (bounds[2 * middle + 1] < codePoint) low = middle + 1;
		else high = middle;
	}
	return low < bounds.length / 2 && bounds[2 * low] <= codePoint;
}
/** A string as Rust's `Debug` for `str` prints it. */
function formatDebugStr(text) {
	let out = "\"";
	for (const character of text) {
		const codePoint = character.length === 1 ? character.charCodeAt(0) : 65536 + (character.charCodeAt(0) - 55296 << 10) + (character.charCodeAt(1) - 56320);
		switch (codePoint) {
			case 0:
				out += "\\0";
				break;
			case 9:
				out += "\\t";
				break;
			case 10:
				out += "\\n";
				break;
			case 13:
				out += "\\r";
				break;
			case 34:
				out += "\\\"";
				break;
			case 92:
				out += "\\\\";
				break;
			default: out += isDebugEscaped(codePoint) ? `\\u{${codePoint.toString(16)}}` : character;
		}
	}
	return `${out}"`;
}
/** serde's `Unexpected` rendering of a number. */
function unexpectedNumber(number) {
	return number.kind === "f64" ? `floating point \`${formatFloat$1(number.value)}\`` : `integer \`${number.value}\``;
}
/** `u64::MAX / 10` and `u64::MAX % 10`, the digit-accumulation overflow guard. */
const U64_MAX_DIV_10 = 1844674407370955161n;
const U64_MAX_MOD_10 = 5n;
/** `i32::MAX / 10` and `i32::MAX % 10`, the exponent-accumulation overflow guard. */
const I32_MAX_DIV_10 = 214748364;
const I32_MAX_MOD_10 = 7;
const I32_MIN = -2147483648;
const I32_MAX = 2147483647;
/** `10^0 … 10^308` as `f64`s. */
const POW10 = Array.from({ length: 309 }, (_, i) => Number(`1e${i}`));
function saturatingAddI32(a, b) {
	return Math.min(I32_MAX, Math.max(I32_MIN, a + b));
}
const TAB = 9;
const NEWLINE = 10;
const CARRIAGE_RETURN = 13;
const SPACE = 32;
const QUOTE = 34;
const PLUS = 43;
const COMMA = 44;
const MINUS = 45;
const DOT = 46;
const SLASH = 47;
const ZERO = 48;
const NINE = 57;
const COLON = 58;
const UPPER_E = 69;
const LEFT_BRACKET = 91;
const BACKSLASH = 92;
const RIGHT_BRACKET = 93;
const LOWER_B = 98;
const LOWER_E = 101;
const LOWER_F = 102;
const LOWER_N = 110;
const LOWER_R = 114;
const LOWER_T = 116;
const LOWER_U = 117;
const LEFT_BRACE = 123;
const RIGHT_BRACE = 125;
function isDigit$1(byte) {
	return byte >= ZERO && byte <= NINE;
}
function hexValue(byte) {
	if (byte >= 48 && byte <= 57) return byte - 48;
	if (byte >= 65 && byte <= 70) return byte - 65 + 10;
	if (byte >= 97 && byte <= 102) return byte - 97 + 10;
	return -1;
}
/** Appends the UTF-8 encoding of a Unicode scalar value. */
function pushUtf8(out, codePoint) {
	if (codePoint < 128) out.push(codePoint);
	else if (codePoint < 2048) out.push(192 | codePoint >> 6, 128 | codePoint & 63);
	else if (codePoint < 65536) out.push(224 | codePoint >> 12, 128 | codePoint >> 6 & 63, 128 | codePoint & 63);
	else out.push(240 | codePoint >> 18, 128 | codePoint >> 12 & 63, 128 | codePoint >> 6 & 63, 128 | codePoint & 63);
}
/** Decodes UTF-8 without dropping a leading byte-order mark. */
const UTF8$1 = new TextDecoder("utf-8", { ignoreBOM: true });
var Deserializer = class {
	bytes;
	/** Index of the next byte `next()` or `peek()` returns. */
	index = 0;
	remainingDepth = 128;
	scratch = [];
	constructor(bytes) {
		this.bytes = bytes;
	}
	peek() {
		return this.index < this.bytes.length ? this.bytes[this.index] : void 0;
	}
	next() {
		return this.index < this.bytes.length ? this.bytes[this.index++] : void 0;
	}
	discard() {
		this.index += 1;
	}
	/** The next byte, or `0` at the end. */
	peekOrNull() {
		return this.peek() ?? 0;
	}
	/** Consumes and returns the next byte, or `0` at the end. */
	nextOrNull() {
		return this.next() ?? 0;
	}
	/** The first byte of a value, past whitespace. */
	parseValueStart() {
		const byte = this.parseWhitespace();
		if (byte === void 0) throw this.peekError(EOF_WHILE_PARSING_VALUE);
		return byte;
	}
	positionOfIndex(i) {
		let startOfLine = 0;
		let line = 1;
		for (let k = 0; k < i; k += 1) if (this.bytes[k] === NEWLINE) {
			startOfLine = k + 1;
			line += 1;
		}
		return {
			line,
			column: i - startOfLine
		};
	}
	/** An error caused by the byte `next()` returned. */
	error(message) {
		const { line, column } = this.positionOfIndex(this.index);
		return new ParseError(message, line, column);
	}
	/** An error caused by the byte `peek()` returned. */
	peekError(message) {
		const { line, column } = this.positionOfIndex(Math.min(this.bytes.length, this.index + 1));
		return new ParseError(message, line, column);
	}
	/** Gives a visitor error the position of the byte last consumed. */
	fixPosition(failure) {
		return failure.line === 0 ? this.error(failure.message) : failure;
	}
	parseWhitespace() {
		for (;;) {
			const byte = this.peek();
			if (byte === SPACE || byte === NEWLINE || byte === TAB || byte === CARRIAGE_RETURN) this.discard();
			else return byte;
		}
	}
	/** Rejects anything but whitespace after the top-level value. */
	end() {
		if (this.parseWhitespace() !== void 0) throw this.peekError(TRAILING_CHARACTERS);
	}
	parseIdent(ident) {
		for (let k = 0; k < ident.length; k += 1) {
			const byte = this.next();
			if (byte === void 0) throw this.error(EOF_WHILE_PARSING_VALUE);
			if (byte !== ident.charCodeAt(k)) throw this.error(EXPECTED_SOME_IDENT);
		}
	}
	/**
	* The `invalid type` error for a value of the wrong kind starting with the
	* peeked `byte`, consuming the value when it is a scalar so that the
	* position is the one serde_json reports.
	*/
	peekInvalidType(byte, expected) {
		let unexpected;
		if (byte === LOWER_N) {
			this.discard();
			this.parseIdent("ull");
			unexpected = "null";
		} else if (byte === LOWER_T) {
			this.discard();
			this.parseIdent("rue");
			unexpected = "boolean `true`";
		} else if (byte === LOWER_F) {
			this.discard();
			this.parseIdent("alse");
			unexpected = "boolean `false`";
		} else if (byte === MINUS) {
			this.discard();
			unexpected = unexpectedNumber(this.parseInteger(false));
		} else if (isDigit$1(byte)) unexpected = unexpectedNumber(this.parseInteger(true));
		else if (byte === QUOTE) {
			this.discard();
			unexpected = `string ${formatDebugStr(this.parseStr())}`;
		} else if (byte === LEFT_BRACKET) unexpected = "sequence";
		else if (byte === LEFT_BRACE) unexpected = "map";
		else return this.peekError(EXPECTED_SOME_VALUE);
		return this.fixPosition(dataError(`invalid type: ${unexpected}, expected ${expected}`));
	}
	parseInteger(positive) {
		const first = this.next();
		if (first === void 0) throw this.error(EOF_WHILE_PARSING_VALUE);
		if (first === ZERO) {
			if (isDigit$1(this.peekOrNull())) throw this.peekError(INVALID_NUMBER);
			return this.parseNumber(positive, 0n);
		}
		if (!isDigit$1(first)) throw this.error(INVALID_NUMBER);
		let significand = BigInt(first - ZERO);
		for (;;) {
			const byte = this.peekOrNull();
			if (!isDigit$1(byte)) return this.parseNumber(positive, significand);
			const digit = BigInt(byte - ZERO);
			if (significand >= U64_MAX_DIV_10 && (significand > U64_MAX_DIV_10 || digit > U64_MAX_MOD_10)) return {
				kind: "f64",
				value: this.parseLongInteger(positive, significand)
			};
			this.discard();
			significand = significand * 10n + digit;
		}
	}
	parseNumber(positive, significand) {
		const byte = this.peekOrNull();
		if (byte === DOT) return {
			kind: "f64",
			value: this.parseDecimal(positive, significand, 0)
		};
		if (byte === LOWER_E || byte === UPPER_E) return {
			kind: "f64",
			value: this.parseExponent(positive, significand, 0)
		};
		if (positive) return {
			kind: "u64",
			value: significand
		};
		const negated = BigInt.asIntN(64, -BigInt.asIntN(64, significand));
		if (negated >= 0n) return {
			kind: "f64",
			value: -Number(significand)
		};
		return {
			kind: "i64",
			value: negated
		};
	}
	parseDecimal(positive, significand, exponentBeforeDecimalPoint) {
		this.discard();
		let exponentAfterDecimalPoint = 0;
		for (;;) {
			const byte = this.peekOrNull();
			if (!isDigit$1(byte)) break;
			const digit = BigInt(byte - ZERO);
			if (significand >= U64_MAX_DIV_10 && (significand > U64_MAX_DIV_10 || digit > U64_MAX_MOD_10)) {
				const exponent = exponentBeforeDecimalPoint + exponentAfterDecimalPoint;
				return this.parseDecimalOverflow(positive, significand, exponent);
			}
			this.discard();
			significand = significand * 10n + digit;
			exponentAfterDecimalPoint -= 1;
		}
		if (exponentAfterDecimalPoint === 0) {
			if (this.peek() !== void 0) throw this.peekError(INVALID_NUMBER);
			throw this.peekError(EOF_WHILE_PARSING_VALUE);
		}
		const exponent = exponentBeforeDecimalPoint + exponentAfterDecimalPoint;
		const byte = this.peekOrNull();
		if (byte === LOWER_E || byte === UPPER_E) return this.parseExponent(positive, significand, exponent);
		return this.f64FromParts(positive, significand, exponent);
	}
	parseExponent(positive, significand, startingExp) {
		this.discard();
		let positiveExp = true;
		const sign = this.peekOrNull();
		if (sign === PLUS) this.discard();
		else if (sign === MINUS) {
			this.discard();
			positiveExp = false;
		}
		const first = this.next();
		if (first === void 0) throw this.error(EOF_WHILE_PARSING_VALUE);
		if (!isDigit$1(first)) throw this.error(INVALID_NUMBER);
		let exp = first - ZERO;
		for (;;) {
			const byte = this.peekOrNull();
			if (!isDigit$1(byte)) break;
			this.discard();
			const digit = byte - ZERO;
			if (exp >= I32_MAX_DIV_10 && (exp > I32_MAX_DIV_10 || digit > I32_MAX_MOD_10)) return this.parseExponentOverflow(positive, significand === 0n, positiveExp);
			exp = exp * 10 + digit;
		}
		const finalExp = saturatingAddI32(startingExp, positiveExp ? exp : -exp);
		return this.f64FromParts(positive, significand, finalExp);
	}
	f64FromParts(positive, significand, exponent) {
		let f = Number(significand);
		for (;;) {
			const magnitude = Math.abs(exponent);
			if (magnitude <= 308) {
				const pow = POW10[magnitude];
				if (exponent >= 0) {
					f *= pow;
					if (!Number.isFinite(f)) throw this.error(NUMBER_OUT_OF_RANGE);
				} else f /= pow;
				break;
			}
			if (f === 0) break;
			if (exponent >= 0) throw this.error(NUMBER_OUT_OF_RANGE);
			f /= 1e308;
			exponent += 308;
		}
		return positive ? f : -f;
	}
	/** The digits after a significand that no longer fits a u64. */
	parseLongInteger(positive, significand) {
		let exponent = 0;
		for (;;) {
			const byte = this.peekOrNull();
			if (isDigit$1(byte)) {
				this.discard();
				exponent += 1;
			} else if (byte === DOT) return this.parseDecimal(positive, significand, exponent);
			else if (byte === LOWER_E || byte === UPPER_E) return this.parseExponent(positive, significand, exponent);
			else return this.f64FromParts(positive, significand, exponent);
		}
	}
	/** The fraction digits past the point where the significand fills a u64. */
	parseDecimalOverflow(positive, significand, exponent) {
		while (isDigit$1(this.peekOrNull())) this.discard();
		const byte = this.peekOrNull();
		if (byte === LOWER_E || byte === UPPER_E) return this.parseExponent(positive, significand, exponent);
		return this.f64FromParts(positive, significand, exponent);
	}
	/** An exponent that no longer fits an i32: an error or zero, never an infinity. */
	parseExponentOverflow(positive, zeroSignificand, positiveExp) {
		if (!zeroSignificand && positiveExp) throw this.error(NUMBER_OUT_OF_RANGE);
		while (isDigit$1(this.peekOrNull())) this.discard();
		return positive ? 0 : -0;
	}
	/** Advances to the next `"`, `\` or control character, or to the end. */
	skipToEscape() {
		while (this.index < this.bytes.length) {
			const byte = this.bytes[this.index];
			if (byte === QUOTE || byte === BACKSLASH || byte < 32) return;
			this.index += 1;
		}
	}
	/** Parses a string after its opening quote, with escapes expanded and validated. */
	parseStr() {
		this.scratch.length = 0;
		let start = this.index;
		for (;;) {
			this.skipToEscape();
			if (this.index === this.bytes.length) throw this.error(EOF_WHILE_PARSING_STRING);
			const byte = this.bytes[this.index];
			if (byte === QUOTE) {
				let text;
				if (this.scratch.length === 0) text = UTF8$1.decode(this.bytes.subarray(start, this.index));
				else {
					for (let k = start; k < this.index; k += 1) this.scratch.push(this.bytes[k]);
					text = UTF8$1.decode(Uint8Array.from(this.scratch));
				}
				this.index += 1;
				return text;
			}
			if (byte === BACKSLASH) {
				for (let k = start; k < this.index; k += 1) this.scratch.push(this.bytes[k]);
				this.index += 1;
				this.parseEscape();
				start = this.index;
			} else {
				this.index += 1;
				throw this.error(CONTROL_CHARACTER_WHILE_PARSING_STRING);
			}
		}
	}
	/** Skips a string after its opening quote, validating only its escapes' shape. */
	ignoreStr() {
		for (;;) {
			this.skipToEscape();
			if (this.index === this.bytes.length) throw this.error(EOF_WHILE_PARSING_STRING);
			const byte = this.bytes[this.index];
			if (byte === QUOTE) {
				this.index += 1;
				return;
			}
			if (byte === BACKSLASH) {
				this.index += 1;
				this.ignoreEscape();
			} else throw this.error(CONTROL_CHARACTER_WHILE_PARSING_STRING);
		}
	}
	nextOrEof() {
		const byte = this.next();
		if (byte === void 0) throw this.error(EOF_WHILE_PARSING_STRING);
		return byte;
	}
	peekOrEof() {
		const byte = this.peek();
		if (byte === void 0) throw this.error(EOF_WHILE_PARSING_STRING);
		return byte;
	}
	/** Parses an escape after its backslash into `scratch`. */
	parseEscape() {
		const byte = this.nextOrEof();
		switch (byte) {
			case QUOTE:
			case BACKSLASH:
			case SLASH:
				this.scratch.push(byte);
				break;
			case LOWER_B:
				this.scratch.push(8);
				break;
			case LOWER_F:
				this.scratch.push(12);
				break;
			case LOWER_N:
				this.scratch.push(NEWLINE);
				break;
			case LOWER_R:
				this.scratch.push(CARRIAGE_RETURN);
				break;
			case LOWER_T:
				this.scratch.push(TAB);
				break;
			case LOWER_U:
				this.parseUnicodeEscape();
				break;
			default: throw this.error(INVALID_ESCAPE);
		}
	}
	/** Four hex digits after `\u`. */
	decodeHexEscape() {
		if (this.index + 4 > this.bytes.length) {
			this.index = this.bytes.length;
			throw this.error(EOF_WHILE_PARSING_STRING);
		}
		const a = hexValue(this.bytes[this.index]);
		const b = hexValue(this.bytes[this.index + 1]);
		const c = hexValue(this.bytes[this.index + 2]);
		const d = hexValue(this.bytes[this.index + 3]);
		this.index += 4;
		if (a < 0 || b < 0 || c < 0 || d < 0) throw this.error(INVALID_ESCAPE);
		return a << 12 | b << 8 | c << 4 | d;
	}
	/** A `\u` escape after its `\u`, with a surrogate pair required to be complete. */
	parseUnicodeEscape() {
		const n = this.decodeHexEscape();
		if (n >= 56320 && n <= 57343) throw this.error(LONE_LEADING_SURROGATE_IN_HEX_ESCAPE);
		if (n < 55296 || n > 56319) {
			pushUtf8(this.scratch, n);
			return;
		}
		if (this.peekOrEof() !== BACKSLASH) {
			this.discard();
			throw this.error(UNEXPECTED_END_OF_HEX_ESCAPE);
		}
		this.discard();
		if (this.peekOrEof() !== LOWER_U) {
			this.discard();
			throw this.error(UNEXPECTED_END_OF_HEX_ESCAPE);
		}
		this.discard();
		const n2 = this.decodeHexEscape();
		if (n2 < 56320 || n2 > 57343) throw this.error(LONE_LEADING_SURROGATE_IN_HEX_ESCAPE);
		pushUtf8(this.scratch, (n - 55296 << 10 | n2 - 56320) + 65536);
	}
	/** Skips an escape after its backslash; a `\u` needs four hex digits only. */
	ignoreEscape() {
		switch (this.nextOrEof()) {
			case QUOTE:
			case BACKSLASH:
			case SLASH:
			case LOWER_B:
			case LOWER_F:
			case LOWER_N:
			case LOWER_R:
			case LOWER_T: break;
			case LOWER_U:
				this.decodeHexEscape();
				break;
			default: throw this.error(INVALID_ESCAPE);
		}
	}
	parseObjectColon() {
		const byte = this.parseWhitespace();
		if (byte === COLON) this.discard();
		else if (byte !== void 0) throw this.peekError(EXPECTED_COLON);
		else throw this.peekError(EOF_WHILE_PARSING_OBJECT);
	}
	endSeq() {
		const byte = this.parseWhitespace();
		if (byte === RIGHT_BRACKET) this.discard();
		else if (byte === COMMA) {
			this.discard();
			if (this.parseWhitespace() === RIGHT_BRACKET) throw this.peekError(TRAILING_COMMA);
			throw this.peekError(TRAILING_CHARACTERS);
		} else if (byte !== void 0) throw this.peekError(TRAILING_CHARACTERS);
		else throw this.peekError(EOF_WHILE_PARSING_LIST);
	}
	endMap() {
		const byte = this.parseWhitespace();
		if (byte === RIGHT_BRACE) this.discard();
		else if (byte === COMMA) throw this.peekError(TRAILING_COMMA);
		else if (byte !== void 0) throw this.peekError(TRAILING_CHARACTERS);
		else throw this.peekError(EOF_WHILE_PARSING_OBJECT);
	}
	hasNextElement(seq) {
		const byte = this.parseWhitespace();
		if (byte === void 0) throw this.peekError(EOF_WHILE_PARSING_LIST);
		if (byte === RIGHT_BRACKET) return false;
		if (seq.first) {
			seq.first = false;
			return true;
		}
		if (byte === COMMA) {
			this.discard();
			const next = this.parseWhitespace();
			if (next === RIGHT_BRACKET) throw this.peekError(TRAILING_COMMA);
			if (next === void 0) throw this.peekError(EOF_WHILE_PARSING_VALUE);
			return true;
		}
		throw this.peekError(EXPECTED_LIST_COMMA_OR_END);
	}
	hasNextKey(map) {
		const byte = this.parseWhitespace();
		if (byte === void 0) throw this.peekError(EOF_WHILE_PARSING_OBJECT);
		if (byte === RIGHT_BRACE) return false;
		if (map.first) {
			map.first = false;
			if (byte === QUOTE) return true;
			throw this.peekError(KEY_MUST_BE_A_STRING);
		}
		if (byte === COMMA) {
			this.discard();
			const next = this.parseWhitespace();
			if (next === QUOTE) return true;
			if (next === RIGHT_BRACE) throw this.peekError(TRAILING_COMMA);
			if (next === void 0) throw this.peekError(EOF_WHILE_PARSING_VALUE);
			throw this.peekError(KEY_MUST_BE_A_STRING);
		}
		throw this.peekError(EXPECTED_OBJECT_COMMA_OR_END);
	}
	/** The next key, or `undefined` at the closing brace. */
	nextKey(map) {
		if (!this.hasNextKey(map)) return void 0;
		this.discard();
		return this.parseStr();
	}
	/**
	* Runs `visit` on the array or object whose opening bracket is the peeked
	* byte, under the recursion limit, then consumes the closing bracket. The
	* closing bracket is consumed even after a failed visit, and a visitor
	* error takes its position after that.
	*/
	nested(visit, end) {
		this.remainingDepth -= 1;
		if (this.remainingDepth === 0) throw this.peekError(RECURSION_LIMIT_EXCEEDED);
		this.discard();
		let result;
		let failure;
		try {
			result = visit();
		} catch (e) {
			failure = e;
		}
		this.remainingDepth += 1;
		try {
			end();
		} catch (e) {
			failure ??= e;
		}
		if (failure !== void 0) throw this.fixPosition(failure);
		return result;
	}
	nestedSeq(visit) {
		return this.nested(visit, () => {
			this.endSeq();
		});
	}
	nestedMap(visit) {
		return this.nested(visit, () => {
			this.endMap();
		});
	}
	/** `u64`. */
	deserializeU64() {
		const byte = this.parseValueStart();
		let number;
		if (byte === MINUS) {
			this.discard();
			number = this.parseInteger(false);
		} else if (isDigit$1(byte)) number = this.parseInteger(true);
		else throw this.peekInvalidType(byte, "u64");
		if (number.kind === "u64") return number.value;
		const problem = number.kind === "i64" ? "invalid value" : "invalid type";
		throw this.fixPosition(dataError(`${problem}: ${unexpectedNumber(number)}, expected u64`));
	}
	/** `String`. */
	deserializeString() {
		const byte = this.parseValueStart();
		if (byte !== QUOTE) throw this.peekInvalidType(byte, "a string");
		this.discard();
		return this.parseStr();
	}
	/** `Option<T>`: `null` is `undefined`, anything else is read by `some`. */
	deserializeOption(some) {
		if (this.parseWhitespace() === LOWER_N) {
			this.discard();
			this.parseIdent("ull");
			return;
		}
		return some();
	}
	/** `Vec<T>`. */
	deserializeSeq(element) {
		const byte = this.parseValueStart();
		if (byte !== LEFT_BRACKET) throw this.peekInvalidType(byte, "a sequence");
		return this.nestedSeq(() => {
			const values = [];
			const seq = { first: true };
			while (this.hasNextElement(seq)) values.push(element());
			return values;
		});
	}
	/** A derived struct, from an object or from an array of its fields in order. */
	deserializeStruct(spec) {
		const byte = this.parseValueStart();
		if (byte === LEFT_BRACKET) return this.nestedSeq(() => this.visitStructSeq(spec));
		if (byte === LEFT_BRACE) return this.nestedMap(() => this.visitStructMap(spec));
		throw this.peekInvalidType(byte, `struct ${spec.name}`);
	}
	visitStructMap(spec) {
		const values = spec.fields.map(() => void 0);
		const seen = spec.fields.map(() => false);
		const map = { first: true };
		for (;;) {
			const key = this.nextKey(map);
			if (key === void 0) break;
			const i = spec.fields.findIndex((field) => field.name === key);
			if (i < 0) {
				this.parseObjectColon();
				this.ignoreValue();
			} else {
				if (seen[i]) throw dataError(`duplicate field \`${key}\``);
				this.parseObjectColon();
				values[i] = spec.fields[i].read(this);
				seen[i] = true;
			}
		}
		spec.fields.forEach((field, i) => {
			if (!seen[i] && !field.optional && !field.defaulted) throw dataError(`missing field \`${field.name}\``);
		});
		return spec.build(values);
	}
	visitStructSeq(spec) {
		const values = [];
		const seq = { first: true };
		const count = spec.fields.length;
		const expecting = `struct ${spec.name} with ${count} element${count === 1 ? "" : "s"}`;
		for (const [i, field] of spec.fields.entries()) if (this.hasNextElement(seq)) values.push(field.read(this));
		else if (field.defaulted) values.push(void 0);
		else throw dataError(`invalid length ${i}, expected ${expecting}`);
		return spec.build(values);
	}
	/** `serde_json::Value`. */
	deserializeValue() {
		const byte = this.parseValueStart();
		if (byte === LOWER_N) {
			this.discard();
			this.parseIdent("ull");
			return null;
		}
		if (byte === LOWER_T) {
			this.discard();
			this.parseIdent("rue");
			return true;
		}
		if (byte === LOWER_F) {
			this.discard();
			this.parseIdent("alse");
			return false;
		}
		if (byte === MINUS) {
			this.discard();
			return this.parseInteger(false).value;
		}
		if (isDigit$1(byte)) return this.parseInteger(true).value;
		if (byte === QUOTE) {
			this.discard();
			return this.parseStr();
		}
		if (byte === LEFT_BRACKET) return this.nestedSeq(() => {
			const values = [];
			const seq = { first: true };
			while (this.hasNextElement(seq)) values.push(this.deserializeValue());
			return values;
		});
		if (byte === LEFT_BRACE) return this.nestedMap(() => {
			const object = {};
			const map = { first: true };
			for (;;) {
				const key = this.nextKey(map);
				if (key === void 0) return object;
				this.parseObjectColon();
				const value = this.deserializeValue();
				Object.defineProperty(object, key, {
					value,
					writable: true,
					enumerable: true,
					configurable: true
				});
			}
		});
		throw this.peekError(EXPECTED_SOME_VALUE);
	}
	/** `IgnoredAny`: skips one value of any shape, without a depth limit. */
	ignoreValue() {
		const stack = [];
		let enclosing;
		for (;;) {
			const byte = this.parseValueStart();
			let frame;
			if (byte === LOWER_N) {
				this.discard();
				this.parseIdent("ull");
			} else if (byte === LOWER_T) {
				this.discard();
				this.parseIdent("rue");
			} else if (byte === LOWER_F) {
				this.discard();
				this.parseIdent("alse");
			} else if (byte === MINUS) {
				this.discard();
				this.ignoreInteger();
			} else if (isDigit$1(byte)) this.ignoreInteger();
			else if (byte === QUOTE) {
				this.discard();
				this.ignoreStr();
			} else if (byte === LEFT_BRACKET || byte === LEFT_BRACE) {
				if (enclosing !== void 0) stack.push(enclosing);
				this.discard();
				frame = byte;
			} else throw this.peekError(EXPECTED_SOME_VALUE);
			let acceptComma;
			if (frame !== void 0) acceptComma = false;
			else if (enclosing !== void 0) {
				frame = enclosing;
				acceptComma = true;
			} else return;
			for (;;) {
				const next = this.parseWhitespace();
				if (next === void 0) throw this.peekError(frame === LEFT_BRACKET ? EOF_WHILE_PARSING_LIST : EOF_WHILE_PARSING_OBJECT);
				if (next === COMMA && acceptComma) {
					this.discard();
					break;
				}
				if (!(next === RIGHT_BRACKET && frame === LEFT_BRACKET || next === RIGHT_BRACE && frame === LEFT_BRACE)) {
					if (acceptComma) throw this.peekError(frame === LEFT_BRACKET ? EXPECTED_LIST_COMMA_OR_END : EXPECTED_OBJECT_COMMA_OR_END);
					break;
				}
				this.discard();
				frame = stack.pop();
				if (frame === void 0) return;
				acceptComma = true;
			}
			if (frame === LEFT_BRACE) {
				const key = this.parseWhitespace();
				if (key === QUOTE) this.discard();
				else if (key !== void 0) throw this.peekError(KEY_MUST_BE_A_STRING);
				else throw this.peekError(EOF_WHILE_PARSING_OBJECT);
				this.ignoreStr();
				const colon = this.parseWhitespace();
				if (colon === COLON) this.discard();
				else if (colon !== void 0) throw this.peekError(EXPECTED_COLON);
				else throw this.peekError(EOF_WHILE_PARSING_OBJECT);
			}
			enclosing = frame;
		}
	}
	ignoreInteger() {
		const first = this.nextOrNull();
		if (first === ZERO) {
			if (isDigit$1(this.peekOrNull())) throw this.peekError(INVALID_NUMBER);
		} else if (isDigit$1(first)) while (isDigit$1(this.peekOrNull())) this.discard();
		else throw this.error(INVALID_NUMBER);
		const byte = this.peekOrNull();
		if (byte === DOT) this.ignoreDecimal();
		else if (byte === LOWER_E || byte === UPPER_E) this.ignoreExponent();
	}
	ignoreDecimal() {
		this.discard();
		let atLeastOneDigit = false;
		while (isDigit$1(this.peekOrNull())) {
			this.discard();
			atLeastOneDigit = true;
		}
		if (!atLeastOneDigit) throw this.peekError(INVALID_NUMBER);
		const byte = this.peekOrNull();
		if (byte === LOWER_E || byte === UPPER_E) this.ignoreExponent();
	}
	ignoreExponent() {
		this.discard();
		const sign = this.peekOrNull();
		if (sign === PLUS || sign === MINUS) this.discard();
		if (!isDigit$1(this.nextOrNull())) throw this.error(INVALID_NUMBER);
		while (isDigit$1(this.peekOrNull())) this.discard();
	}
};
const readU64 = (de) => de.deserializeU64();
const readString = (de) => de.deserializeString();
const readOptionalU64 = (de) => de.deserializeOption(() => de.deserializeU64());
const readOptionalString = (de) => de.deserializeOption(() => de.deserializeString());
function required(name, read) {
	return {
		name,
		read,
		optional: false,
		defaulted: false
	};
}
function optional(name, read) {
	return {
		name,
		read,
		optional: true,
		defaulted: false
	};
}
const REGISTRY_ENTRY = {
	name: "RegistryEntry",
	fields: [
		required("codepoint", readU64),
		required("name", readString),
		optional("type", readOptionalString),
		optional("uri", readOptionalString),
		optional("description", readOptionalString)
	],
	build: ([codepoint, name, type, uri, description]) => ({
		codepoint,
		name,
		...type === void 0 ? {} : { type },
		...uri === void 0 ? {} : { uri },
		...description === void 0 ? {} : { description }
	})
};
const ONTOLOGY_INFO = {
	name: "OntologyInfo",
	fields: [
		optional("name", readOptionalString),
		optional("source_url", readOptionalString),
		optional("start_code_point", readOptionalU64),
		optional("processing_strategy", readOptionalString)
	],
	build: ([name, sourceUrl, startCodePoint, processingStrategy]) => ({
		...name === void 0 ? {} : { name },
		...sourceUrl === void 0 ? {} : { sourceUrl },
		...startCodePoint === void 0 ? {} : { startCodePoint },
		...processingStrategy === void 0 ? {} : { processingStrategy }
	})
};
const GENERATED_INFO = {
	name: "GeneratedInfo",
	fields: [optional("tool", readOptionalString)],
	build: ([tool]) => tool === void 0 ? {} : { tool }
};
const REGISTRY_FILE = {
	name: "RegistryFile",
	fields: [
		optional("ontology", (de) => de.deserializeOption(() => de.deserializeStruct(ONTOLOGY_INFO))),
		optional("generated", (de) => de.deserializeOption(() => de.deserializeStruct(GENERATED_INFO))),
		required("entries", (de) => de.deserializeSeq(() => de.deserializeStruct(REGISTRY_ENTRY))),
		{
			name: "statistics",
			read: (de) => de.deserializeOption(() => de.deserializeValue()),
			optional: true,
			defaulted: true
		}
	],
	build: ([ontology, generated, entries, statistics]) => ({
		...ontology === void 0 ? {} : { ontology },
		...generated === void 0 ? {} : { generated },
		entries,
		...statistics === void 0 ? {} : { statistics }
	})
};
/**
* Parses the text of a registry file exactly as the reference does with
* `serde_json::from_str::<RegistryFile>`.
*
* Unknown fields are skipped at every level, a repeated known field or a
* missing required one is an error, `null` for an optional field reads as
* absent, and a struct may also be given as an array of its fields in order.
* Nesting is limited to 128 levels except while skipping unknown fields.
*
* @param text - The file's content; a JS string, so already valid Unicode.
* @returns The parsed file.
* @throws {KnownValuesError} With code `Json` and serde_json's message,
*   including ` at line L column C` (byte-based), when `text` is not a
*   registry file; with code `InvalidParameter` when `text` is not a string.
*
* @example
* ```ts
* const file = parseRegistryFile('{"entries":[{"codepoint":1000,"name":"myValue"}]}');
* file.entries[0].codepoint; // 1000n
* ```
*/
function parseRegistryFile(text) {
	if (typeof text !== "string") throw KnownValuesError.invalidParameter("text", text);
	const de = new Deserializer(new TextEncoder().encode(text));
	try {
		const file = de.deserializeStruct(REGISTRY_FILE);
		de.end();
		return file;
	} catch (e) {
		throw KnownValuesError.json(e.display());
	}
}
/**
* Loading known values from the `.json` registry files of configurable
* directories (`~/.known-values` by default), and the process-wide
* directory configuration the global registry reads on first access.
*
* The host filesystem is reached through `process.getBuiltinModule` so the
* module has no static `node:` import; where the builtin is unavailable (a
* browser), every directory behaves as a missing one.
*
* @module directory
*/
/** The adapter over Node's `fs` and `os` builtins, or `undefined` where they are unavailable. */
function hostFilesystem() {
	const proc = globalThis.process;
	if (proc === void 0 || typeof proc.getBuiltinModule !== "function") return void 0;
	let fs;
	let os;
	try {
		fs = proc.getBuiltinModule("node:fs");
		os = proc.getBuiltinModule("node:os");
	} catch {
		return;
	}
	if (fs === void 0 || os === void 0) return void 0;
	const nodeFs = fs;
	const nodeOs = os;
	return {
		separator: proc?.platform === "win32" ? "\\" : "/",
		isDirectory(path) {
			try {
				return nodeFs.statSync(path).isDirectory();
			} catch {
				return false;
			}
		},
		*entries(path) {
			const dir = nodeFs.opendirSync(path);
			try {
				for (;;) {
					const entry = dir.readSync();
					if (entry === null) return;
					yield entry.name;
				}
			} finally {
				dir.closeSync();
			}
		},
		readFile(path) {
			return nodeFs.readFileSync(path);
		},
		homeEnv() {
			return proc?.env?.["HOME"];
		},
		userHome() {
			try {
				return nodeOs.userInfo().homedir;
			} catch {
				return;
			}
		},
		errno(code) {
			return nodeOs.constants.errno[code];
		}
	};
}
let FILESYSTEM = null;
/** The filesystem the loader uses: the host's unless a test injected one. */
function filesystem() {
	if (FILESYSTEM === null) FILESYSTEM = hostFilesystem();
	return FILESYSTEM;
}
/** `PathBuf::join` with a relative name: one separator unless the directory already ends in one. */
function joinPath(dir, name, separator) {
	if (dir === "") return name;
	const last = dir[dir.length - 1];
	return last === separator || separator === "\\" && last === "/" ? dir + name : dir + separator + name;
}
/**
* `Path::extension` of an entry name: none for `..`, none when the only
* dot leads the name, else the text after the last dot.
*/
function extensionOf(name) {
	if (name === "..") return void 0;
	const dot = name.lastIndexOf(".");
	if (dot <= 0) return void 0;
	return name.slice(dot + 1);
}
/** The POSIX `strerror` texts the reference's `io::Error` prints for the codes a registry load meets. */
const STRERROR = {
	EISDIR: "Is a directory",
	EACCES: "Permission denied",
	ENOENT: "No such file or directory",
	ENOTDIR: "Not a directory",
	ELOOP: "Too many levels of symbolic links",
	ENAMETOOLONG: "File name too long",
	EMFILE: "Too many open files",
	EIO: "Input/output error"
};
/** `IO error: <strerror> (os error <errno>)`, or the host's message for a code outside the table. */
function ioError(fs, e) {
	const host = e;
	const code = typeof host?.code === "string" ? host.code : void 0;
	const text = code === void 0 ? void 0 : STRERROR[code];
	const errno = code === void 0 ? void 0 : fs.errno(code);
	if (text !== void 0 && errno !== void 0) return KnownValuesError.io(`IO error: ${text} (os error ${errno})`);
	return KnownValuesError.io(`IO error: ${host?.message ?? String(e)}`);
}
const UTF8 = new TextDecoder("utf-8", {
	fatal: true,
	ignoreBOM: true
});
/** The reference's `fs::read_to_string`: the bytes, which must be UTF-8. */
function readToString(fs, path) {
	let bytes;
	try {
		bytes = fs.readFile(path);
	} catch (e) {
		throw ioError(fs, e);
	}
	try {
		return UTF8.decode(bytes);
	} catch {
		throw KnownValuesError.io("IO error: stream did not contain valid UTF-8");
	}
}
/** The reference's `load_single_file`: the file's entries as named values. */
function loadSingleFile(fs, path) {
	const text = readToString(fs, path);
	let file;
	try {
		file = parseRegistryFile(text);
	} catch (e) {
		if (KnownValuesError.isKnownValuesError(e) && e.is("Json")) throw KnownValuesError.json(`JSON parse error in ${path}: ${e.message}`);
		throw e;
	}
	return file.entries.map((entry) => new KnownValue(entry.codepoint, entry.name));
}
/** The `.json` entries of a directory in host order; throws the directory's own IO error. */
function jsonFiles(fs, path) {
	const files = [];
	try {
		for (const name of fs.entries(path)) if (extensionOf(name) === "json") files.push(joinPath(path, name, fs.separator));
	} catch (e) {
		throw ioError(fs, e);
	}
	return files;
}
/** A path list argument, checked before use. */
function checkedPaths(paths) {
	if (!Array.isArray(paths)) throw KnownValuesError.invalidParameter("paths", paths);
	for (const p of paths) if (typeof p !== "string") throw KnownValuesError.invalidParameter("path", p);
	return [...paths];
}
/**
* The directories the global registry loads registry files from, in order
* (a later directory replaces an earlier one by codepoint). The default is
* the one directory `~/.known-values`; an empty configuration loads nothing
* and makes the global registry equal to a reference build without the
* `directory-loading` feature.
*/
var DirectoryConfig = class DirectoryConfig {
	_paths;
	/**
	* @param paths - The directories, in order (none by default)
	* @throws KnownValuesError `InvalidParameter` when `paths` is not an array of strings
	*/
	constructor(paths = []) {
		this._paths = checkedPaths(paths);
	}
	/** The default directory only. */
	static defaultOnly() {
		return new DirectoryConfig([DirectoryConfig.defaultDirectory()]);
	}
	/** `paths`, then the default directory. */
	static withPathsAndDefault(paths) {
		return new DirectoryConfig([...checkedPaths(paths), DirectoryConfig.defaultDirectory()]);
	}
	/**
	* `~/.known-values`: the home directory is a non-empty `HOME`, else the
	* account's home from the user database, else `.` (the reference's
	* `dirs::home_dir().unwrap_or(".")`).
	*/
	static defaultDirectory() {
		const fs = filesystem();
		const separator = fs?.separator ?? "/";
		let home = fs?.homeEnv();
		if (home === void 0 || home === "") home = fs?.userHome();
		if (home === void 0 || home === "") home = ".";
		return joinPath(home, ".known-values", separator);
	}
	/** The directories, in order. */
	get paths() {
		return [...this._paths];
	}
	/**
	* Appends a directory.
	*
	* @throws KnownValuesError `InvalidParameter` when `path` is not a string
	*/
	addPath(path) {
		if (typeof path !== "string") throw KnownValuesError.invalidParameter("path", path);
		this._paths.push(path);
	}
};
/** `config` checked as a `DirectoryConfig`. */
function checkedConfig(config) {
	if (!(config instanceof DirectoryConfig) && !isConfigLike(config)) throw KnownValuesError.invalidParameter("config", config);
	return config;
}
/** A `DirectoryConfig` from another copy of this module: a `paths` array of strings. */
function isConfigLike(x) {
	const paths = x?.paths;
	return Array.isArray(paths) && paths.every((p) => typeof p === "string");
}
/**
* The values of every `.json` registry file in `path`, in the host's
* directory order (the reference's `load_from_directory`): a missing path
* or a non-directory yields none; the first unreadable or unparsable file
* fails the whole load.
*
* @throws KnownValuesError `Io` (`IO error: …`) or `Json` (`JSON parse error in <file>: …`)
*/
function loadFromDirectory(path) {
	if (typeof path !== "string") throw KnownValuesError.invalidParameter("path", path);
	const fs = filesystem();
	if (fs?.isDirectory(path) !== true) return [];
	const values = [];
	for (const file of jsonFiles(fs, path)) values.push(...loadSingleFile(fs, file));
	return values;
}
/**
* The reference's `load_from_directory_tolerant`: per-file errors are
* collected; a directory that cannot be opened or read to the end fails as
* a whole and its values are discarded.
*/
function loadDirectoryTolerant(fs, path) {
	const values = [];
	const errors = [];
	if (!fs.isDirectory(path)) return {
		values,
		errors
	};
	for (const file of jsonFiles(fs, path)) try {
		values.push(...loadSingleFile(fs, file));
	} catch (e) {
		if (!KnownValuesError.isKnownValuesError(e)) throw e;
		errors.push({
			path: file,
			error: e
		});
	}
	return {
		values,
		errors
	};
}
/**
* The values of every configured directory (the reference's
* `load_from_config`): per-file errors are tolerated and reported; a
* directory that cannot be read to the end is reported as one error, its
* partial values discarded and its path left out of `filesProcessed`.
*/
function loadFromConfig(config) {
	const checked = checkedConfig(config);
	const values = /* @__PURE__ */ new Map();
	const filesProcessed = [];
	const errors = [];
	const fs = filesystem();
	for (const dir of checked.paths) {
		if (fs === void 0) {
			filesProcessed.push(dir);
			continue;
		}
		let loaded;
		try {
			loaded = loadDirectoryTolerant(fs, dir);
		} catch (e) {
			if (!KnownValuesError.isKnownValuesError(e)) throw e;
			errors.push({
				path: dir,
				error: e
			});
			continue;
		}
		for (const kv of loaded.values) values.set(kv.valueBigInt, kv);
		errors.push(...loaded.errors);
		filesProcessed.push(dir);
	}
	return {
		values,
		filesProcessed,
		errors
	};
}
/**
* A bidirectional registry of known values: codepoint → value and
* assigned name → value.
*
* @module known-values-store
*/
/** The argument checked as a `KnownValue` before any store read or write. */
function checked(x) {
	if (!KnownValue.isKnownValue(x)) throw KnownValuesError.invalidParameter("knownValue", x);
	return x;
}
/**
* A bidirectional registry of known values: codepoint → value and assigned
* name → value.
*
* `register` replaces by codepoint: a later registration of the same
* codepoint replaces the earlier value and retires its name. A later
* registration of the same *name* on another codepoint moves the name index
* to it; the earlier codepoint keeps its own `assignedName` and both count
* in `size` (the reference behaves the same). The empty name of the unit
* value is indexed like any other, so `byName("")` answers codepoint 0.
* Iteration is in registration order; a replaced codepoint keeps its
* original position. Values are frozen, so `clone()` may share them.
*
* Every argument is checked before the store is touched: a value that is
* not a `KnownValue`, or a name that is not a string, is a
* `KnownValuesError` `InvalidParameter`.
*/
var KnownValuesStore = class KnownValuesStore {
	_byValue;
	_byName;
	/**
	* @param knownValues - Registered in order, as `register` would.
	* @throws KnownValuesError `InvalidParameter` when `knownValues` is not iterable or holds a non-`KnownValue`
	*/
	constructor(knownValues = []) {
		this._byValue = /* @__PURE__ */ new Map();
		this._byName = /* @__PURE__ */ new Map();
		if (typeof knownValues !== "object" || knownValues === null || typeof knownValues[Symbol.iterator] !== "function") throw KnownValuesError.invalidParameter("knownValues", knownValues);
		const values = [...knownValues].map(checked);
		for (const kv of values) this.register(kv);
	}
	/**
	* Add or replace a value. A later registration of the same codepoint
	* replaces the earlier one and retires its name; the same name on another
	* codepoint moves the name index (see the class doc).
	*
	* @throws KnownValuesError `InvalidParameter` when `knownValue` is not a `KnownValue`
	*/
	register(knownValue) {
		const kv = checked(knownValue);
		const oldName = this._byValue.get(kv.valueBigInt)?.assignedName;
		if (oldName !== void 0) this._byName.delete(oldName);
		this._byValue.set(kv.valueBigInt, kv);
		const name = kv.assignedName;
		if (name !== void 0) this._byName.set(name, kv);
	}
	/**
	* The registered value with this codepoint, if any.
	*
	* @throws KnownValuesError `InvalidParameter` when `value` is not a non-negative safe
	*   integer `number` or a `bigint` in `0 ..= 2⁶⁴ − 1`
	*/
	byValue(value) {
		return this._byValue.get(toBigInt(value));
	}
	/**
	* The registered value with this assigned name, if any.
	*
	* @throws KnownValuesError `InvalidParameter` when `assignedName` is not a string
	*/
	byName(assignedName) {
		if (typeof assignedName !== "string") throw KnownValuesError.invalidParameter("assignedName", assignedName);
		return this._byName.get(assignedName);
	}
	/**
	* The name this store assigns to the value's codepoint, if any.
	*
	* @throws KnownValuesError `InvalidParameter` when `knownValue` is not a `KnownValue`
	*/
	assignedNameOf(knownValue) {
		return this._byValue.get(checked(knownValue).valueBigInt)?.assignedName;
	}
	/**
	* The store's name for the codepoint, else the value's own name.
	*
	* @throws KnownValuesError `InvalidParameter` when `knownValue` is not a `KnownValue`
	*/
	nameOf(knownValue) {
		const kv = checked(knownValue);
		return this._byValue.get(kv.valueBigInt)?.assignedName ?? kv.name;
	}
	/**
	* Register every entry of the `.json` registry files in `path`, in the
	* host's directory order (the reference's `load_from_directory`): a
	* missing path or a non-directory registers nothing; the first unreadable
	* or unparsable file stops the load with nothing registered.
	*
	* @returns How many values the directory held
	* @throws KnownValuesError `Io` or `Json` for the first failing file or directory
	*/
	loadFromDirectory(path) {
		const values = loadFromDirectory(path);
		for (const kv of values) this.register(kv);
		return values.length;
	}
	/**
	* Register the values of every configured directory, tolerating per-file
	* errors (the reference's `load_from_config`): later directories replace
	* earlier ones by codepoint, and the result lists the directories
	* processed and every error met.
	*/
	loadFromConfig(config) {
		const result = loadFromConfig(config);
		for (const kv of result.values.values()) this.register(kv);
		return result;
	}
	/** How many codepoints are registered. */
	get size() {
		return this._byValue.size;
	}
	/** Registered values, in registration order. */
	values() {
		return this._byValue.values();
	}
	/** Registered values, in registration order. */
	[Symbol.iterator]() {
		return this._byValue.values();
	}
	/** An independent registry with the same entries (the frozen values are shared). */
	clone() {
		const cloned = new KnownValuesStore();
		cloned._byValue = new Map(this._byValue);
		cloned._byName = new Map(this._byName);
		return cloned;
	}
};
/** 0 — `''` (the unit value): The Unit type, and its sole inhabitant '', which is a value conveying no information. */
const UNIT = new KnownValue(0, "");
/** 1 — `isA`: The subject is an instance of the class identified by the object. */
const IS_A = new KnownValue(1, "isA");
/** 2 — `id`: The object is an unambiguous identifier of the subject within a given context. */
const ID = new KnownValue(2, "id");
/** 3 — `signed`: The object is a cryptographic signature of the subject. */
const SIGNED = new KnownValue(3, "signed");
/** 4 — `note`: The object is a human-readable note about the subject. */
const NOTE = new KnownValue(4, "note");
/** 5 — `hasRecipient`: The subject can be decrypted using the private key that decrypts the content key in the object. */
const HAS_RECIPIENT = new KnownValue(5, "hasRecipient");
/** 6 — `sskrShare`: The subject can be decrypted by a quorum of SSKR shares including the one in the object. */
const SSKR_SHARE = new KnownValue(6, "sskrShare");
/** 7 — `controller`: The object is the subject's controlling entity. */
const CONTROLLER = new KnownValue(7, "controller");
/** 8 — `key`: The entity identified by the subject holds the private half of the public keys(s) in the object. */
const KEY = new KnownValue(8, "key");
/** 9 — `dereferenceVia`: The content referenced by the subject can be dereferenced using the object. */
const DEREFERENCE_VIA = new KnownValue(9, "dereferenceVia");
/** 10 — `entity`: The entity referenced by the subject is specified in the object. */
const ENTITY = new KnownValue(10, "entity");
/** 11 — `name`: The subject is known by the name in the object. */
const NAME = new KnownValue(11, "name");
/** 12 — `language`: The subject is written in the language of the ISO language code object. */
const LANGUAGE = new KnownValue(12, "language");
/** 13 — `issuer`: The object is the subject's issuing entity. */
const ISSUER = new KnownValue(13, "issuer");
/** 14 — `holder`: The object identifies the entity to which the subject has been issued. */
const HOLDER = new KnownValue(14, "holder");
/** 15 — `salt`: The object is random salt used to decorrelate the digest of the subject. */
const SALT = new KnownValue(15, "salt");
/** 16 — `date`: The object is a primary datestamp of the subject. */
const DATE = new KnownValue(16, "date");
/** 17 — `Unknown`: Placeholder for an unknown value. */
const UNKNOWN_VALUE = new KnownValue(17, "Unknown");
/** 18 — `version`: The object is the version of the subject. */
const VERSION_VALUE = new KnownValue(18, "version");
/** 19 — `hasSecret`: The subject can be decrypted using the secret that decrypts the content key in the object. */
const HAS_SECRET = new KnownValue(19, "hasSecret");
/** 20 — `edits`: The object is a set of edits used by the Envelope.transform(edits:) method. */
const DIFF_EDITS = new KnownValue(20, "edits");
/** 21 — `validFrom`: The subject is valid from the date in the object. */
const VALID_FROM = new KnownValue(21, "validFrom");
/** 22 — `validUntil`: The subject is valid until the date in the object. */
const VALID_UNTIL = new KnownValue(22, "validUntil");
/** 23 — `position`: The position of an item in a series or sequence of items. */
const POSITION = new KnownValue(23, "position");
/** 24 — `nickname`: The subject is a nickname for the object. */
const NICKNAME = new KnownValue(24, "nickname");
new KnownValue(25, "value");
/** 26 — `attestation`: The object is an attestation of the subject. */
const ATTESTATION = new KnownValue(26, "attestation");
/** 27 — `verifiableAt`: The object is a date at which the subject can be verified. */
const VERIFIABLE_AT = new KnownValue(27, "verifiableAt");
/** 50 — `attachment`: Declares that the object is a vendor-defined attachment to the envelope. */
const ATTACHMENT = new KnownValue(50, "attachment");
/** 51 — `vendor`: Declares the vendor of the subject. */
const VENDOR = new KnownValue(51, "vendor");
/** 52 — `conformsTo`: An established standard to which the subject conforms. */
const CONFORMS_TO = new KnownValue(52, "conformsTo");
/** 60 — `allow`: The object is a set of permissions that allow the subject to perform the actions specified in the object. */
const ALLOW = new KnownValue(60, "allow");
/** 61 — `deny`: The object is a set of permissions that deny the subject from performing the actions specified in the object. */
const DENY = new KnownValue(61, "deny");
/** 62 — `endpoint`: The object is a service endpoint associated with the subject. */
const ENDPOINT = new KnownValue(62, "endpoint");
/** 63 — `delegate`: The object is a delegate authorized by the subject. */
const DELEGATE = new KnownValue(63, "delegate");
/** 64 — `provenance`: The object is a provenance mark associated with the subject. */
const PROVENANCE = new KnownValue(64, "provenance");
/** 65 — `privateKey`: The object is a private key associated with the subject. */
const PRIVATE_KEY = new KnownValue(65, "privateKey");
/** 66 — `service`: The object is a service associated with the subject. */
const SERVICE = new KnownValue(66, "service");
/** 67 — `capability`: The object is a capability associated with the subject. */
const CAPABILITY = new KnownValue(67, "capability");
/** 68 — `provenanceGenerator`: The object is a provenance mark generator associated with the subject. */
const PROVENANCE_GENERATOR = new KnownValue(68, "provenanceGenerator");
/** 70 — `All`: The set of all allowed privileges. */
const PRIVILEGE_ALL = new KnownValue(70, "All");
/** 71 — `Authorize`: Operational privilege: authorize actions on behalf of the subject. */
const PRIVILEGE_AUTH = new KnownValue(71, "Authorize");
/** 72 — `Sign`: Operational privilege: sign documents on behalf of the subject. */
const PRIVILEGE_SIGN = new KnownValue(72, "Sign");
/** 73 — `Encrypt`: Operational privilege: encrypt messages from the subject and decrypt messages to the subject. */
const PRIVILEGE_ENCRYPT = new KnownValue(73, "Encrypt");
/** 74 — `Elide`: Operational privilege: elide the subject's documents. */
const PRIVILEGE_ELIDE = new KnownValue(74, "Elide");
/** 75 — `Issue`: Operational privilege: issue documents on behalf of the subject. */
const PRIVILEGE_ISSUE = new KnownValue(75, "Issue");
/** 76 — `Access`: Operational privilege: access resources on behalf of the subject. */
const PRIVILEGE_ACCESS = new KnownValue(76, "Access");
/** 80 — `Delegate`: Management privilege: delegate the privileges of the subject to another entity. */
const PRIVILEGE_DELEGATE = new KnownValue(80, "Delegate");
/** 81 — `Verify`: Management privilege: update the subject's documents, including the ability to reduce privileges. */
const PRIVILEGE_VERIFY = new KnownValue(81, "Verify");
/** 82 — `Update`: Management privilege: update the subject's service endpoints. */
const PRIVILEGE_UPDATE = new KnownValue(82, "Update");
/** 83 — `Transfer`: Management privilege: remove the inception key from the XID document. */
const PRIVILEGE_TRANSFER = new KnownValue(83, "Transfer");
/** 84 — `Elect`: Management privilege: add or remove other verifiers (rotate keys). */
const PRIVILEGE_ELECT = new KnownValue(84, "Elect");
/** 85 — `Burn`: Management privilege: transition to a new provenance mark chain. */
const PRIVILEGE_BURN = new KnownValue(85, "Burn");
/** 86 — `Revoke`: Management privilege: revoke the XID entirely. */
const PRIVILEGE_REVOKE = new KnownValue(86, "Revoke");
/** 100 — `body`: The object is the body of the request or expression identified by the subject. */
const BODY = new KnownValue(100, "body");
/** 101 — `result`: The object is the success result of the request identified by the subject. */
const RESULT = new KnownValue(101, "result");
/** 102 — `error`: The object is the failure result of the request identified by the subject. */
const ERROR = new KnownValue(102, "error");
/** 103 — `OK`: The success result of a request that has no other return value. */
const OK_VALUE = new KnownValue(103, "OK");
/** 104 — `Processing`: The "in processing" result of a request. */
const PROCESSING_VALUE = new KnownValue(104, "Processing");
/** 105 — `sender`: The object identifies the sender, including a way to verify messages from the sender (e.g. public key). */
const SENDER = new KnownValue(105, "sender");
/** 106 — `senderContinuation`: The object is a continuation owned by the sender. */
const SENDER_CONTINUATION = new KnownValue(106, "senderContinuation");
/** 107 — `recipientContinuation`: The object is a continuation owned by the recipient. */
const RECIPIENT_CONTINUATION = new KnownValue(107, "recipientContinuation");
/** 108 — `content`: The object is the content of the event. */
const CONTENT = new KnownValue(108, "content");
/** 200 — `Seed`: A cryptographic seed. */
const SEED_TYPE = new KnownValue(200, "Seed");
/** 201 — `PrivateKey`: A cryptographic private key. */
const PRIVATE_KEY_TYPE = new KnownValue(201, "PrivateKey");
/** 202 — `PublicKey`: A cryptographic public key. */
const PUBLIC_KEY_TYPE = new KnownValue(202, "PublicKey");
/** 203 — `MasterKey`: A cryptographic master key. */
const MASTER_KEY_TYPE = new KnownValue(203, "MasterKey");
/** 300 — `asset`: Declares a cryptocurrency asset specifier, e.g. "Bitcoin", "Ethereum". */
const ASSET = new KnownValue(300, "asset");
/** 301 — `Bitcoin`: The Bitcoin cryptocurrency ("BTC"). */
const BITCOIN_VALUE = new KnownValue(301, "Bitcoin");
/** 302 — `Ethereum`: The Ethereum cryptocurrency ("ETH"). */
const ETHEREUM_VALUE = new KnownValue(302, "Ethereum");
/** 303 — `Tezos`: The Tezos cryptocurrency ("XTZ"). */
const TEZOS_VALUE = new KnownValue(303, "Tezos");
/** 400 — `network`: Declares a cryptocurrency network, e.g. "MainNet", "TestNet". */
const NETWORK = new KnownValue(400, "network");
/** 401 — `MainNet`: A cryptocurrency main network. */
const MAIN_NET_VALUE = new KnownValue(401, "MainNet");
/** 402 — `TestNet`: A cryptocurrency test network. */
const TEST_NET_VALUE = new KnownValue(402, "TestNet");
/** 500 — `BIP32Key`: A BIP-32 HD key. */
const BIP32_KEY_TYPE = new KnownValue(500, "BIP32Key");
/** 501 — `chainCode`: Declares the chain code of a BIP-32 HD key. */
const CHAIN_CODE = new KnownValue(501, "chainCode");
/** 502 — `DerivationPath`: A BIP-32 derivation path. */
const DERIVATION_PATH_TYPE = new KnownValue(502, "DerivationPath");
/** 503 — `parentPath`: Declares the derivation path for a BIP-32 key. */
const PARENT_PATH = new KnownValue(503, "parentPath");
/** 504 — `childrenPath`: Declares the allowable derivation paths from a BIP-32 key. */
const CHILDREN_PATH = new KnownValue(504, "childrenPath");
/** 505 — `parentFingerprint`: Declares the parent fingerprint of a BIP-32 key. */
const PARENT_FINGERPRINT = new KnownValue(505, "parentFingerprint");
/** 506 — `PSBT`: A Partially-Signed Bitcoin Transaction (PSBT). */
const PSBT_TYPE = new KnownValue(506, "PSBT");
/** 507 — `OutputDescriptor`: A Bitcoin output descriptor. */
const OUTPUT_DESCRIPTOR_TYPE = new KnownValue(507, "OutputDescriptor");
/** 508 — `outputDescriptor`: Declares a Bitcoin output descriptor associated with the subject. */
const OUTPUT_DESCRIPTOR = new KnownValue(508, "outputDescriptor");
/** 600 — `Graph`: A graph. All other assertions in the envelope must be either node or edge. */
const GRAPH = new KnownValue(600, "Graph");
/** 601 — `SourceTargetGraph`: A graph with edges that have source and target assertions. */
const SOURCE_TARGET_GRAPH = new KnownValue(601, "SourceTargetGraph");
/** 602 — `ParentChildGraph`: A graph with edges that have parent and child assertions. */
const PARENT_CHILD_GRAPH = new KnownValue(602, "ParentChildGraph");
/** 603 — `Digraph`: A directed graph. Implies SourceTargetGraph. source and target are distinct. */
const DIGRAPH = new KnownValue(603, "Digraph");
/** 604 — `AcyclicGraph`: A graph that does not admit cycles. Implies SourceTargetGraph. */
const ACYCLIC_GRAPH = new KnownValue(604, "AcyclicGraph");
/** 605 — `Multigraph`: A multigraph (admits parallel edges). Implies SourceTargetGraph. */
const MULTIGRAPH = new KnownValue(605, "Multigraph");
/** 606 — `Pseudograph`: A pseudograph (admits self-loops and parallel edges). Implies Multigraph. */
const PSEUDOGRAPH = new KnownValue(606, "Pseudograph");
/** 607 — `GraphFragment`: A fragment of a graph. May have references to external nodes and edges that are not resolvable in the fragment. */
const GRAPH_FRAGMENT = new KnownValue(607, "GraphFragment");
/** 608 — `DAG`: A directed acyclic graph. Implies Digraph and AcyclicGraph. */
const DAG = new KnownValue(608, "DAG");
/** 609 — `Tree`: A tree. Implies ParentChildGraph. Exactly one node must have no parent. All other nodes must have exactly one parent. */
const TREE = new KnownValue(609, "Tree");
/** 610 — `Forest`: A forest (set of trees). Implies ParentChildGraph. */
const FOREST = new KnownValue(610, "Forest");
/** 611 — `CompoundGraph`: A compound graph (a graph with subgraphs). Implies Forest and SourceTargetGraph. */
const COMPOUND_GRAPH = new KnownValue(611, "CompoundGraph");
/** 612 — `Hypergraph`: An undirected hypergraph (edges may connect more than two nodes). */
const HYPERGRAPH = new KnownValue(612, "Hypergraph");
/** 613 — `Dihypergraph`: A directed hypergraph (edges may connect more than two nodes and have a direction). Implies Hypergraph and Digraph. */
const DIHYPERGRAPH = new KnownValue(613, "Dihypergraph");
/** 700 — `node`: A node in a graph. */
const NODE = new KnownValue(700, "node");
/** 701 — `edge`: An edge in a graph. */
const EDGE = new KnownValue(701, "edge");
/** 702 — `source`: Identifies the source node of the subject edge of a SourceTargetGraph. */
const SOURCE = new KnownValue(702, "source");
/** 703 — `target`: Identifies the target node of the subject edge of a SourceTargetGraph. */
const TARGET = new KnownValue(703, "target");
/** 704 — `parent`: Identifies the parent node of the subject edge of a ParentChildGraph. */
const PARENT = new KnownValue(704, "parent");
/** 705 — `child`: Identifies a child node of the subject edge of a ParentChildGraph. */
const CHILD = new KnownValue(705, "child");
new KnownValue(706, "Self");
/**
* The global registry: the reference's seed of BCR-2023-002 constants, then
* the registry files of the configured directories (`~/.known-values` by
* default), built on first use.
*
* @module registry
*/
/**
* The constants the reference registers in its global store, in its order:
* 102 of the 104 exported constants. `VALUE` (25) and `SELF` (706) are
* declared and exported with their names but not registered, as in the
* reference.
*/
const REFERENCE_STORE_SEED = /*#__PURE__*/ Object.freeze([
	UNIT,
	IS_A,
	ID,
	SIGNED,
	NOTE,
	HAS_RECIPIENT,
	SSKR_SHARE,
	CONTROLLER,
	KEY,
	DEREFERENCE_VIA,
	ENTITY,
	NAME,
	LANGUAGE,
	ISSUER,
	HOLDER,
	SALT,
	DATE,
	UNKNOWN_VALUE,
	VERSION_VALUE,
	HAS_SECRET,
	DIFF_EDITS,
	VALID_FROM,
	VALID_UNTIL,
	POSITION,
	NICKNAME,
	ATTESTATION,
	VERIFIABLE_AT,
	ATTACHMENT,
	VENDOR,
	CONFORMS_TO,
	ALLOW,
	DENY,
	ENDPOINT,
	DELEGATE,
	PROVENANCE,
	PRIVATE_KEY,
	SERVICE,
	CAPABILITY,
	PROVENANCE_GENERATOR,
	PRIVILEGE_ALL,
	PRIVILEGE_AUTH,
	PRIVILEGE_SIGN,
	PRIVILEGE_ENCRYPT,
	PRIVILEGE_ELIDE,
	PRIVILEGE_ISSUE,
	PRIVILEGE_ACCESS,
	PRIVILEGE_DELEGATE,
	PRIVILEGE_VERIFY,
	PRIVILEGE_UPDATE,
	PRIVILEGE_TRANSFER,
	PRIVILEGE_ELECT,
	PRIVILEGE_BURN,
	PRIVILEGE_REVOKE,
	BODY,
	RESULT,
	ERROR,
	OK_VALUE,
	PROCESSING_VALUE,
	SENDER,
	SENDER_CONTINUATION,
	RECIPIENT_CONTINUATION,
	CONTENT,
	SEED_TYPE,
	PRIVATE_KEY_TYPE,
	PUBLIC_KEY_TYPE,
	MASTER_KEY_TYPE,
	ASSET,
	BITCOIN_VALUE,
	ETHEREUM_VALUE,
	TEZOS_VALUE,
	NETWORK,
	MAIN_NET_VALUE,
	TEST_NET_VALUE,
	BIP32_KEY_TYPE,
	CHAIN_CODE,
	DERIVATION_PATH_TYPE,
	PARENT_PATH,
	CHILDREN_PATH,
	PARENT_FINGERPRINT,
	PSBT_TYPE,
	OUTPUT_DESCRIPTOR_TYPE,
	OUTPUT_DESCRIPTOR,
	GRAPH,
	SOURCE_TARGET_GRAPH,
	PARENT_CHILD_GRAPH,
	DIGRAPH,
	ACYCLIC_GRAPH,
	MULTIGRAPH,
	PSEUDOGRAPH,
	GRAPH_FRAGMENT,
	DAG,
	TREE,
	FOREST,
	COMPOUND_GRAPH,
	HYPERGRAPH,
	DIHYPERGRAPH,
	NODE,
	EDGE,
	SOURCE,
	TARGET,
	PARENT,
	CHILD
]);
/**
* Locks the directory configuration and takes it: the one set before the
* first access, else the default (`~/.known-values`). After this a
* `setDirectoryConfig` or `addSearchPaths` throws `AlreadyInitialized`.
*/
function getAndLockConfig() {
	const slot = globalSlot();
	slot.locked = true;
	const config = slot.config ?? DirectoryConfig.defaultOnly();
	delete slot.config;
	return config;
}
/**
* The process-wide registry, built on first call and shared by every copy
* of this module in the process (the ESM and CommonJS builds): the
* reference's 102 seeded constants, then the entries of the registry files
* in the configured directories (`~/.known-values` unless
* `setDirectoryConfig` or `addSearchPaths` said otherwise before the first
* call), later entries replacing earlier ones by codepoint. Hosts without a
* filesystem load nothing. Errors met while loading are tolerated, as the
* reference's `load_from_config` tolerates them; `loadFromConfig` reports
* them for a store of your own.
*/
function getGlobalKnownValuesStore() {
	const slot = globalSlot();
	if (slot.store === void 0) {
		const store = new KnownValuesStore(REFERENCE_STORE_SEED);
		store.loadFromConfig(getAndLockConfig());
		slot.store = store;
	}
	return slot.store;
}
//#endregion
//#region src/pattern/value/known-value-pattern.ts
/**
* Returns true if the given tag value equals the expected tag.
* Handles both number and bigint tag values uniformly.
*/
const tagEquals = (actual, expected) => {
	if (actual === void 0) return false;
	return (typeof actual === "bigint" ? actual : BigInt(actual)) === (typeof expected === "bigint" ? expected : BigInt(expected));
};
/**
* Creates a KnownValuePattern that matches any known value.
*/
const knownValuePatternAny = () => ({ variant: "Any" });
/**
* Creates a KnownValuePattern that matches a specific known value.
*/
const knownValuePatternValue = (value) => ({
	variant: "Value",
	value
});
/**
* Creates a KnownValuePattern that matches a known value by name.
*/
const knownValuePatternNamed = (name) => ({
	variant: "Named",
	name
});
/**
* Creates a KnownValuePattern that matches known values by regex on name.
*/
const knownValuePatternRegex = (pattern) => ({
	variant: "Regex",
	pattern
});
/**
* Extracts a KnownValue from a tagged CBOR value if it's a known value (tag 40000).
*
* The returned KnownValue carries no assigned name. Callers that need the
* registered name must look it up via the global `KNOWN_VALUES` registry.
*/
const extractKnownValue = (haystack) => {
	if (!isTagged(haystack)) return;
	const tag = tagValue(haystack);
	if (!tagEquals(tag, TAG_KNOWN_VALUE.value)) return;
	const content = asTaggedValue(haystack)?.[1];
	if (content === void 0) return;
	const value = asUnsigned(content);
	if (value === void 0) return;
	return new KnownValue(value);
};
/**
* Returns the name of the given KnownValue, looking it up in the global
* registry first and falling back to the value's own (numeric) name string.
*
*/
const resolveKnownValueName = (knownValue) => {
	return getGlobalKnownValuesStore().nameOf(knownValue);
};
/**
* Tests if a CBOR value matches this known value pattern.
*/
const knownValuePatternMatches = (pattern, haystack) => {
	const knownValue = extractKnownValue(haystack);
	if (knownValue === void 0) return false;
	switch (pattern.variant) {
		case "Any": return true;
		case "Value": return knownValue.valueBigInt === pattern.value.valueBigInt;
		case "Named": {
			const expected = getGlobalKnownValuesStore().byName(pattern.name);
			if (expected === void 0) return false;
			return knownValue.valueBigInt === expected.valueBigInt;
		}
		case "Regex": return pattern.pattern.test(resolveKnownValueName(knownValue));
	}
};
/**
* Returns paths to matching known values.
*/
const knownValuePatternPaths = (pattern, haystack) => {
	if (knownValuePatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Formats a KnownValuePattern as a string.
*/
const knownValuePatternDisplay = (pattern) => {
	switch (pattern.variant) {
		case "Any": return "known";
		case "Value": return `'${pattern.value.name}'`;
		case "Named": return `'${pattern.name}'`;
		case "Regex": return `'/${pattern.pattern.source}/'`;
	}
};
//#endregion
//#region src/pattern/value/index.ts
/**
* Returns paths to matching values for a ValuePattern.
*/
const valuePatternPaths = (pattern, haystack) => {
	switch (pattern.type) {
		case "Bool": return boolPatternPaths(pattern.pattern, haystack);
		case "Null": return nullPatternPaths(pattern.pattern, haystack);
		case "Number": return numberPatternPaths(pattern.pattern, haystack);
		case "Text": return textPatternPaths(pattern.pattern, haystack);
		case "ByteString": return byteStringPatternPaths(pattern.pattern, haystack);
		case "Date": return datePatternPaths(pattern.pattern, haystack);
		case "Digest": return digestPatternPaths(pattern.pattern, haystack);
		case "KnownValue": return knownValuePatternPaths(pattern.pattern, haystack);
	}
};
/**
* Formats a ValuePattern as a string.
*/
const valuePatternDisplay = (pattern) => {
	switch (pattern.type) {
		case "Bool": return boolPatternDisplay(pattern.pattern);
		case "Null": return nullPatternDisplay(pattern.pattern);
		case "Number": return numberPatternDisplay(pattern.pattern);
		case "Text": return textPatternDisplay(pattern.pattern);
		case "ByteString": return byteStringPatternDisplay(pattern.pattern);
		case "Date": return datePatternDisplay(pattern.pattern);
		case "Digest": return digestPatternDisplay(pattern.pattern);
		case "KnownValue": return knownValuePatternDisplay(pattern.pattern);
	}
};
//#endregion
//#region src/pattern/matcher.ts
/**
* Compiles a pattern into a VM program.
*
* @param pattern - The pattern to compile
* @returns A compiled program ready for execution
*/
const compilePattern = (pattern) => {
	const code = [];
	const literals = [];
	const captureNames = [];
	collectPatternCaptureNames(pattern, captureNames);
	compilePatternToCode(pattern, code, literals, captureNames);
	code.push({ type: "Accept" });
	return {
		code,
		literals,
		captureNames
	};
};
/**
* Recursively collects capture names from a pattern.
*
* path and the runtime `arrayPatternPathsWithCaptures` fast-path check
* (DP1 — see `array_pattern/mod.rs::paths_with_captures` lines ~530-540).
*/
const collectPatternCaptureNames = (pattern, names) => {
	switch (pattern.kind) {
		case "Value": break;
		case "Structure":
			collectStructurePatternCaptureNames(pattern.pattern, names);
			break;
		case "Meta": collectMetaPatternCaptureNames(pattern.pattern, names);
	}
};
/**
* Collects capture names from structure patterns.
*/
const collectStructurePatternCaptureNames = (pattern, names) => {
	switch (pattern.type) {
		case "Array":
			if (pattern.pattern.variant === "Elements") collectPatternCaptureNames(pattern.pattern.pattern, names);
			break;
		case "Map":
			if (pattern.pattern.variant === "Constraints") for (const constraint of pattern.pattern.constraints) {
				collectPatternCaptureNames(constraint[0], names);
				collectPatternCaptureNames(constraint[1], names);
			}
			break;
		case "Tagged": if (pattern.pattern.variant !== "Any") collectPatternCaptureNames(pattern.pattern.pattern, names);
	}
};
/**
* Collects capture names from meta patterns.
*/
const collectMetaPatternCaptureNames = (pattern, names) => {
	switch (pattern.type) {
		case "Capture":
			if (!names.includes(pattern.pattern.name)) names.push(pattern.pattern.name);
			collectPatternCaptureNames(pattern.pattern.pattern, names);
			break;
		case "And":
			for (const p of pattern.pattern.patterns) collectPatternCaptureNames(p, names);
			break;
		case "Or":
			for (const p of pattern.pattern.patterns) collectPatternCaptureNames(p, names);
			break;
		case "Not":
			collectPatternCaptureNames(pattern.pattern.pattern, names);
			break;
		case "Repeat":
			collectPatternCaptureNames(pattern.pattern.pattern, names);
			break;
		case "Search":
			collectPatternCaptureNames(pattern.pattern.pattern, names);
			break;
		case "Sequence": for (const p of pattern.pattern.patterns) collectPatternCaptureNames(p, names);
	}
};
/**
* Compiles a pattern to VM bytecode.
*/
const compilePatternToCode = (pattern, code, literals, captureNames) => {
	switch (pattern.kind) {
		case "Value":
			literals.push(pattern);
			code.push({
				type: "MatchPredicate",
				literalIndex: literals.length - 1
			});
			break;
		case "Structure":
			if (pattern.pattern.type === "Array" && pattern.pattern.pattern.variant === "Elements") {
				const innerElement = pattern.pattern.pattern.pattern;
				const innerCaptures = [];
				collectPatternCaptureNames(innerElement, innerCaptures);
				const isSequenceInner = innerElement.kind === "Meta" && innerElement.pattern.type === "Sequence";
				if (innerCaptures.length > 0 && !isSequenceInner) {
					const arrayCheckIdx = literals.length;
					literals.push({
						kind: "Structure",
						pattern: {
							type: "Array",
							pattern: { variant: "Any" }
						}
					});
					code.push({
						type: "MatchStructure",
						literalIndex: arrayCheckIdx
					});
					code.push({
						type: "PushAxis",
						axis: "ArrayElement"
					});
					compilePatternToCode(innerElement, code, literals, captureNames);
					code.push({ type: "Pop" });
					break;
				}
			}
			literals.push(pattern);
			code.push({
				type: "MatchStructure",
				literalIndex: literals.length - 1
			});
			break;
		case "Meta": compileMetaPattern(pattern.pattern, code, literals, captureNames);
	}
};
/**
* Compiles meta patterns to VM bytecode.
*/
const compileMetaPattern = (pattern, code, literals, captureNames) => {
	switch (pattern.type) {
		case "Any":
			code.push({ type: "Save" });
			break;
		case "And":
			for (const p of pattern.pattern.patterns) compilePatternToCode(p, code, literals, captureNames);
			break;
		case "Or": {
			const patterns = pattern.pattern.patterns;
			if (patterns.length === 0) break;
			if (patterns.length === 1) {
				compilePatternToCode(patterns[0], code, literals, captureNames);
				break;
			}
			const jumpAddrs = [];
			for (let i = 0; i < patterns.length - 1; i++) {
				const splitAddr = code.length;
				code.push({
					type: "Split",
					a: 0,
					b: 0
				});
				code[splitAddr].a = code.length;
				compilePatternToCode(patterns[i], code, literals, captureNames);
				jumpAddrs.push(code.length);
				code.push({
					type: "Jump",
					address: 0
				});
				code[splitAddr].b = code.length;
			}
			compilePatternToCode(patterns[patterns.length - 1], code, literals, captureNames);
			const endAddr = code.length;
			for (const addr of jumpAddrs) code[addr].address = endAddr;
			break;
		}
		case "Not":
			literals.push(pattern.pattern.pattern);
			code.push({
				type: "NotMatch",
				patternIndex: literals.length - 1
			});
			break;
		case "Repeat":
			literals.push(pattern.pattern.pattern);
			code.push({
				type: "Repeat",
				patternIndex: literals.length - 1,
				quantifier: pattern.pattern.quantifier
			});
			break;
		case "Capture": {
			const captureIndex = captureNames.indexOf(pattern.pattern.name);
			code.push({
				type: "CaptureStart",
				captureIndex
			});
			compilePatternToCode(pattern.pattern.pattern, code, literals, captureNames);
			code.push({
				type: "CaptureEnd",
				captureIndex
			});
			break;
		}
		case "Search": {
			const captureMap = [];
			const innerNames = [];
			collectPatternCaptureNames(pattern.pattern.pattern, innerNames);
			for (const name of innerNames) {
				const idx = captureNames.indexOf(name);
				if (idx >= 0) captureMap.push([name, idx]);
			}
			literals.push(pattern.pattern.pattern);
			code.push({
				type: "Search",
				patternIndex: literals.length - 1,
				captureMap
			});
			break;
		}
		case "Sequence": {
			const patterns = pattern.pattern.patterns;
			if (patterns.length === 0) break;
			compilePatternToCode(patterns[0], code, literals, captureNames);
			for (let i = 1; i < patterns.length; i++) {
				code.push({ type: "ExtendSequence" });
				compilePatternToCode(patterns[i], code, literals, captureNames);
				code.push({ type: "CombineSequence" });
			}
			break;
		}
	}
};
//#endregion
//#region src/pattern/structure/array-pattern/helpers.ts
/**
* Check if a pattern is a repeat pattern.
*/
const isRepeatPattern = (pattern) => {
	return pattern.kind === "Meta" && pattern.pattern.type === "Repeat";
};
/**
* Check if a pattern is a capture pattern containing a repeat pattern.
* Returns the inner repeat pattern if found.
*/
const extractCaptureWithRepeat = (pattern) => {
	if (pattern.kind === "Meta" && pattern.pattern.type === "Capture") {
		const innerPattern = pattern.pattern.pattern.pattern;
		if (innerPattern.kind === "Meta" && innerPattern.pattern.type === "Repeat") return innerPattern.pattern.pattern;
	}
};
/**
* Extract any repeat pattern from a pattern, whether direct or within a capture.
*/
const extractRepeatPattern = (pattern) => {
	if (pattern.kind === "Meta") {
		if (pattern.pattern.type === "Repeat") return pattern.pattern.pattern;
		if (pattern.pattern.type === "Capture") {
			const innerPattern = pattern.pattern.pattern.pattern;
			if (innerPattern.kind === "Meta" && innerPattern.pattern.type === "Repeat") return innerPattern.pattern.pattern;
		}
	}
};
/**
* Check if a slice of patterns contains any repeat patterns (direct or in captures).
*/
const hasRepeatPatternsInSlice = (patterns) => {
	return patterns.some((p) => extractRepeatPattern(p) !== void 0);
};
/**
* Calculate the bounds for repeat pattern matching based on quantifier and
* available elements.
*/
const calculateRepeatBounds = (quantifier, elementIdx, arrLen) => {
	const minCount = quantifier.min();
	const remainingElements = Math.max(0, arrLen - elementIdx);
	return [minCount, Math.min(quantifier.max() ?? remainingElements, remainingElements)];
};
/**
* Check if a repeat pattern can match a specific number of elements starting
* at elementIdx.
*/
const canRepeatMatch = (repeatPattern, arr, elementIdx, repCount, matchFn) => {
	if (repCount === 0) return true;
	for (let i = 0; i < repCount; i++) {
		const element = arr[elementIdx + i];
		if (!matchFn(repeatPattern.pattern, element)) return false;
	}
	return true;
};
/**
* Build a simple array context path: [arrayCbor, element]
*/
const buildSimpleArrayContextPath = (arrayCbor, element) => {
	return [arrayCbor, element];
};
/**
* Format a pattern for display within array context, swapping
* `>`-separator sequences to `,`-separator inside arrays — recursively.
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
const formatArrayElementPattern = (pattern) => {
	if (pattern.kind === "Meta" && pattern.pattern.type === "Sequence") return pattern.pattern.pattern.patterns.map((p) => formatArrayElementPattern(p)).join(", ");
	return getPatternDisplay(pattern);
};
//#endregion
//#region src/pattern/structure/array-pattern/backtrack.ts
/**
* Boolean backtracking state - just tracks success/failure.
*/
var BooleanBacktrackState = class {
	tryAdvance(_patternIdx, _elementIdx) {
		return true;
	}
	backtrack() {}
	isSuccess(patternIdx, elementIdx, patternsLen, elementsLen) {
		return patternIdx >= patternsLen && elementIdx >= elementsLen;
	}
	getResult() {
		return true;
	}
};
/**
* Assignment tracking backtracking state - collects pattern-element pairs.
*/
var AssignmentBacktrackState = class {
	assignments = [];
	tryAdvance(patternIdx, elementIdx) {
		this.assignments.push([patternIdx, elementIdx]);
		return true;
	}
	backtrack() {
		this.assignments.pop();
	}
	isSuccess(patternIdx, elementIdx, patternsLen, elementsLen) {
		return patternIdx >= patternsLen && elementIdx >= elementsLen;
	}
	getResult() {
		return this.assignments;
	}
	len() {
		return this.assignments.length;
	}
	truncate(len) {
		this.assignments.length = len;
	}
};
/**
* Generic backtracking algorithm that works with any BacktrackState.
*/
var GenericBacktracker = class {
	_patterns;
	_arr;
	_matchFn;
	constructor(patterns, arr, matchFn) {
		this._patterns = patterns;
		this._arr = arr;
		this._matchFn = matchFn;
	}
	/**
	* Generic backtracking algorithm that works with any state type.
	*/
	backtrack(state, patternIdx, elementIdx) {
		if (state.isSuccess(patternIdx, elementIdx, this._patterns.length, this._arr.length)) return true;
		if (patternIdx >= this._patterns.length) return false;
		const currentPattern = this._patterns[patternIdx];
		if (currentPattern.kind === "Meta" && currentPattern.pattern.type === "Repeat") {
			const repeatPattern = currentPattern.pattern.pattern;
			return this.tryRepeatBacktrack(repeatPattern, state, patternIdx, elementIdx);
		}
		if (currentPattern.kind === "Meta" && currentPattern.pattern.type === "Capture") {
			const repeatPattern = extractCaptureWithRepeat(currentPattern);
			if (repeatPattern !== void 0) return this.tryRepeatBacktrack(repeatPattern, state, patternIdx, elementIdx);
			if (elementIdx < this._arr.length) {
				const element = this._arr[elementIdx];
				if (this._matchFn(currentPattern, element) && state.tryAdvance(patternIdx, elementIdx)) {
					if (this.backtrack(state, patternIdx + 1, elementIdx + 1)) return true;
					state.backtrack();
				}
			}
			return false;
		}
		if (elementIdx < this._arr.length) {
			const element = this._arr[elementIdx];
			if (this._matchFn(currentPattern, element) && state.tryAdvance(patternIdx, elementIdx)) {
				if (this.backtrack(state, patternIdx + 1, elementIdx + 1)) return true;
				state.backtrack();
			}
		}
		return false;
	}
	/**
	* Helper for repeat pattern backtracking with generic state.
	*/
	tryRepeatBacktrack(repeatPattern, state, patternIdx, elementIdx) {
		const quantifier = repeatPattern.quantifier;
		const [minCount, maxCount] = calculateRepeatBounds(quantifier, elementIdx, this._arr.length);
		for (let repCount = maxCount; repCount >= minCount; repCount--) if (elementIdx + repCount <= this._arr.length && canRepeatMatch(repeatPattern, this._arr, elementIdx, repCount, this._matchFn)) {
			let advancedCount = 0;
			let canAdvance = true;
			for (let i = 0; i < repCount; i++) {
				if (!state.tryAdvance(patternIdx, elementIdx + i)) {
					for (let j = 0; j < advancedCount; j++) state.backtrack();
					canAdvance = false;
					break;
				}
				advancedCount++;
			}
			if (!canAdvance) continue;
			if (this.backtrack(state, patternIdx + 1, elementIdx + repCount)) return true;
			for (let i = 0; i < repCount; i++) state.backtrack();
		}
		return false;
	}
};
//#endregion
//#region src/pattern/structure/array-pattern/assigner.ts
/**
* Helper class for handling element-to-pattern assignment logic.
* Encapsulates the complex logic for mapping array elements to sequence
* patterns that was previously duplicated between matching and capture
* collection.
*/
var SequenceAssigner = class {
	_patterns;
	_arr;
	_matchFn;
	constructor(patterns, arr, matchFn) {
		this._patterns = patterns;
		this._arr = arr;
		this._matchFn = matchFn;
	}
	/**
	* Check if the sequence can match against the array elements (boolean result).
	*/
	canMatch() {
		if (this._patterns.length === 0) return this._arr.length === 0;
		const hasRepeatPatterns = hasRepeatPatternsInSlice(this._patterns);
		if (this._patterns.length === this._arr.length && !hasRepeatPatterns) return this._patterns.every((pattern, i) => this._matchFn(pattern, this._arr[i]));
		const backtracker = new GenericBacktracker(this._patterns, this._arr, this._matchFn);
		const state = new BooleanBacktrackState();
		return backtracker.backtrack(state, 0, 0);
	}
	/**
	* Find the element-to-pattern assignments (returns assignment pairs).
	*/
	findAssignments() {
		if (this._patterns.length === 0) return this._arr.length === 0 ? [] : void 0;
		const hasRepeatPatterns = hasRepeatPatternsInSlice(this._patterns);
		if (this._patterns.length === this._arr.length && !hasRepeatPatterns) {
			const assignments = [];
			for (let patternIdx = 0; patternIdx < this._patterns.length; patternIdx++) {
				const pattern = this._patterns[patternIdx];
				const element = this._arr[patternIdx];
				if (this._matchFn(pattern, element)) assignments.push([patternIdx, patternIdx]);
				else return;
			}
			return assignments;
		}
		const backtracker = new GenericBacktracker(this._patterns, this._arr, this._matchFn);
		const state = new AssignmentBacktrackState();
		if (backtracker.backtrack(state, 0, 0)) return state.assignments;
	}
};
//#endregion
//#region src/pattern/structure/array-pattern/index.ts
/**
* Creates an ArrayPattern that matches any array.
*/
const arrayPatternAny = () => ({ variant: "Any" });
/**
* Creates an ArrayPattern that matches arrays with elements matching the pattern.
*/
const arrayPatternWithElements = (pattern) => ({
	variant: "Elements",
	pattern
});
/**
* Creates an ArrayPattern that matches arrays with length in an interval.
*/
const arrayPatternWithLengthInterval = (interval) => ({
	variant: "Length",
	length: interval
});
/**
* Gets array elements as Cbor array.
*/
const getArrayElements = (haystack) => {
	if (!isArray(haystack)) return;
	const len = arrayLength(haystack);
	if (len === void 0) return;
	const elements = [];
	for (let i = 0; i < len; i++) {
		const item = arrayItem(haystack, i);
		if (item === void 0) return;
		elements.push(item);
	}
	return elements;
};
/**
* Match a single repeat pattern against array elements.
*/
const matchRepeatPatternAgainstArray = (repeatPattern, arr) => {
	const quantifier = repeatPattern.quantifier;
	const minCount = quantifier.min();
	const maxCount = quantifier.max() ?? arr.length;
	if (arr.length < minCount || arr.length > maxCount) return false;
	return arr.every((element) => matchPattern(repeatPattern.pattern, element));
};
/**
* Match a sequence of patterns against array elements using backtracking.
*/
const matchSequencePatternsAgainstArray = (seqPattern, arr) => {
	const patterns = seqPattern.patterns;
	return new SequenceAssigner(patterns, arr, matchPattern).canMatch();
};
/**
* Check if a sequence pattern can match against array elements.
*/
const canMatchSequenceAgainstArray = (pattern, arr) => {
	if (pattern.kind === "Meta") {
		if (pattern.pattern.type === "Sequence") return matchSequencePatternsAgainstArray(pattern.pattern.pattern, arr);
		if (pattern.pattern.type === "Repeat") return matchRepeatPatternAgainstArray(pattern.pattern.pattern, arr);
	}
	const arrayCbor = cbor(arr);
	return matchPattern(pattern, arrayCbor);
};
/**
* Match a complex sequence against array elements.
*/
const matchComplexSequence = (haystack, pattern) => {
	const arr = getArrayElements(haystack);
	if (arr === void 0) return [];
	if (canMatchSequenceAgainstArray(pattern, arr)) return [[haystack]];
	return [];
};
/**
* Find which array elements are assigned to which sequence patterns.
*/
const findSequenceElementAssignments = (seqPattern, arr) => {
	const patterns = seqPattern.patterns;
	return new SequenceAssigner(patterns, arr, matchPattern).findAssignments();
};
/**
* Handle sequence patterns with captures by manually matching elements
* and collecting captures with proper array context.
*/
const handleSequenceCaptures = (seqPattern, arrayCbor, arr) => {
	const assignments = findSequenceElementAssignments(seqPattern, arr);
	if (assignments === void 0) return [[], /* @__PURE__ */ new Map()];
	const allCaptures = /* @__PURE__ */ new Map();
	for (let patternIdx = 0; patternIdx < seqPattern.patterns.length; patternIdx++) {
		const pattern = seqPattern.patterns[patternIdx];
		if (pattern.kind === "Meta" && pattern.pattern.type === "Capture") {
			const capturePattern = pattern.pattern.pattern;
			if (extractCaptureWithRepeat(pattern) !== void 0) {
				const capturedElements = assignments.filter(([pIdx, _]) => pIdx === patternIdx).map(([_, eIdx]) => arr[eIdx]);
				const subArray = cbor(capturedElements);
				const captureName = capturePattern.name;
				const arrayContextPath = buildSimpleArrayContextPath(arrayCbor, subArray);
				const existing = allCaptures.get(captureName) ?? [];
				existing.push(arrayContextPath);
				allCaptures.set(captureName, existing);
				continue;
			}
		}
		if (isRepeatPattern(pattern) && pattern.kind === "Meta" && pattern.pattern.type === "Repeat") {
			const innerPattern = pattern.pattern.pattern.pattern;
			if (innerPattern.kind === "Meta" && innerPattern.pattern.type === "Capture") {
				const capturedElements = assignments.filter(([pIdx, _]) => pIdx === patternIdx).map(([_, eIdx]) => arr[eIdx]);
				const subArray = cbor(capturedElements);
				const captureName = innerPattern.pattern.pattern.name;
				const arrayContextPath = buildSimpleArrayContextPath(arrayCbor, subArray);
				const existing = allCaptures.get(captureName) ?? [];
				existing.push(arrayContextPath);
				allCaptures.set(captureName, existing);
				continue;
			}
		}
		const elementIndices = assignments.filter(([pIdx, _]) => pIdx === patternIdx).map(([_, eIdx]) => eIdx);
		for (const elementIdx of elementIndices) {
			const element = arr[elementIdx];
			if (pattern.kind === "Meta" && pattern.pattern.type === "Capture") {
				const captureName = pattern.pattern.pattern.name;
				const arrayContextPath = buildSimpleArrayContextPath(arrayCbor, element);
				const existing = allCaptures.get(captureName) ?? [];
				existing.push(arrayContextPath);
				allCaptures.set(captureName, existing);
			}
		}
	}
	return [[[arrayCbor]], allCaptures];
};
/**
* Returns paths to matching array values.
*/
const arrayPatternPaths = (pattern, haystack) => {
	if (!isArray(haystack)) return [];
	const arr = getArrayElements(haystack);
	if (arr === void 0) return [];
	switch (pattern.variant) {
		case "Any": return [[haystack]];
		case "Elements": {
			const elemPattern = pattern.pattern;
			if (elemPattern.kind === "Meta") {
				if (elemPattern.pattern.type === "Sequence") {
					const seqPattern = elemPattern.pattern.pattern;
					if (hasRepeatPatternsInSlice(seqPattern.patterns)) return matchComplexSequence(haystack, elemPattern);
					if (seqPattern.patterns.length === arr.length) {
						for (let i = 0; i < seqPattern.patterns.length; i++) if (!matchPattern(seqPattern.patterns[i], arr[i])) return [];
						return [[haystack]];
					}
					return [];
				}
				if (elemPattern.pattern.type === "Repeat") return matchComplexSequence(haystack, elemPattern);
				if (elemPattern.pattern.type === "Capture") return arr.some((element) => matchPattern(elemPattern, element)) ? [[haystack]] : [];
			}
			if (elemPattern.kind === "Value" || elemPattern.kind === "Structure" || elemPattern.kind === "Meta" && elemPattern.pattern.type === "Any") {
				if (arr.length !== 1) return [];
				return matchPattern(elemPattern, arr[0]) ? [[haystack]] : [];
			}
			return arr.some((element) => matchPattern(elemPattern, element)) ? [[haystack]] : [];
		}
		case "Length": return pattern.length.contains(arr.length) ? [[haystack]] : [];
	}
};
/**
* Returns paths with captures for array patterns.
*/
const arrayPatternPathsWithCaptures = (pattern, haystack) => {
	if (!isArray(haystack)) return [[], /* @__PURE__ */ new Map()];
	const arr = getArrayElements(haystack);
	if (arr === void 0) return [[], /* @__PURE__ */ new Map()];
	switch (pattern.variant) {
		case "Any":
		case "Length": return [arrayPatternPaths(pattern, haystack), /* @__PURE__ */ new Map()];
		case "Elements": {
			const elemPattern = pattern.pattern;
			const innerCaptureNames = [];
			collectPatternCaptureNames(elemPattern, innerCaptureNames);
			if (innerCaptureNames.length === 0) return [arrayPatternPaths(pattern, haystack), /* @__PURE__ */ new Map()];
			if (arrayPatternPaths(pattern, haystack).length === 0) return [[], /* @__PURE__ */ new Map()];
			if (elemPattern.kind === "Meta" && elemPattern.pattern.type === "Sequence") {
				const seqPattern = elemPattern.pattern.pattern;
				return handleSequenceCaptures(seqPattern, haystack, arr);
			}
			const result = getPatternPathsWithCaptures({
				kind: "Structure",
				pattern: {
					type: "Array",
					pattern
				}
			}, haystack);
			return [result.paths, result.captures];
		}
	}
};
/**
* Formats an ArrayPattern as a string.
*/
const arrayPatternDisplay = (pattern, _patternDisplay) => {
	switch (pattern.variant) {
		case "Any": return "array";
		case "Elements": return `[${formatArrayElementPattern(pattern.pattern)}]`;
		case "Length": return `[${pattern.length.toString()}]`;
	}
};
//#endregion
//#region src/pattern/structure/map-pattern.ts
/**
* Creates a MapPattern that matches any map.
*/
const mapPatternAny = () => ({ variant: "Any" });
/**
* Creates a MapPattern that matches maps with key-value constraints.
*/
const mapPatternWithConstraints = (constraints) => ({
	variant: "Constraints",
	constraints
});
/**
* Creates a MapPattern that matches maps with length in an interval.
*/
const mapPatternWithLengthInterval = (interval) => ({
	variant: "Length",
	length: interval
});
/**
* Tests if a CBOR value matches this map pattern.
*/
const mapPatternMatches = (pattern, haystack) => {
	if (!isMap(haystack)) return false;
	switch (pattern.variant) {
		case "Any": return true;
		case "Constraints": {
			const keys = mapKeys(haystack);
			if (keys === void 0) return false;
			for (const [keyPattern, valuePattern] of pattern.constraints) {
				let foundMatch = false;
				for (const key of keys) if (matchPattern(keyPattern, key)) {
					const rawValue = mapValue(haystack, key);
					if (rawValue !== void 0 && rawValue !== null) {
						if (matchPattern(valuePattern, rawValue)) {
							foundMatch = true;
							break;
						}
					}
				}
				if (!foundMatch) return false;
			}
			return true;
		}
		case "Length": {
			const size = mapSize(haystack);
			return size !== void 0 && pattern.length.contains(size);
		}
	}
};
/**
* Returns paths to matching map values.
*/
const mapPatternPaths = (pattern, haystack) => {
	if (mapPatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Collects captures from a pattern by delegating to its
* `paths_with_captures` implementation.
*
* the per-pattern dispatcher recurses through `Or`, `And`, `Not`,
* `Repeat`, `Sequence`, `Capture`, etc. so captures nested arbitrarily
* deep inside a constraint's key or value pattern are all collected.
*
* Earlier this port only inspected the top-level pattern type for
* `Capture`, which silently lost captures inside any meta wrapper —
* e.g. `{key: text | @cap(text)}` would not capture.
*
* Each captured path produced by the inner dispatcher is rebased
* onto the map context (`[mapCbor, matchedValue, ...]`) so that
* downstream consumers see a path rooted at the map.
*/
const collectCapturesFromPattern = (pattern, matchedValue, mapContext, captures) => {
	const result = getPatternPathsWithCapturesDirect(pattern, matchedValue);
	if (result.captures.size === 0) return;
	for (const [name, capturedPaths] of result.captures) {
		const existing = captures.get(name) ?? [];
		for (const innerPath of capturedPaths) {
			const rebased = [mapContext, matchedValue];
			if (innerPath.length > 1) rebased.push(...innerPath.slice(1));
			existing.push(rebased);
		}
		captures.set(name, existing);
	}
};
/**
* Returns paths with captures for map patterns.
*/
const mapPatternPathsWithCaptures = (pattern, haystack) => {
	if (!isMap(haystack)) return [[], /* @__PURE__ */ new Map()];
	switch (pattern.variant) {
		case "Any":
		case "Length": return [mapPatternPaths(pattern, haystack), /* @__PURE__ */ new Map()];
		case "Constraints": {
			const keys = mapKeys(haystack);
			if (keys === void 0) return [[], /* @__PURE__ */ new Map()];
			const captures = /* @__PURE__ */ new Map();
			for (const [keyPattern, valuePattern] of pattern.constraints) for (const key of keys) if (matchPattern(keyPattern, key)) {
				const rawValue = mapValue(haystack, key);
				if (rawValue !== void 0 && rawValue !== null) {
					const value = rawValue;
					if (matchPattern(valuePattern, value)) {
						collectCapturesFromPattern(keyPattern, key, haystack, captures);
						collectCapturesFromPattern(valuePattern, value, haystack, captures);
						break;
					}
				}
			}
			if (mapPatternMatches(pattern, haystack)) return [[[haystack]], captures];
			return [[], /* @__PURE__ */ new Map()];
		}
	}
};
/**
* Formats a MapPattern as a string.
*/
const mapPatternDisplay = (pattern, patternDisplay) => {
	switch (pattern.variant) {
		case "Any": return "map";
		case "Constraints": return `{${pattern.constraints.map(([k, v]) => `${patternDisplay(k)}: ${patternDisplay(v)}`).join(", ")}}`;
		case "Length": return `{${pattern.length.toString()}}`;
	}
};
//#endregion
//#region src/pattern/structure/tagged-pattern.ts
/**
* Creates a TaggedPattern that matches any tagged value.
*/
const taggedPatternAny = () => ({ variant: "Any" });
/**
* Creates a TaggedPattern that matches tagged values with specific tag and content.
*/
const taggedPatternWithTag = (tag, pattern) => ({
	variant: "Tag",
	tag,
	pattern
});
/**
* Creates a TaggedPattern that matches tagged values with a tag having the given name.
*/
const taggedPatternWithName = (name, pattern) => ({
	variant: "Name",
	name,
	pattern
});
/**
* Creates a TaggedPattern that matches tagged values with a tag name matching the regex.
*/
const taggedPatternWithRegex = (regex, pattern) => ({
	variant: "Regex",
	regex,
	pattern
});
/**
* Compare two tag values for equality.
*
* Tag values are CBOR `u64` (`number | bigint` in TS). To match Rust
* `Tag::value() == other.value()` byte-for-byte across the full
* `0..=2^64-1` range, we promote both operands to `BigInt` before
* comparing — `Number(...)` would silently lose precision for tag
* values above `2^53-1`.
*/
const tagsEqual = (a, b) => {
	if (a === void 0) return false;
	return BigInt(a) === BigInt(b);
};
/**
* Resolve a CBOR tag value to its registered name via the global
* `TagsStore`, mirroring Rust's `Tag::name()` lookup
*
* Returns `undefined` if the tag is not registered. Earlier this port
* stringified the numeric tag (`String(tag)`), which made `Name` and
* `Regex` variants effectively never match registered tags.
*/
const lookupTagName = (tag) => {
	const found = getGlobalTagsStore().tagForValue(tag);
	if (found === void 0) return void 0;
	return found.name;
};
/**
* Tests if a CBOR value matches this tagged pattern.
*/
const taggedPatternMatches = (pattern, haystack) => {
	if (!isTagged(haystack)) return false;
	const tag = tagValue(haystack);
	const content = asTaggedValue(haystack)?.[1];
	if (content === void 0 || tag === void 0) return false;
	switch (pattern.variant) {
		case "Any": return true;
		case "Tag": return tagsEqual(tag, pattern.tag.value) && matchPattern(pattern.pattern, content);
		case "Name": {
			const tagName = lookupTagName(tag);
			if (tagName === void 0) return false;
			return tagName === pattern.name && matchPattern(pattern.pattern, content);
		}
		case "Regex": {
			const tagName = lookupTagName(tag);
			if (tagName === void 0) return false;
			return pattern.regex.test(tagName) && matchPattern(pattern.pattern, content);
		}
	}
};
/**
* Returns paths to matching tagged values.
*/
const taggedPatternPaths = (pattern, haystack) => {
	if (taggedPatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Returns paths with captures for a tagged pattern.
* Collects captures from inner patterns for Tag variant.
*/
const taggedPatternPathsWithCaptures = (pattern, haystack) => {
	if (!isTagged(haystack)) return [[], /* @__PURE__ */ new Map()];
	const tag = tagValue(haystack);
	const content = asTaggedValue(haystack)?.[1];
	if (content === void 0) return [[], /* @__PURE__ */ new Map()];
	switch (pattern.variant) {
		case "Any": return [[[haystack]], /* @__PURE__ */ new Map()];
		case "Tag": {
			if (!tagsEqual(tag, pattern.tag.value)) return [[], /* @__PURE__ */ new Map()];
			const innerResult = getPatternPathsWithCapturesDirect(pattern.pattern, content);
			if (innerResult.paths.length === 0) return [[], innerResult.captures];
			const taggedPaths = innerResult.paths.map((contentPath) => {
				const path = [haystack];
				if (contentPath.length > 1) path.push(...contentPath.slice(1));
				return path;
			});
			const updatedCaptures = /* @__PURE__ */ new Map();
			for (const [name, capturePaths] of innerResult.captures) {
				const updated = capturePaths.map((_capturePath) => {
					return [haystack, content];
				});
				updatedCaptures.set(name, updated);
			}
			return [taggedPaths, updatedCaptures];
		}
		case "Name":
		case "Regex": return [taggedPatternPaths(pattern, haystack), /* @__PURE__ */ new Map()];
	}
};
/**
* Formats a TaggedPattern as a string.
*/
const taggedPatternDisplay = (pattern, patternDisplay) => {
	switch (pattern.variant) {
		case "Any": return "tagged";
		case "Tag": return `tagged(${pattern.tag.value}, ${patternDisplay(pattern.pattern)})`;
		case "Name": return `tagged(${pattern.name}, ${patternDisplay(pattern.pattern)})`;
		case "Regex": return `tagged(/${pattern.regex.source}/,  ${patternDisplay(pattern.pattern)})`;
	}
};
//#endregion
//#region src/pattern/structure/index.ts
/**
* Returns paths to matching structures for a StructurePattern.
*/
const structurePatternPaths = (pattern, haystack) => {
	switch (pattern.type) {
		case "Array": return arrayPatternPaths(pattern.pattern, haystack);
		case "Map": return mapPatternPaths(pattern.pattern, haystack);
		case "Tagged": return taggedPatternPaths(pattern.pattern, haystack);
	}
};
/**
* Returns paths with captures for a StructurePattern.
* Used internally by the VM to avoid infinite recursion.
*/
const structurePatternPathsWithCaptures = (pattern, haystack) => {
	switch (pattern.type) {
		case "Array": return arrayPatternPathsWithCaptures(pattern.pattern, haystack);
		case "Map": return mapPatternPathsWithCaptures(pattern.pattern, haystack);
		case "Tagged": return taggedPatternPathsWithCaptures(pattern.pattern, haystack);
	}
};
/**
* Formats a StructurePattern as a string.
*/
const structurePatternDisplay = (pattern, patternDisplay) => {
	switch (pattern.type) {
		case "Array": return arrayPatternDisplay(pattern.pattern, patternDisplay);
		case "Map": return mapPatternDisplay(pattern.pattern, patternDisplay);
		case "Tagged": return taggedPatternDisplay(pattern.pattern, patternDisplay);
	}
};
//#endregion
//#region src/pattern/meta/any-pattern.ts
/**
* Creates an AnyPattern.
*/
const anyPattern = () => ({ variant: "Any" });
/**
* Returns paths to matching values.
*/
const anyPatternPaths = (_pattern, haystack) => {
	return [[haystack]];
};
/**
* Formats an AnyPattern as a string.
*/
const anyPatternDisplay = (_pattern) => {
	return "*";
};
//#endregion
//#region src/pattern/meta/and-pattern.ts
/**
* Creates an AndPattern with the given patterns.
*/
const andPattern = (patterns) => ({
	variant: "And",
	patterns
});
/**
* Tests if a CBOR value matches this and pattern.
* All patterns must match.
*/
const andPatternMatches = (pattern, haystack) => {
	return pattern.patterns.every((p) => matchPattern(p, haystack));
};
/**
* Returns paths to matching values.
*/
const andPatternPaths = (pattern, haystack) => {
	if (andPatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Formats an AndPattern as a string.
*/
const andPatternDisplay = (pattern, patternDisplay) => {
	return pattern.patterns.map(patternDisplay).join(" & ");
};
//#endregion
//#region src/pattern/meta/or-pattern.ts
/**
* Creates an OrPattern with the given patterns.
*/
const orPattern = (patterns) => ({
	variant: "Or",
	patterns
});
/**
* Tests if a CBOR value matches this or pattern.
* At least one pattern must match.
*/
const orPatternMatches = (pattern, haystack) => {
	return pattern.patterns.some((p) => matchPattern(p, haystack));
};
/**
* Returns paths to matching values.
*/
const orPatternPaths = (pattern, haystack) => {
	if (orPatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Formats an OrPattern as a string.
*/
const orPatternDisplay = (pattern, patternDisplay) => {
	return pattern.patterns.map(patternDisplay).join(" | ");
};
//#endregion
//#region src/pattern/meta/not-pattern.ts
/**
* Creates a NotPattern with the given inner pattern.
*/
const notPattern = (pattern) => ({
	variant: "Not",
	pattern
});
/**
* Tests if a CBOR value matches this not pattern.
* Returns true if the inner pattern does NOT match.
*/
const notPatternMatches = (pattern, haystack) => {
	return !matchPattern(pattern.pattern, haystack);
};
/**
* Returns paths to matching values.
*/
const notPatternPaths = (pattern, haystack) => {
	if (notPatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Check if a pattern is complex for display purposes.
* Complex patterns need parentheses when inside a NOT pattern.
*
* capture,repeat}_pattern.rs`):
*
* - **AndPattern / OrPattern / SequencePattern**: complex iff
*   `patterns.len() > 1` *or* any inner pattern is itself complex.
* - **NotPattern**: always complex.
* - **CapturePattern**: delegates to its inner pattern's `is_complex`.
* - **AnyPattern / RepeatPattern / value patterns / structure
*   patterns**: always non-complex.
*
* Earlier this port hardcoded `["And", "Or", "Not", "Sequence"]` as
* complex, which classified `and(x)` (single-element And) as complex
* even though Rust says it's not — observable in `!and(x)` formatting.
*/
const isComplex = (pattern) => {
	if (pattern.kind !== "Meta") return false;
	const meta = pattern.pattern;
	switch (meta.type) {
		case "Not": return true;
		case "And":
		case "Or":
		case "Sequence": {
			const inner = meta.pattern.patterns;
			return inner.length > 1 || inner.some((p) => isComplex(p));
		}
		case "Capture": return isComplex(meta.pattern.pattern);
		case "Any":
		case "Repeat":
		case "Search": return false;
	}
};
/**
* Formats a NotPattern as a string.
*/
const notPatternDisplay = (pattern, patternDisplay) => {
	if (isComplex(pattern.pattern)) return `!(${patternDisplay(pattern.pattern)})`;
	return `!${patternDisplay(pattern.pattern)}`;
};
//#endregion
//#region src/pattern/meta/repeat-pattern.ts
/**
* Creates a RepeatPattern with the given pattern and quantifier.
*/
const repeatPattern = (pattern, quantifier) => ({
	variant: "Repeat",
	pattern,
	quantifier
});
/**
* Tests if a CBOR value matches this repeat pattern.
* Note: This is a simplified implementation. Complex matching
* will be implemented with the VM.
*/
const repeatPatternMatches = (pattern, haystack) => {
	const innerMatches = matchPattern(pattern.pattern, haystack);
	const min = pattern.quantifier.min();
	const max = pattern.quantifier.max();
	if (innerMatches) return min <= 1 && (max === void 0 || max >= 1);
	return min === 0;
};
/**
* Returns paths to matching values.
*/
const repeatPatternPaths = (pattern, haystack) => {
	if (repeatPatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Formats a RepeatPattern as a string.
* Always wraps the inner pattern in parentheses to match Rust behavior.
*/
const repeatPatternDisplay = (pattern, patternDisplay) => {
	return `(${patternDisplay(pattern.pattern)})${pattern.quantifier.toString()}`;
};
//#endregion
//#region src/pattern/meta/capture-pattern.ts
/**
* Creates a CapturePattern with the given name and inner pattern.
*/
const capturePattern = (name, pattern) => ({
	variant: "Capture",
	name,
	pattern
});
/**
* Tests if a CBOR value matches this capture pattern.
* Capture itself doesn't affect matching - it delegates to inner pattern.
*/
const capturePatternMatches = (pattern, haystack) => {
	return matchPattern(pattern.pattern, haystack);
};
/**
* Returns paths to matching values.
*/
const capturePatternPaths = (pattern, haystack) => {
	if (capturePatternMatches(pattern, haystack)) return [[haystack]];
	return [];
};
/**
* Formats a CapturePattern as a string.
*/
const capturePatternDisplay = (pattern, patternDisplay) => {
	return `@${pattern.name}(${patternDisplay(pattern.pattern)})`;
};
//#endregion
//#region src/pattern/meta/search-pattern.ts
/**
* Creates a SearchPattern with the given inner pattern.
*/
const searchPattern = (pattern) => ({
	variant: "Search",
	pattern
});
/**
* Recursively searches the CBOR tree and collects all matching paths.
*/
const searchRecursive = (pattern, haystack, currentPath, results) => {
	if (matchPattern(pattern, haystack)) results.push([...currentPath, haystack]);
	if (isArray(haystack)) {
		const len = arrayLength(haystack);
		if (len !== void 0) for (let i = 0; i < len; i++) {
			const item = arrayItem(haystack, i);
			if (item !== void 0) searchRecursive(pattern, item, [...currentPath, haystack], results);
		}
	} else if (isMap(haystack)) {
		const keys = mapKeys(haystack);
		if (keys !== void 0) for (const key of keys) {
			searchRecursive(pattern, key, [...currentPath, haystack], results);
			const rawValue = mapValue(haystack, key);
			if (rawValue !== void 0 && rawValue !== null) searchRecursive(pattern, rawValue, [...currentPath, haystack], results);
		}
	} else if (isTagged(haystack)) {
		const content = asTaggedValue(haystack)?.[1];
		if (content !== void 0) searchRecursive(pattern, content, [...currentPath, haystack], results);
	}
};
/**
* Returns paths to all matching values in the tree.
*/
const searchPatternPaths = (pattern, haystack) => {
	const results = [];
	searchRecursive(pattern.pattern, haystack, [], results);
	return results;
};
/**
* Recursively searches the CBOR tree, collecting paths and captures.
*/
const searchRecursiveWithCaptures = (pattern, haystack, currentPath, results, captures, collectCapture) => {
	if (matchPattern(pattern, haystack)) {
		const matchPath = [...currentPath, haystack];
		results.push(matchPath);
		collectCapture(pattern, haystack, matchPath);
	}
	if (isArray(haystack)) {
		const len = arrayLength(haystack);
		if (len !== void 0) for (let i = 0; i < len; i++) {
			const item = arrayItem(haystack, i);
			if (item !== void 0) searchRecursiveWithCaptures(pattern, item, [...currentPath, haystack], results, captures, collectCapture);
		}
	} else if (isMap(haystack)) {
		const keys = mapKeys(haystack);
		if (keys !== void 0) for (const key of keys) {
			searchRecursiveWithCaptures(pattern, key, [...currentPath, haystack], results, captures, collectCapture);
			const rawValue = mapValue(haystack, key);
			if (rawValue !== void 0 && rawValue !== null) searchRecursiveWithCaptures(pattern, rawValue, [...currentPath, haystack], results, captures, collectCapture);
		}
	} else if (isTagged(haystack)) {
		const content = asTaggedValue(haystack)?.[1];
		if (content !== void 0) searchRecursiveWithCaptures(pattern, content, [...currentPath, haystack], results, captures, collectCapture);
	}
};
/**
* Extract capture from a pattern at a given match location.
* Recursively searches for all capture patterns.
*/
const extractCaptures = (pattern, matchPath, captures) => {
	if (pattern.kind === "Meta") switch (pattern.pattern.type) {
		case "Capture": {
			const captureName = pattern.pattern.pattern.name;
			const existing = captures.get(captureName) ?? [];
			existing.push(matchPath);
			captures.set(captureName, existing);
			extractCaptures(pattern.pattern.pattern.pattern, matchPath, captures);
			break;
		}
		case "And":
			for (const p of pattern.pattern.pattern.patterns) extractCaptures(p, matchPath, captures);
			break;
		case "Or":
			for (const p of pattern.pattern.pattern.patterns) extractCaptures(p, matchPath, captures);
			break;
		case "Sequence":
			for (const p of pattern.pattern.pattern.patterns) extractCaptures(p, matchPath, captures);
			break;
		case "Not":
			extractCaptures(pattern.pattern.pattern.pattern, matchPath, captures);
			break;
		case "Repeat":
			extractCaptures(pattern.pattern.pattern.pattern, matchPath, captures);
			break;
		case "Search": extractCaptures(pattern.pattern.pattern.pattern, matchPath, captures);
	}
	else if (pattern.kind === "Structure") switch (pattern.pattern.type) {
		case "Array":
			if (pattern.pattern.pattern.variant === "Elements") extractCaptures(pattern.pattern.pattern.pattern, matchPath, captures);
			break;
		case "Map":
			if (pattern.pattern.pattern.variant === "Constraints") for (const [keyPattern, valuePattern] of pattern.pattern.pattern.constraints) {
				extractCaptures(keyPattern, matchPath, captures);
				extractCaptures(valuePattern, matchPath, captures);
			}
			break;
		case "Tagged": if (pattern.pattern.pattern.variant !== "Any") extractCaptures(pattern.pattern.pattern.pattern, matchPath, captures);
	}
};
/**
* Returns paths with captures for all matching values in the tree.
*/
const searchPatternPathsWithCaptures = (pattern, haystack) => {
	const results = [];
	const captures = /* @__PURE__ */ new Map();
	const collectCapture = (p, _h, path) => {
		extractCaptures(p, path, captures);
	};
	searchRecursiveWithCaptures(pattern.pattern, haystack, [], results, captures, collectCapture);
	return {
		paths: results,
		captures
	};
};
/**
* Formats a SearchPattern as a string.
*/
const searchPatternDisplay = (pattern, patternDisplay) => {
	return `search(${patternDisplay(pattern.pattern)})`;
};
//#endregion
//#region src/pattern/meta/sequence-pattern.ts
/**
* Creates a SequencePattern with the given patterns.
*/
const sequencePattern = (patterns) => ({
	variant: "Sequence",
	patterns
});
/**
* Returns paths to matching values.
*
* Note: Sequence patterns return empty paths when used directly.
* The actual sequence matching is handled by the VM within array contexts.
*/
const sequencePatternPaths = (_pattern, _haystack) => {
	return [];
};
/**
* Formats a SequencePattern as a string.
*
* an empty sequence renders as `()` (empty parens), not `""`. This
* keeps `parse(format(emptySequence()))` round-trippable.
*/
const sequencePatternDisplay = (pattern, patternDisplay) => {
	if (pattern.patterns.length === 0) return "()";
	return pattern.patterns.map(patternDisplay).join(", ");
};
//#endregion
//#region src/pattern/meta/index.ts
/**
* Returns paths to matching values for a MetaPattern.
*/
const metaPatternPaths = (pattern, haystack) => {
	switch (pattern.type) {
		case "Any": return anyPatternPaths(pattern.pattern, haystack);
		case "And": return andPatternPaths(pattern.pattern, haystack);
		case "Or": return orPatternPaths(pattern.pattern, haystack);
		case "Not": return notPatternPaths(pattern.pattern, haystack);
		case "Repeat": return repeatPatternPaths(pattern.pattern, haystack);
		case "Capture": return capturePatternPaths(pattern.pattern, haystack);
		case "Search": return searchPatternPaths(pattern.pattern, haystack);
		case "Sequence": return sequencePatternPaths(pattern.pattern, haystack);
	}
};
/**
* Formats a MetaPattern as a string.
*/
const metaPatternDisplay = (pattern, patternDisplay) => {
	switch (pattern.type) {
		case "Any": return anyPatternDisplay(pattern.pattern);
		case "And": return andPatternDisplay(pattern.pattern, patternDisplay);
		case "Or": return orPatternDisplay(pattern.pattern, patternDisplay);
		case "Not": return notPatternDisplay(pattern.pattern, patternDisplay);
		case "Repeat": return repeatPatternDisplay(pattern.pattern, patternDisplay);
		case "Capture": return capturePatternDisplay(pattern.pattern, patternDisplay);
		case "Search": return searchPatternDisplay(pattern.pattern, patternDisplay);
		case "Sequence": return sequencePatternDisplay(pattern.pattern, patternDisplay);
	}
};
//#endregion
//#region src/pattern/vm.ts
/**
* Return child CBOR values reachable from `cbor` via the given axis.
*/
const axisChildren = (axis, cbor) => {
	switch (axis) {
		case "ArrayElement": {
			if (!isArray(cbor)) return [];
			const len = arrayLength(cbor);
			if (len === void 0) return [];
			const children = [];
			for (let i = 0; i < len; i++) {
				const item = arrayItem(cbor, i);
				if (item !== void 0) children.push(item);
			}
			return children;
		}
		case "MapKey": {
			if (!isMap(cbor)) return [];
			const keys = mapKeys(cbor);
			if (keys === void 0 || keys === null) return [];
			return keys;
		}
		case "MapValue": {
			if (!isMap(cbor)) return [];
			const values = mapValues(cbor);
			if (values === void 0 || values === null) return [];
			return values;
		}
		case "TaggedContent": {
			if (!isTagged(cbor)) return [];
			const content = asTaggedValue(cbor)?.[1];
			if (content === void 0) return [];
			return [content];
		}
	}
};
/**
* Compares two CBOR values for equality.
*
* each value to canonical dCBOR bytes, then compare the byte arrays.
* Earlier this port used `JSON.stringify` for equality, which is
* unsafe for CBOR — JS `JSON.stringify` mishandles maps with
* non-canonical key order, drops `BigInt` (throws), silently equates
* `Symbol`s, and chokes on cyclic references / `Uint8Array`. The
* canonical-byte comparison is what `repeatPaths`'s loop-prevention
* check actually needs.
*/
const cborEquals = (a, b) => {
	if (a === b) return true;
	let ad;
	let bd;
	try {
		ad = encodeCbor(a);
		bd = encodeCbor(b);
	} catch {
		return false;
	}
	if (ad.length !== bd.length) return false;
	for (let i = 0; i < ad.length; i++) if (ad[i] !== bd[i]) return false;
	return true;
};
/**
* Hash a path for deduplication.
*
* each element is serialized to canonical dCBOR bytes, hex-encoded,
* and joined with `|`. Two paths whose elements have identical CBOR
* bytes hash to the same key — even when their JS object identity
* differs, even when `toDiagnostic()` collides (or differs) for
* pathological inputs. Earlier this port joined `toDiagnostic()`
* strings with `|`, which can collide on values with identical
* diagnostic notation but different binary CBOR (or vice versa).
*/
const pathHash = (path) => {
	const parts = [];
	for (const item of path) try {
		parts.push(bytesToHex$2(encodeCbor(item)));
	} catch {
		parts.push(String(item));
	}
	return parts.join("|");
};
/**
* Match atomic patterns without recursion into the VM.
*
* This function handles only the patterns that are safe to use in
* MatchPredicate instructions.
*/
const atomicPaths = (pattern, cbor) => {
	switch (pattern.kind) {
		case "Value":
		case "Structure": return getPatternPaths(pattern, cbor);
		case "Meta":
			if (pattern.pattern.type === "Any") return [[cbor]];
			throw new Error(`Non-atomic meta pattern used in MatchPredicate: ${pattern.pattern.type}`);
	}
};
/**
* Compute repeat paths based on pattern, quantifier, and starting state.
*/
const repeatPaths = (pattern, cbor, path, quantifier) => {
	const states = [[{
		cbor,
		path: [...path]
	}]];
	const bound = quantifier.max() ?? Number.MAX_SAFE_INTEGER;
	for (let rep = 0; rep < bound; rep++) {
		const next = [];
		const lastState = states[states.length - 1];
		for (const state of lastState) {
			const subPaths = getPatternPaths(pattern, state.cbor);
			for (const subPath of subPaths) {
				const last = subPath[subPath.length - 1];
				if (last === void 0) continue;
				if (cborEquals(last, state.cbor)) continue;
				const combined = [...state.path];
				const firstElement = subPath[0];
				const startIdx = firstElement !== void 0 && cborEquals(firstElement, state.cbor) ? 1 : 0;
				for (let i = startIdx; i < subPath.length; i++) combined.push(subPath[i]);
				next.push({
					cbor: last,
					path: combined
				});
			}
		}
		if (next.length === 0) break;
		states.push(next);
	}
	const hasZeroRep = quantifier.min() === 0;
	const zeroRepResult = hasZeroRep ? [{
		cbor,
		path: [...path]
	}] : [];
	const maxPossible = states.length - 1;
	const maxAllowed = Math.min(bound, maxPossible);
	if (maxAllowed < quantifier.min() && quantifier.min() > 0) return [];
	const minCount = quantifier.min() === 0 ? 1 : quantifier.min();
	const maxCount = maxAllowed < minCount ? -1 : maxAllowed;
	if (maxCount < minCount) return zeroRepResult;
	let counts;
	const reluctance = quantifier.reluctance();
	if (reluctance === Reluctance.Greedy) {
		counts = [];
		for (let i = maxCount; i >= minCount; i--) counts.push(i);
	} else if (reluctance === Reluctance.Lazy) {
		counts = [];
		for (let i = minCount; i <= maxCount; i++) counts.push(i);
	} else counts = maxCount >= minCount ? [maxCount] : [];
	const out = [];
	if (reluctance === Reluctance.Greedy) {
		for (const c of counts) {
			const list = states[c];
			if (list !== void 0) out.push(...list);
		}
		if (hasZeroRep && out.length === 0) out.push({
			cbor,
			path: [...path]
		});
	} else {
		if (hasZeroRep) out.push({
			cbor,
			path: [...path]
		});
		for (const c of counts) {
			const list = states[c];
			if (list !== void 0) out.push(...list);
		}
	}
	return out;
};
/**
* Execute a single thread until it halts.
*/
const runThread = (prog, start, out) => {
	let produced = false;
	const stack = [start];
	while (stack.length > 0) {
		const th = stack.pop();
		if (th === void 0) break;
		threadLoop: while (true) {
			const instr = prog.code[th.pc];
			switch (instr.type) {
				case "MatchPredicate":
					if (atomicPaths(prog.literals[instr.literalIndex], th.cbor).length === 0) break threadLoop;
					th.pc += 1;
					break;
				case "MatchStructure": {
					const pattern = prog.literals[instr.literalIndex];
					if (pattern.kind !== "Structure") throw new Error("MatchStructure used with non-structure pattern");
					const result = getPatternPathsWithCapturesDirect(pattern, th.cbor);
					if (result.paths.length === 0) break threadLoop;
					for (let i = 0; i < prog.captureNames.length; i++) {
						const name = prog.captureNames[i];
						const capturedPaths = result.captures.get(name);
						if (capturedPaths !== void 0) {
							while (th.captures.length <= i) th.captures.push([]);
							th.captures[i].push(...capturedPaths);
						}
					}
					if (result.paths.length === 1 && result.paths[0].length === 1) th.pc += 1;
					else {
						for (const structurePath of result.paths) {
							const target = structurePath[structurePath.length - 1];
							if (target !== void 0) {
								const newThread = {
									pc: th.pc + 1,
									cbor: target,
									path: [...th.path, ...structurePath.slice(1)],
									savedPaths: [...th.savedPaths],
									captures: th.captures.map((c) => [...c]),
									captureStack: th.captureStack.map((s) => [...s])
								};
								stack.push(newThread);
							}
						}
						break threadLoop;
					}
					break;
				}
				case "Split": {
					const th2 = {
						pc: instr.b,
						cbor: th.cbor,
						path: [...th.path],
						savedPaths: [...th.savedPaths],
						captures: th.captures.map((c) => [...c]),
						captureStack: th.captureStack.map((s) => [...s])
					};
					stack.push(th2);
					th.pc = instr.a;
					break;
				}
				case "Jump":
					th.pc = instr.address;
					break;
				case "PushAxis": {
					const children = axisChildren(instr.axis, th.cbor);
					for (const child of children) {
						const newThread = {
							pc: th.pc + 1,
							cbor: child,
							path: [...th.path, child],
							savedPaths: [...th.savedPaths],
							captures: th.captures.map((c) => [...c]),
							captureStack: th.captureStack.map((s) => [...s])
						};
						stack.push(newThread);
					}
					break threadLoop;
				}
				case "Pop": {
					if (th.path.length === 0) break threadLoop;
					th.path.pop();
					const parent = th.path[th.path.length - 1];
					if (parent !== void 0) th.cbor = parent;
					th.pc += 1;
					break;
				}
				case "Save":
					out.push({
						path: [...th.path],
						captures: th.captures.map((c) => [...c])
					});
					produced = true;
					th.pc += 1;
					break;
				case "Accept":
					out.push({
						path: [...th.path],
						captures: th.captures.map((c) => [...c])
					});
					produced = true;
					break threadLoop;
				case "Search": {
					const innerPattern = prog.literals[instr.patternIndex];
					const searchPat = searchPattern(innerPattern);
					const result = searchPatternPathsWithCaptures(searchPat, th.cbor);
					const reversedPaths = [...result.paths].reverse();
					for (const searchPath of reversedPaths) {
						const newThread = {
							pc: th.pc + 1,
							cbor: th.cbor,
							path: searchPath,
							savedPaths: [...th.savedPaths],
							captures: th.captures.map((c) => [...c]),
							captureStack: th.captureStack.map((s) => [...s])
						};
						for (const [name, captureIdx] of instr.captureMap) if (captureIdx < newThread.captures.length) {
							const capturePaths = result.captures.get(name);
							if (capturePaths !== void 0) for (const capturePath of capturePaths) newThread.captures[captureIdx].push(capturePath);
						}
						stack.push(newThread);
					}
					break threadLoop;
				}
				case "ExtendSequence": {
					th.savedPaths.push([...th.path]);
					const last = th.path[th.path.length - 1];
					if (last !== void 0) {
						th.path = [last];
						th.cbor = last;
					}
					th.pc += 1;
					break;
				}
				case "CombineSequence": {
					const saved = th.savedPaths.pop();
					if (saved !== void 0) {
						const combined = [...saved];
						if (th.path.length > 1) combined.push(...th.path.slice(1));
						th.path = combined;
					}
					th.pc += 1;
					break;
				}
				case "NotMatch":
					if (getPatternPaths(prog.literals[instr.patternIndex], th.cbor).length > 0) break threadLoop;
					th.pc += 1;
					break;
				case "Repeat": {
					const results = repeatPaths(prog.literals[instr.patternIndex], th.cbor, th.path, instr.quantifier);
					for (const result of results) {
						const newThread = {
							pc: th.pc + 1,
							cbor: result.cbor,
							path: result.path,
							savedPaths: [...th.savedPaths],
							captures: th.captures.map((c) => [...c]),
							captureStack: th.captureStack.map((s) => [...s])
						};
						stack.push(newThread);
					}
					break threadLoop;
				}
				case "CaptureStart": {
					const idx = instr.captureIndex;
					while (th.captures.length <= idx) th.captures.push([]);
					while (th.captureStack.length <= idx) th.captureStack.push([]);
					th.captureStack[idx].push(th.path.length);
					th.pc += 1;
					break;
				}
				case "CaptureEnd": {
					const idx = instr.captureIndex;
					const stack = th.captureStack[idx];
					if (stack !== void 0 && stack.length > 0) {
						stack.pop();
						const capturedPath = [...th.path];
						const captureArray = th.captures[idx];
						if (captureArray !== void 0) captureArray.push(capturedPath);
					}
					th.pc += 1;
					break;
				}
			}
		}
	}
	return produced;
};
/**
* Execute a program against a dCBOR value, returning all matching paths and captures.
*/
const run = (prog, root) => {
	const initialCaptures = prog.captureNames.map(() => []);
	const start = {
		pc: 0,
		cbor: root,
		path: [root],
		savedPaths: [],
		captures: initialCaptures,
		captureStack: []
	};
	const results = [];
	runThread(prog, start, results);
	const seenPaths = /* @__PURE__ */ new Set();
	const paths = [];
	for (const result of results) {
		const hash = pathHash(result.path);
		if (!seenPaths.has(hash)) {
			seenPaths.add(hash);
			paths.push(result.path);
		}
	}
	const captures = /* @__PURE__ */ new Map();
	for (let i = 0; i < prog.captureNames.length; i++) {
		const name = prog.captureNames[i];
		const capturedPaths = [];
		for (const result of results) {
			const captureGroup = result.captures[i];
			if (captureGroup !== void 0) capturedPaths.push(...captureGroup);
		}
		if (capturedPaths.length > 0) {
			const seenCapturePaths = /* @__PURE__ */ new Set();
			const deduplicated = [];
			for (const path of capturedPaths) {
				const hash = pathHash(path);
				if (!seenCapturePaths.has(hash)) {
					seenCapturePaths.add(hash);
					deduplicated.push(path);
				}
			}
			captures.set(name, deduplicated);
		}
	}
	return {
		paths,
		captures
	};
};
/**
* VM for executing pattern programs against dCBOR values.
*/
var Vm = class {
	/**
	* Execute a program against a dCBOR value.
	*/
	static run(prog, root) {
		return run(prog, root);
	}
};
//#endregion
//#region src/pattern/meta/captures.ts
/**
* Paths with captures for meta patterns, with the reference's semantics: a
* capture holds the paths its inner pattern matched; `and` merges, `or`
* unions across every alternative, `not` exposes none; a repeat outside an
* array matches once; `search` re-anchors nested captures under the path
* where the pattern was found.
*/
const merge = (into, from) => {
	for (const [name, paths] of from) {
		const existing = into.get(name);
		if (existing === void 0) into.set(name, [...paths]);
		else existing.push(...paths);
	}
};
const metaPatternPathsWithCaptures = (pattern, haystack) => {
	switch (pattern.type) {
		case "Any": return {
			paths: [[haystack]],
			captures: /* @__PURE__ */ new Map()
		};
		case "And": {
			const captures = /* @__PURE__ */ new Map();
			for (const p of pattern.pattern.patterns) {
				const r = getPatternPathsWithCaptures(p, haystack);
				if (r.paths.length === 0) return {
					paths: [],
					captures: /* @__PURE__ */ new Map()
				};
				merge(captures, r.captures);
			}
			return {
				paths: [[haystack]],
				captures
			};
		}
		case "Or": {
			const paths = [];
			const captures = /* @__PURE__ */ new Map();
			for (const p of pattern.pattern.patterns) {
				const r = getPatternPathsWithCaptures(p, haystack);
				paths.push(...r.paths);
				merge(captures, r.captures);
			}
			return {
				paths,
				captures
			};
		}
		case "Not": return {
			paths: getPatternPathsWithCaptures(pattern.pattern.pattern, haystack).paths.length === 0 ? [[haystack]] : [],
			captures: /* @__PURE__ */ new Map()
		};
		case "Capture": {
			const r = getPatternPathsWithCaptures(pattern.pattern.pattern, haystack);
			const captures = new Map(r.captures);
			if (r.paths.length > 0) captures.set(pattern.pattern.name, [...r.paths]);
			return {
				paths: r.paths,
				captures
			};
		}
		case "Repeat": {
			const { pattern: inner, quantifier } = pattern.pattern;
			const names = [];
			collectPatternCaptureNames(inner, names);
			if (names.length === 0) {
				const innerPaths = getPatternPaths(inner, haystack);
				if (innerPaths.length > 0) return {
					paths: quantifier.contains(1) ? innerPaths : [],
					captures: /* @__PURE__ */ new Map()
				};
				return {
					paths: quantifier.contains(0) ? [[haystack]] : [],
					captures: /* @__PURE__ */ new Map()
				};
			}
			if (isArray(haystack)) {
				const items = asArray(haystack) ?? [];
				if (!quantifier.contains(items.length)) return {
					paths: [],
					captures: /* @__PURE__ */ new Map()
				};
				const captures = /* @__PURE__ */ new Map();
				if (items.length === 0 && quantifier.contains(0)) for (const name of names) captures.set(name, []);
				else for (const item of items) merge(captures, getPatternPathsWithCaptures(inner, item).captures);
				return {
					paths: [[haystack]],
					captures
				};
			}
			const matches = getPatternPaths(inner, haystack).length > 0;
			if (matches && quantifier.contains(1)) return {
				paths: [[haystack]],
				captures: getPatternPathsWithCaptures(inner, haystack).captures
			};
			if (!matches && quantifier.contains(0)) {
				const captures = /* @__PURE__ */ new Map();
				for (const name of names) captures.set(name, []);
				return {
					paths: [[haystack]],
					captures
				};
			}
			return {
				paths: [],
				captures: /* @__PURE__ */ new Map()
			};
		}
		case "Search": {
			const results = [];
			const captures = /* @__PURE__ */ new Map();
			searchWithCaptures(pattern.pattern.pattern, haystack, [haystack], results, captures);
			const seen = /* @__PURE__ */ new Set();
			const unique = [];
			for (const path of results) {
				const key = path.map((c) => bytesToHex$2(c.toData())).join(",");
				if (!seen.has(key)) {
					seen.add(key);
					unique.push(path);
				}
			}
			return {
				paths: unique,
				captures
			};
		}
		case "Sequence": return {
			paths: sequencePatternPaths(pattern.pattern, haystack),
			captures: /* @__PURE__ */ new Map()
		};
	}
};
const searchWithCaptures = (inner, cbor, path, results, captures) => {
	const r = getPatternPathsWithCaptures(inner, cbor);
	if (r.paths.length > 0) {
		results.push([...path]);
		for (const [name, capturePaths] of r.captures) {
			const list = captures.get(name) ?? [];
			if (capturePaths.length > 1 || capturePaths.length === 1 && capturePaths[0].length > path.length) for (const capturePath of capturePaths) list.push(capturePath.length > 1 ? [...path, ...capturePath.slice(1)] : [...path]);
			else list.push([...path]);
			captures.set(name, list);
		}
	}
	const items = asArray(cbor);
	if (items !== void 0) {
		for (const child of items) searchWithCaptures(inner, child, [...path, child], results, captures);
		return;
	}
	const map = asMap(cbor);
	if (map !== void 0) {
		for (const [key, value] of map.entries()) {
			searchWithCaptures(inner, key, [...path, key], results, captures);
			searchWithCaptures(inner, value, [...path, value], results, captures);
		}
		return;
	}
	const tagged = asTaggedValue(cbor);
	if (tagged !== void 0) searchWithCaptures(inner, tagged[1], [...path, tagged[1]], results, captures);
};
//#endregion
//#region src/pattern/constructors.ts
/**
* Creates a pattern that matches any value.
*/
const any = () => ({
	kind: "Meta",
	pattern: {
		type: "Any",
		pattern: anyPattern()
	}
});
/**
* Creates a pattern that matches any boolean.
*/
const anyBool = () => ({
	kind: "Value",
	pattern: {
		type: "Bool",
		pattern: boolPatternAny()
	}
});
/**
* Creates a pattern that matches a specific boolean value.
*/
const boolean = (value) => ({
	kind: "Value",
	pattern: {
		type: "Bool",
		pattern: boolPatternValue(value)
	}
});
/**
* Creates a pattern that matches null.
*/
const nullValue = () => ({
	kind: "Value",
	pattern: {
		type: "Null",
		pattern: nullPattern()
	}
});
/**
* Creates a pattern that matches any number.
*/
const anyNumber = () => ({
	kind: "Value",
	pattern: {
		type: "Number",
		pattern: numberPatternAny()
	}
});
/**
* Creates a pattern that matches a specific number.
*/
const number = (value) => ({
	kind: "Value",
	pattern: {
		type: "Number",
		pattern: numberPatternValue(value)
	}
});
/**
* Creates a pattern that matches numbers in a range.
*/
const numberRange = (min, max) => ({
	kind: "Value",
	pattern: {
		type: "Number",
		pattern: numberPatternRange(min, max)
	}
});
/**
* Creates a pattern that matches any text.
*/
const anyText = () => ({
	kind: "Value",
	pattern: {
		type: "Text",
		pattern: textPatternAny()
	}
});
/**
* Creates a pattern that matches specific text.
*/
const text = (value) => ({
	kind: "Value",
	pattern: {
		type: "Text",
		pattern: textPatternValue(value)
	}
});
/**
* Creates a pattern that matches text using a regex.
*/
const textRegex = (pattern) => ({
	kind: "Value",
	pattern: {
		type: "Text",
		pattern: textPatternRegex(pattern)
	}
});
/**
* Creates a pattern that matches any byte string.
*/
const anyByteString = () => ({
	kind: "Value",
	pattern: {
		type: "ByteString",
		pattern: byteStringPatternAny()
	}
});
/**
* Creates a pattern that matches a specific byte string.
*/
const byteString = (value) => ({
	kind: "Value",
	pattern: {
		type: "ByteString",
		pattern: byteStringPatternValue(value)
	}
});
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
const byteStringRegex = (pattern) => ({
	kind: "Value",
	pattern: {
		type: "ByteString",
		pattern: byteStringPatternBinaryRegex(pattern)
	}
});
/**
* Creates a pattern that matches any array.
*/
const anyArray = () => ({
	kind: "Structure",
	pattern: {
		type: "Array",
		pattern: arrayPatternAny()
	}
});
/**
* Creates a pattern that matches any map.
*/
const anyMap = () => ({
	kind: "Structure",
	pattern: {
		type: "Map",
		pattern: mapPatternAny()
	}
});
/**
* Creates a pattern that matches any tagged value.
*/
const anyTagged = () => ({
	kind: "Structure",
	pattern: {
		type: "Tagged",
		pattern: taggedPatternAny()
	}
});
/**
* Creates an AND pattern that matches if all patterns match.
*/
const and = (...patterns) => ({
	kind: "Meta",
	pattern: {
		type: "And",
		pattern: andPattern(patterns)
	}
});
/**
* Creates an OR pattern that matches if any pattern matches.
*/
const or = (...patterns) => ({
	kind: "Meta",
	pattern: {
		type: "Or",
		pattern: orPattern(patterns)
	}
});
/**
* Creates a NOT pattern that matches if the pattern does not match.
*/
const not = (pattern) => ({
	kind: "Meta",
	pattern: {
		type: "Not",
		pattern: notPattern(pattern)
	}
});
/**
* Creates a capture pattern with a name.
*/
const capture = (name, pattern) => ({
	kind: "Meta",
	pattern: {
		type: "Capture",
		pattern: capturePattern(name, pattern)
	}
});
/**
* Creates a search pattern for recursive matching.
*/
const search = (pattern) => ({
	kind: "Meta",
	pattern: {
		type: "Search",
		pattern: searchPattern(pattern)
	}
});
/**
* Creates a sequence pattern for ordered matching.
*/
const sequence = (...patterns) => ({
	kind: "Meta",
	pattern: {
		type: "Sequence",
		pattern: sequencePattern(patterns)
	}
});
/**
* Creates a pattern that matches numbers greater than a value.
*/
const numberGreaterThan = (value) => ({
	kind: "Value",
	pattern: {
		type: "Number",
		pattern: numberPatternGreaterThan(value)
	}
});
/**
* Creates a pattern that matches numbers greater than or equal to a value.
*/
const numberGreaterThanOrEqual = (value) => ({
	kind: "Value",
	pattern: {
		type: "Number",
		pattern: numberPatternGreaterThanOrEqual(value)
	}
});
/**
* Creates a pattern that matches numbers less than a value.
*/
const numberLessThan = (value) => ({
	kind: "Value",
	pattern: {
		type: "Number",
		pattern: numberPatternLessThan(value)
	}
});
/**
* Creates a pattern that matches numbers less than or equal to a value.
*/
const numberLessThanOrEqual = (value) => ({
	kind: "Value",
	pattern: {
		type: "Number",
		pattern: numberPatternLessThanOrEqual(value)
	}
});
/**
* Creates a pattern that matches NaN.
*/
const numberNaN = () => ({
	kind: "Value",
	pattern: {
		type: "Number",
		pattern: numberPatternNaN()
	}
});
/**
* Creates a pattern that matches positive infinity.
*/
const numberInfinity = () => ({
	kind: "Value",
	pattern: {
		type: "Number",
		pattern: numberPatternInfinity()
	}
});
/**
* Creates a pattern that matches negative infinity.
*/
const numberNegInfinity = () => ({
	kind: "Value",
	pattern: {
		type: "Number",
		pattern: numberPatternNegInfinity()
	}
});
/**
* Creates a pattern that matches any date.
*/
const anyDate = () => ({
	kind: "Value",
	pattern: {
		type: "Date",
		pattern: datePatternAny()
	}
});
/**
* Creates a pattern that matches a specific date.
*/
const date = (value) => ({
	kind: "Value",
	pattern: {
		type: "Date",
		pattern: datePatternValue(value)
	}
});
/**
* Creates a pattern that matches dates within a range (inclusive).
*/
const dateRange = (min, max) => ({
	kind: "Value",
	pattern: {
		type: "Date",
		pattern: datePatternRange(min, max)
	}
});
/**
* Creates a pattern that matches dates on or after the specified date.
*/
const dateEarliest = (value) => ({
	kind: "Value",
	pattern: {
		type: "Date",
		pattern: datePatternEarliest(value)
	}
});
/**
* Creates a pattern that matches dates on or before the specified date.
*/
const dateLatest = (value) => ({
	kind: "Value",
	pattern: {
		type: "Date",
		pattern: datePatternLatest(value)
	}
});
/**
* Creates a pattern that matches dates by their ISO-8601 string representation.
*/
const dateIso8601 = (value) => ({
	kind: "Value",
	pattern: {
		type: "Date",
		pattern: datePatternStringValue(value)
	}
});
/**
* Creates a pattern that matches dates by regex on their ISO-8601 string.
*/
const dateRegex = (pattern) => ({
	kind: "Value",
	pattern: {
		type: "Date",
		pattern: datePatternRegex(pattern)
	}
});
/**
* Creates a pattern that matches any digest.
*/
const anyDigest = () => ({
	kind: "Value",
	pattern: {
		type: "Digest",
		pattern: digestPatternAny()
	}
});
/**
* Creates a pattern that matches a specific digest.
*/
const digest = (value) => ({
	kind: "Value",
	pattern: {
		type: "Digest",
		pattern: digestPatternValue(value)
	}
});
/**
* Creates a pattern that matches digests with a prefix.
*/
const digestPrefix = (prefix) => ({
	kind: "Value",
	pattern: {
		type: "Digest",
		pattern: digestPatternPrefix(prefix)
	}
});
/**
* Creates a pattern that matches digests by binary regex.
*/
const digestBinaryRegex = (pattern) => ({
	kind: "Value",
	pattern: {
		type: "Digest",
		pattern: digestPatternBinaryRegex(pattern)
	}
});
/**
* Creates a pattern that matches any known value.
*/
const anyKnownValue = () => ({
	kind: "Value",
	pattern: {
		type: "KnownValue",
		pattern: knownValuePatternAny()
	}
});
/**
* Creates a pattern that matches a specific known value.
*/
const knownValue = (value) => ({
	kind: "Value",
	pattern: {
		type: "KnownValue",
		pattern: knownValuePatternValue(value)
	}
});
/**
* Creates a pattern that matches a known value by name.
*/
const knownValueNamed = (name) => ({
	kind: "Value",
	pattern: {
		type: "KnownValue",
		pattern: knownValuePatternNamed(name)
	}
});
/**
* Creates a pattern that matches known values by regex on their name.
*/
const knownValueRegex = (pattern) => ({
	kind: "Value",
	pattern: {
		type: "KnownValue",
		pattern: knownValuePatternRegex(pattern)
	}
});
/**
* Creates a pattern that matches tagged values with a specific tag.
*/
const tagged = (tag, pattern) => ({
	kind: "Structure",
	pattern: {
		type: "Tagged",
		pattern: taggedPatternWithTag(tag, pattern)
	}
});
/**
* Creates a pattern that matches tagged values by tag name.
*/
const taggedName = (name, pattern) => ({
	kind: "Structure",
	pattern: {
		type: "Tagged",
		pattern: taggedPatternWithName(name, pattern)
	}
});
/**
* Creates a pattern that matches tagged values by tag name regex.
*/
const taggedRegex = (regex, pattern) => ({
	kind: "Structure",
	pattern: {
		type: "Tagged",
		pattern: taggedPatternWithRegex(regex, pattern)
	}
});
/**
* Creates a repeat pattern with the given pattern and quantifier.
*/
const repeat = (pattern, quantifier) => ({
	kind: "Meta",
	pattern: {
		type: "Repeat",
		pattern: repeatPattern(pattern, quantifier)
	}
});
/**
* Creates a grouped pattern (equivalent to repeat with exactly 1).
* This is useful for precedence grouping in pattern expressions.
*/
const group = (pattern) => ({
	kind: "Meta",
	pattern: {
		type: "Repeat",
		pattern: repeatPattern(pattern, Quantifier.exactly(1))
	}
});
//#endregion
//#region src/pattern/index.ts
/**
* Returns paths to matching elements in a CBOR value.
*
* @param pattern - The pattern to match
* @param haystack - The CBOR value to search
* @returns Array of paths to matching elements
*/
const paths = (pattern, haystack) => {
	switch (pattern.kind) {
		case "Value": return valuePatternPaths(pattern.pattern, haystack);
		case "Structure": return structurePatternPaths(pattern.pattern, haystack);
		case "Meta": return metaPatternPaths(pattern.pattern, haystack);
	}
};
/**
* Tests if a pattern matches a CBOR value.
*
* @param pattern - The pattern to match
* @param haystack - The CBOR value to test
* @returns true if the pattern matches
*/
const matches = (pattern, haystack) => {
	return paths(pattern, haystack).length > 0;
};
/**
* Formats a pattern as a string.
*
* @param pattern - The pattern to format
* @returns String representation of the pattern
*/
const display = (pattern) => {
	const displayFn = (p) => display(p);
	switch (pattern.kind) {
		case "Value": return valuePatternDisplay(pattern.pattern);
		case "Structure": return structurePatternDisplay(pattern.pattern, displayFn);
		case "Meta": return metaPatternDisplay(pattern.pattern, displayFn);
	}
};
/**
* Matches a pattern against a CBOR value and returns all matching paths.
*
* @param pattern - The pattern to match
* @param haystack - The CBOR value to search
* @returns Array of paths to matching elements
*/
/**
* Checks if a pattern matches a CBOR value.
*
* @param pattern - The pattern to match
* @param haystack - The CBOR value to test
* @returns true if the pattern matches
*/
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
const pathsWithCapturesDirect = (pattern, haystack) => {
	if (pattern.kind === "Structure") {
		const [paths, captures] = structurePatternPathsWithCaptures(pattern.pattern, haystack);
		return {
			paths,
			captures
		};
	}
	if (pattern.kind === "Value") return {
		paths: paths(pattern, haystack),
		captures: /* @__PURE__ */ new Map()
	};
	const matched = paths(pattern, haystack);
	const captures = /* @__PURE__ */ new Map();
	const collectCaptures = (p, h) => {
		if (p.kind === "Meta") switch (p.pattern.type) {
			case "Capture": {
				const capturePattern = p.pattern.pattern;
				const capturedPaths = paths(capturePattern.pattern, h);
				if (capturedPaths.length > 0) {
					const existing = captures.get(capturePattern.name) ?? [];
					captures.set(capturePattern.name, [...existing, ...capturedPaths]);
				}
				collectCaptures(capturePattern.pattern, h);
				break;
			}
			case "And":
				for (const inner of p.pattern.pattern.patterns) collectCaptures(inner, h);
				break;
			case "Or":
				for (const inner of p.pattern.pattern.patterns) if (matches(inner, h)) {
					collectCaptures(inner, h);
					break;
				}
				break;
			case "Not": break;
			case "Repeat":
				collectCaptures(p.pattern.pattern.pattern, h);
				break;
			case "Sequence":
				for (const inner of p.pattern.pattern.patterns) collectCaptures(inner, h);
				break;
			case "Search": collectCaptures(p.pattern.pattern.pattern, h);
		}
		else if (p.kind === "Structure") {
			const [_, structureCaptures] = structurePatternPathsWithCaptures(p.pattern, h);
			for (const [name, capturePaths] of structureCaptures) {
				const existing = captures.get(name) ?? [];
				captures.set(name, [...existing, ...capturePaths]);
			}
		}
	};
	if (paths.length > 0) collectCaptures(pattern, haystack);
	return {
		paths: matched,
		captures
	};
};
/**
* Matches a pattern against a CBOR value and returns paths with captures.
*
* @param pattern - The pattern to match
* @param haystack - The CBOR value to search
* @returns Match result with paths and captures
*/
const pathsWithCaptures = (pattern, haystack) => {
	const names = [];
	collectPatternCaptureNames(pattern, names);
	if (names.length === 0) return {
		paths: paths(pattern, haystack),
		captures: /* @__PURE__ */ new Map()
	};
	switch (pattern.kind) {
		case "Meta": return metaPatternPathsWithCaptures(pattern.pattern, haystack);
		case "Structure": return Vm.run(compilePattern(pattern), haystack);
		case "Value": return {
			paths: paths(pattern, haystack),
			captures: /* @__PURE__ */ new Map()
		};
	}
};
setMatchFn(matches);
setPathsFn(paths);
setPathsWithCapturesFn(pathsWithCaptures);
setPathsWithCapturesDirectFn(pathsWithCapturesDirect);
setDisplayFn(display);
//#endregion
//#region ../bc-dcbor-parse-ts/dist/token-RNmX2OXx.mjs
/** Builds a frozen span. */
function span$1(start, end) {
	return Object.freeze({
		start,
		end
	});
}
new TextEncoder();
Object.freeze({
	EmptyInput: "EmptyInput",
	UnexpectedEndOfInput: "UnexpectedEndOfInput",
	ExtraData: "ExtraData",
	UnexpectedToken: "UnexpectedToken",
	UnrecognizedToken: "UnrecognizedToken",
	ExpectedComma: "ExpectedComma",
	ExpectedColon: "ExpectedColon",
	UnmatchedParentheses: "UnmatchedParentheses",
	UnmatchedBraces: "UnmatchedBraces",
	ExpectedMapKey: "ExpectedMapKey",
	InvalidTagValue: "InvalidTagValue",
	UnknownTagName: "UnknownTagName",
	InvalidHexString: "InvalidHexString",
	InvalidBase64String: "InvalidBase64String",
	UnknownUrType: "UnknownUrType",
	InvalidUr: "InvalidUr",
	InvalidKnownValue: "InvalidKnownValue",
	UnknownKnownValueName: "UnknownKnownValueName",
	InvalidDateString: "InvalidDateString",
	DuplicateMapKey: "DuplicateMapKey",
	NestingTooDeep: "NestingTooDeep"
});
/**
* Thrown by `parseDcbor` and `parseDcborPrefix` (and carried by the `try…`
* forms) for text that does not parse. `code` says why; `details` carries
* the span and the code-specific fields; `fullMessage(source)` renders the
* message with the source line and a caret. Instances come from the static
* factories only.
*
* @example
* ```ts
* try {
*   parseDcbor(text);
* } catch (e) {
*   if (DcborParseError.isDcborParseError(e) && e.code === "UnknownTagName") {
*     e.details.name; // the tag name that did not resolve
*   }
* }
* ```
*/
var DcborParseError = class DcborParseError extends Error {
	/** Always `"DcborParseError"`; the cross-copy identity {@link DcborParseError.isDcborParseError} checks. */
	name = "DcborParseError";
	/** The discriminant; equals `details.code`. */
	code;
	/** The structured payload, discriminated by `code`. */
	details;
	constructor(message, details) {
		super(message);
		this.code = details.code;
		this.details = Object.freeze(details);
	}
	/** Type guard for a `DcborParseError`, including one from another copy of this package. */
	static isDcborParseError(value) {
		return value instanceof Error && value.name === "DcborParseError" && "code" in value;
	}
	/** `true` when `code` is this error's code. */
	is(code) {
		return this.code === code;
	}
	/** The span, if the error has one. */
	get span() {
		return "span" in this.details ? this.details.span : void 0;
	}
	/** The message with the source line and a caret under the span. */
	fullMessage(source) {
		const s = this.code === "UnexpectedEndOfInput" ? span$1(source.length, source.length) : this.span ?? span$1(0, 0);
		return formatMessage(this.message, source, s);
	}
	static make(message, details) {
		return new DcborParseError(message, details);
	}
	/** The source holds nothing but whitespace and comments. */
	static emptyInput() {
		return DcborParseError.make("Empty input", { code: "EmptyInput" });
	}
	/** The source ended inside an item. */
	static unexpectedEndOfInput() {
		return DcborParseError.make("Unexpected end of input", { code: "UnexpectedEndOfInput" });
	}
	/** Text follows the first item. */
	static extraData(span) {
		return DcborParseError.make("Extra data at end of input", {
			code: "ExtraData",
			span
		});
	}
	/** A token that cannot start or continue an item here. */
	static unexpectedToken(kind, text, span) {
		return DcborParseError.make(`Unexpected token \`${text}\``, {
			code: "UnexpectedToken",
			span,
			kind,
			text
		});
	}
	/** Text no token matches. */
	static unrecognizedToken(span) {
		return DcborParseError.make("Unrecognized token", {
			code: "UnrecognizedToken",
			span
		});
	}
	/** Two items in a container with nothing between them. */
	static expectedComma(span) {
		return DcborParseError.make("Expected comma", {
			code: "ExpectedComma",
			span
		});
	}
	/** A map key not followed by a colon. */
	static expectedColon(span) {
		return DcborParseError.make("Expected colon", {
			code: "ExpectedColon",
			span
		});
	}
	/** A tag's content not followed by `)`. */
	static unmatchedParentheses(span) {
		return DcborParseError.make("Unmatched parentheses", {
			code: "UnmatchedParentheses",
			span
		});
	}
	/** A map not closed before the end of the source. */
	static unmatchedBraces(span) {
		return DcborParseError.make("Unmatched braces", {
			code: "UnmatchedBraces",
			span
		});
	}
	/** A map entry without a value. */
	static expectedMapKey(span) {
		return DcborParseError.make("Expected map key", {
			code: "ExpectedMapKey",
			span
		});
	}
	/** A tag number outside the unsigned 64-bit range. */
	static invalidTagValue(value, span) {
		return DcborParseError.make(`Invalid tag value '${value}'`, {
			code: "InvalidTagValue",
			span,
			value
		});
	}
	/** A tag name the tags store does not know. */
	static unknownTagName(name, span) {
		return DcborParseError.make(`Unknown tag name '${name}'`, {
			code: "UnknownTagName",
			span,
			name
		});
	}
	/** An `h'…'` literal with an odd number of digits or an unterminated one. */
	static invalidHexString(span) {
		return DcborParseError.make("Invalid hex string", {
			code: "InvalidHexString",
			span
		});
	}
	/** A `b64'…'` literal that is not canonical base64. */
	static invalidBase64String(span) {
		return DcborParseError.make("Invalid base64 string", {
			code: "InvalidBase64String",
			span
		});
	}
	/** A UR whose type has no tag in the tags store. */
	static unknownUrType(urType, span) {
		return DcborParseError.make(`Unknown UR type '${urType}'`, {
			code: "UnknownUrType",
			span,
			urType
		});
	}
	/** A UR the decoder rejects. */
	static invalidUr(cause, span) {
		return DcborParseError.make(`Invalid UR '${cause}'`, {
			code: "InvalidUr",
			span,
			cause
		});
	}
	/** A known-value number outside the unsigned 64-bit range. */
	static invalidKnownValue(value, span) {
		return DcborParseError.make(`Invalid known value '${value}'`, {
			code: "InvalidKnownValue",
			span,
			value
		});
	}
	/** A known-value name the registry does not know. */
	static unknownKnownValueName(name, span) {
		return DcborParseError.make(`Unknown known value name '${name}'`, {
			code: "UnknownKnownValueName",
			span,
			name
		});
	}
	/** A date literal that is not a valid instant. */
	static invalidDateString(dateString, span) {
		return DcborParseError.make(`Invalid date string '${dateString}'`, {
			code: "InvalidDateString",
			span,
			dateString
		});
	}
	/** A map key that appears twice. */
	static duplicateMapKey(span) {
		return DcborParseError.make("Duplicate map key", {
			code: "DuplicateMapKey",
			span
		});
	}
	/** A container or tag nested deeper than `maxDepth`. */
	static nestingTooDeep(maxDepth, span) {
		return DcborParseError.make(`Nesting deeper than ${maxDepth} levels`, {
			code: "NestingTooDeep",
			span,
			maxDepth
		});
	}
};
Object.freeze({
	OddMapLength: "OddMapLength",
	DuplicateMapKey: "DuplicateMapKey",
	ParseError: "ParseError"
});
function formatMessage(message, source, range) {
	const start = range.start;
	const end = range.end;
	let lineNumber = 1;
	let lineStart = 0;
	for (let idx = 0; idx < source.length && idx < start; idx++) if (source[idx] === "\n") {
		lineNumber++;
		lineStart = idx + 1;
	}
	let line = source.split("\n")[lineNumber - 1] ?? "";
	if (line.endsWith("\r")) line = line.slice(0, -1);
	const column = Math.max(0, start - lineStart);
	const underlineLen = Math.max(1, end - start);
	const caret = " ".repeat(column) + "^".repeat(underlineLen);
	return `line ${lineNumber}: ${message}\n${line}\n${caret}`;
}
/**
* The tokenizer for dCBOR diagnostic notation.
*
* @module token
*/
const DATE_RE = /\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?/y;
const NUMBER_RE = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const TAG_NAME_RE = /[a-zA-Z_][a-zA-Z0-9_-]*\(/y;
const STRING_RE = /"([^"\\\x00-\x1F]|\\(["\\bnfrt/]|u[a-fA-F0-9]{4}))*"/y;
const HEX_RE = /[0-9a-fA-F]*/y;
const BASE64_RE = /[A-Za-z0-9+/=]*/y;
const KNOWN_VALUE_NUMBER_RE = /'(0|[1-9][0-9]*)'/y;
const KNOWN_VALUE_NAME_RE = /'([a-zA-Z_][a-zA-Z0-9_-]*)'/y;
const UR_RE = /ur:([a-zA-Z0-9][a-zA-Z0-9-]*)\/([a-zA-Z]{8,})/y;
/**
* The keywords, longest first so `-Infinity` is tried before anything else
* that starts with `-`. A keyword must not run straight into identifier
* characters (`truex` is one unrecognised run) and must not be followed by
* `(`, which makes it a tag name; `-Infinity` is exempt from both because no
* identifier starts with `-`.
*/
const KEYWORDS$1 = [
	[
		"-Infinity",
		"NegInfinity",
		void 0
	],
	[
		"true",
		"Bool",
		true
	],
	[
		"false",
		"Bool",
		false
	],
	[
		"null",
		"Null",
		void 0
	],
	[
		"NaN",
		"NaN",
		void 0
	],
	[
		"Infinity",
		"Infinity",
		void 0
	],
	[
		"Unit",
		"Unit",
		void 0
	]
];
const IDENT_CHAR = /[a-zA-Z0-9_-]/;
const PUNCTUATION = /* @__PURE__ */ new Map([
	["{", "BraceOpen"],
	["}", "BraceClose"],
	["[", "BracketOpen"],
	["]", "BracketClose"],
	["(", "ParenthesisOpen"],
	[")", "ParenthesisClose"],
	[":", "Colon"],
	[",", "Comma"]
]);
/**
* Splits a source string into tokens. Iterate it, or call `next()` until it
* returns `undefined`; either way text no token matches throws
* `DcborParseError`.
*
* @beta
*/
var Lexer$1 = class {
	_source;
	_position;
	_tokenStart;
	_tokenEnd;
	constructor(source) {
		this._source = source;
		this._position = 0;
		this._tokenStart = 0;
		this._tokenEnd = 0;
	}
	/** The span of the last token (or of the unrecognised text that stopped the lexer). */
	get span() {
		return span$1(this._tokenStart, this._tokenEnd);
	}
	/** The source text of the last token. */
	get slice() {
		return this._source.slice(this._tokenStart, this._tokenEnd);
	}
	/** The tokens, in order. */
	*[Symbol.iterator]() {
		for (let t = this.next(); t !== void 0; t = this.next()) yield t;
	}
	/**
	* The next token, or `undefined` at the end of the source.
	*
	* @throws {DcborParseError} for unrecognised text or a malformed literal
	*/
	next() {
		this._skipWhitespaceAndComments();
		if (this._position >= this._source.length) return;
		this._tokenStart = this._position;
		const result = this._tryMatchKeyword() ?? this._tryMatchDateLiteral() ?? this._tryMatchTagValueOrNumber() ?? this._tryMatchTagName() ?? this._tryMatchString() ?? this._tryMatchByteStringHex() ?? this._tryMatchByteStringBase64() ?? this._tryMatchKnownValue() ?? this._tryMatchUR() ?? this._tryMatchPunctuation();
		if (result === void 0) {
			this._position++;
			this._tokenEnd = this._position;
			throw DcborParseError.unrecognizedToken(this.span);
		}
		return result;
	}
	/** Finishes a token at the current position. */
	_done(token) {
		this._tokenEnd = this._position;
		return Object.freeze({
			...token,
			span: this.span
		});
	}
	/** Skips spaces, tabs, newlines, form feeds, `/…/` comments and `#` comments to the end of the line. */
	_skipWhitespaceAndComments() {
		while (this._position < this._source.length) {
			const ch = this._source[this._position];
			if (ch === " " || ch === "	" || ch === "\r" || ch === "\n" || ch === "\f") {
				this._position++;
				continue;
			}
			if (ch === "/") {
				let scan = this._position + 1;
				while (scan < this._source.length && this._source[scan] !== "/") scan++;
				if (scan < this._source.length) {
					this._position = scan + 1;
					continue;
				}
				break;
			}
			if (ch === "#") {
				while (this._position < this._source.length && this._source[this._position] !== "\n") this._position++;
				continue;
			}
			break;
		}
	}
	_tryMatchKeyword() {
		for (const [keyword, kind, value] of KEYWORDS$1) {
			if (!this._source.startsWith(keyword, this._position)) continue;
			const after = this._source[this._position + keyword.length] ?? "";
			if (!keyword.startsWith("-") && (after === "(" || IDENT_CHAR.test(after))) continue;
			this._position += keyword.length;
			return kind === "Bool" ? this._done({
				type: "Bool",
				value: value === true
			}) : this._done({ type: kind });
		}
	}
	_tryMatchDateLiteral() {
		const match = this._exec(DATE_RE);
		if (match === null) return void 0;
		const dateStr = match[0];
		this._position += dateStr.length;
		this._tokenEnd = this._position;
		let value;
		try {
			value = CborDate.fromString(dateStr);
		} catch {
			throw DcborParseError.invalidDateString(dateStr, this.span);
		}
		return this._done({
			type: "DateLiteral",
			value
		});
	}
	_tryMatchTagValueOrNumber() {
		const match = this._exec(NUMBER_RE);
		if (match === null) return void 0;
		const numStr = match[0];
		if (this._source[this._position + numStr.length] === "(" && !numStr.includes(".") && !numStr.includes("e") && !numStr.includes("E") && !numStr.startsWith("-")) {
			this._position += numStr.length + 1;
			this._tokenEnd = this._position;
			const parsed = parseU64(numStr);
			if (parsed === void 0) throw DcborParseError.invalidTagValue(numStr, span$1(this._tokenStart, this._tokenStart + numStr.length));
			return this._done({
				type: "TagValue",
				value: parsed
			});
		}
		this._position += numStr.length;
		return this._done({
			type: "Number",
			value: parseFloat(numStr)
		});
	}
	_tryMatchTagName() {
		const match = this._exec(TAG_NAME_RE);
		if (match === null) return void 0;
		const fullMatch = match[0];
		this._position += fullMatch.length;
		return this._done({
			type: "TagName",
			value: fullMatch.slice(0, -1)
		});
	}
	_tryMatchString() {
		if (this._source[this._position] !== "\"") return;
		const match = this._exec(STRING_RE);
		if (match !== null) {
			const fullMatch = match[0];
			this._position += fullMatch.length;
			return this._done({
				type: "String",
				value: fullMatch.slice(1, -1)
			});
		}
		this._position++;
		this._tokenEnd = this._position;
		throw DcborParseError.unrecognizedToken(this.span);
	}
	_tryMatchByteStringHex() {
		if (!this._matchLiteral("h'")) return;
		const match = this._exec(HEX_RE);
		const hexPart = match !== null ? match[0] : "";
		this._position += hexPart.length;
		if (this._source[this._position] !== "'") {
			this._tokenEnd = this._position;
			throw DcborParseError.invalidHexString(this.span);
		}
		this._position++;
		this._tokenEnd = this._position;
		if (hexPart.length % 2 !== 0) throw DcborParseError.invalidHexString(this.span);
		return this._done({
			type: "ByteStringHex",
			value: hexToBytes$3(hexPart)
		});
	}
	_tryMatchByteStringBase64() {
		if (!this._matchLiteral("b64'")) return;
		const match = this._exec(BASE64_RE);
		const base64Part = match !== null ? match[0] : "";
		this._position += base64Part.length;
		if (this._source[this._position] !== "'") {
			this._tokenEnd = this._position;
			throw DcborParseError.invalidBase64String(this.span);
		}
		this._position++;
		this._tokenEnd = this._position;
		const bytes = base64Part.length < 2 ? void 0 : base64ToBytes(base64Part);
		if (bytes === void 0) throw DcborParseError.invalidBase64String(this.span);
		return this._done({
			type: "ByteStringBase64",
			value: bytes
		});
	}
	_tryMatchKnownValue() {
		if (this._source[this._position] !== "'") return;
		if (this._source[this._position + 1] === "'") {
			this._position += 2;
			return this._done({
				type: "KnownValueName",
				value: ""
			});
		}
		let match = this._exec(KNOWN_VALUE_NUMBER_RE);
		if (match !== null) {
			const fullMatch = match[0];
			const numStr = match[1];
			this._position += fullMatch.length;
			this._tokenEnd = this._position;
			const value = parseU64(numStr);
			if (value === void 0) throw DcborParseError.invalidKnownValue(numStr, span$1(this._tokenStart + 1, this._tokenEnd - 1));
			return this._done({
				type: "KnownValueNumber",
				value
			});
		}
		match = this._exec(KNOWN_VALUE_NAME_RE);
		if (match !== null) {
			const fullMatch = match[0];
			const name = match[1];
			this._position += fullMatch.length;
			return this._done({
				type: "KnownValueName",
				value: name
			});
		}
		this._position++;
		this._tokenEnd = this._position;
		throw DcborParseError.unrecognizedToken(this.span);
	}
	_tryMatchUR() {
		const match = this._exec(UR_RE);
		if (match === null) return void 0;
		const fullMatch = match[0];
		this._position += fullMatch.length;
		this._tokenEnd = this._position;
		let value;
		try {
			value = UR.parse(fullMatch);
		} catch (e) {
			const cause = e instanceof Error ? e.message : String(e);
			throw DcborParseError.invalidUr(cause, this.span);
		}
		return this._done({
			type: "UR",
			value
		});
	}
	_tryMatchPunctuation() {
		const kind = PUNCTUATION.get(this._source[this._position]);
		if (kind === void 0) return void 0;
		this._position++;
		return this._done({ type: kind });
	}
	/** Runs a sticky regex at the current position. */
	_exec(re) {
		re.lastIndex = this._position;
		return re.exec(this._source);
	}
	_matchLiteral(literal) {
		if (this._source.startsWith(literal, this._position)) {
			this._position += literal.length;
			return true;
		}
		return false;
	}
};
const MAX_U64 = (1n << 64n) - 1n;
/**
* A string of decimal digits as an unsigned 64-bit integer: a `number` when
* it fits `Number.MAX_SAFE_INTEGER`, a `bigint` above that, `undefined`
* beyond `2⁶⁴ − 1`. The callers' regular expressions guarantee the digits.
*/
function parseU64(digits) {
	if (digits.length < 16) return Number(digits);
	const value = BigInt(digits);
	if (value > MAX_U64) return void 0;
	return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value;
}
const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
/**
* Decodes standard base64 strictly: the length is a multiple of four, `=`
* appears only as the last one or two characters, every other character is
* in the alphabet, and the bits left over in the last sextet are zero.
* `undefined` when any of that fails.
*/
function base64ToBytes(text) {
	if (text.length % 4 !== 0) return void 0;
	const padding = text.endsWith("==") ? 2 : text.endsWith("=") ? 1 : 0;
	const body = text.slice(0, text.length - padding);
	const out = new Uint8Array(text.length / 4 * 3 - padding);
	let acc = 0;
	let bits = 0;
	let o = 0;
	for (const ch of body) {
		const v = BASE64_ALPHABET.indexOf(ch);
		if (v < 0) return void 0;
		acc = acc << 6 | v;
		bits += 6;
		if (bits >= 8) {
			bits -= 8;
			out[o++] = acc >> bits & 255;
			acc &= (1 << bits) - 1;
		}
	}
	if (bits > 0 && acc !== 0) return void 0;
	return out;
}
//#endregion
//#region ../bc-dcbor-parse-ts/dist/index.mjs
/**
* The parser: dCBOR diagnostic notation → `Cbor`.
*/
const DEFAULT_MAX_DEPTH = 1e3;
function requireSource(fn, src) {
	if (typeof src !== "string") throw new TypeError(`${fn}: src must be a string`);
}
/** @internal Validates `options` and fills in the defaults; a wrong type is a `TypeError`. */
function resolveOptions(fn, options) {
	if (options === void 0) return {
		tags: getGlobalTagsStore(),
		knownValues: getGlobalKnownValuesStore(),
		maxDepth: DEFAULT_MAX_DEPTH,
		depth: 0
	};
	if (typeof options !== "object" || options === null) throw new TypeError(`${fn}: options must be an object`);
	const { tags, knownValues, maxDepth } = options;
	if (tags !== void 0 && !hasMethod(tags, "tagForName")) throw new TypeError(`${fn}: options.tags must be a tags store (an object with tagForName)`);
	if (knownValues !== void 0 && !hasMethod(knownValues, "byName")) throw new TypeError(`${fn}: options.knownValues must be a known-value resolver (an object with byName)`);
	if (maxDepth !== void 0 && (typeof maxDepth !== "number" || !Number.isInteger(maxDepth) || maxDepth < 1)) throw new TypeError(`${fn}: options.maxDepth must be a positive integer`);
	return {
		tags: tags ?? getGlobalTagsStore(),
		knownValues: knownValues ?? getGlobalKnownValuesStore(),
		maxDepth: maxDepth ?? DEFAULT_MAX_DEPTH,
		depth: 0
	};
}
function hasMethod(value, name) {
	return (typeof value === "object" || typeof value === "function") && value !== null && typeof value[name] === "function";
}
/** Whether anything but whitespace and comments follows; unrecognised text counts as more. */
function hasMore(lexer) {
	try {
		return lexer.next() !== void 0;
	} catch (e) {
		if (DcborParseError.isDcborParseError(e)) return true;
		throw e;
	}
}
/**
* Parses the first dCBOR item of `src` and reports how much of the source
* it consumed, leaving the rest for the caller.
*
* @throws {DcborParseError} for text that does not parse
* @throws {TypeError} for a `src` that is not a string or an option of the wrong type
*/
function parseDcborPrefix(src, options) {
	requireSource("parseDcborPrefix", src);
	const ctx = resolveOptions("parseDcborPrefix", options);
	const lexer = new Lexer$1(src);
	const value = parseItemToken(expectFirstToken(lexer), lexer, ctx);
	const length = hasMore(lexer) ? lexer.span.start : src.length;
	return Object.freeze({
		value,
		length
	});
}
/** `parseDcborPrefix` as a `Result` instead of a throw; the `TypeError` contract of `tryParseDcbor` applies. */
function tryParseDcborPrefix(src, options) {
	try {
		return {
			ok: true,
			value: parseDcborPrefix(src, options)
		};
	} catch (e) {
		if (DcborParseError.isDcborParseError(e)) return {
			ok: false,
			error: e
		};
		throw e;
	}
}
function expectFirstToken(lexer) {
	try {
		return expectToken(lexer);
	} catch (e) {
		if (DcborParseError.isDcborParseError(e) && e.code === "UnexpectedEndOfInput") throw DcborParseError.emptyInput();
		throw e;
	}
}
function parseItem$1(lexer, ctx) {
	return parseItemToken(expectToken(lexer), lexer, ctx);
}
/** The next token; end of input and unrecognised text are errors. */
function expectToken(lexer) {
	const spanBefore = lexer.span;
	let token;
	try {
		token = lexer.next();
	} catch (e) {
		if (DcborParseError.isDcborParseError(e) && e.code === "UnrecognizedToken") throw DcborParseError.unrecognizedToken(spanBefore);
		throw e;
	}
	if (token === void 0) throw DcborParseError.unexpectedEndOfInput();
	return token;
}
/** Enters one nesting level at `opening`, or throws `NestingTooDeep`. */
function enter(ctx, opening) {
	if (ctx.depth >= ctx.maxDepth) throw DcborParseError.nestingTooDeep(ctx.maxDepth, opening);
	ctx.depth++;
}
function parseItemToken(token, lexer, ctx) {
	switch (token.type) {
		case "Bool": return cbor(token.value);
		case "Null": return cbor(null);
		case "ByteStringHex":
		case "ByteStringBase64": return cbor(token.value);
		case "DateLiteral": return cbor(token.value);
		case "Number": return cbor(token.value);
		case "NaN": return cbor(NaN);
		case "Infinity": return cbor(Number.POSITIVE_INFINITY);
		case "NegInfinity": return cbor(Number.NEGATIVE_INFINITY);
		case "String": return cbor(token.value);
		case "UR": {
			const urType = token.value.type.name;
			const tag = ctx.tags.tagForName(urType)?.value;
			if (tag !== void 0) return taggedValue(tag, token.value.cbor);
			throw DcborParseError.unknownUrType(urType, span$1(token.span.start + 3, token.span.start + 3 + urType.length));
		}
		case "TagValue": return parseNumberTag(token, lexer, ctx);
		case "TagName": return parseNameTag(token, lexer, ctx);
		case "KnownValueNumber": return new KnownValue(token.value).toCbor();
		case "KnownValueName": {
			const knownValue = ctx.knownValues.byName(token.value);
			if (knownValue !== void 0) return knownValue.toCbor();
			if (token.value === "") return new KnownValue(0).toCbor();
			throw DcborParseError.unknownKnownValueName(token.value, span$1(token.span.start + 1, token.span.end - 1));
		}
		case "Unit": return new KnownValue(0).toCbor();
		case "BracketOpen": return parseArray(token, lexer, ctx);
		case "BraceOpen": return parseMap(token, lexer, ctx);
		case "BraceClose":
		case "BracketClose":
		case "ParenthesisOpen":
		case "ParenthesisClose":
		case "Colon":
		case "Comma": throw DcborParseError.unexpectedToken(token.type, lexer.slice, token.span);
	}
}
function parseNumberTag(token, lexer, ctx) {
	enter(ctx, token.span);
	const item = parseItem$1(lexer, ctx);
	const close = expectCloseParenthesis(lexer);
	ctx.depth--;
	if (close.type === "ParenthesisClose") return taggedValue(token.value, item);
	throw DcborParseError.unmatchedParentheses(close.span);
}
function expectCloseParenthesis(lexer) {
	try {
		return expectToken(lexer);
	} catch (e) {
		if (DcborParseError.isDcborParseError(e) && e.code === "UnexpectedEndOfInput") throw DcborParseError.unmatchedParentheses(lexer.span);
		throw e;
	}
}
function parseNameTag(token, lexer, ctx) {
	const tagSpan = span$1(token.span.start, token.span.end - 1);
	enter(ctx, token.span);
	const item = parseItem$1(lexer, ctx);
	const close = expectToken(lexer);
	ctx.depth--;
	if (close.type === "ParenthesisClose") {
		const tag = ctx.tags.tagForName(token.value)?.value;
		if (tag !== void 0) return taggedValue(tag, item);
		throw DcborParseError.unknownTagName(token.value, tagSpan);
	}
	throw DcborParseError.unmatchedParentheses(close.span);
}
function parseArray(opening, lexer, ctx) {
	enter(ctx, opening.span);
	const items = [];
	let awaitsComma = false;
	let awaitsItem = false;
	for (;;) {
		const token = expectToken(lexer);
		if (token.type === "BracketClose" && !awaitsItem) {
			ctx.depth--;
			return cbor(items);
		}
		if (token.type === "Comma" && awaitsComma) {
			awaitsItem = true;
			awaitsComma = false;
			continue;
		}
		if (awaitsComma) throw DcborParseError.expectedComma(token.span);
		items.push(parseItemToken(token, lexer, ctx));
		awaitsItem = false;
		awaitsComma = true;
	}
}
function parseMap(opening, lexer, ctx) {
	enter(ctx, opening.span);
	const map = new CborMap();
	let awaitsComma = false;
	let awaitsKey = false;
	for (;;) {
		let token;
		try {
			token = expectToken(lexer);
		} catch (e) {
			if (DcborParseError.isDcborParseError(e) && e.code === "UnexpectedEndOfInput") throw DcborParseError.unmatchedBraces(lexer.span);
			throw e;
		}
		if (token.type === "BraceClose" && !awaitsKey) {
			ctx.depth--;
			return cbor(map);
		}
		if (token.type === "Comma" && awaitsComma) {
			awaitsKey = true;
			awaitsComma = false;
			continue;
		}
		if (awaitsComma) throw DcborParseError.expectedComma(token.span);
		const key = parseItemToken(token, lexer, ctx);
		const keySpan = lexer.span;
		if (map.has(key)) throw DcborParseError.duplicateMapKey(keySpan);
		let colon;
		try {
			colon = expectToken(lexer);
		} catch {
			colon = void 0;
		}
		if (colon?.type !== "Colon") throw DcborParseError.expectedColon(lexer.span);
		let value;
		try {
			value = parseItem$1(lexer, ctx);
		} catch (e) {
			if (DcborParseError.isDcborParseError(e) && e.code === "UnexpectedToken" && e.details.kind === "BraceClose") throw DcborParseError.expectedMapKey(e.details.span);
			throw e;
		}
		map.set(key, value);
		awaitsKey = false;
		awaitsComma = true;
	}
}
//#endregion
//#region src/parse/token.ts
/**
* Copyright © 2023-2026 Blockchain Commons, LLC
*
*
* Token types and Lexer for the dCBOR pattern language.
*
* This module provides tokenization for dCBOR pattern expressions,
* converting input strings into a sequence of tokens for parsing.
*
* @module parse/token
*/
/**
* Simple keywords that map directly to tokens.
*/
const KEYWORDS = {
	tagged: { type: "Tagged" },
	array: { type: "Array" },
	map: { type: "Map" },
	bool: { type: "Bool" },
	bstr: { type: "ByteString" },
	date: { type: "Date" },
	known: { type: "Known" },
	null: { type: "Null" },
	number: { type: "Number" },
	text: { type: "Text" },
	digest: { type: "Digest" },
	search: { type: "Search" },
	true: { type: "BoolTrue" },
	false: { type: "BoolFalse" },
	NaN: { type: "NaN" },
	Infinity: { type: "Infinity" }
};
/**
* Check if a character is whitespace.
*/
const isWhitespace = (ch) => {
	return ch === " " || ch === "	" || ch === "\r" || ch === "\n" || ch === "\f";
};
/**
* Check if a character is a digit.
*/
const isDigit = (ch) => {
	return ch >= "0" && ch <= "9";
};
/**
* Check if a character is a hex digit.
*/
const isHexDigit = (ch) => {
	return ch >= "0" && ch <= "9" || ch >= "a" && ch <= "f" || ch >= "A" && ch <= "F";
};
/**
* Check if a character is an identifier start character.
*/
const isIdentStart = (ch) => {
	return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch === "_";
};
/**
* Check if a character is an identifier continuation character.
*/
const isIdentCont = (ch) => {
	return isIdentStart(ch) || isDigit(ch);
};
/**
* Parse a hex string to bytes.
*/
const hexToBytes = (hex) => {
	if (hex.length % 2 !== 0) return;
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		const byte = parseInt(hex.slice(i, i + 2), 16);
		if (isNaN(byte)) return;
		bytes[i / 2] = byte;
	}
	return bytes;
};
/**
* Lexer state for tokenizing dCBOR pattern expressions.
*/
var Lexer = class {
	_input;
	_position;
	constructor(input) {
		this._input = input;
		this._position = 0;
	}
	/**
	* Creates a new lexer for the given input.
	*/
	/**
	* Returns the input string.
	*/
	input() {
		return this._input;
	}
	/**
	* Returns the current position in the input.
	*/
	position() {
		return this._position;
	}
	/**
	* Returns the remaining input.
	*/
	remainder() {
		return this._input.slice(this._position);
	}
	/**
	* Peeks at the current character without consuming it.
	*/
	peek() {
		return this._input[this._position];
	}
	/**
	* Peeks at the character at offset from current position.
	*/
	peekAt(offset) {
		return this._input[this._position + offset];
	}
	/**
	* Consumes and returns the current character.
	*/
	advance() {
		const ch = this._input[this._position];
		if (ch !== void 0) this._position++;
		return ch;
	}
	/**
	* Advances by n characters.
	*/
	bump(n) {
		this._position += n;
	}
	/**
	* Creates a span from start to current position.
	*/
	spanFrom(start) {
		return span(start, this._position);
	}
	/**
	* Skips whitespace characters.
	*/
	skipWhitespace() {
		while (this._position < this._input.length && isWhitespace(this._input[this._position])) this._position++;
	}
	/**
	* Checks if the remainder starts with the given string.
	*/
	startsWith(s) {
		return this._input.slice(this._position).startsWith(s);
	}
	/**
	* Gets the next token.
	*/
	next() {
		this.skipWhitespace();
		if (this._position >= this._input.length) return;
		const start = this._position;
		const ch = this.peek() ?? "";
		if (this.startsWith("-Infinity")) {
			this.bump(9);
			return Ok({
				token: { type: "NegInfinity" },
				span: this.spanFrom(start)
			});
		}
		if (this.startsWith("...")) {
			this.bump(3);
			return Ok({
				token: { type: "Ellipsis" },
				span: this.spanFrom(start)
			});
		}
		if (this.startsWith(">=")) {
			this.bump(2);
			return Ok({
				token: { type: "GreaterThanOrEqual" },
				span: this.spanFrom(start)
			});
		}
		if (this.startsWith("<=")) {
			this.bump(2);
			return Ok({
				token: { type: "LessThanOrEqual" },
				span: this.spanFrom(start)
			});
		}
		if (this.startsWith("*?")) {
			this.bump(2);
			return Ok({
				token: { type: "RepeatZeroOrMoreLazy" },
				span: this.spanFrom(start)
			});
		}
		if (this.startsWith("*+")) {
			this.bump(2);
			return Ok({
				token: { type: "RepeatZeroOrMorePossessive" },
				span: this.spanFrom(start)
			});
		}
		if (this.startsWith("+?")) {
			this.bump(2);
			return Ok({
				token: { type: "RepeatOneOrMoreLazy" },
				span: this.spanFrom(start)
			});
		}
		if (this.startsWith("++")) {
			this.bump(2);
			return Ok({
				token: { type: "RepeatOneOrMorePossessive" },
				span: this.spanFrom(start)
			});
		}
		if (this.startsWith("??")) {
			this.bump(2);
			return Ok({
				token: { type: "RepeatZeroOrOneLazy" },
				span: this.spanFrom(start)
			});
		}
		if (this.startsWith("?+")) {
			this.bump(2);
			return Ok({
				token: { type: "RepeatZeroOrOnePossessive" },
				span: this.spanFrom(start)
			});
		}
		switch (ch) {
			case "&":
				this.advance();
				return Ok({
					token: { type: "And" },
					span: this.spanFrom(start)
				});
			case "|":
				this.advance();
				return Ok({
					token: { type: "Or" },
					span: this.spanFrom(start)
				});
			case "!":
				this.advance();
				return Ok({
					token: { type: "Not" },
					span: this.spanFrom(start)
				});
			case "*":
				this.advance();
				return Ok({
					token: { type: "RepeatZeroOrMore" },
					span: this.spanFrom(start)
				});
			case "+":
				this.advance();
				return Ok({
					token: { type: "RepeatOneOrMore" },
					span: this.spanFrom(start)
				});
			case "?":
				this.advance();
				return Ok({
					token: { type: "RepeatZeroOrOne" },
					span: this.spanFrom(start)
				});
			case "(":
				this.advance();
				return Ok({
					token: { type: "ParenOpen" },
					span: this.spanFrom(start)
				});
			case ")":
				this.advance();
				return Ok({
					token: { type: "ParenClose" },
					span: this.spanFrom(start)
				});
			case "[":
				this.advance();
				return Ok({
					token: { type: "BracketOpen" },
					span: this.spanFrom(start)
				});
			case "]":
				this.advance();
				return Ok({
					token: { type: "BracketClose" },
					span: this.spanFrom(start)
				});
			case "}":
				this.advance();
				return Ok({
					token: { type: "BraceClose" },
					span: this.spanFrom(start)
				});
			case ",":
				this.advance();
				return Ok({
					token: { type: "Comma" },
					span: this.spanFrom(start)
				});
			case ":":
				this.advance();
				return Ok({
					token: { type: "Colon" },
					span: this.spanFrom(start)
				});
			case ">":
				this.advance();
				return Ok({
					token: { type: "GreaterThan" },
					span: this.spanFrom(start)
				});
			case "<":
				this.advance();
				return Ok({
					token: { type: "LessThan" },
					span: this.spanFrom(start)
				});
		}
		if (ch === "{") {
			this.advance();
			return this.parseBraceOpen(start);
		}
		if (ch === "\"") {
			this.advance();
			return this.parseString(start);
		}
		if (ch === "'") {
			this.advance();
			return this.parseSingleQuoted(start);
		}
		if (ch === "/") {
			this.advance();
			return this.parseRegex(start);
		}
		if (ch === "@") {
			this.advance();
			return this.parseGroupName(start);
		}
		if (ch === "h" && this.peekAt(1) === "'") {
			this.bump(2);
			if (this.peek() === "/") {
				this.advance();
				return this.parseHexRegex(start);
			}
			return this.parseHexString(start);
		}
		if (isDigit(ch) || ch === "-" && isDigit(this.peekAt(1) ?? "")) return this.parseNumber(start);
		if (isIdentStart(ch)) return this.parseIdentifierOrKeyword(start);
		this.advance();
		return Err({
			type: "UnrecognizedToken",
			span: this.spanFrom(start)
		});
	}
	/**
	* Tokenizes the entire input and returns all tokens.
	*/
	tokenize() {
		const tokens = [];
		while (true) {
			const result = this.next();
			if (result === void 0) break;
			if (!result.ok) return result;
			tokens.push(result.value);
		}
		return Ok(tokens);
	}
	/**
	* Parse { - could be BraceOpen or Range.
	*/
	parseBraceOpen(start) {
		const remainder = this.remainder();
		let pos = 0;
		while (pos < remainder.length && isWhitespace(remainder[pos])) pos++;
		if (pos < remainder.length && isDigit(remainder[pos])) {
			if (this.looksLikeRangePattern(remainder.slice(pos))) return this.parseRange(start);
		}
		return Ok({
			token: { type: "BraceOpen" },
			span: this.spanFrom(start)
		});
	}
	/**
	* Check if content looks like a range pattern.
	*/
	looksLikeRangePattern(content) {
		let i = 0;
		while (i < content.length && isWhitespace(content[i])) i++;
		if (i >= content.length || !isDigit(content[i])) return false;
		while (i < content.length && isDigit(content[i])) i++;
		while (i < content.length && isWhitespace(content[i])) i++;
		if (i < content.length) {
			const ch = content[i];
			if (ch === ":") return false;
			return ch === "," || ch === "}";
		}
		return false;
	}
	/**
	* Parse a range pattern like {1,5} or {3,} or {5}.
	*/
	parseRange(start) {
		this.skipWhitespace();
		const minStart = this._position;
		let peeked = this.peek();
		while (peeked !== void 0 && isDigit(peeked)) {
			this.advance();
			peeked = this.peek();
		}
		if (this._position === minStart) return Err({
			type: "InvalidRange",
			span: this.spanFrom(start)
		});
		const min = parseInt(this._input.slice(minStart, this._position), 10);
		this.skipWhitespace();
		let max;
		const nextCh = this.peek();
		if (nextCh === ",") {
			this.advance();
			this.skipWhitespace();
			const afterComma = this.peek();
			if (afterComma === "}") {
				this.advance();
				max = void 0;
			} else if (afterComma !== void 0 && isDigit(afterComma)) {
				const maxStart = this._position;
				let maxPeeked = this.peek();
				while (maxPeeked !== void 0 && isDigit(maxPeeked)) {
					this.advance();
					maxPeeked = this.peek();
				}
				max = parseInt(this._input.slice(maxStart, this._position), 10);
				this.skipWhitespace();
				if (this.peek() !== "}") return Err({
					type: "InvalidRange",
					span: this.spanFrom(start)
				});
				this.advance();
			} else return Err({
				type: "InvalidRange",
				span: this.spanFrom(start)
			});
		} else if (nextCh === "}") {
			this.advance();
			max = min;
		} else return Err({
			type: "InvalidRange",
			span: this.spanFrom(start)
		});
		let reluctance = Reluctance.Greedy;
		const modCh = this.peek();
		if (modCh === "?") {
			this.advance();
			reluctance = Reluctance.Lazy;
		} else if (modCh === "+") {
			this.advance();
			reluctance = Reluctance.Possessive;
		}
		if (max !== void 0 && min > max) return Err({
			type: "InvalidRange",
			span: this.spanFrom(start)
		});
		const quantifier = max !== void 0 ? Quantifier.between(min, max, reluctance) : Quantifier.atLeast(min, reluctance);
		return Ok({
			token: {
				type: "Range",
				quantifier
			},
			span: this.spanFrom(start)
		});
	}
	/**
	* Parse a string literal.
	*/
	parseString(start) {
		let result = "";
		let escape = false;
		while (this._position < this._input.length) {
			const ch = this.advance() ?? "";
			if (escape) {
				switch (ch) {
					case "\"":
						result += "\"";
						break;
					case "\\":
						result += "\\";
						break;
					case "n":
						result += "\n";
						break;
					case "r":
						result += "\r";
						break;
					case "t":
						result += "	";
						break;
					default:
						result += "\\";
						result += ch;
				}
				escape = false;
			} else if (ch === "\\") escape = true;
			else if (ch === "\"") return Ok({
				token: {
					type: "StringLiteral",
					value: result
				},
				span: this.spanFrom(start)
			});
			else result += ch;
		}
		return Err({
			type: "UnterminatedString",
			span: this.spanFrom(start)
		});
	}
	/**
	* Parse a single-quoted string.
	*/
	parseSingleQuoted(start) {
		let result = "";
		let escape = false;
		while (this._position < this._input.length) {
			const ch = this.advance() ?? "";
			if (escape) {
				switch (ch) {
					case "'":
						result += "'";
						break;
					case "\\":
						result += "\\";
						break;
					case "n":
						result += "\n";
						break;
					case "r":
						result += "\r";
						break;
					case "t":
						result += "	";
						break;
					default:
						result += "\\";
						result += ch;
				}
				escape = false;
			} else if (ch === "\\") escape = true;
			else if (ch === "'") return Ok({
				token: {
					type: "SingleQuoted",
					value: result
				},
				span: this.spanFrom(start)
			});
			else result += ch;
		}
		return Err({
			type: "UnterminatedString",
			span: this.spanFrom(start)
		});
	}
	/**
	* Parse a regex pattern.
	*/
	parseRegex(start) {
		let pattern = "";
		let escape = false;
		while (this._position < this._input.length) {
			const ch = this.advance() ?? "";
			if (escape) {
				pattern += ch;
				escape = false;
			} else if (ch === "\\") {
				pattern += ch;
				escape = true;
			} else if (ch === "/") {
				try {
					new RegExp(pattern);
				} catch {
					return Err({
						type: "InvalidRegex",
						span: this.spanFrom(start)
					});
				}
				return Ok({
					token: {
						type: "Regex",
						pattern
					},
					span: this.spanFrom(start)
				});
			} else pattern += ch;
		}
		return Err({
			type: "UnterminatedRegex",
			span: this.spanFrom(start)
		});
	}
	/**
	* Parse a group name.
	*/
	parseGroupName(start) {
		const nameStart = this._position;
		if (!isIdentStart(this.peek() ?? "")) return Err({
			type: "InvalidCaptureGroupName",
			name: "",
			span: this.spanFrom(start)
		});
		let identCh = this.peek();
		while (identCh !== void 0 && isIdentCont(identCh)) {
			this.advance();
			identCh = this.peek();
		}
		const name = this._input.slice(nameStart, this._position);
		return Ok({
			token: {
				type: "GroupName",
				name
			},
			span: this.spanFrom(start)
		});
	}
	/**
	* Parse a hex string.
	*/
	parseHexString(start) {
		let hex = "";
		while (this._position < this._input.length) {
			const ch = this.peek() ?? "";
			if (ch === "'") {
				this.advance();
				const bytes = hexToBytes(hex);
				if (bytes === void 0) return Err({
					type: "InvalidHexString",
					span: this.spanFrom(start)
				});
				return Ok({
					token: {
						type: "HexString",
						value: bytes
					},
					span: this.spanFrom(start)
				});
			} else if (isHexDigit(ch)) {
				hex += ch;
				this.advance();
			} else return Err({
				type: "InvalidHexString",
				span: this.spanFrom(start)
			});
		}
		return Err({
			type: "UnterminatedHexString",
			span: this.spanFrom(start)
		});
	}
	/**
	* Parse a hex regex pattern.
	*/
	parseHexRegex(start) {
		let pattern = "";
		let escape = false;
		while (this._position < this._input.length) {
			const ch = this.advance() ?? "";
			if (escape) {
				pattern += ch;
				escape = false;
			} else if (ch === "\\") {
				pattern += ch;
				escape = true;
			} else if (ch === "/") {
				if (this.peek() === "'") {
					this.advance();
					try {
						new RegExp(pattern);
					} catch {
						return Err({
							type: "InvalidRegex",
							span: this.spanFrom(start)
						});
					}
					return Ok({
						token: {
							type: "HexRegex",
							pattern
						},
						span: this.spanFrom(start)
					});
				}
				pattern += ch;
			} else pattern += ch;
		}
		return Err({
			type: "UnterminatedRegex",
			span: this.spanFrom(start)
		});
	}
	/**
	* Parse a number literal using dcbor-parse for consistency with dCBOR.
	*/
	parseNumber(start) {
		const numStart = this._position;
		if (this.peek() === "-") this.advance();
		if (this.peek() === "0") this.advance();
		else if (isDigit(this.peek() ?? "")) while (isDigit(this.peek() ?? "")) this.advance();
		else return Err({
			type: "InvalidNumberFormat",
			span: this.spanFrom(start)
		});
		if (this.peek() === "." && this.peekAt(1) !== ".") {
			this.advance();
			if (!isDigit(this.peek() ?? "")) return Err({
				type: "InvalidNumberFormat",
				span: this.spanFrom(start)
			});
			while (isDigit(this.peek() ?? "")) this.advance();
		}
		if (this.peek() === "e" || this.peek() === "E") {
			this.advance();
			if (this.peek() === "+" || this.peek() === "-") this.advance();
			if (!isDigit(this.peek() ?? "")) return Err({
				type: "InvalidNumberFormat",
				span: this.spanFrom(start)
			});
			while (isDigit(this.peek() ?? "")) this.advance();
		}
		const parseResult = tryParseDcborPrefix(this._input.slice(numStart, this._position));
		if (!parseResult.ok) return Err({
			type: "InvalidNumberFormat",
			span: this.spanFrom(start)
		});
		const numValue = asNumber(parseResult.value.value);
		if (numValue === void 0) return Err({
			type: "InvalidNumberFormat",
			span: this.spanFrom(start)
		});
		const value = typeof numValue === "bigint" ? Number(numValue) : numValue;
		if (!isFinite(value)) return Err({
			type: "InvalidNumberFormat",
			span: this.spanFrom(start)
		});
		return Ok({
			token: {
				type: "NumberLiteral",
				value
			},
			span: this.spanFrom(start)
		});
	}
	/**
	* Parse an identifier or keyword.
	*/
	parseIdentifierOrKeyword(start) {
		const identStart = this._position;
		let identCh = this.peek();
		while (identCh !== void 0 && isIdentCont(identCh)) {
			this.advance();
			identCh = this.peek();
		}
		const ident = this._input.slice(identStart, this._position);
		if (ident === "date" && this.peek() === "'") {
			this.advance();
			return this.parseDateQuoted(start);
		}
		if (ident === "digest" && this.peek() === "'") {
			this.advance();
			return this.parseDigestQuoted(start);
		}
		const keyword = KEYWORDS[ident];
		if (keyword !== void 0) return Ok({
			token: keyword,
			span: this.spanFrom(start)
		});
		return Err({
			type: "UnrecognizedToken",
			span: this.spanFrom(start)
		});
	}
	/**
	* Parse a date quoted pattern.
	*/
	parseDateQuoted(start) {
		let content = "";
		while (this._position < this._input.length) {
			const ch = this.advance() ?? "";
			if (ch === "'") {
				if (content.length === 0) return Err({
					type: "InvalidDateFormat",
					span: this.spanFrom(start)
				});
				return Ok({
					token: {
						type: "DateQuoted",
						value: content
					},
					span: this.spanFrom(start)
				});
			}
			content += ch;
		}
		return Err({
			type: "UnterminatedDateQuoted",
			span: this.spanFrom(start)
		});
	}
	/**
	* Parse a digest quoted pattern.
	*/
	parseDigestQuoted(start) {
		let content = "";
		while (this._position < this._input.length) {
			const ch = this.advance() ?? "";
			if (ch === "'") {
				if (content.length === 0) return Err({
					type: "InvalidDigestPattern",
					message: "empty content",
					span: this.spanFrom(start)
				});
				return Ok({
					token: {
						type: "DigestQuoted",
						value: content
					},
					span: this.spanFrom(start)
				});
			}
			content += ch;
		}
		return Err({
			type: "UnterminatedDigestQuoted",
			span: this.spanFrom(start)
		});
	}
	/**
	* Peeks at the next token without consuming it.
	* Returns a Result with the token or undefined if at end of input.
	*/
	peekToken() {
		const savedPosition = this._position;
		const result = this.next();
		this._position = savedPosition;
		if (result === void 0) return;
		if (!result.ok) return result;
		return Ok(result.value.token);
	}
	/**
	* Returns the current span (position to position).
	*/
	span() {
		return span(this._position, this._position);
	}
	/**
	* Returns the last token's span.
	*/
	lastSpan() {
		return span(this._position, this._position);
	}
};
//#endregion
//#region src/parse/value/bool-parser.ts
/**
* Parse a boolean pattern from the `bool` keyword.
*/
const parseBool = (_lexer) => {
	return Ok(anyBool());
};
/**
* Parse a `true` literal.
*/
const parseBoolTrue = (_lexer) => {
	return Ok(boolean(true));
};
/**
* Parse a `false` literal.
*/
const parseBoolFalse = (_lexer) => {
	return Ok(boolean(false));
};
//#endregion
//#region src/parse/value/null-parser.ts
/**
* Parse a null pattern from the `null` keyword.
*/
const parseNull = (_lexer) => {
	return Ok(nullValue());
};
//#endregion
//#region src/parse/value/number-parser.ts
/**
* Parse a number pattern from the `number` keyword.
*/
const parseNumber = (_lexer) => {
	return Ok(anyNumber());
};
//#endregion
//#region src/parse/value/text-parser.ts
/**
* Parse a text pattern from the `text` keyword.
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
const parseText = (_lexer) => {
	return Ok(anyText());
};
//#endregion
//#region src/parse/value/bytestring-parser.ts
/**
* Parse a bytestring pattern from the `bytes` keyword.
*/
const parseByteString = (_lexer) => {
	return Ok(anyByteString());
};
/**
* Parse a hex string token result into a pattern.
*/
const parseHexStringToken = (hexResult) => {
	if (!hexResult.ok) return hexResult;
	return Ok(byteString(hexResult.value));
};
/**
* Parse a hex regex token result into a pattern.
*
* In TypeScript, binary regex matching is implemented by converting bytes to Latin-1 strings.
* This mimics Rust's regex::bytes::Regex behavior where each byte 0-255 maps to a character.
*/
const parseHexRegexToken = (regexResult) => {
	if (!regexResult.ok) return regexResult;
	return Ok(byteStringRegex(regexResult.value));
};
//#endregion
//#region src/parse/value/date-parser.ts
/**
* Parse a date pattern from the `date` keyword.
*/
const parseDate = (_lexer) => {
	return Ok({
		kind: "Value",
		pattern: {
			type: "Date",
			pattern: datePatternAny()
		}
	});
};
//#endregion
//#region src/parse/value/digest-parser.ts
/**
* Parse a digest pattern from the `digest` keyword.
*/
const parseDigest = (_lexer) => {
	return Ok({
		kind: "Value",
		pattern: {
			type: "Digest",
			pattern: digestPatternAny()
		}
	});
};
//#endregion
//#region src/parse/value/known-value-parser.ts
/**
* Parse a known value pattern from the `known` keyword.
*/
const parseKnownValue = (_lexer) => {
	return Ok({
		kind: "Value",
		pattern: {
			type: "KnownValue",
			pattern: knownValuePatternAny()
		}
	});
};
//#endregion
//#region src/parse/parse-registry.ts
/**
* The registered parseOr function.
*/
let parseOrFn;
/**
* Registers the parseOr function.
*/
const setParseOrFn = (fn) => {
	parseOrFn = fn;
};
/**
* Calls the registered parseOr function.
*/
const parseOrFromRegistry = (lexer) => {
	if (parseOrFn === void 0) throw new Error("ParseOr function not initialized. Import parse/index to initialize.");
	return parseOrFn(lexer);
};
//#endregion
//#region src/parse/structure/tagged-parser.ts
/**
* Copyright © 2023-2026 Blockchain Commons, LLC
*
*
* Tagged pattern parser.
*
* Supports the following syntax:
* - `tagged` - matches any tagged value
* - `tagged(value, pattern)` - matches tagged value with specific u64 tag and content pattern
* - `tagged(name, pattern)` - matches tagged value with named tag and content pattern
* - `tagged(/regex/, pattern)` - matches tagged value with tag name matching regex and content pattern
*
* @module parse/structure/tagged-parser
*/
/**
* Parse a tagged pattern from the `tagged` keyword.
*
* Supports:
* - `tagged` - matches any tagged value
* - `tagged(value, pattern)` - matches tagged value with specific tag number
* - `tagged(name, pattern)` - matches tagged value with named tag
* - `tagged(/regex/, pattern)` - matches tagged value with tag name matching regex
*/
const parseTagged = (lexer) => {
	const peeked = lexer.peekToken();
	if (peeked === void 0 || !peeked.ok || peeked.value.type !== "ParenOpen") return Ok(anyTagged());
	lexer.next();
	const remainder = lexer.remainder();
	const remainderStart = lexer.position();
	const innerResult = parseTaggedInner(remainder, remainderStart);
	if (!innerResult.ok) return innerResult;
	const [tagSelector, contentPattern, consumed] = innerResult.value;
	lexer.bump(consumed);
	const closeResult = lexer.next();
	if (closeResult === void 0) return Err({
		type: "ExpectedCloseParen",
		span: lexer.span()
	});
	if (!closeResult.ok) return closeResult;
	if (closeResult.value.token.type !== "ParenClose") return Err({
		type: "ExpectedCloseParen",
		span: closeResult.value.span
	});
	let taggedPattern;
	switch (tagSelector.type) {
		case "Value": {
			const tag = Tag.from(tagSelector.value);
			taggedPattern = taggedPatternWithTag(tag, contentPattern);
			break;
		}
		case "Name":
			taggedPattern = taggedPatternWithName(tagSelector.name, contentPattern);
			break;
		case "Regex": taggedPattern = taggedPatternWithRegex(tagSelector.regex, contentPattern);
	}
	return Ok({
		kind: "Structure",
		pattern: {
			type: "Tagged",
			pattern: taggedPattern
		}
	});
};
/**
* Parse the inner content of tagged(selector, pattern).
* Returns [TagSelector, Pattern, consumed_bytes].
*/
const parseTaggedInner = (src, remainderStart) => {
	let pos = 0;
	skipWhitespace(src, (p) => pos = p, pos);
	let tagSelector;
	if (src[pos] === "/") {
		const regexResult = parseTextRegex(src, pos);
		if (!regexResult.ok) return regexResult;
		const [regex, newPos] = regexResult.value;
		pos = newPos;
		tagSelector = {
			type: "Regex",
			regex
		};
	} else {
		const wordResult = parseBareWord(src, pos);
		if (!wordResult.ok) return wordResult;
		const [word, newPos] = wordResult.value;
		pos = newPos;
		if (/^\d+$/.test(word)) {
			const big = BigInt(word);
			if (big > 18446744073709551615n) tagSelector = {
				type: "Name",
				name: word
			};
			else tagSelector = {
				type: "Value",
				value: big <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(big) : big
			};
		} else tagSelector = {
			type: "Name",
			name: word
		};
	}
	skipWhitespace(src, (p) => pos = p, pos);
	if (pos >= src.length || src[pos] !== ",") return Err({ type: "UnexpectedEndOfInput" });
	pos += 1;
	skipWhitespace(src, (p) => pos = p, pos);
	const patternStart = pos;
	let parenDepth = 0;
	while (pos < src.length) {
		const ch = src[pos];
		if (ch === "(") parenDepth += 1;
		else if (ch === ")") {
			if (parenDepth === 0) break;
			parenDepth -= 1;
		}
		pos += 1;
	}
	const patternSrc = src.slice(patternStart, pos);
	const trimmedPattern = patternSrc.trim();
	const trimOffset = patternSrc.length - patternSrc.trimStart().length;
	const contentLexer = new Lexer(trimmedPattern);
	let contentResult = parseOrFromRegistry(contentLexer);
	if (contentResult.ok && contentLexer.position() < trimmedPattern.length) contentResult = Err({
		type: "ExtraData",
		span: {
			start: contentLexer.position(),
			end: trimmedPattern.length
		}
	});
	if (!contentResult.ok) {
		const error = contentResult.error;
		if ("span" in error) {
			const offset = remainderStart + patternStart + trimOffset;
			const adjustedSpan = {
				start: error.span.start + offset,
				end: error.span.end + offset
			};
			return Err({
				...error,
				span: adjustedSpan
			});
		}
		return contentResult;
	}
	return Ok([
		tagSelector,
		contentResult.value,
		pos
	]);
};
/**
* Parse a regex from the input string starting with /
*/
const parseTextRegex = (src, startPos) => {
	let pos = startPos;
	skipWhitespace(src, (p) => pos = p, pos);
	if (pos >= src.length || src[pos] !== "/") return Err({
		type: "UnterminatedRegex",
		span: {
			start: pos,
			end: pos
		}
	});
	pos += 1;
	const start = pos;
	let escape = false;
	while (pos < src.length) {
		const ch = src[pos];
		pos += 1;
		if (escape) {
			escape = false;
			continue;
		}
		if (ch === "\\") {
			escape = true;
			continue;
		}
		if (ch === "/") {
			const inner = src.slice(start, pos - 1);
			try {
				const regex = new RegExp(inner);
				skipWhitespace(src, (p) => pos = p, pos);
				return Ok([regex, pos]);
			} catch {
				return Err({
					type: "InvalidRegex",
					span: {
						start,
						end: pos
					}
				});
			}
		}
	}
	return Err({
		type: "UnterminatedRegex",
		span: {
			start: pos,
			end: pos
		}
	});
};
/**
* Parse a bare word (alphanumeric with hyphens and underscores).
*/
const parseBareWord = (src, startPos) => {
	let pos = startPos;
	skipWhitespace(src, (p) => pos = p, pos);
	const start = pos;
	while (pos < src.length) {
		const ch = src[pos];
		if (" 	\n\r\f,)".includes(ch)) break;
		pos += 1;
	}
	if (start === pos) return Err({ type: "UnexpectedEndOfInput" });
	const word = src.slice(start, pos);
	skipWhitespace(src, (p) => pos = p, pos);
	return Ok([word, pos]);
};
/**
* Skip whitespace characters.
*/
const skipWhitespace = (src, setPos, pos) => {
	while (pos < src.length && " 	\n\r\f".includes(src[pos])) pos += 1;
	setPos(pos);
};
//#endregion
//#region src/parse/structure/array-parser.ts
/**
* Parse a bracket array pattern: [pattern] or [{n}] etc.
*/
const parseBracketArray = (lexer) => {
	const peeked = lexer.peekToken();
	if (peeked === void 0) return Err({ type: "UnexpectedEndOfInput" });
	if (!peeked.ok) return peeked;
	const token = peeked.value;
	if (token.type === "Range") {
		lexer.next();
		const pattern = arrayPatternWithLengthInterval(token.quantifier.interval());
		const closeResult = lexer.next();
		if (closeResult === void 0) return Err({
			type: "ExpectedCloseBracket",
			span: lexer.span()
		});
		if (!closeResult.ok) return closeResult;
		if (closeResult.value.token.type !== "BracketClose") return Err({
			type: "ExpectedCloseBracket",
			span: closeResult.value.span
		});
		return Ok({
			kind: "Structure",
			pattern: {
				type: "Array",
				pattern
			}
		});
	}
	if (token.type === "BracketClose") {
		lexer.next();
		return Ok({
			kind: "Structure",
			pattern: {
				type: "Array",
				pattern: arrayPatternWithLengthInterval(Interval.atLeast(0))
			}
		});
	}
	const elementPattern = parseArrayOr(lexer);
	if (!elementPattern.ok) return elementPattern;
	const pattern = arrayPatternWithElements(elementPattern.value);
	const closeResult = lexer.next();
	if (closeResult === void 0) return Err({
		type: "ExpectedCloseBracket",
		span: lexer.span()
	});
	if (!closeResult.ok) return closeResult;
	if (closeResult.value.token.type !== "BracketClose") return Err({
		type: "ExpectedCloseBracket",
		span: closeResult.value.span
	});
	return Ok({
		kind: "Structure",
		pattern: {
			type: "Array",
			pattern
		}
	});
};
/**
* Parse OR patterns within array context.
*/
const parseArrayOr = (lexer) => {
	const patterns = [];
	const first = parseArrayAnd(lexer);
	if (!first.ok) return first;
	patterns.push(first.value);
	while (true) {
		const peeked = lexer.peekToken();
		if (peeked === void 0 || !peeked.ok || peeked.value.type !== "Or") break;
		lexer.next();
		const next = parseArrayAnd(lexer);
		if (!next.ok) return next;
		patterns.push(next.value);
	}
	if (patterns.length === 1) return Ok(patterns[0]);
	return Ok(or(...patterns));
};
/**
* Parse AND patterns within array context.
*/
const parseArrayAnd = (lexer) => {
	const patterns = [];
	const first = parseArrayNot(lexer);
	if (!first.ok) return first;
	patterns.push(first.value);
	while (true) {
		const peeked = lexer.peekToken();
		if (peeked === void 0 || !peeked.ok || peeked.value.type !== "And") break;
		lexer.next();
		const next = parseArrayNot(lexer);
		if (!next.ok) return next;
		patterns.push(next.value);
	}
	if (patterns.length === 1) return Ok(patterns[0]);
	return Ok(and(...patterns));
};
/**
* Parse NOT patterns within array context.
*/
const parseArrayNot = (lexer) => {
	const peeked = lexer.peekToken();
	if (peeked !== void 0 && peeked.ok && peeked.value.type === "Not") {
		lexer.next();
		const inner = parseArrayNot(lexer);
		if (!inner.ok) return inner;
		return Ok(not(inner.value));
	}
	return parseArraySequence(lexer);
};
/**
* Parse sequence patterns within array context (comma-separated).
*/
const parseArraySequence = (lexer) => {
	const patterns = [];
	const first = parseOrFromRegistry(lexer);
	if (!first.ok) return first;
	patterns.push(first.value);
	while (true) {
		const peeked = lexer.peekToken();
		if (peeked === void 0 || !peeked.ok || peeked.value.type !== "Comma") break;
		lexer.next();
		const next = parseOrFromRegistry(lexer);
		if (!next.ok) return next;
		patterns.push(next.value);
	}
	if (patterns.length === 1) return Ok(patterns[0]);
	return Ok(sequence(...patterns));
};
//#endregion
//#region src/parse/structure/map-parser.ts
/**
* Parse a bracket map pattern: {pattern: pattern} or {{n}} etc.
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
const parseBracketMap = (lexer) => {
	const peeked = lexer.peekToken();
	if (peeked === void 0) return Err({ type: "UnexpectedEndOfInput" });
	if (!peeked.ok) return peeked;
	const token = peeked.value;
	if (token.type === "Range") {
		lexer.next();
		const pattern = mapPatternWithLengthInterval(token.quantifier.interval());
		const closeResult = lexer.next();
		if (closeResult === void 0) return Err({
			type: "ExpectedCloseBrace",
			span: lexer.span()
		});
		if (!closeResult.ok) return closeResult;
		if (closeResult.value.token.type !== "BraceClose") return Err({
			type: "ExpectedCloseBrace",
			span: closeResult.value.span
		});
		return Ok({
			kind: "Structure",
			pattern: {
				type: "Map",
				pattern
			}
		});
	}
	const constraints = [];
	while (true) {
		const keyResult = parseOrFromRegistry(lexer);
		if (!keyResult.ok) return keyResult;
		const colonResult = lexer.next();
		if (colonResult === void 0) return Err({
			type: "ExpectedColon",
			span: lexer.span()
		});
		if (!colonResult.ok) return colonResult;
		if (colonResult.value.token.type !== "Colon") return Err({
			type: "ExpectedColon",
			span: colonResult.value.span
		});
		const valueResult = parseOrFromRegistry(lexer);
		if (!valueResult.ok) return valueResult;
		constraints.push([keyResult.value, valueResult.value]);
		const nextToken = lexer.peekToken();
		if (nextToken?.ok !== true) return Err({ type: "UnexpectedEndOfInput" });
		if (nextToken.value.type === "BraceClose") {
			lexer.next();
			break;
		}
		if (nextToken.value.type === "Comma") {
			lexer.next();
			continue;
		}
		return Err({
			type: "UnexpectedToken",
			token: nextToken.value,
			span: lexer.span()
		});
	}
	return Ok({
		kind: "Structure",
		pattern: {
			type: "Map",
			pattern: mapPatternWithConstraints(constraints)
		}
	});
};
//#endregion
//#region src/parse/meta/capture-parser.ts
/**
* Parse a capture pattern of the form `@name(pattern)`.
*/
const parseCapture = (lexer, name) => {
	const openResult = lexer.next();
	if (openResult === void 0) return Err({ type: "UnexpectedEndOfInput" });
	if (!openResult.ok) return openResult;
	if (openResult.value.token.type !== "ParenOpen") return Err({
		type: "UnexpectedToken",
		token: openResult.value.token,
		span: openResult.value.span
	});
	const innerResult = parseOrFromRegistry(lexer);
	if (!innerResult.ok) return innerResult;
	const closeResult = lexer.next();
	if (closeResult === void 0) return Err({
		type: "ExpectedCloseParen",
		span: lexer.span()
	});
	if (!closeResult.ok) return closeResult;
	if (closeResult.value.token.type !== "ParenClose") return Err({
		type: "ExpectedCloseParen",
		span: closeResult.value.span
	});
	return Ok(capture(name, innerResult.value));
};
//#endregion
//#region src/parse/meta/search-parser.ts
/**
* Parse a search pattern `...(pattern)`.
*/
const parseSearch = (lexer) => {
	const openResult = lexer.next();
	if (openResult === void 0) return Err({ type: "UnexpectedEndOfInput" });
	if (!openResult.ok) return openResult;
	if (openResult.value.token.type !== "ParenOpen") return Err({
		type: "UnexpectedToken",
		token: openResult.value.token,
		span: openResult.value.span
	});
	const innerResult = parseOrFromRegistry(lexer);
	if (!innerResult.ok) return innerResult;
	const closeResult = lexer.next();
	if (closeResult === void 0) return Err({
		type: "ExpectedCloseParen",
		span: lexer.span()
	});
	if (!closeResult.ok) return closeResult;
	if (closeResult.value.token.type !== "ParenClose") return Err({
		type: "ExpectedCloseParen",
		span: closeResult.value.span
	});
	return Ok(search(innerResult.value));
};
//#endregion
//#region src/parse/meta/repeat-parser.ts
/**
* Parse quantifier tokens that follow a grouped pattern.
*/
const parseQuantifier = (pattern, lexer, forceRepeat) => {
	const peeked = lexer.peekToken();
	if (peeked?.ok !== true) {
		if (forceRepeat) return Ok(wrapInRepeat(pattern, Quantifier.exactly(1)));
		return Ok(pattern);
	}
	const token = peeked.value;
	switch (token.type) {
		case "RepeatZeroOrMore":
			lexer.next();
			return Ok(wrapInRepeat(pattern, Quantifier.zeroOrMore()));
		case "RepeatZeroOrMoreLazy":
			lexer.next();
			return Ok(wrapInRepeat(pattern, Quantifier.zeroOrMore(Reluctance.Lazy)));
		case "RepeatZeroOrMorePossessive":
			lexer.next();
			return Ok(wrapInRepeat(pattern, Quantifier.zeroOrMore(Reluctance.Possessive)));
		case "RepeatOneOrMore":
			lexer.next();
			return Ok(wrapInRepeat(pattern, Quantifier.oneOrMore()));
		case "RepeatOneOrMoreLazy":
			lexer.next();
			return Ok(wrapInRepeat(pattern, Quantifier.oneOrMore(Reluctance.Lazy)));
		case "RepeatOneOrMorePossessive":
			lexer.next();
			return Ok(wrapInRepeat(pattern, Quantifier.oneOrMore(Reluctance.Possessive)));
		case "RepeatZeroOrOne":
			lexer.next();
			return Ok(wrapInRepeat(pattern, Quantifier.zeroOrOne()));
		case "RepeatZeroOrOneLazy":
			lexer.next();
			return Ok(wrapInRepeat(pattern, Quantifier.zeroOrOne(Reluctance.Lazy)));
		case "RepeatZeroOrOnePossessive":
			lexer.next();
			return Ok(wrapInRepeat(pattern, Quantifier.zeroOrOne(Reluctance.Possessive)));
		case "Range":
			lexer.next();
			return Ok(wrapInRepeat(pattern, token.quantifier));
		case "And":
		case "Or":
		case "Not":
		case "Tagged":
		case "Array":
		case "Map":
		case "Bool":
		case "ByteString":
		case "Date":
		case "Known":
		case "Null":
		case "Number":
		case "Text":
		case "Digest":
		case "Search":
		case "BoolTrue":
		case "BoolFalse":
		case "NaN":
		case "Infinity":
		case "NegInfinity":
		case "ParenOpen":
		case "ParenClose":
		case "BracketOpen":
		case "BracketClose":
		case "BraceOpen":
		case "BraceClose":
		case "Comma":
		case "Colon":
		case "Ellipsis":
		case "GreaterThanOrEqual":
		case "LessThanOrEqual":
		case "GreaterThan":
		case "LessThan":
		case "NumberLiteral":
		case "GroupName":
		case "StringLiteral":
		case "SingleQuoted":
		case "Regex":
		case "HexString":
		case "HexRegex":
		case "DateQuoted":
		case "DigestQuoted":
			if (forceRepeat) return Ok(wrapInRepeat(pattern, Quantifier.exactly(1)));
			return Ok(pattern);
	}
};
/**
* Wrap a pattern in a RepeatPattern with the given quantifier.
*/
const wrapInRepeat = (pattern, quantifier) => ({
	kind: "Meta",
	pattern: {
		type: "Repeat",
		pattern: repeatPattern(pattern, quantifier)
	}
});
//#endregion
//#region src/parse/meta/primary-parser.ts
/**
* Copyright © 2023-2026 Blockchain Commons, LLC
*
*
* Primary pattern parser - handles atomic patterns.
*
* @module parse/meta/primary-parser
*/
/**
* Parse a primary pattern - the most basic unit of pattern matching.
*/
const parsePrimary = (lexer) => {
	const tokenResult = lexer.next();
	if (tokenResult === void 0) return Err({ type: "UnexpectedEndOfInput" });
	if (!tokenResult.ok) return tokenResult;
	const spanned = tokenResult.value;
	const token = spanned.token;
	switch (token.type) {
		case "RepeatZeroOrMore": return Ok(any());
		case "Search": return parseSearch(lexer);
		case "ParenOpen": {
			const patternResult = parseOrFromRegistry(lexer);
			if (!patternResult.ok) return patternResult;
			const closeResult = lexer.next();
			if (closeResult === void 0) return Err({
				type: "ExpectedCloseParen",
				span: lexer.span()
			});
			if (!closeResult.ok) return closeResult;
			if (closeResult.value.token.type !== "ParenClose") return Err({
				type: "ExpectedCloseParen",
				span: closeResult.value.span
			});
			return parseQuantifier(patternResult.value, lexer, true);
		}
		case "GroupName": return parseCapture(lexer, token.name);
		case "Bool": return parseBool(lexer);
		case "BoolTrue": return parseBoolTrue(lexer);
		case "BoolFalse": return parseBoolFalse(lexer);
		case "ByteString": return parseByteString(lexer);
		case "Date": return parseDate(lexer);
		case "Digest": return parseDigest(lexer);
		case "DigestQuoted": return parseDigestQuotedContent(token.value, spanned.span);
		case "DateQuoted": return parseDateQuotedContent(token.value, spanned.span);
		case "Known": return parseKnownValue(lexer);
		case "Null": return parseNull(lexer);
		case "Number": return parseNumber(lexer);
		case "Text": return parseText(lexer);
		case "StringLiteral": return Ok(text(token.value));
		case "SingleQuoted": return parseSingleQuotedAsKnownValue(token.value);
		case "Regex": try {
			const regex = new RegExp(token.pattern);
			return Ok(textRegex(regex));
		} catch {
			return Err({
				type: "InvalidRegex",
				span: spanned.span
			});
		}
		case "HexString": return parseHexStringToken(Ok(token.value));
		case "HexRegex": try {
			const regex = new RegExp(token.pattern);
			return parseHexRegexToken(Ok(regex));
		} catch {
			return Err({
				type: "InvalidRegex",
				span: spanned.span
			});
		}
		case "Tagged": return parseTagged(lexer);
		case "Array": return Ok(anyArray());
		case "Map": return Ok(anyMap());
		case "BracketOpen": return parseBracketArray(lexer);
		case "BraceOpen": return parseBracketMap(lexer);
		case "Range": return Ok({
			kind: "Structure",
			pattern: {
				type: "Map",
				pattern: mapPatternWithLengthInterval(token.quantifier.interval())
			}
		});
		case "NumberLiteral": {
			const peeked = lexer.peekToken();
			if (peeked !== void 0 && peeked.ok && peeked.value.type === "Ellipsis") {
				lexer.next();
				const endResult = lexer.next();
				if (endResult === void 0) return Err({ type: "UnexpectedEndOfInput" });
				if (!endResult.ok) return endResult;
				if (endResult.value.token.type !== "NumberLiteral") return Err({
					type: "UnexpectedToken",
					token: endResult.value.token,
					span: endResult.value.span
				});
				return Ok(numberRange(token.value, endResult.value.token.value));
			}
			return Ok(number(token.value));
		}
		case "NaN": return Ok({
			kind: "Value",
			pattern: {
				type: "Number",
				pattern: numberPatternNaN()
			}
		});
		case "Infinity": return Ok({
			kind: "Value",
			pattern: {
				type: "Number",
				pattern: numberPatternInfinity()
			}
		});
		case "NegInfinity": return Ok({
			kind: "Value",
			pattern: {
				type: "Number",
				pattern: numberPatternNegInfinity()
			}
		});
		case "GreaterThanOrEqual": {
			const numResult = lexer.next();
			if (numResult === void 0) return Err({ type: "UnexpectedEndOfInput" });
			if (!numResult.ok) return numResult;
			if (numResult.value.token.type !== "NumberLiteral") return Err({
				type: "UnexpectedToken",
				token: numResult.value.token,
				span: numResult.value.span
			});
			return Ok({
				kind: "Value",
				pattern: {
					type: "Number",
					pattern: numberPatternGreaterThanOrEqual(numResult.value.token.value)
				}
			});
		}
		case "LessThanOrEqual": {
			const numResult = lexer.next();
			if (numResult === void 0) return Err({ type: "UnexpectedEndOfInput" });
			if (!numResult.ok) return numResult;
			if (numResult.value.token.type !== "NumberLiteral") return Err({
				type: "UnexpectedToken",
				token: numResult.value.token,
				span: numResult.value.span
			});
			return Ok({
				kind: "Value",
				pattern: {
					type: "Number",
					pattern: numberPatternLessThanOrEqual(numResult.value.token.value)
				}
			});
		}
		case "GreaterThan": {
			const numResult = lexer.next();
			if (numResult === void 0) return Err({ type: "UnexpectedEndOfInput" });
			if (!numResult.ok) return numResult;
			if (numResult.value.token.type !== "NumberLiteral") return Err({
				type: "UnexpectedToken",
				token: numResult.value.token,
				span: numResult.value.span
			});
			return Ok({
				kind: "Value",
				pattern: {
					type: "Number",
					pattern: numberPatternGreaterThan(numResult.value.token.value)
				}
			});
		}
		case "LessThan": {
			const numResult = lexer.next();
			if (numResult === void 0) return Err({ type: "UnexpectedEndOfInput" });
			if (!numResult.ok) return numResult;
			if (numResult.value.token.type !== "NumberLiteral") return Err({
				type: "UnexpectedToken",
				token: numResult.value.token,
				span: numResult.value.span
			});
			return Ok({
				kind: "Value",
				pattern: {
					type: "Number",
					pattern: numberPatternLessThan(numResult.value.token.value)
				}
			});
		}
		case "And":
		case "Or":
		case "Not":
		case "RepeatZeroOrMoreLazy":
		case "RepeatZeroOrMorePossessive":
		case "RepeatOneOrMore":
		case "RepeatOneOrMoreLazy":
		case "RepeatOneOrMorePossessive":
		case "RepeatZeroOrOne":
		case "RepeatZeroOrOneLazy":
		case "RepeatZeroOrOnePossessive":
		case "ParenClose":
		case "BracketClose":
		case "BraceClose":
		case "Comma":
		case "Colon":
		case "Ellipsis": return Err({
			type: "UnexpectedToken",
			token,
			span: spanned.span
		});
	}
};
/**
* Parse a single-quoted pattern as a known value.
*
* This handles the non-prefixed single-quoted syntax:
* - 'value' -> known value by numeric ID
* - 'name' -> known value by name
* - '/regex/' -> known value by regex
*/
const parseSingleQuotedAsKnownValue = (value) => {
	if (value.startsWith("/") && value.endsWith("/") && value.length > 2) {
		const regexStr = value.slice(1, -1);
		try {
			const regex = new RegExp(regexStr);
			return Ok({
				kind: "Value",
				pattern: {
					type: "KnownValue",
					pattern: knownValuePatternRegex(regex)
				}
			});
		} catch {
			return Err({
				type: "InvalidRegex",
				span: {
					start: 0,
					end: value.length
				}
			});
		}
	}
	if (/^\d+$/.test(value)) {
		const numericValue = BigInt(value);
		if (numericValue <= 18446744073709551615n) {
			const knownValue = new KnownValue(numericValue);
			return Ok({
				kind: "Value",
				pattern: {
					type: "KnownValue",
					pattern: knownValuePatternValue(knownValue)
				}
			});
		}
	}
	return Ok({
		kind: "Value",
		pattern: {
			type: "KnownValue",
			pattern: knownValuePatternNamed(value)
		}
	});
};
/**
* Parse the body of a `digest'…'` literal.
*
* version runs in the lexer (the token payload is already a
* `Result<DigestPattern>`); the TS lexer keeps the raw content and
* delegates to this helper so the parser surface stays minimal. The
* dispatch order and error variants are identical to Rust.
*/
const parseDigestQuotedContent = (content, span) => {
	if (content.length === 0) return Err({
		type: "InvalidDigestPattern",
		message: "empty content",
		span
	});
	if (content.startsWith("ur:")) try {
		const digest = decodeURWith(UR.parse(content), Digest.codec);
		return Ok({
			kind: "Value",
			pattern: {
				type: "Digest",
				pattern: digestPatternValue(digest)
			}
		});
	} catch (e) {
		return Err({
			type: "InvalidUr",
			message: e instanceof Error ? e.message : String(e),
			span
		});
	}
	if (content.startsWith("/") && content.endsWith("/") && content.length > 2) {
		const regexBody = content.slice(1, -1);
		try {
			const regex = new RegExp(regexBody);
			return Ok({
				kind: "Value",
				pattern: {
					type: "Digest",
					pattern: digestPatternBinaryRegex(regex)
				}
			});
		} catch {
			return Err({
				type: "InvalidRegex",
				span
			});
		}
	}
	if (/^[0-9a-fA-F]+$/.test(content)) {
		if (content.length % 2 !== 0) return Err({
			type: "InvalidHexString",
			span
		});
		if (content.length > 64) return Err({
			type: "InvalidHexString",
			span
		});
		const bytes = new Uint8Array(content.length / 2);
		for (let i = 0; i < content.length; i += 2) bytes[i / 2] = parseInt(content.slice(i, i + 2), 16);
		return Ok({
			kind: "Value",
			pattern: {
				type: "Digest",
				pattern: digestPatternPrefix(bytes)
			}
		});
	}
	return Err({
		type: "InvalidDigestPattern",
		message: content,
		span
	});
};
/**
* Parse the body of a `date'…'` literal.
*
*   - empty content              → InvalidDateFormat.
*   - `/regex/`                  → DatePattern.Regex.
*   - `...iso`                   → DatePattern.Latest.
*   - `iso...`                   → DatePattern.Earliest.
*   - `iso1...iso2`              → DatePattern.Range.
*   - single ISO-8601            → DatePattern.Value.
*   - anything else              → InvalidDateFormat.
*/
const parseDateQuotedContent = (content, span) => {
	if (content.length === 0) return Err({
		type: "InvalidDateFormat",
		span
	});
	if (content.startsWith("/") && content.endsWith("/") && content.length > 2) {
		const regexBody = content.slice(1, -1);
		try {
			const regex = new RegExp(regexBody);
			return Ok({
				kind: "Value",
				pattern: {
					type: "Date",
					pattern: datePatternRegex(regex)
				}
			});
		} catch {
			return Err({
				type: "InvalidRegex",
				span
			});
		}
	}
	const tryParseDate = (s) => {
		try {
			return CborDate.fromString(s);
		} catch {
			return;
		}
	};
	if (content.includes("...")) {
		if (content.startsWith("...")) {
			const date = tryParseDate(content.slice(3));
			if (date === void 0) return Err({
				type: "InvalidDateFormat",
				span
			});
			return Ok({
				kind: "Value",
				pattern: {
					type: "Date",
					pattern: datePatternLatest(date)
				}
			});
		}
		if (content.endsWith("...")) {
			const date = tryParseDate(content.slice(0, -3));
			if (date === void 0) return Err({
				type: "InvalidDateFormat",
				span
			});
			return Ok({
				kind: "Value",
				pattern: {
					type: "Date",
					pattern: datePatternEarliest(date)
				}
			});
		}
		const parts = content.split("...");
		if (parts.length !== 2) return Err({
			type: "InvalidDateFormat",
			span
		});
		const start = tryParseDate(parts[0]);
		const end = tryParseDate(parts[1]);
		if (start === void 0 || end === void 0) return Err({
			type: "InvalidDateFormat",
			span
		});
		return Ok({
			kind: "Value",
			pattern: {
				type: "Date",
				pattern: datePatternRange(start, end)
			}
		});
	}
	const date = tryParseDate(content);
	if (date === void 0) return Err({
		type: "InvalidDateFormat",
		span
	});
	return Ok({
		kind: "Value",
		pattern: {
			type: "Date",
			pattern: datePatternValue(date)
		}
	});
};
//#endregion
//#region src/parse/meta/not-parser.ts
/**
* Parse a NOT pattern or delegate to primary parser.
*/
const parseNot = (lexer) => {
	const peeked = lexer.peekToken();
	if (peeked !== void 0 && peeked.ok && peeked.value.type === "Not") {
		lexer.next();
		const inner = parseNot(lexer);
		if (!inner.ok) return inner;
		return Ok(not(inner.value));
	}
	return parsePrimary(lexer);
};
//#endregion
//#region src/parse/meta/and-parser.ts
/**
* Parse an AND pattern.
*/
const parseAnd = (lexer) => {
	const patterns = [];
	const first = parseNot(lexer);
	if (!first.ok) return first;
	patterns.push(first.value);
	while (true) {
		const peeked = lexer.peekToken();
		if (peeked?.ok !== true) break;
		if (peeked.value.type !== "And") break;
		lexer.next();
		const next = parseNot(lexer);
		if (!next.ok) return next;
		patterns.push(next.value);
	}
	if (patterns.length === 1) return Ok(patterns[0]);
	return Ok(and(...patterns));
};
//#endregion
//#region src/parse/meta/or-parser.ts
/**
* Parse an OR pattern - the top-level pattern parser.
*/
const parseOr = (lexer) => {
	const patterns = [];
	const first = parseAnd(lexer);
	if (!first.ok) return first;
	patterns.push(first.value);
	while (true) {
		const peeked = lexer.peekToken();
		if (peeked?.ok !== true) break;
		if (peeked.value.type !== "Or") break;
		lexer.next();
		const next = parseAnd(lexer);
		if (!next.ok) return next;
		patterns.push(next.value);
	}
	if (patterns.length === 1) return Ok(patterns[0]);
	return Ok(or(...patterns));
};
//#endregion
//#region src/parse/index.ts
setParseOrFn(parseOr);
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
const parseAllFailure = (input) => {
	const result = parsePrefix(input);
	if (!result.ok) return result;
	const [pattern, consumed] = result.value;
	if (consumed < input.length) return Err({
		type: "ExtraData",
		span: {
			start: consumed,
			end: input.length
		}
	});
	return Ok(pattern);
};
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
const parsePrefix = (input) => {
	const lexer = new Lexer(input);
	const patternResult = parseOr(lexer);
	if (!patternResult.ok) return patternResult;
	const consumed = lexer.position();
	return Ok([patternResult.value, consumed]);
};
const ok = (value) => ({
	ok: true,
	value
});
const err = (failure) => ({
	ok: false,
	error: new DcborPatternError(failure)
});
/**
* Parses a whole pattern string.
*
* @throws {DcborPatternError} If the string is not a pattern, or has trailing input
*/
function parsePattern(input) {
	const r = parseAllFailure(input);
	if (r.ok) return r.value;
	throw new DcborPatternError(r.error);
}
/** `parsePattern` without throwing. */
function tryParsePattern(input) {
	const r = parseAllFailure(input);
	return r.ok ? ok(r.value) : err(r.error);
}
/**
* Parses the pattern at the start of `input` and reports how much it
* consumed, for languages that embed patterns.
*
* @throws {DcborPatternError} If no pattern starts the input
*/
function parsePatternPrefix(input) {
	const r = parsePrefix(input);
	if (r.ok) return {
		pattern: r.value[0],
		length: r.value[1]
	};
	throw new DcborPatternError(r.error);
}
/** `parsePatternPrefix` without throwing. */
function tryParsePatternPrefix(input) {
	const r = parsePrefix(input);
	return r.ok ? ok({
		pattern: r.value[0],
		length: r.value[1]
	}) : err(r.error);
}
//#endregion
//#region ../bc-dcbor-ts/dist/diag-BojJpiTF.mjs
/**
* String helpers for the diagnostic and hex-dump formatters.
*
* @module string-util
*/
/**
* Flank a string with left and right strings.
*
* @param s - String to flank
* @param left - Left flanking string
* @param right - Right flanking string
* @returns Flanked string
*/
const flanked = (s, left, right) => left + s + right;
const resolveOpts = (opts) => {
	const summarize = opts?.summarize ?? false;
	return {
		annotate: opts?.annotate ?? false,
		summarize,
		flat: summarize || (opts?.flat ?? false),
		tags: opts?.tags ?? "global"
	};
};
/**
* Format a CBOR value - or a walk visitor's `WalkElement` - as CBOR
* diagnostic notation.
*
* ```typescript
* diagnostic(value);                       // pretty-printed
* diagnostic(value, { flat: true });       // single line
* diagnostic(value, { annotate: true });   // tag names as annotations
* diagnostic(value, { summarize: true });  // registered summarizers (implies flat)
* ```
*
* @param input - CBOR value, or a `WalkElement` from a walk visitor
* @param opts - Formatting options (explicit `undefined` fields mean
*   "use the default")
* @public
*/
function diagnostic(input, opts) {
	const state = resolveOpts(opts);
	if (typeof input === "object" && "type" in input && (input.type === "single" || input.type === "keyvalue")) {
		if (input.type === "single") return diagFormat(diagItem(input.cbor, state), state);
		return `${diagFormat(diagItem(input.key, state), state)}: ${diagFormat(diagItem(input.value, state), state)}`;
	}
	return diagFormat(diagItem(input, state), state);
}
const item = (value) => ({
	kind: "item",
	value
});
const group$1 = (begin, end, items, isPairs, comment) => {
	const g = {
		kind: "group",
		begin,
		end,
		items,
		isPairs
	};
	if (comment !== void 0) g.comment = comment;
	return g;
};
const isGroup = (i) => i.kind === "group";
const containsGroup = (i) => i.kind === "group" && i.items.some(isGroup);
/**
* The UTF-8 length of a rendered item (the reference measures `str::len()`,
* bytes, not UTF-16 units), without encoding it.
*/
const utf8Length = (text) => {
	let n = 0;
	for (const ch of text) {
		const cp = ch.codePointAt(0) ?? 0;
		n += cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
	}
	return n;
};
const totalStringsLen = (i) => i.kind === "item" ? utf8Length(i.value) : i.items.reduce((acc, c) => acc + totalStringsLen(c), 0);
const greatestStringsLen = (i) => i.kind === "item" ? utf8Length(i.value) : i.items.reduce((acc, c) => Math.max(acc, totalStringsLen(c)), 0);
/**
* Alternates between `pairSeparator` (after even-indexed items - keys) and
* `itemSeparator` (after odd-indexed items - values). Uses `itemSeparator`
* throughout when `pairSeparator` is omitted.
*/
function joined(elements, itemSeparator, pairSeparator) {
	const sep = pairSeparator ?? itemSeparator;
	let result = "";
	const len = elements.length;
	for (let i = 0; i < len; i++) {
		result += elements[i];
		if (i !== len - 1) result += (i & 1) !== 0 ? itemSeparator : sep;
	}
	return result;
}
const diagFormat = (i, opts) => diagFormatOpt(i, 0, "", opts);
function diagFormatOpt(i, level, separator, opts) {
	if (i.kind === "item") return formatLine(level, opts, i.value, separator, void 0);
	if (opts.flat !== true && (containsGroup(i) || totalStringsLen(i) > 20 || greatestStringsLen(i) > 20)) return multilineComposition(i, level, separator, opts);
	return singleLineComposition(i, level, separator, opts);
}
function formatLine(level, opts, string, separator, comment) {
	const result = `${opts.flat === true ? "" : " ".repeat(level * 4)}${string}${separator}`;
	if (comment !== void 0) return `${result}   / ${comment} /`;
	return result;
}
function singleLineComposition(i, level, separator, opts) {
	let str;
	let comment;
	if (i.kind === "item") {
		str = i.value;
		comment = void 0;
	} else {
		const components = i.items.map((c) => c.kind === "item" ? c.value : singleLineComposition(c, level + 1, separator, opts));
		const pairSeparator = i.isPairs ? ": " : ", ";
		str = flanked(joined(components, ", ", pairSeparator), i.begin, i.end);
		comment = i.comment;
	}
	return formatLine(level, opts, str, separator, comment);
}
function multilineComposition(i, level, separator, opts) {
	if (i.kind === "item") return i.value;
	const lines = [];
	const openOpts = {
		...opts,
		flat: false
	};
	lines.push(formatLine(level, openOpts, i.begin, "", i.comment));
	for (let idx = 0; idx < i.items.length; idx++) {
		const sep = idx === i.items.length - 1 ? "" : i.isPairs && (idx & 1) === 0 ? ":" : ",";
		lines.push(diagFormatOpt(i.items[idx], level + 1, sep, opts));
	}
	lines.push(formatLine(level, opts, i.end, separator, void 0));
	return lines.join("\n");
}
function diagItem(cbor, opts) {
	switch (cbor.type) {
		case MajorType.Unsigned: return item(formatUnsigned(cbor.value));
		case MajorType.Negative: return item(formatNegative(cbor.value));
		case MajorType.ByteString: return item(formatBytes(cbor.value));
		case MajorType.Text: return item(formatText(cbor.value));
		case MajorType.Array: return item_array(cbor.value, opts);
		case MajorType.Map: return item_map(cbor.value, opts);
		case MajorType.Tagged: return item_tagged(cbor.tag, cbor.value, opts);
		case MajorType.Simple: return item(formatSimple(cbor.value));
	}
}
function item_array(items, opts) {
	return group$1("[", "]", items.map((it) => diagItem(it, opts)), false);
}
function item_map(map, opts) {
	const entries = map?.entriesArray ?? [];
	const flatItems = [];
	for (const e of entries) {
		flatItems.push(diagItem(e.key, opts));
		flatItems.push(diagItem(e.value, opts));
	}
	return group$1("{", "}", flatItems, true);
}
function item_tagged(tag, content, opts) {
	if (opts.summarize === true) {
		const summarizer = resolveTagsStore(opts.tags)?.summarizer(tag);
		if (summarizer !== void 0) {
			const result = summarizer(content, opts.flat ?? false);
			if (result.ok) return item(result.value);
			return item(`<error: ${result.error.message}>`);
		}
	}
	let comment;
	if (opts.annotate === true) {
		const store = resolveTagsStore(opts.tags);
		const tagObj = { value: tag };
		const assignedName = store?.assignedNameForTag(tagObj);
		if (assignedName !== void 0) comment = assignedName;
	}
	return group$1(`${String(tag)}(`, ")", [diagItem(content, opts)], false, comment);
}
function formatUnsigned(value) {
	return String(value);
}
function formatNegative(value) {
	if (typeof value === "bigint") return String(-value - 1n);
	return String(-value - 1);
}
function formatBytes(value) {
	return `h'${bytesToHex$2(value)}'`;
}
function formatText(value) {
	return `"${value.replace(/"/g, "\\\"")}"`;
}
function formatSimple(value) {
	switch (value.type) {
		case "True": return "true";
		case "False": return "false";
		case "Null": return "null";
		case "Float": return formatFloat(value.value);
	}
}
/**
* Format a CBOR float for diagnostic output, with the same rendering
* `hexAnnotated` uses; see {@link floatDisplayString}.
*/
function formatFloat(value) {
	return floatDisplayString(value);
}
function resolveTagsStore(tags) {
	if (tags === "none") return void 0;
	if (tags === "global" || tags === void 0) return getGlobalTagsStore();
	return tags;
}
//#endregion
//#region src/format.ts
const resolve = (o) => ({
	indent: o.indent ?? true,
	elementFormat: o.elementFormat ?? "summary",
	maxLength: o.maxLength,
	lastElementOnly: o.lastElementOnly ?? false
});
const truncateWithEllipsis = (s, maxLength) => {
	if (maxLength === void 0 || s.length <= maxLength) return s;
	if (maxLength > 1) return `${s.slice(0, maxLength - 1)}…`;
	return "…";
};
/**
* Format a single CBOR element according to the specified format.
*
* @internal
* @param cbor - The CBOR value to format
* @param format - The format to use
* @param maxLength - Maximum length before truncation
* @returns The formatted string
*/
const formatCborElement = (cbor, _format, maxLength) => {
	const text = diagnostic(cbor, {
		summarize: true,
		flat: true
	});
	return truncateWithEllipsis(text, maxLength);
};
/**
* Format each path element on its own line, each line successively indented by
* 4 spaces. Options can be provided to customize the formatting.
*
* @param path - The path to format
* @param opts - Formatting options
* @returns The formatted path string
*/
const formatPathWith = (path, opts) => {
	if (opts.lastElementOnly) {
		const lastElement = path[path.length - 1];
		if (lastElement !== void 0) return formatCborElement(lastElement, opts.elementFormat, opts.maxLength);
		return "";
	}
	const lines = [];
	for (let index = 0; index < path.length; index++) {
		const element = path[index];
		const indent = opts.indent ? " ".repeat(index * 4) : "";
		const content = formatCborElement(element, opts.elementFormat, opts.maxLength);
		lines.push(`${indent}${content}`);
	}
	return lines.join("\n");
};
/**
* Format each path element on its own line, each line successively indented by
* 4 spaces.
*
* @param path - The path to format
* @returns The formatted path string
*/
/** One path, one element per line, indented by depth unless `indent` is false. */
const formatPath = (path, options = {}) => formatPathWith(path, resolve(options));
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
/**
* Match paths as text: each capture (sorted by name) as `@name` followed by
* its paths indented, then every path, one element per line.
*/
const formatPaths = (paths, options = {}) => {
	const opts = resolve(options);
	const captures = options.captures ?? /* @__PURE__ */ new Map();
	const result = [];
	const captureNames = Array.from(captures.keys()).sort();
	for (const captureName of captureNames) {
		const capturePaths = captures.get(captureName);
		if (capturePaths !== void 0) {
			result.push(`@${captureName}`);
			for (const path of capturePaths) {
				const formattedPath = formatPathWith(path, opts);
				for (const line of formattedPath.split("\n")) if (line.length > 0) result.push(`    ${line}`);
			}
		}
	}
	for (const path of paths) {
		const formattedPath = formatPathWith(path, opts);
		for (const line of formattedPath.split("\n")) if (line.length > 0) result.push(line);
	}
	return result.join("\n");
};
/**
* Format multiple paths with custom formatting options.
*
* @param paths - The paths to format
* @param opts - Formatting options
* @returns The formatted string
*/
/**
* Format multiple paths with default options.
*
* @param paths - The paths to format
* @returns The formatted string
*/
//#endregion
//#region tests/baseline/entry.ts
function baselineDecodeCbor(bytes) {
	return decodeCbor(bytes);
}
function baselineEncodeCbor(value) {
	return encodeCbor(value);
}
function baselineRegisterTags() {
	registerTags(getGlobalTagsStore());
}
//#endregion
export { DEFAULT_INTERVAL, DEFAULT_QUANTIFIER, DEFAULT_RELUCTANCE, DcborPatternError, DcborPatternErrorCode, Interval, Quantifier, Reluctance, and, any, anyArray, anyBool, anyByteString, anyDate, anyDigest, anyKnownValue, anyMap, anyNumber, anyTagged, anyText, baselineDecodeCbor, baselineEncodeCbor, baselineRegisterTags, boolean, byteString, byteStringRegex, capture, date, dateEarliest, dateIso8601, dateLatest, dateRange, dateRegex, digest, digestBinaryRegex, digestPrefix, display, formatPath, formatPaths, group, knownValue, knownValueNamed, knownValueRegex, matches, not, nullValue, number, numberGreaterThan, numberGreaterThanOrEqual, numberInfinity, numberLessThan, numberLessThanOrEqual, numberNaN, numberNegInfinity, numberRange, or, parsePattern, parsePatternPrefix, paths, pathsWithCaptures, reluctanceSuffix, repeat, search, sequence, span, tagged, taggedName, taggedRegex, text, textRegex, tryParsePattern, tryParsePatternPrefix };
