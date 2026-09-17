/**
 * Pattern constructors: one function per pattern form, composing into the
 * frozen `Pattern` union that `paths`, `matches` and `display` run.
 */
import { type Tag, CborDate } from "@blockchaincommons/dcbor";
import type { Digest } from "@blockchaincommons/components";
import type { KnownValue } from "@blockchaincommons/known-values";
import type { Pattern } from "./index";
import { valuePattern, structurePattern, metaPattern } from "./wrap";
import { boolPatternAny, boolPatternValue } from "./value/bool-pattern";
import { nullPattern as nullPatternCreate } from "./value/null-pattern";
import {
  numberPatternAny,
  numberPatternValue,
  numberPatternRange,
  numberPatternGreaterThan,
  numberPatternGreaterThanOrEqual,
  numberPatternLessThan,
  numberPatternLessThanOrEqual,
  numberPatternNaN,
  numberPatternInfinity,
  numberPatternNegInfinity,
} from "./value/number-pattern";
import { textPatternAny, textPatternValue, textPatternRegex } from "./value/text-pattern";
import {
  byteStringPatternAny,
  byteStringPatternValue,
  byteStringPatternBinaryRegex,
} from "./value/bytestring-pattern";
import {
  datePatternAny,
  datePatternValue,
  datePatternRange,
  datePatternEarliest,
  datePatternLatest,
  datePatternStringValue,
  datePatternRegex,
} from "./value/date-pattern";
import {
  digestPatternAny,
  digestPatternValue,
  digestPatternPrefix,
  digestPatternBinaryRegex,
} from "./value/digest-pattern";
import {
  knownValuePatternAny,
  knownValuePatternValue,
  knownValuePatternNamed,
  knownValuePatternRegex,
} from "./value/known-value-pattern";
import { arrayPatternAny } from "./structure/array-pattern";
import { mapPatternAny } from "./structure/map-pattern";
import {
  taggedPatternAny,
  taggedPatternWithTag,
  taggedPatternWithName,
  taggedPatternWithRegex,
} from "./structure/tagged-pattern";
import { anyPattern as anyPatternCreate } from "./meta/any-pattern";
import { andPattern as andPatternCreate } from "./meta/and-pattern";
import { orPattern as orPatternCreate } from "./meta/or-pattern";
import { notPattern as notPatternCreate } from "./meta/not-pattern";
import { capturePattern as capturePatternCreate } from "./meta/capture-pattern";
import { searchPattern as searchPatternCreate } from "./meta/search-pattern";
import { sequencePattern as sequencePatternCreate } from "./meta/sequence-pattern";
import { repeatPattern as repeatPatternCreate } from "./meta/repeat-pattern";
import { Quantifier } from "../quantifier";
import type { RegexInput } from "../regex";
import {
  requireBytes,
  requireNumber,
  requirePattern,
  requirePatterns,
  requireString,
} from "./guards";

const CAPTURE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TAG_NAME = /^[^\s,()]+$/;

/** `*`: matches any value. */
export const any = (): Pattern => metaPattern({ type: "Any", pattern: anyPatternCreate() });

/** `bool`: matches any boolean. */
export const anyBool = (): Pattern => valuePattern({ type: "Bool", pattern: boolPatternAny() });

/** `true` or `false`: matches that boolean. */
export const bool = (value: boolean): Pattern => {
  if (typeof value !== "boolean") throw new TypeError("value must be a boolean");
  return valuePattern({ type: "Bool", pattern: boolPatternValue(value) });
};

/** `null`: matches null. */
export const nullValue = (): Pattern =>
  valuePattern({ type: "Null", pattern: nullPatternCreate() });

/** `number`: matches any number. */
export const anyNumber = (): Pattern =>
  valuePattern({ type: "Number", pattern: numberPatternAny() });

/** A bare number: matches that number. */
export const number = (value: number): Pattern => {
  if (Number.isNaN(requireNumber(value, "value")))
    throw new RangeError("value must not be NaN; use numberNaN()");
  return valuePattern({ type: "Number", pattern: numberPatternValue(value) });
};

/** `min...max`: matches numbers in the inclusive range. */
export const numberRange = (min: number, max: number): Pattern => {
  requireNumber(min, "min");
  requireNumber(max, "max");
  if (Number.isNaN(min) || Number.isNaN(max)) throw new RangeError("a range bound must not be NaN");
  if (min > max) throw new RangeError("min must not exceed max");
  return valuePattern({ type: "Number", pattern: numberPatternRange(min, max) });
};

/** `>value`. */
export const numberGreaterThan = (value: number): Pattern => {
  if (Number.isNaN(requireNumber(value, "value"))) throw new RangeError("value must not be NaN");
  return valuePattern({ type: "Number", pattern: numberPatternGreaterThan(value) });
};

