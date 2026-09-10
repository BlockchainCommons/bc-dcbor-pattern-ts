/**
 * The lexer: pattern text into tokens with their spans. A token the language
 * has no reading for throws `DcborPatternError`.
 */
import { tryParseDcborPrefix } from "@blockchaincommons/dcbor-parse";
import { asNumber } from "@blockchaincommons/dcbor";
import { type Span, span, DcborPatternError } from "../error";
import { Quantifier } from "../quantifier";
import { Reluctance } from "../reluctance";
import { compilePatternRegex } from "../regex";

/** A token of the pattern language. */
export type Token =
  | { readonly type: "And" }
  | { readonly type: "Or" }
  | { readonly type: "Not" }
  | { readonly type: "RepeatZeroOrMore" }
  | { readonly type: "RepeatZeroOrMoreLazy" }
  | { readonly type: "RepeatZeroOrMorePossessive" }
  | { readonly type: "RepeatOneOrMore" }
  | { readonly type: "RepeatOneOrMoreLazy" }
  | { readonly type: "RepeatOneOrMorePossessive" }
  | { readonly type: "RepeatZeroOrOne" }
  | { readonly type: "RepeatZeroOrOneLazy" }
  | { readonly type: "RepeatZeroOrOnePossessive" }
  | { readonly type: "Tagged" }
  | { readonly type: "Array" }
  | { readonly type: "Map" }
  | { readonly type: "Bool" }
  | { readonly type: "ByteString" }
  | { readonly type: "Date" }
  | { readonly type: "Known" }
  | { readonly type: "Null" }
  | { readonly type: "Number" }
  | { readonly type: "Text" }
  | { readonly type: "Digest" }
  | { readonly type: "Search" }
  | { readonly type: "BoolTrue" }
  | { readonly type: "BoolFalse" }
  | { readonly type: "NaN" }
  | { readonly type: "Infinity" }
  | { readonly type: "NegInfinity" }
  | { readonly type: "ParenOpen" }
  | { readonly type: "ParenClose" }
  | { readonly type: "BracketOpen" }
  | { readonly type: "BracketClose" }
  | { readonly type: "BraceOpen" }
  | { readonly type: "BraceClose" }
  | { readonly type: "Comma" }
  | { readonly type: "Colon" }
  | { readonly type: "Ellipsis" }
  | { readonly type: "GreaterThanOrEqual" }
  | { readonly type: "LessThanOrEqual" }
  | { readonly type: "GreaterThan" }
  | { readonly type: "LessThan" }
  | { readonly type: "NumberLiteral"; readonly value: number }
  | { readonly type: "GroupName"; readonly name: string }
  | { readonly type: "StringLiteral"; readonly value: string }
  | { readonly type: "SingleQuoted"; readonly value: string }
  | { readonly type: "Regex"; readonly pattern: string }
  | { readonly type: "HexString"; readonly value: Uint8Array }
  | { readonly type: "HexRegex"; readonly pattern: string }
  | { readonly type: "DateQuoted"; readonly value: string }
  | { readonly type: "DigestQuoted"; readonly value: string }
  | { readonly type: "Range"; readonly quantifier: Quantifier };

/** A token with its span in the source. */
export interface SpannedToken {
  readonly token: Token;
  readonly span: Span;
}

const KEYWORDS: Readonly<Record<string, Token>> = {
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
  Infinity: { type: "Infinity" },
};

const isWhitespace = (ch: string): boolean =>
  ch === " " || ch === "\t" || ch === "\r" || ch === "\n" || ch === "\f";
const isDigit = (ch: string): boolean => ch >= "0" && ch <= "9";
const isHexDigit = (ch: string): boolean =>
  (ch >= "0" && ch <= "9") || (ch >= "a" && ch <= "f") || (ch >= "A" && ch <= "F");
const isIdentStart = (ch: string): boolean =>
  (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
const isIdentCont = (ch: string): boolean => isIdentStart(ch) || isDigit(ch);

const hexToBytes = (hex: string): Uint8Array | undefined => {
  if (hex.length % 2 !== 0) return undefined;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) return undefined;
    bytes[i / 2] = byte;
  }
  return bytes;
};

const TWO_CHAR: readonly (readonly [string, Token["type"]])[] = [
  [">=", "GreaterThanOrEqual"],
  ["<=", "LessThanOrEqual"],
  ["*?", "RepeatZeroOrMoreLazy"],
  ["*+", "RepeatZeroOrMorePossessive"],
  ["+?", "RepeatOneOrMoreLazy"],
  ["++", "RepeatOneOrMorePossessive"],
  ["??", "RepeatZeroOrOneLazy"],
  ["?+", "RepeatZeroOrOnePossessive"],
];

