/**
 * The recursive-descent parser over the lexer's tokens: `or` > `and` > `not`
 * > primary, with groups, captures, `search`, arrays, maps and tagged values.
 */
import { CborDate, Tag } from "@blockchaincommons/dcbor";
import { parseDcborItem } from "@blockchaincommons/dcbor-parse";
import { Digest } from "@blockchaincommons/components";
import { KnownValue } from "@blockchaincommons/known-values";
import { UR, decodeURWith } from "@blockchaincommons/uniform-resources";
import { type Span, span as makeSpan, DcborPatternError } from "../error";
import { Lexer, type Literal, type SpannedToken, type Token } from "./token";
import type { Pattern } from "../pattern";
import {
  any,
  anyArray,
  anyBool,
  anyByteString,
  anyDate,
  anyDigest,
  anyKnownValue,
  anyMap,
  anyNumber,
  anyTagged,
  anyText,
  and,
  bool,
  byteString,
  byteStringRegex,
  capture,
  date,
  dateEarliest,
  dateLatest,
  dateRange,
  dateRegex,
  digest,
  digestBinaryRegex,
  digestPrefix,
  knownValue,
  knownValueNamed,
  knownValueRegex,
  notMatching,
  nullValue,
  number,
  numberGreaterThan,
  numberGreaterThanOrEqual,
  numberInfinity,
  numberLessThan,
  numberLessThanOrEqual,
  numberNaN,
  numberNegInfinity,
  or,
  repeat,
  search,
  sequence,
  text,
  textRegex,
} from "../pattern/constructors";
import { structurePattern, valuePattern } from "../pattern/wrap";
import { numberPatternRange } from "../pattern/value/number-pattern";
import {
  arrayPatternWithElements,
  arrayPatternWithLengthInterval,
} from "../pattern/structure/array-pattern";
import {
  mapPatternWithConstraints,
  mapPatternWithLengthInterval,
} from "../pattern/structure/map-pattern";
import {
  taggedPatternWithName,
  taggedPatternWithRegex,
  taggedPatternWithTag,
} from "../pattern/structure/tagged-pattern";
import { Interval } from "../interval";
import { compilePatternRegex, type RegexMode } from "../regex";
import { Quantifier } from "../quantifier";
import { Reluctance } from "../reluctance";

const fail = (error: DcborPatternError): never => {
  throw error;
};

/** `UnexpectedToken` for `token` at `span`, quoting its source text (or its kind when the span is empty). */
const unexpected = (input: string, token: Token, span: Span): DcborPatternError => {
  const text = input.slice(span.start, span.end);
  return DcborPatternError.unexpectedToken(token.type, text === "" ? token.type : text, span);
};

/** A bare number literal: `1e400` reads as infinity and is the infinity pattern. */
const numberLiteral = (value: number): Pattern =>
  value === Infinity ? numberInfinity() : value === -Infinity ? numberNegInfinity() : number(value);

/** `min...max` as written; an inverted range is accepted and matches nothing. */
const numberRangeLiteral = (min: number, max: number): Pattern =>
  valuePattern({ type: "Number", pattern: numberPatternRange(min, max) });

/** A literal's decoded value; its error is thrown when the parser consumes the token. */
const decoded = <T>(literal: Literal<T>): T => {
  if (literal.ok) return literal.value;
  throw literal.error;
};

/** Parses the pattern text a `Lexer` produces; `maxDepth` bounds the nesting when given. */
export class Parser {
  private readonly lexer: Lexer;
  private readonly maxDepth: number | undefined;
  private depth = 0;

  constructor(input: string, maxDepth?: number) {
    this.lexer = new Lexer(input);
    this.maxDepth = maxDepth;
  }

  /**
   * The offset the parse consumed: the start of the next token, or the
   * input's length when nothing but whitespace follows.
   */
  consumed(): number {
    try {
      const r = this.lexer.next();
      return r === undefined ? this.lexer.input().length : r.span.start;
    } catch (e) {
      if (DcborPatternError.isDcborPatternError(e)) return e.span?.start ?? this.lexer.position();
      throw e;
    }
  }

