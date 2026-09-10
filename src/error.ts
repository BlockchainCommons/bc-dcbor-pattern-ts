/**
 * Errors: `DcborPatternError` for text that does not parse. Spans are UTF-16
 * code-unit offsets into the source.
 *
 * @module error
 */

/** A non-throwing outcome: the value, or the error. */
export type DcborResult<T, E> =
  | {
      /** `true`: `value` is present. */
      readonly ok: true;
      /** The outcome. */
      readonly value: T;
    }
  | {
      /** `false`: `error` is present. */
      readonly ok: false;
      /** Why there is no value. */
      readonly error: E;
    };

/** A half-open range of UTF-16 code units in the source string. */
export interface Span {
  /** The offset of the first code unit. */
  readonly start: number;
  /** The offset after the last code unit. */
  readonly end: number;
}

/** Builds a frozen span. */
export function span(start: number, end: number): Span {
  return Object.freeze({ start, end });
}

const utf8 = new TextEncoder();

/** Converts a span's UTF-16 offsets to UTF-8 byte offsets, as other implementations count them. */
export function spanToByteOffsets(source: string, range: Span): Span {
  const bytes = (n: number): number => utf8.encode(source.slice(0, n)).length;
  return Object.freeze({ start: bytes(range.start), end: bytes(range.end) });
}

/** The kind of a token, as `UnexpectedToken` reports it. */
export type TokenKind =
  | "And"
  | "Or"
  | "Not"
  | "RepeatZeroOrMore"
  | "RepeatZeroOrMoreLazy"
  | "RepeatZeroOrMorePossessive"
  | "RepeatOneOrMore"
  | "RepeatOneOrMoreLazy"
  | "RepeatOneOrMorePossessive"
  | "RepeatZeroOrOne"
  | "RepeatZeroOrOneLazy"
  | "RepeatZeroOrOnePossessive"
  | "Tagged"
  | "Array"
  | "Map"
  | "Bool"
  | "ByteString"
  | "Date"
  | "Known"
  | "Null"
  | "Number"
  | "Text"
  | "Digest"
  | "Search"
  | "BoolTrue"
  | "BoolFalse"
  | "NaN"
  | "Infinity"
  | "NegInfinity"
  | "ParenOpen"
  | "ParenClose"
  | "BracketOpen"
  | "BracketClose"
  | "BraceOpen"
  | "BraceClose"
  | "Comma"
  | "Colon"
  | "Ellipsis"
  | "GreaterThanOrEqual"
  | "LessThanOrEqual"
  | "GreaterThan"
  | "LessThan"
  | "NumberLiteral"
  | "GroupName"
  | "StringLiteral"
  | "SingleQuoted"
  | "Regex"
  | "HexString"
  | "HexRegex"
  | "DateQuoted"
  | "DigestQuoted"
  | "Range";

/** Why a pattern text was rejected. */
export const DcborPatternErrorCode: {
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
} = Object.freeze({
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
  NestingTooDeep: "NestingTooDeep",
});

/** One of the `DcborPatternErrorCode` values. */
export type DcborPatternErrorCode =
  (typeof DcborPatternErrorCode)[keyof typeof DcborPatternErrorCode];

/**
 * The structured payload of a {@link DcborPatternError}, discriminated by
 * `code`: `e.details.code === "UnexpectedToken"` narrows to `{ span, kind,
 * text }`. Every code but `EmptyInput` and `UnexpectedEndOfInput` carries
 * the span of the offending text.
 */