/** `>=value`. */
export const numberGreaterThanOrEqual = (value: number): Pattern => {
  if (Number.isNaN(requireNumber(value, "value"))) throw new RangeError("value must not be NaN");
  return valuePattern({ type: "Number", pattern: numberPatternGreaterThanOrEqual(value) });
};

/** `<value`. */
export const numberLessThan = (value: number): Pattern => {
  if (Number.isNaN(requireNumber(value, "value"))) throw new RangeError("value must not be NaN");
  return valuePattern({ type: "Number", pattern: numberPatternLessThan(value) });
};

/** `<=value`. */
export const numberLessThanOrEqual = (value: number): Pattern => {
  if (Number.isNaN(requireNumber(value, "value"))) throw new RangeError("value must not be NaN");
  return valuePattern({ type: "Number", pattern: numberPatternLessThanOrEqual(value) });
};

/** `NaN`. */
export const numberNaN = (): Pattern =>
  valuePattern({ type: "Number", pattern: numberPatternNaN() });

/** `Infinity`. */
export const numberInfinity = (): Pattern =>
  valuePattern({ type: "Number", pattern: numberPatternInfinity() });

/** `-Infinity`. */
export const numberNegInfinity = (): Pattern =>
  valuePattern({ type: "Number", pattern: numberPatternNegInfinity() });

/** `text`: matches any text. */
export const anyText = (): Pattern => valuePattern({ type: "Text", pattern: textPatternAny() });

/** `"string"`: matches that text. */
export const text = (value: string): Pattern =>
  valuePattern({ type: "Text", pattern: textPatternValue(requireString(value, "value")) });

/** `/regex/`: matches text the regex matches. */
export const textRegex = (regex: RegexInput): Pattern =>
  valuePattern({ type: "Text", pattern: textPatternRegex(regex) });

/** `bstr`: matches any byte string. */
export const anyByteString = (): Pattern =>
  valuePattern({ type: "ByteString", pattern: byteStringPatternAny() });

/** `h'hex'`: matches those bytes. */
export const byteString = (value: Uint8Array): Pattern =>
  valuePattern({
    type: "ByteString",
    pattern: byteStringPatternValue(requireBytes(value, "value")),
  });

/**
 * `h'/regex/'`: matches byte strings the regex matches, each byte read as
 * one character (`\xNN` names a byte).
 */
export const byteStringRegex = (regex: RegexInput): Pattern =>
  valuePattern({ type: "ByteString", pattern: byteStringPatternBinaryRegex(regex) });

/** `date`: matches any date. */
export const anyDate = (): Pattern => valuePattern({ type: "Date", pattern: datePatternAny() });

/** `date'iso'`: matches that date. */
export const date = (value: CborDate): Pattern =>
  valuePattern({ type: "Date", pattern: datePatternValue(value) });

/** `date'iso...iso'`: matches dates in the inclusive range. */
export const dateRange = (min: CborDate, max: CborDate): Pattern =>
  valuePattern({ type: "Date", pattern: datePatternRange(min, max) });

/** `date'iso...'`: matches dates on or after `value`. */
export const dateEarliest = (value: CborDate): Pattern =>
  valuePattern({ type: "Date", pattern: datePatternEarliest(value) });

/** `date'...iso'`: matches dates on or before `value`. */
export const dateLatest = (value: CborDate): Pattern =>
  valuePattern({ type: "Date", pattern: datePatternLatest(value) });

/** A date pattern matching by the date's ISO-8601 text. */
export const dateIso8601 = (value: string): Pattern => {
  requireString(value, "value");
  try {
    CborDate.fromString(value);
  } catch {
    throw new RangeError(`value is not an ISO-8601 date: ${value}`);
  }
  return valuePattern({ type: "Date", pattern: datePatternStringValue(value) });
};

/** `date'/regex/'`: matches dates whose ISO-8601 text the regex matches. */
export const dateRegex = (regex: RegexInput): Pattern =>
  valuePattern({ type: "Date", pattern: datePatternRegex(regex) });

/** `digest`: matches any digest. */
export const anyDigest = (): Pattern =>
  valuePattern({ type: "Digest", pattern: digestPatternAny() });

/** `digest'ur:digest/…'`: matches that digest. */
export const digest = (value: Digest): Pattern =>
  valuePattern({ type: "Digest", pattern: digestPatternValue(value) });

/** `digest'hex'`: matches digests starting with those bytes. */
export const digestPrefix = (prefix: Uint8Array): Pattern => {
  if (requireBytes(prefix, "prefix").length > 32)
    throw new RangeError("a digest prefix is at most 32 bytes");
  return valuePattern({ type: "Digest", pattern: digestPatternPrefix(prefix) });
};

