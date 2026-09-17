/**
 * The lexer: pattern text into tokens with their spans. A literal that
 * matched its opening but not its grammar is still a token: it carries the
 * error, which the parser reports when it consumes the token. Only text no
 * token starts throws, with the span a single-pass scanner reads before
 * giving up.
 */
import { tryParseDcborItemPartial } from "@blockchaincommons/dcbor-parse";
import { asNumber } from "@blockchaincommons/dcbor";
import { type DcborResult, type Span, span, DcborPatternError } from "../error";
import { Quantifier } from "../quantifier";
import { Reluctance } from "../reluctance";
import { compilePatternRegex } from "../regex";

/** A literal's decoded value, or the error the parser reports for it. */
export type Literal<T> = DcborResult<T, DcborPatternError>;

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
  | { readonly type: "NumberLiteral"; readonly value: Literal<number> }
  | { readonly type: "GroupName"; readonly name: string }
  | { readonly type: "StringLiteral"; readonly value: Literal<string> }
  | { readonly type: "SingleQuoted"; readonly value: Literal<string> }
  | { readonly type: "Regex"; readonly pattern: Literal<string> }
  | { readonly type: "HexString"; readonly value: Literal<Uint8Array> }
  | { readonly type: "HexRegex"; readonly pattern: Literal<string> }
  | { readonly type: "DateQuoted"; readonly value: Literal<string> }
  | { readonly type: "DigestQuoted"; readonly value: Literal<string> }
  | { readonly type: "Range"; readonly quantifier: Literal<Quantifier> };

/** A token with its span in the source. */
export interface SpannedToken {
  readonly token: Token;
  readonly span: Span;
}

const ok = <T>(value: T): Literal<T> => ({ ok: true, value });
const err = <T>(error: DcborPatternError): Literal<T> => ({ ok: false, error });

/** The keywords, by their text. */
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
  "-Infinity": { type: "NegInfinity" },
  "...": { type: "Ellipsis" },
};

/**
 * Every word-like token text, longest first: the keywords and the openers of
 * the quoted literals. The lexer takes the longest one the text starts with;
 * text that starts like one of them but completes none is unrecognised over
 * the part it shares with them, as a single-pass scanner reads it.
 */
const WORDS: readonly string[] = [...Object.keys(KEYWORDS), "date'", "digest'", "h'", "h'/"].sort(
  (a, b) => b.length - a.length,
);

const isWhitespace = (ch: string): boolean =>
  ch === " " || ch === "\t" || ch === "\r" || ch === "\n" || ch === "\f";
const isDigit = (ch: string): boolean => ch >= "0" && ch <= "9";
const isHexDigit = (ch: string): boolean =>
  (ch >= "0" && ch <= "9") || (ch >= "a" && ch <= "f") || (ch >= "A" && ch <= "F");