export type DcborPatternErrorDetails =
  | {
      /** The discriminant. */
      readonly code: "EmptyInput";
    }
  | {
      /** The discriminant. */
      readonly code: "UnexpectedEndOfInput";
    }
  | {
      /** The discriminant. */
      readonly code: "ExtraData";
      /** The text after the pattern. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "UnexpectedToken";
      /** The token. */
      readonly span: Span;
      /** The kind of the token found. */
      readonly kind: TokenKind;
      /** The token's source text. */
      readonly text: string;
    }
  | {
      /** The discriminant. */
      readonly code: "UnrecognizedToken";
      /** The unrecognised text. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidRegex";
      /** The regex literal. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "UnterminatedRegex";
      /** The literal, to the end of the source. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "UnterminatedString";
      /** The literal, to the end of the source. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidRange";
      /** The range text. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidHexString";
      /** The literal. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "UnterminatedHexString";
      /** The literal, to the end of the source. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidDateFormat";
      /** The literal. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidNumberFormat";
      /** The literal. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidUr";
      /** The literal. */
      readonly span: Span;
      /** The UR decoder's reason. */
      readonly cause: string;
    }
  | {
      /** The discriminant. */
      readonly code: "ExpectedOpenParen";
      /** Where the parenthesis was required. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "ExpectedCloseParen";
      /** The token found instead, or the end of the source. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "ExpectedCloseBracket";
      /** The token found instead, or the end of the source. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "ExpectedCloseBrace";
      /** The token found instead, or the end of the source. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "ExpectedColon";
      /** The token found instead, or the end of the source. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "ExpectedPattern";
      /** Where the pattern was required. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "UnmatchedParentheses";
      /** The parenthesis without a pair. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "UnmatchedBraces";
      /** The brace without a pair. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidCaptureGroupName";
      /** The `@` and the name. */
      readonly span: Span;
      /** The name as written. */
      readonly name: string;
    }
  | {
      /** The discriminant. */
      readonly code: "InvalidDigestPattern";
      /** The literal. */
      readonly span: Span;
      /** The body as written, or `empty content`. */
      readonly reason: string;
    }
  | {
      /** The discriminant. */
      readonly code: "UnterminatedDigestQuoted";
      /** The literal, to the end of the source. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "UnterminatedDateQuoted";
      /** The literal, to the end of the source. */
      readonly span: Span;
    }
  | {
      /** The discriminant. */
      readonly code: "NestingTooDeep";
      /** The token that opened the level too many. */
      readonly span: Span;
      /** The limit in force. */
      readonly maxDepth: number;
    };

/** The details payload of each `DcborPatternErrorCode`. */
export type DcborPatternErrorDetailsByCode = {
  [D in DcborPatternErrorDetails as D["code"]]: D;
};

/**
 * A {@link DcborPatternError} narrowed to one code: `code` is `C` and
 * `details` is the payload of `C`. With the default type argument it is the
 * union over every code, so narrowing on `error.code` narrows `error.details`.
 */
export type DcborPatternErrorTyped<C extends DcborPatternErrorCode = DcborPatternErrorCode> =
  C extends DcborPatternErrorCode
    ? DcborPatternError & {
        /** The discriminant. */
        readonly code: C;
        /** The payload of `code`. */
        readonly details: DcborPatternErrorDetailsByCode[C];
      }
    : never;

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
export class DcborPatternError extends Error {
  /** Always `"DcborPatternError"`; the cross-copy identity {@link DcborPatternError.isDcborPatternError} checks. */
  override readonly name = "DcborPatternError";
  /** The discriminant; equals `details.code`. */
  readonly code: DcborPatternErrorCode;
  /** The structured payload, discriminated by `code`. */
  readonly details: DcborPatternErrorDetails;

  private constructor(message: string, details: DcborPatternErrorDetails) {
    super(message);
    this.code = details.code;
    this.details = Object.freeze(details);
  }

  /** Type guard for a `DcborPatternError`, including one from another copy of this package. */
  static isDcborPatternError(value: unknown): value is DcborPatternErrorTyped {
    return value instanceof Error && value.name === "DcborPatternError" && "code" in value;
  }

  /** `true` when `code` is this error's code. */
  is(code: DcborPatternErrorCode): boolean {
    return this.code === code;
  }

  /** The span, if the error has one. */
  get span(): Span | undefined {
    return "span" in this.details ? this.details.span : undefined;
  }

  /** The message with the source line and a caret under the span. */
  fullMessage(source: string): string {
    const s =
      this.code === "UnexpectedEndOfInput" || this.code === "EmptyInput"
        ? span(source.length, source.length)
        : (this.span ?? span(0, 0));
    return formatMessage(this.message, source, s);
  }

  /** @internal The same error with its span moved by `offset`. */
  shifted(offset: number): DcborPatternError {
    const current = this.span;
    if (current === undefined) return this;
    const moved = span(current.start + offset, current.end + offset);
    return new DcborPatternError(this.message, {
      ...this.details,
      span: moved,
    } as DcborPatternErrorDetails);
  }