const ONE_CHAR: Readonly<Record<string, Token["type"]>> = {
  "&": "And",
  "|": "Or",
  "!": "Not",
  "*": "RepeatZeroOrMore",
  "+": "RepeatOneOrMore",
  "?": "RepeatZeroOrOne",
  "(": "ParenOpen",
  ")": "ParenClose",
  "[": "BracketOpen",
  "]": "BracketClose",
  "}": "BraceClose",
  ",": "Comma",
  ":": "Colon",
  ">": "GreaterThan",
  "<": "LessThan",
};

/** Reads the tokens of a pattern text one at a time. */
export class Lexer {
  private readonly _input: string;
  private _position = 0;

  constructor(input: string) {
    this._input = input;
  }

  /** The whole source. */
  input(): string {
    return this._input;
  }

  /** The offset after the last token read. */
  position(): number {
    return this._position;
  }

  /** The source from the current offset on. */
  remainder(): string {
    return this._input.slice(this._position);
  }

  /** Skips `n` code units. */
  bump(n: number): void {
    this._position += n;
  }

  /** The empty span at the current offset. */
  span(): Span {
    return span(this._position, this._position);
  }

  private peekChar(offset = 0): string | undefined {
    return this._input[this._position + offset];
  }

  private spanFrom(start: number): Span {
    return span(start, this._position);
  }

  private skipWhitespace(): void {
    while (this._position < this._input.length && isWhitespace(this._input[this._position])) {
      this._position++;
    }
  }

  private startsWith(s: string): boolean {
    return this._input.startsWith(s, this._position);
  }

  /**
   * The next token, or `undefined` at the end of the source.
   *
   * @throws {DcborPatternError} for text no token matches, or a malformed literal
   */
  next(): SpannedToken | undefined {
    this.skipWhitespace();
    if (this._position >= this._input.length) return undefined;

    const start = this._position;
    const ch = this.peekChar() ?? "";
    const token = (t: Token): SpannedToken => ({ token: t, span: this.spanFrom(start) });

    if (this.startsWith("-Infinity")) {
      this.bump(9);
      return token({ type: "NegInfinity" });
    }
    if (this.startsWith("...")) {
      this.bump(3);
      return token({ type: "Ellipsis" });
    }
    for (const [text, type] of TWO_CHAR) {
      if (this.startsWith(text)) {
        this.bump(2);
        return token({ type } as Token);
      }
    }
    const single = ONE_CHAR[ch];
    if (single !== undefined) {
      this.bump(1);
      return token({ type: single } as Token);
    }

    if (ch === "{") {
      this.bump(1);
      return this.braceOpen(start);
    }
    if (ch === '"') {
      this.bump(1);
      return token({ type: "StringLiteral", value: this.quoted(start, '"') });
    }
    if (ch === "'") {
      this.bump(1);
      return token({ type: "SingleQuoted", value: this.quoted(start, "'") });
    }
    if (ch === "/") {
      this.bump(1);
      return token({ type: "Regex", pattern: this.regex(start, "text") });
    }
    if (ch === "@") {
      this.bump(1);
      return token({ type: "GroupName", name: this.groupName(start) });
    }
    if (ch === "h" && this.peekChar(1) === "'") {
      this.bump(2);
      if (this.peekChar() === "/") {
        this.bump(1);
        return token({ type: "HexRegex", pattern: this.hexRegex(start) });
      }
      return token({ type: "HexString", value: this.hexString(start) });
    }
    if (isDigit(ch) || (ch === "-" && isDigit(this.peekChar(1) ?? ""))) {
      return token({ type: "NumberLiteral", value: this.number(start) });
    }
    if (isIdentStart(ch)) return this.identifier(start);

    this.bump(1);
    throw DcborPatternError.unrecognizedToken(this.spanFrom(start));
  }

  /** The next token without consuming it, or `undefined` at the end; throws as `next` does. */
  peekToken(): Token | undefined {
    const saved = this._position;
    try {
      return this.next()?.token;
    } finally {
      this._position = saved;
    }
  }