/** `digest'/regex/'`: matches digests whose bytes the regex matches. */
export const digestBinaryRegex = (regex: RegexInput): Pattern =>
  valuePattern({ type: "Digest", pattern: digestPatternBinaryRegex(regex) });

/** `known`: matches any known value. */
export const anyKnownValue = (): Pattern =>
  valuePattern({ type: "KnownValue", pattern: knownValuePatternAny() });

/** `'value'`: matches that known value. */
export const knownValue = (value: KnownValue): Pattern =>
  valuePattern({ type: "KnownValue", pattern: knownValuePatternValue(value) });

/** `'name'`: matches the known value registered under `name`. */
export const knownValueNamed = (name: string): Pattern =>
  valuePattern({
    type: "KnownValue",
    pattern: knownValuePatternNamed(requireString(name, "name")),
  });

/** `'/regex/'`: matches known values whose name the regex matches. */
export const knownValueRegex = (regex: RegexInput): Pattern =>
  valuePattern({ type: "KnownValue", pattern: knownValuePatternRegex(regex) });

/** `array`: matches any array. */
export const anyArray = (): Pattern =>
  structurePattern({ type: "Array", pattern: arrayPatternAny() });

/** `map`: matches any map. */
export const anyMap = (): Pattern => structurePattern({ type: "Map", pattern: mapPatternAny() });

/** `tagged`: matches any tagged value. */
export const anyTagged = (): Pattern =>
  structurePattern({ type: "Tagged", pattern: taggedPatternAny() });

/** `tagged(n, p)`: matches `tag` with content matching `pattern`. */
export const tagged = (tag: Tag, pattern: Pattern): Pattern =>
  structurePattern({
    type: "Tagged",
    pattern: taggedPatternWithTag(tag, requirePattern(pattern)),
  });

/** `tagged(name, p)`: matches the tag registered as `name` with content matching `pattern`. */
export const taggedName = (name: string, pattern: Pattern): Pattern => {
  if (!TAG_NAME.test(requireString(name, "name"))) {
    throw new RangeError(`tag name must be a bare word: ${JSON.stringify(name)}`);
  }
  return structurePattern({
    type: "Tagged",
    pattern: taggedPatternWithName(name, requirePattern(pattern)),
  });
};

/** `tagged(/regex/, p)`: matches tags whose registered name the regex matches. */
export const taggedRegex = (regex: RegexInput, pattern: Pattern): Pattern =>
  structurePattern({
    type: "Tagged",
    pattern: taggedPatternWithRegex(regex, requirePattern(pattern)),
  });

/** `a & b & …`: matches when every operand matches. */
export const and = (...patterns: Pattern[]): Pattern =>
  metaPattern({ type: "And", pattern: andPatternCreate(requirePatterns(patterns, "and")) });

/** `a | b | …`: matches when any operand matches. */
export const or = (...patterns: Pattern[]): Pattern =>
  metaPattern({ type: "Or", pattern: orPatternCreate(requirePatterns(patterns, "or")) });

/** `!p`: matches when `pattern` does not. */
export const notMatching = (pattern: Pattern): Pattern =>
  metaPattern({ type: "Not", pattern: notPatternCreate(requirePattern(pattern)) });

/** `@name(p)`: matches as `pattern` and names the paths it matched. */
export const capture = (name: string, pattern: Pattern): Pattern => {
  if (!CAPTURE_NAME.test(requireString(name, "name"))) {
    throw new RangeError(`capture name must be an identifier: ${JSON.stringify(name)}`);
  }
  return metaPattern({
    type: "Capture",
    pattern: capturePatternCreate(name, requirePattern(pattern)),
  });
};

/** `search(p)`: matches at every node of the tree where `pattern` matches. */
export const search = (pattern: Pattern): Pattern =>
  metaPattern({ type: "Search", pattern: searchPatternCreate(requirePattern(pattern)) });

/** `a, b, …`: consecutive array elements. */
export const sequence = (...patterns: Pattern[]): Pattern =>
  metaPattern({
    type: "Sequence",
    pattern: sequencePatternCreate(requirePatterns(patterns, "sequence")),
  });

/** `(p){n,m}`: `pattern` repeated according to `quantifier`. */
export const repeat = (pattern: Pattern, quantifier: Quantifier): Pattern => {
  if (!(quantifier instanceof Quantifier)) throw new TypeError("quantifier must be a Quantifier");
  return metaPattern({
    type: "Repeat",
    pattern: repeatPatternCreate(requirePattern(pattern), quantifier),
  });
};

/** `(p)`: a group, which is a repeat of exactly one. */
export const group = (pattern: Pattern): Pattern => repeat(pattern, Quantifier.exactly(1));