  /** Enters a nesting level at `span`, or throws `NestingTooDeep` past a `maxDepth`. */
  private enter(span: Span): void {
    this.depth++;
    if (this.maxDepth !== undefined && this.depth > this.maxDepth) {
      fail(DcborPatternError.nestingTooDeep(this.maxDepth, span));
    }
  }

  private leave(): void {
    this.depth--;
  }

  /** The next token; `undefined` at the end; throws for text no token starts. */
  private next(): SpannedToken | undefined {
    return this.lexer.next();
  }

  /**
   * The next token without consuming it; `undefined` at the end, and for
   * text no token starts, which the consumer of the lookahead then reports.
   */
  private peek(): Token | undefined {
    try {
      return this.lexer.peekToken();
    } catch (e) {
      if (DcborPatternError.isDcborPatternError(e)) return undefined;
      throw e;
    }
  }

  /**
   * The next token, which must be `type`: any other token is
   * `UnexpectedToken`, and the end of the source is `atEnd`.
   */
  private closing(type: Token["type"], atEnd: (span: Span) => DcborPatternError): SpannedToken {
    const t = this.next();
    if (t === undefined) return fail(atEnd(this.lexer.span()));
    if (t.token.type !== type) return fail(unexpected(this.lexer.input(), t.token, t.span));
    return t;
  }

  /** `a | b | …`. */
  parseOr(): Pattern {
    const patterns: Pattern[] = [this.parseAnd()];
    while (this.peek()?.type === "Or") {
      this.next();
      patterns.push(this.parseAnd());
    }
    return patterns.length === 1 ? patterns[0] : or(...patterns);
  }

  /** `a & b & …`. */
  private parseAnd(): Pattern {
    const patterns: Pattern[] = [this.parseNot()];
    while (this.peek()?.type === "And") {
      this.next();
      patterns.push(this.parseNot());
    }
    return patterns.length === 1 ? patterns[0] : and(...patterns);
  }