  /** `{`: a `{n,m}` range when digits and a comma or brace follow, else a brace. */
  private braceOpen(start: number): SpannedToken {
    const rest = this.remainder();
    let pos = 0;
    while (pos < rest.length && isWhitespace(rest[pos])) pos++;
    if (pos < rest.length && isDigit(rest[pos]) && looksLikeRange(rest.slice(pos))) {
      return {
        token: { type: "Range", quantifier: this.range(start) },
        span: this.spanFrom(start),
      };
    }
    return { token: { type: "BraceOpen" }, span: this.spanFrom(start) };
  }

  private digits(): string {
    const from = this._position;
    while (isDigit(this.peekChar() ?? "")) this.bump(1);
    return this._input.slice(from, this._position);
  }

  /** `{n}`, `{n,m}` or `{n,}` with an optional `?` or `+`. */
  private range(start: number): Quantifier {
    const invalid = (): never => {
      throw DcborPatternError.invalidRange(this.spanFrom(start));
    };
    this.skipWhitespace();
    const minText = this.digits();
    if (minText === "") invalid();
    const min = parseInt(minText, 10);
    if (min > Number.MAX_SAFE_INTEGER) invalid();
    this.skipWhitespace();

    let max: number | undefined;
    if (this.peekChar() === ",") {
      this.bump(1);
      this.skipWhitespace();
      if (this.peekChar() === "}") {
        this.bump(1);
        max = undefined;
      } else if (isDigit(this.peekChar() ?? "")) {
        max = parseInt(this.digits(), 10);
        if (max > Number.MAX_SAFE_INTEGER) invalid();
        this.skipWhitespace();
        if (this.peekChar() !== "}") invalid();
        this.bump(1);
      } else {
        invalid();
      }
    } else if (this.peekChar() === "}") {
      this.bump(1);
      max = min;
    } else {
      invalid();
    }

    let reluctance: Reluctance = Reluctance.Greedy;
    if (this.peekChar() === "?") {
      this.bump(1);
      reluctance = Reluctance.Lazy;
    } else if (this.peekChar() === "+") {
      this.bump(1);
      reluctance = Reluctance.Possessive;
    }
    if (max !== undefined && min > max) invalid();
    return max !== undefined
      ? Quantifier.between(min, max, reluctance)
      : Quantifier.atLeast(min, reluctance);
  }

  /** A string literal after its opening quote; `\"`, `\\`, `\n`, `\r`, `\t` are escapes. */
  private quoted(start: number, quote: string): string {
    let result = "";
    let escape = false;
    while (this._position < this._input.length) {
      const ch = this._input[this._position++];
      if (escape) {
        switch (ch) {
          case quote:
          case "\\":
            result += ch;
            break;
          case "n":
            result += "\n";
            break;
          case "r":
            result += "\r";
            break;
          case "t":
            result += "\t";
            break;
          default:
            result += `\\${ch}`;
        }
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === quote) {
        return result;
      } else {
        result += ch;
      }
    }
    throw DcborPatternError.unterminatedString(this.spanFrom(start));
  }

  /** A regex literal after its opening slash, checked against the dialect. */
  private regex(start: number, mode: "text" | "bytes"): string {
    let pattern = "";
    let escape = false;
    while (this._position < this._input.length) {
      const ch = this._input[this._position++];
      if (escape) {
        pattern += ch;
        escape = false;
      } else if (ch === "\\") {
        pattern += ch;
        escape = true;
      } else if (ch === "/") {
        try {
          compilePatternRegex(pattern, mode);
        } catch {
          throw DcborPatternError.invalidRegex(this.spanFrom(start));
        }
        return pattern;
      } else {
        pattern += ch;
      }
    }
    throw DcborPatternError.unterminatedRegex(this.spanFrom(start));
  }

  /** `@name`: an identifier. */
  private groupName(start: number): string {
    const nameStart = this._position;
    if (!isIdentStart(this.peekChar() ?? "")) {
      throw DcborPatternError.invalidCaptureGroupName("", this.spanFrom(start));
    }
    while (isIdentCont(this.peekChar() ?? "")) this.bump(1);
    return this._input.slice(nameStart, this._position);
  }

  /** `h'…'` after `h'`: even-length hex. */
  private hexString(start: number): Uint8Array {
    let hex = "";
    while (this._position < this._input.length) {
      const ch = this.peekChar() ?? "";
      if (ch === "'") {
        this.bump(1);
        const bytes = hexToBytes(hex);
        if (bytes === undefined) throw DcborPatternError.invalidHexString(this.spanFrom(start));
        return bytes;
      }
      if (!isHexDigit(ch)) throw DcborPatternError.invalidHexString(this.spanFrom(start));
      hex += ch;
      this.bump(1);
    }
    throw DcborPatternError.unterminatedHexString(this.spanFrom(start));
  }