const isIdentStart = (ch: string): boolean =>
  (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
const isIdentCont = (ch: string): boolean => isIdentStart(ch) || isDigit(ch);

const NUMBER_RE = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
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
   * The next token, or `undefined` at the end of the source. A literal that
   * does not complete or decode is a token carrying its error.
   *
   * @throws {DcborPatternError} `UnrecognizedToken` for text no token starts
   */
  next(): SpannedToken | undefined {
    this.skipWhitespace();
    if (this._position >= this._input.length) return undefined;

    const start = this._position;
    const ch = this.peekChar() ?? "";
    const token = (t: Token): SpannedToken => ({ token: t, span: this.spanFrom(start) });

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
      return token({ type: "Regex", pattern: this.regex(start) });
    }
    if (ch === "@") {
      this.bump(1);
      if (!isIdentStart(this.peekChar() ?? "")) return this.unrecognized(start);
      const nameStart = this._position;
      while (isIdentCont(this.peekChar() ?? "")) this.bump(1);
      return token({ type: "GroupName", name: this._input.slice(nameStart, this._position) });
    }
    if (isDigit(ch) || (ch === "-" && isDigit(this.peekChar(1) ?? ""))) {
      return token({ type: "NumberLiteral", value: this.number() });
    }

    const word = WORDS.find((w) => this.startsWith(w));
    if (word === undefined) return this.unrecognized(start);
    this.bump(word.length);
    switch (word) {
      case "h'":
        return token({ type: "HexString", value: this.hexString(start) });
      case "h'/":
        return token({ type: "HexRegex", pattern: this.hexRegex(start) });
      case "date'":
        return token({ type: "DateQuoted", value: this.quotedBody(start, "date'") });
      case "digest'":
        return token({ type: "DigestQuoted", value: this.quotedBody(start, "digest'") });
      default:
        return token(KEYWORDS[word]);
    }
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

  /**
   * Throws for text no token starts. The span is what a single-pass scanner
   * reads before giving up: the part the text shares with a keyword it
   * started (`nul`, `-Inf`, `..`), the `@` of a capture without a name, and
   * otherwise one code point.
   */
  private unrecognized(start: number): never {
    let extent = 0;
    for (const w of WORDS) {
      let n = 0;
      while (n < w.length && this._input[start + n] === w[n]) n++;
      extent = Math.max(extent, n);
    }
    if (this._position > start) extent = Math.max(extent, this._position - start);
    if (extent === 0) extent = String.fromCodePoint(this._input.codePointAt(start) ?? 0).length;
    this._position = start + extent;
    throw DcborPatternError.unrecognizedToken(this.spanFrom(start));
  }

  /** `{`: a `{n,m}` range when digits and a comma or brace follow, else a brace. */
  private braceOpen(start: number): SpannedToken {
    const rest = this.remainder();
    let pos = 0;
    while (pos < rest.length && isWhitespace(rest[pos])) pos++;
    if (pos < rest.length && isDigit(rest[pos]) && looksLikeRange(rest.slice(pos))) {
      const quantifier = this.range(start);
      return { token: { type: "Range", quantifier }, span: this.spanFrom(start) };
    }
    return { token: { type: "BraceOpen" }, span: this.spanFrom(start) };
  }

  /**
   * `{n}`, `{n,m}` or `{n,}` with an optional `?` or `+`, after the `{`. A
   * range that does not read is `InvalidRange` over the `{` and leaves the
   * rest unread; inverted bounds are `InvalidRange` over the whole range.
   */
  private range(start: number): Literal<Quantifier> {
    const src = this.remainder();
    const invalid = (): Literal<Quantifier> =>
      err(DcborPatternError.invalidRange(this.spanFrom(start)));
    let pos = 0;
    const skipWs = (): void => {
      while (pos < src.length && isWhitespace(src[pos])) pos++;
    };
    const digits = (): string => {
      const from = pos;
      while (pos < src.length && isDigit(src[pos])) pos++;
      return src.slice(from, pos);
    };
    skipWs();
    const minText = digits();
    if (minText === "") return invalid();
    const min = Number(minText);
    if (min > Number.MAX_SAFE_INTEGER) return invalid();
    skipWs();

    let max: number | undefined;
    if (src[pos] === ",") {
      pos++;
      skipWs();
      if (src[pos] === "}") {
        pos++;
        max = undefined;
      } else if (isDigit(src[pos] ?? "")) {
        max = Number(digits());
        if (max > Number.MAX_SAFE_INTEGER) return invalid();
        skipWs();
        if (src[pos] !== "}") return invalid();
        pos++;
      } else {
        return invalid();
      }
    } else if (src[pos] === "}") {
      pos++;
      max = min;
    } else {
      return invalid();
    }

    let reluctance: Reluctance = Reluctance.Greedy;
    if (src[pos] === "?") {
      pos++;
      reluctance = Reluctance.Lazy;
    } else if (src[pos] === "+") {
      pos++;
      reluctance = Reluctance.Possessive;
    }
    this.bump(pos);
    if (max !== undefined && min > max) return invalid();
    return ok(
      max !== undefined
        ? Quantifier.between(min, max, reluctance)
        : Quantifier.atLeast(min, reluctance),
    );
  }

  /**
   * A string literal after its opening quote; `\"`, `\\`, `\n`, `\r`, `\t`
   * are escapes. Without a closing quote it is `UnterminatedString` over the
   * opening quote, and the text after it is left unread.
   */
  private quoted(start: number, quote: string): Literal<string> {
    let result = "";
    let escape = false;
    let pos = this._position;
    while (pos < this._input.length) {
      const ch = this._input[pos++];
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
        this._position = pos;
        return ok(result);
      } else {
        result += ch;
      }
    }
    return err(DcborPatternError.unterminatedString(this.spanFrom(start)));
  }

  /**
   * A regex literal after its opening slash, checked against the dialect
   * once closed: `InvalidRegex` spans the whole literal. Without a closing
   * slash it is `UnterminatedRegex` over the opening slash.
   */
  private regex(start: number): Literal<string> {
    const close = this.scanRegex(this._position);
    if (close === undefined) return err(DcborPatternError.unterminatedRegex(this.spanFrom(start)));
    const pattern = this._input.slice(this._position, close);
    this._position = close + 1;
    return this.checkedRegex(pattern, "text", start);
  }

  /** `h'/…/'` after `h'/`: a byte regex; unterminated over the `h'/`. */
  private hexRegex(start: number): Literal<string> {
    let from = this._position;
    for (;;) {
      const close = this.scanRegex(from);
      if (close === undefined) break;
      if (this._input[close + 1] === "'") {
        const pattern = this._input.slice(this._position, close);
        this._position = close + 2;
        return this.checkedRegex(pattern, "bytes", start);
      }
      from = close + 1;
    }
    return err(DcborPatternError.unterminatedRegex(this.spanFrom(start)));
  }

  /** The offset of the next unescaped `/` at or after `from`, or `undefined`. */
  private scanRegex(from: number): number | undefined {
    let escape = false;
    for (let pos = from; pos < this._input.length; pos++) {
      const ch = this._input[pos];
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === "/") return pos;
    }
    return undefined;
  }

  private checkedRegex(pattern: string, mode: "text" | "bytes", start: number): Literal<string> {
    try {
      compilePatternRegex(pattern, mode);
      return ok(pattern);
    } catch {
      return err(DcborPatternError.invalidRegex(this.spanFrom(start)));
    }
  }

  /**
   * `h'…'` after `h'`: even-length hex. A body that is not hex, or has an
   * odd number of digits, is `InvalidHexString` over the `h'`, with the body
   * left unread; without a closing quote it is `UnterminatedHexString`.
   */
  private hexString(start: number): Literal<Uint8Array> {
    for (let pos = this._position; pos < this._input.length; pos++) {
      const ch = this._input[pos];
      if (ch === "'") {
        const hex = this._input.slice(this._position, pos);
        if (hex.length % 2 !== 0) {
          return err(DcborPatternError.invalidHexString(this.spanFrom(start)));
        }
        this._position = pos + 1;
        return ok(hexToBytes(hex));
      }
      if (!isHexDigit(ch)) return err(DcborPatternError.invalidHexString(this.spanFrom(start)));
    }
    return err(DcborPatternError.unterminatedHexString(this.spanFrom(start)));
  }

  /**
   * The body of `date'…'` or `digest'…'` after the opener, up to the closing
   * quote; without one it is unterminated over the opener.
   */
  private quotedBody(start: number, opener: "date'" | "digest'"): Literal<string> {
    const close = this._input.indexOf("'", this._position);
    if (close < 0) {
      const range = this.spanFrom(start);
      return err(
        opener === "date'"
          ? DcborPatternError.unterminatedDateQuoted(range)
          : DcborPatternError.unterminatedDigestQuoted(range),
      );
    }
    const body = this._input.slice(this._position, close);
    this._position = close + 1;
    return ok(body);
  }

  /** A number literal, read as dCBOR reads it; `1e400` reads as infinity. */
  private number(): Literal<number> {
    NUMBER_RE.lastIndex = this._position;
    const match = NUMBER_RE.exec(this._input);
    const text = match === null ? "" : match[0];
    const start = this._position;
    this._position += text.length;
    const parsed = tryParseDcborItemPartial(text);
    const value = parsed.ok ? asNumber(parsed.value.value) : undefined;
    if (value === undefined) {
      return err(DcborPatternError.invalidNumberFormat(this.spanFrom(start)));
    }
    return ok(typeof value === "bigint" ? Number(value) : value);
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