  /** `!p`, right-associative. */
  private parseNot(): Pattern {
    if (this.peek()?.type === "Not") {
      this.next();
      return notMatching(this.parseNot());
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Pattern {
    const spanned = this.next();
    if (spanned === undefined) return fail(DcborPatternError.unexpectedEndOfInput());
    const { token, span } = spanned;

    switch (token.type) {
      case "RepeatZeroOrMore":
        return any();
      case "Search":
        return this.parseSearch(span);
      case "ParenOpen": {
        this.enter(span);
        const inner = this.parseOr();
        this.closing("ParenClose", () => DcborPatternError.unexpectedEndOfInput());
        this.leave();
        return this.parseQuantifier(inner, true);
      }
      case "GroupName":
        return this.parseCapture(token.name, span);
      case "Bool":
        return anyBool();
      case "BoolTrue":
        return bool(true);
      case "BoolFalse":
        return bool(false);
      case "ByteString":
        return anyByteString();
      case "Date":
        return anyDate();
      case "Digest":
        return anyDigest();
      case "DigestQuoted":
        return parseDigestQuotedContent(decoded(token.value), span);
      case "DateQuoted":
        return parseDateQuotedContent(decoded(token.value), span);
      case "Known":
        return anyKnownValue();
      case "Null":
        return nullValue();
      case "Number":
        return anyNumber();
      case "Text":
        return anyText();
      case "StringLiteral":
        return text(decoded(token.value));
      case "SingleQuoted":
        return parseSingleQuotedAsKnownValue(decoded(token.value));
      case "Regex":
        return textRegex(decoded(token.pattern));
      case "HexString":
        return byteString(decoded(token.value));
      case "HexRegex":
        return byteStringRegex(decoded(token.pattern));
      case "Tagged":
        return this.parseTagged(span);
      case "Array":
        return anyArray();
      case "Map":
        return anyMap();
      case "BracketOpen":
        return this.parseBracketArray(span);
      case "BraceOpen":
        return this.parseBracketMap(span);
      case "Range":
        return structurePattern({
          type: "Map",
          pattern: mapPatternWithLengthInterval(decoded(token.quantifier).interval),
        });
      case "NumberLiteral": {
        const value = decoded(token.value);
        if (this.peek()?.type === "Ellipsis") {
          this.next();
          return numberRangeLiteral(value, this.parseNumberOperand());
        }
        return numberLiteral(value);
      }
      case "NaN":
        return numberNaN();
      case "Infinity":
        return numberInfinity();
      case "NegInfinity":
        return numberNegInfinity();
      case "GreaterThanOrEqual":
        return numberGreaterThanOrEqual(this.parseNumberOperand());
      case "LessThanOrEqual":
        return numberLessThanOrEqual(this.parseNumberOperand());
      case "GreaterThan":
        return numberGreaterThan(this.parseNumberOperand());
      case "LessThan":
        return numberLessThan(this.parseNumberOperand());
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
      case "Ellipsis":
        return fail(unexpected(this.lexer.input(), token, span));
    }
  }

  /** The number after a comparison operator or `...`. */
  private parseNumberOperand(): number {
    const t = this.next();
    if (t === undefined) return fail(DcborPatternError.unexpectedEndOfInput());
    if (t.token.type !== "NumberLiteral") {
      return fail(unexpected(this.lexer.input(), t.token, t.span));
    }
    return decoded(t.token.value);
  }

  /** The quantifier after a group; a group always becomes a repeat. */
  private parseQuantifier(pattern: Pattern, forceRepeat: boolean): Pattern {
    const token = this.peek();
    const wrap = (q: Quantifier): Pattern => {
      this.next();
      return repeat(pattern, q);
    };
    switch (token?.type) {
      case "RepeatZeroOrMore":
        return wrap(Quantifier.zeroOrMore());
      case "RepeatZeroOrMoreLazy":
        return wrap(Quantifier.zeroOrMore(Reluctance.Lazy));
      case "RepeatZeroOrMorePossessive":
        return wrap(Quantifier.zeroOrMore(Reluctance.Possessive));
      case "RepeatOneOrMore":
        return wrap(Quantifier.oneOrMore());
      case "RepeatOneOrMoreLazy":
        return wrap(Quantifier.oneOrMore(Reluctance.Lazy));
      case "RepeatOneOrMorePossessive":
        return wrap(Quantifier.oneOrMore(Reluctance.Possessive));
      case "RepeatZeroOrOne":
        return wrap(Quantifier.zeroOrOne());
      case "RepeatZeroOrOneLazy":
        return wrap(Quantifier.zeroOrOne(Reluctance.Lazy));
      case "RepeatZeroOrOnePossessive":
        return wrap(Quantifier.zeroOrOne(Reluctance.Possessive));
      case "Range": {
        this.next();
        return repeat(pattern, decoded(token.quantifier));
      }
      default:
        return forceRepeat ? repeat(pattern, Quantifier.exactly(1)) : pattern;
    }
  }

  /** `(` after `@name` or `search`, then the inner pattern and its `)`. */
  private parseParenthesized(at: Span): Pattern {
    const open = this.next();
    if (open === undefined) return fail(DcborPatternError.unexpectedEndOfInput());
    if (open.token.type !== "ParenOpen") {
      return fail(unexpected(this.lexer.input(), open.token, open.span));
    }
    this.enter(at);
    const inner = this.parseOr();
    this.closing("ParenClose", (span) => DcborPatternError.expectedCloseParen(span));
    this.leave();
    return inner;
  }

  /** `@name(p)`; the name was consumed. */
  private parseCapture(name: string, at: Span): Pattern {
    return capture(name, this.parseParenthesized(at));
  }

  /** `search(p)`; the keyword was consumed. */
  private parseSearch(at: Span): Pattern {
    return search(this.parseParenthesized(at));
  }

  /** `[…]`; the bracket was consumed. */
  private parseBracketArray(at: Span): Pattern {
    this.enter(at);
    const token = this.peek();

    if (token?.type === "Range") {
      const interval = decoded(token.quantifier).interval;
      this.next();
      this.closing("BracketClose", (span) => DcborPatternError.expectedCloseBracket(span));
      this.leave();
      return structurePattern({
        type: "Array",
        pattern: arrayPatternWithLengthInterval(interval),
      });
    }

    // `[]` is any array; `[{0}]` is the empty array
    if (token?.type === "BracketClose") {
      this.next();
      this.leave();
      return structurePattern({
        type: "Array",
        pattern: arrayPatternWithLengthInterval(Interval.atLeast(0)),
      });
    }

    const elements = this.parseArrayOr();
    this.closing("BracketClose", (span) => DcborPatternError.expectedCloseBracket(span));
    this.leave();
    return structurePattern({ type: "Array", pattern: arrayPatternWithElements(elements) });
  }

  private parseArrayOr(): Pattern {
    const patterns: Pattern[] = [this.parseArrayAnd()];
    while (this.peek()?.type === "Or") {
      this.next();
      patterns.push(this.parseArrayAnd());
    }
    return patterns.length === 1 ? patterns[0] : or(...patterns);
  }

  private parseArrayAnd(): Pattern {
    const patterns: Pattern[] = [this.parseArrayNot()];
    while (this.peek()?.type === "And") {
      this.next();
      patterns.push(this.parseArrayNot());
    }
    return patterns.length === 1 ? patterns[0] : and(...patterns);
  }

  private parseArrayNot(): Pattern {
    if (this.peek()?.type === "Not") {
      this.next();
      return notMatching(this.parseArrayNot());
    }
    return this.parseArraySequence();
  }

  /** `p, q, …` inside brackets. */
  private parseArraySequence(): Pattern {
    const patterns: Pattern[] = [this.parseOr()];
    while (this.peek()?.type === "Comma") {
      this.next();
      patterns.push(this.parseOr());
    }
    return patterns.length === 1 ? patterns[0] : sequence(...patterns);
  }

  /** `{…}`; the brace was consumed. `{}` is not a pattern: use `map`. */
  private parseBracketMap(at: Span): Pattern {
    this.enter(at);
    const token = this.peek();

    if (token?.type === "Range") {
      this.next();
      const interval = decoded(token.quantifier).interval;
      this.closing("BraceClose", (span) => DcborPatternError.expectedCloseBrace(span));
      this.leave();
      return structurePattern({
        type: "Map",
        pattern: mapPatternWithLengthInterval(interval),
      });
    }

    const constraints: [Pattern, Pattern][] = [];
    for (;;) {
      const key = this.parseOr();
      this.closing("Colon", (span) => DcborPatternError.expectedColon(span));
      const value = this.parseOr();
      constraints.push([key, value]);

      const after = this.next();
      if (after === undefined) {
        return fail(DcborPatternError.expectedCloseBrace(this.lexer.span()));
      }
      if (after.token.type === "BraceClose") break;
      if (after.token.type !== "Comma") {
        return fail(unexpected(this.lexer.input(), after.token, after.span));
      }
    }
    this.leave();
    return structurePattern({ type: "Map", pattern: mapPatternWithConstraints(constraints) });
  }

  /** `tagged` or `tagged(selector, p)`; the keyword was consumed. */
  private parseTagged(at: Span): Pattern {
    if (this.peek()?.type !== "ParenOpen") return anyTagged();
    this.next();
    this.enter(at);

    const remainder = this.lexer.remainder();
    const remainderStart = this.lexer.position();
    const [selector, content, consumed] = parseTaggedInner(
      remainder,
      remainderStart,
      this.maxDepth === undefined ? undefined : this.maxDepth - this.depth,
    );
    this.lexer.bump(consumed);
    this.closing("ParenClose", (span) => DcborPatternError.expectedCloseParen(span));
    this.leave();

    switch (selector.type) {
      case "Value":
        return structurePattern({
          type: "Tagged",
          pattern: taggedPatternWithTag(Tag.from(selector.value), content),
        });
      case "Name":
        return structurePattern({
          type: "Tagged",
          pattern: taggedPatternWithName(selector.name, content),
        });
      case "Regex":
        return structurePattern({
          type: "Tagged",
          pattern: taggedPatternWithRegex(selector.regex, content),
        });
    }
  }
}

/** Parses `input` as a whole pattern: nothing but whitespace may follow it. */
export const parseAll = (input: string, maxDepth?: number): Pattern => {
  const [pattern, consumed] = parsePartial(input, maxDepth);
  if (consumed < input.length) {
    return fail(DcborPatternError.extraData(makeSpan(consumed, input.length)));
  }
  return pattern;
};

/** Parses the pattern at the start of `input` and reports how much it consumed, trailing whitespace included. */
export const parsePartial = (input: string, maxDepth?: number): [Pattern, number] => {
  const parser = new Parser(input, maxDepth);
  const pattern = parser.parseOr();
  return [pattern, parser.consumed()];
};

/** The regex source, once the dialect accepts it for `mode`. */
const checkRegex = (source: string, mode: RegexMode, span: Span): string => {
  try {
    compilePatternRegex(source, mode);
    return source;
  } catch {
    return fail(DcborPatternError.invalidRegex(span));
  }
};

/** `'…'`: a known value by number, by name, or by a regex on the name. */
const parseSingleQuotedAsKnownValue = (value: string): Pattern => {
  if (value.startsWith("/") && value.endsWith("/") && value.length > 2) {
    return knownValueRegex(checkRegex(value.slice(1, -1), "text", { start: 0, end: value.length }));
  }
  if (/^\d+$/.test(value)) {
    const numericValue = BigInt(value);
    if (numericValue <= 0xffffffffffffffffn) return knownValue(new KnownValue(numericValue));
    // beyond the 64-bit range the digits are a name, as the reference parses them
  }
  return knownValueNamed(value);
};

/** The body of `digest'…'`: a UR, a binary regex, or a hex prefix of at most 32 bytes. */
const parseDigestQuotedContent = (content: string, span: Span): Pattern => {
  if (content.length === 0) {
    return fail(DcborPatternError.invalidDigestPattern("empty content", span));
  }
  if (content.startsWith("ur:")) {
    try {
      return digest(decodeURWith(UR.parse(content), Digest.codec));
    } catch (e) {
      return fail(DcborPatternError.invalidUr(e instanceof Error ? e.message : String(e), span));
    }
  }
  if (content.startsWith("/") && content.endsWith("/") && content.length > 2) {
    return digestBinaryRegex(checkRegex(content.slice(1, -1), "bytes", span));
  }
  if (/^[0-9a-fA-F]+$/.test(content)) {
    if (content.length % 2 !== 0 || content.length > 64) {
      return fail(DcborPatternError.invalidHexString(span));
    }
    const bytes = new Uint8Array(content.length / 2);
    for (let i = 0; i < content.length; i += 2) {
      bytes[i / 2] = parseInt(content.slice(i, i + 2), 16);
    }
    return digestPrefix(bytes);
  }
  return fail(DcborPatternError.invalidDigestPattern(content, span));
};

/** The date a dCBOR diagnostic text denotes, or `undefined`. */
const tryParseDate = (s: string): CborDate | undefined => {
  try {
    return CborDate.fromTaggedCbor(parseDcborItem(s));
  } catch {
    return undefined;
  }
};

/** The body of `date'…'`: a regex, a range, an open range, or a single date. */
const parseDateQuotedContent = (content: string, span: Span): Pattern => {
  if (content.length === 0) return fail(DcborPatternError.invalidDateFormat(span));
  if (content.startsWith("/") && content.endsWith("/") && content.length > 2) {
    return dateRegex(checkRegex(content.slice(1, -1), "text", span));
  }
  const dateOrFail = (s: string): CborDate =>
    tryParseDate(s) ?? fail(DcborPatternError.invalidDateFormat(span));
  if (content.includes("...")) {
    if (content.startsWith("...")) return dateLatest(dateOrFail(content.slice(3)));
    if (content.endsWith("...")) return dateEarliest(dateOrFail(content.slice(0, -3)));
    const parts = content.split("...");
    if (parts.length !== 2) return fail(DcborPatternError.invalidDateFormat(span));
    return dateRange(dateOrFail(parts[0]), dateOrFail(parts[1]));
  }
  return date(dateOrFail(content));
};

type TagSelector =
  | { type: "Value"; value: number | bigint }
  | { type: "Name"; name: string }
  | { type: "Regex"; regex: string };

const isTagWhitespace = (ch: string): boolean => " \t\n\r\f".includes(ch);

const skipWhitespace = (src: string, pos: number): number => {
  while (pos < src.length && isTagWhitespace(src[pos])) pos++;
  return pos;
};

/** The selector, the content pattern and the length consumed of `tagged(…`'s inside. */
const parseTaggedInner = (
  src: string,
  remainderStart: number,
  maxDepth: number | undefined,
): [TagSelector, Pattern, number] => {
  let pos = skipWhitespace(src, 0);

  let selector: TagSelector;
  if (src[pos] === "/") {
    const [regex, newPos] = parseTagRegex(src, pos);
    pos = newPos;
    selector = { type: "Regex", regex };
  } else {
    const [word, newPos] = parseBareWord(src, pos);
    pos = newPos;
    // a leading `+` is accepted, as the reference's integer parser accepts it
    if (/^\+?\d+$/.test(word)) {
      const big = BigInt(word);
      selector =
        big > 0xffffffffffffffffn
          ? { type: "Name", name: word }
          : { type: "Value", value: big <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(big) : big };
    } else {
      selector = { type: "Name", name: word };
    }
  }

  pos = skipWhitespace(src, pos);
  if (pos >= src.length || src[pos] !== ",") return fail(DcborPatternError.unexpectedEndOfInput());
  pos = skipWhitespace(src, pos + 1);

  // the content runs to the parenthesis that closes `tagged(`
  const patternStart = pos;
  let parenDepth = 0;
  while (pos < src.length) {
    const ch = src[pos];
    if (ch === "(") parenDepth++;
    else if (ch === ")") {
      if (parenDepth === 0) break;
      parenDepth--;
    }
    pos++;
  }

  const patternSrc = src.slice(patternStart, pos);
  const trimmed = patternSrc.trim();
  const trimOffset = patternSrc.length - patternSrc.trimStart().length;
  const offset = remainderStart + patternStart + trimOffset;
  let content: Pattern;
  try {
    content = parseAll(trimmed, maxDepth);
  } catch (e) {
    if (DcborPatternError.isDcborPatternError(e)) throw e.shifted(offset);
    throw e;
  }
  return [selector, content, pos];
};

const parseTagRegex = (src: string, startPos: number): [string, number] => {
  let pos = skipWhitespace(src, startPos);
  if (pos >= src.length || src[pos] !== "/") {
    return fail(DcborPatternError.unterminatedRegex(makeSpan(pos, pos)));
  }
  pos++;
  const start = pos;
  let escape = false;
  while (pos < src.length) {
    const ch = src[pos];
    pos++;
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === "/") {
      const regex = checkRegex(src.slice(start, pos - 1), "text", makeSpan(start, pos));
      return [regex, skipWhitespace(src, pos)];
    }
  }
  return fail(DcborPatternError.unterminatedRegex(makeSpan(pos, pos)));
};

const parseBareWord = (src: string, startPos: number): [string, number] => {
  let pos = skipWhitespace(src, startPos);
  const start = pos;
  while (pos < src.length && !" \t\n\r\f,)".includes(src[pos])) pos++;
  if (start === pos) return fail(DcborPatternError.unexpectedEndOfInput());
  return [src.slice(start, pos), skipWhitespace(src, pos)];
};