  /** `h'/…/'` after `h'/`: a byte regex, checked against the dialect. */
  private hexRegex(start: number): string {
    let pattern = "";
    let escape = false;
    while (this._position < this._input.length) {
      const ch = this._input[this._position++];
      if (escape) {
        pattern += ch;
        escape = false;
      } else if (ch === "\\") {
        pattern += ch;
        escape = true;
      } else if (ch === "/" && this.peekChar() === "'") {
        this.bump(1);
        try {
          compilePatternRegex(pattern, "bytes");
        } catch {
          throw DcborPatternError.invalidRegex(this.spanFrom(start));
        }
        return pattern;
      } else {
        pattern += ch;
      }
    }
    throw DcborPatternError.unterminatedRegex(this.spanFrom(start));
  }

  /** A number literal, read as dCBOR reads it. */
  private number(start: number): number {
    const invalid = (): never => {
      throw DcborPatternError.invalidNumberFormat(this.spanFrom(start));
    };
    if (this.peekChar() === "-") this.bump(1);
    if (this.peekChar() === "0") this.bump(1);
    else if (isDigit(this.peekChar() ?? "")) this.digits();
    else invalid();
    if (this.peekChar() === "." && this.peekChar(1) !== ".") {
      this.bump(1);
      if (!isDigit(this.peekChar() ?? "")) invalid();
      this.digits();
    }
    if (this.peekChar() === "e" || this.peekChar() === "E") {
      this.bump(1);
      if (this.peekChar() === "+" || this.peekChar() === "-") this.bump(1);
      if (!isDigit(this.peekChar() ?? "")) invalid();
      this.digits();
    }
    const parsed = tryParseDcborPrefix(this._input.slice(start, this._position));
    if (!parsed.ok) return invalid();
    const numValue = asNumber(parsed.value.value);
    if (numValue === undefined) return invalid();
    const value = typeof numValue === "bigint" ? Number(numValue) : numValue;
    if (!Number.isFinite(value)) return invalid();
    return value;
  }

  /** A keyword, or `date'…'` / `digest'…'`. */
  private identifier(start: number): SpannedToken {
    const identStart = this._position;
    while (isIdentCont(this.peekChar() ?? "")) this.bump(1);
    const ident = this._input.slice(identStart, this._position);

    if (ident === "date" && this.peekChar() === "'") {
      this.bump(1);
      return {
        token: { type: "DateQuoted", value: this.dateQuoted(start) },
        span: this.spanFrom(start),
      };
    }
    if (ident === "digest" && this.peekChar() === "'") {
      this.bump(1);
      return {
        token: { type: "DigestQuoted", value: this.digestQuoted(start) },
        span: this.spanFrom(start),
      };
    }
    const keyword = KEYWORDS[ident];
    if (keyword !== undefined) return { token: keyword, span: this.spanFrom(start) };
    throw DcborPatternError.unrecognizedToken(this.spanFrom(start));
  }

  private dateQuoted(start: number): string {
    let content = "";
    while (this._position < this._input.length) {
      const ch = this._input[this._position++];
      if (ch === "'") {
        if (content.length === 0) throw DcborPatternError.invalidDateFormat(this.spanFrom(start));
        return content;
      }
      content += ch;
    }
    throw DcborPatternError.unterminatedDateQuoted(this.spanFrom(start));
  }

  private digestQuoted(start: number): string {
    let content = "";
    while (this._position < this._input.length) {
      const ch = this._input[this._position++];
      if (ch === "'") {
        if (content.length === 0) {
          throw DcborPatternError.invalidDigestPattern("empty content", this.spanFrom(start));
        }
        return content;
      }
      content += ch;
    }
    throw DcborPatternError.unterminatedDigestQuoted(this.spanFrom(start));
  }
}

/** Whether `content` (after `{`) reads as `n`, `n,` or `n,m` followed by `}` or `,`. */
const looksLikeRange = (content: string): boolean => {
  let i = 0;
  while (i < content.length && isWhitespace(content[i])) i++;
  if (i >= content.length || !isDigit(content[i])) return false;
  while (i < content.length && isDigit(content[i])) i++;
  while (i < content.length && isWhitespace(content[i])) i++;
  if (i >= content.length) return false;
  const ch = content[i];
  return ch !== ":" && (ch === "," || ch === "}");
};