  private static make<C extends DcborPatternErrorCode>(
    message: string,
    details: DcborPatternErrorDetailsByCode[C],
  ): DcborPatternErrorTyped<C> {
    return new DcborPatternError(message, details) as DcborPatternErrorTyped<C>;
  }

  /** The source is empty. */
  static emptyInput(): DcborPatternErrorTyped<"EmptyInput"> {
    return DcborPatternError.make("Empty input", { code: "EmptyInput" });
  }
  /** The source ended inside a pattern. */
  static unexpectedEndOfInput(): DcborPatternErrorTyped<"UnexpectedEndOfInput"> {
    return DcborPatternError.make("Unexpected end of input", { code: "UnexpectedEndOfInput" });
  }
  /** Text follows the pattern. */
  static extraData(range: Span): DcborPatternErrorTyped<"ExtraData"> {
    return DcborPatternError.make("Extra data at end of input", { code: "ExtraData", span: range });
  }
  /** A token that cannot start or continue a pattern here. */
  static unexpectedToken(
    kind: TokenKind,
    text: string,
    range: Span,
  ): DcborPatternErrorTyped<"UnexpectedToken"> {
    return DcborPatternError.make(`Unexpected token \`${text}\``, {
      code: "UnexpectedToken",
      span: range,
      kind,
      text,
    });
  }
  /** Text no token matches. */
  static unrecognizedToken(range: Span): DcborPatternErrorTyped<"UnrecognizedToken"> {
    return DcborPatternError.make("Unrecognized token", { code: "UnrecognizedToken", span: range });
  }
  /** A regex the dialect does not accept. */
  static invalidRegex(range: Span): DcborPatternErrorTyped<"InvalidRegex"> {
    return DcborPatternError.make("Invalid regex pattern", { code: "InvalidRegex", span: range });
  }
  /** A `/regex/` without its closing slash. */
  static unterminatedRegex(range: Span): DcborPatternErrorTyped<"UnterminatedRegex"> {
    return DcborPatternError.make("Unterminated regex pattern", {
      code: "UnterminatedRegex",
      span: range,
    });
  }
  /** A string literal without its closing quote. */
  static unterminatedString(range: Span): DcborPatternErrorTyped<"UnterminatedString"> {
    return DcborPatternError.make("Unterminated string literal", {
      code: "UnterminatedString",
      span: range,
    });
  }
  /** A `{n,m}` range that is not one, or with `n` above `m`. */
  static invalidRange(range: Span): DcborPatternErrorTyped<"InvalidRange"> {
    return DcborPatternError.make("Invalid range", { code: "InvalidRange", span: range });
  }
  /** A hex literal that is not even-length hex. */
  static invalidHexString(range: Span): DcborPatternErrorTyped<"InvalidHexString"> {
    return DcborPatternError.make("Invalid hex string", { code: "InvalidHexString", span: range });
  }
  /** An `h'…'` literal without its closing quote. */
  static unterminatedHexString(range: Span): DcborPatternErrorTyped<"UnterminatedHexString"> {
    return DcborPatternError.make("Unterminated hex string", {
      code: "UnterminatedHexString",
      span: range,
    });
  }
  /** A `date'…'` body that is not a date, a range of dates, or a regex. */
  static invalidDateFormat(range: Span): DcborPatternErrorTyped<"InvalidDateFormat"> {
    return DcborPatternError.make("Invalid date format", {
      code: "InvalidDateFormat",
      span: range,
    });
  }
  /** A number literal that is not a finite dCBOR number. */
  static invalidNumberFormat(range: Span): DcborPatternErrorTyped<"InvalidNumberFormat"> {
    return DcborPatternError.make("Invalid number format", {
      code: "InvalidNumberFormat",
      span: range,
    });
  }
  /** A `digest'ur:…'` body the UR decoder rejects. */
  static invalidUr(cause: string, range: Span): DcborPatternErrorTyped<"InvalidUr"> {
    return DcborPatternError.make(`Invalid UR: ${cause}`, {
      code: "InvalidUr",
      span: range,
      cause,
    });
  }
  /** An opening parenthesis was required. */
  static expectedOpenParen(range: Span): DcborPatternErrorTyped<"ExpectedOpenParen"> {
    return DcborPatternError.make("Expected opening parenthesis", {
      code: "ExpectedOpenParen",
      span: range,
    });
  }
  /** A closing parenthesis was required. */
  static expectedCloseParen(range: Span): DcborPatternErrorTyped<"ExpectedCloseParen"> {
    return DcborPatternError.make("Expected closing parenthesis", {
      code: "ExpectedCloseParen",
      span: range,
    });
  }
  /** A closing bracket was required. */
  static expectedCloseBracket(range: Span): DcborPatternErrorTyped<"ExpectedCloseBracket"> {
    return DcborPatternError.make("Expected closing bracket", {
      code: "ExpectedCloseBracket",
      span: range,
    });
  }
  /** A closing brace was required. */
  static expectedCloseBrace(range: Span): DcborPatternErrorTyped<"ExpectedCloseBrace"> {
    return DcborPatternError.make("Expected closing brace", {
      code: "ExpectedCloseBrace",
      span: range,
    });
  }
  /** A colon was required between a map key and its value. */
  static expectedColon(range: Span): DcborPatternErrorTyped<"ExpectedColon"> {
    return DcborPatternError.make("Expected colon", { code: "ExpectedColon", span: range });
  }
  /** A pattern was required after an operator. */
  static expectedPattern(range: Span): DcborPatternErrorTyped<"ExpectedPattern"> {
    return DcborPatternError.make("Expected pattern after operator", {
      code: "ExpectedPattern",
      span: range,
    });
  }
  /** Parentheses that do not pair. */
  static unmatchedParentheses(range: Span): DcborPatternErrorTyped<"UnmatchedParentheses"> {
    return DcborPatternError.make("Unmatched parentheses", {
      code: "UnmatchedParentheses",
      span: range,
    });
  }
  /** Braces that do not pair. */
  static unmatchedBraces(range: Span): DcborPatternErrorTyped<"UnmatchedBraces"> {
    return DcborPatternError.make("Unmatched braces", { code: "UnmatchedBraces", span: range });
  }
  /** A capture name that is not an identifier. */
  static invalidCaptureGroupName(
    name: string,
    range: Span,
  ): DcborPatternErrorTyped<"InvalidCaptureGroupName"> {
    return DcborPatternError.make(`Invalid capture group name '${name}'`, {
      code: "InvalidCaptureGroupName",
      span: range,
      name,
    });
  }
  /** A `digest'…'` body that is neither a UR, a regex nor a hex prefix. */
  static invalidDigestPattern(
    reason: string,
    range: Span,
  ): DcborPatternErrorTyped<"InvalidDigestPattern"> {
    return DcborPatternError.make(`Invalid digest pattern: ${reason}`, {
      code: "InvalidDigestPattern",
      span: range,
      reason,
    });
  }
  /** A `digest'…'` literal without its closing quote. */
  static unterminatedDigestQuoted(range: Span): DcborPatternErrorTyped<"UnterminatedDigestQuoted"> {
    return DcborPatternError.make("Unterminated digest quoted pattern", {
      code: "UnterminatedDigestQuoted",
      span: range,
    });
  }
  /** A `date'…'` literal without its closing quote. */
  static unterminatedDateQuoted(range: Span): DcborPatternErrorTyped<"UnterminatedDateQuoted"> {
    return DcborPatternError.make("Unterminated date quoted pattern", {
      code: "UnterminatedDateQuoted",
      span: range,
    });
  }
  /** A pattern nested deeper than `maxDepth`. */
  static nestingTooDeep(maxDepth: number, range: Span): DcborPatternErrorTyped<"NestingTooDeep"> {
    return DcborPatternError.make(`Nesting deeper than ${maxDepth} levels`, {
      code: "NestingTooDeep",
      span: range,
      maxDepth,
    });
  }
}

function formatMessage(message: string, source: string, range: Span): string {
  const start = range.start;
  const end = range.end;
  let lineNumber = 1;
  let lineStart = 0;
  for (let idx = 0; idx < source.length && idx < start; idx++) {
    if (source[idx] === "\n") {
      lineNumber++;
      lineStart = idx + 1;
    }
  }
  const lines = source.split("\n");
  let line = lines[lineNumber - 1] ?? "";
  if (line.endsWith("\r")) line = line.slice(0, -1);
  const column = Math.max(0, start - lineStart);
  const underlineLen = Math.max(1, end - start);
  const caret = " ".repeat(column) + "^".repeat(underlineLen);
  return `line ${lineNumber}: ${message}\n${line}\n${caret}`;
}
