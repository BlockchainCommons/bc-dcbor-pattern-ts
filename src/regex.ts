/**
 * The pattern language's regex dialect, translated to JavaScript. A text
 * regex runs over code points; a byte regex runs over a string with one
 * character per byte. Constructs JavaScript lacks (possessive quantifiers)
 * are approximated, and constructs the dialect lacks (lookaround,
 * backreferences) are rejected, so a pattern's regex means the same thing
 * wherever the pattern is read.
 */

/** Whether a regex runs over text (code points) or over bytes. */
export type RegexMode = "text" | "bytes";

/** A regex as the pattern language spells it, with its compiled form. */
export interface PatternRegex {
  /** The text between the slashes, as written in a pattern. */
  readonly source: string;
  /** The compiled regex, ready to `test`. */
  readonly regex: RegExp;
}

/** A regex source the dialect does not accept. */
export class RegexSyntaxError extends Error {
  override readonly name = "RegexSyntaxError";
}

const reject = (why: string): never => {
  throw new RegexSyntaxError(why);
};

/** ASCII character classes, as `[:name:]` inside a bracket expression. */
const POSIX_CLASSES: Readonly<Record<string, string>> = {
  alnum: "0-9A-Za-z",
  alpha: "A-Za-z",
  ascii: "\\x00-\\x7F",
  blank: "\\t ",
  cntrl: "\\x00-\\x1F\\x7F",
  digit: "0-9",
  graph: "!-~",
  lower: "a-z",
  print: " -~",
  punct: "!-/:-@\\[-`{-~",
  space: "\\t\\n\\v\\f\\r ",
  upper: "A-Z",
  word: "0-9A-Za-z_",
  xdigit: "0-9A-Fa-f",
};

/** `name` as JavaScript spells the Unicode property: itself, or `Script=name`. */
const unicodeProperty = (name: string): string => {
  try {
    new RegExp(`\\p{${name}}`, "u");
    return name;
  } catch {
    try {
      new RegExp(`\\p{Script=${name}}`, "u");
      return `Script=${name}`;
    } catch {
      return reject(`unknown Unicode property ${name}`);
    }
  }
};

const isQuantifierEnd = (ch: string | undefined): boolean =>
  ch === "*" || ch === "+" || ch === "?" || ch === "}";

/**
 * Translates a dialect source to a JavaScript source and flags: leading
 * inline flags become flags, `(?P<n>` becomes `(?<n>`, `\x{…}` becomes
 * `\u{…}` (text) or `\xHH` (bytes), `\pL` becomes `\p{L}`, `\A`/`\z`
 * become anchors, POSIX classes become ranges, possessive quantifiers
 * become greedy; lookaround, backreferences and the greed swap are rejected.
 */
const translate = (source: string, mode: RegexMode): { source: string; flags: string } => {
  let flags = mode === "text" ? "u" : "";
  let extended = false;
  let i = 0;

  // every leading `(?flags)` group applies to the whole regex
  for (;;) {
    const leading = /^\(\?([imsxuU-]+)\)/.exec(source.slice(i));
    if (leading === null) break;
    let negate = false;
    for (const flag of leading[1]) {
      switch (flag) {
        case "-":
          negate = true;
          break;
        case "i":
        case "m":
        case "s":
          if (negate) flags = flags.replace(flag, "");
          else if (!flags.includes(flag)) flags += flag;
          break;
        case "x":
          extended = !negate;
          break;
        case "u":
          // text always runs in Unicode mode; bytes always run byte by byte
          if (mode === "text" && negate) reject("(?-u) is not allowed in a text regex");
          break;
        case "U":
          reject("(?U) is not supported");
          break;
      }
    }
    i += leading[0].length;
  }

  let out = "";
  let inClass = false;
  let previous = "";
  while (i < source.length) {
    const ch = source[i];

    if (ch === "\\") {
      const next = source[i + 1];
      if (next === undefined) reject("trailing backslash");
      if (next === "x" && source[i + 2] === "{") {
        const close = source.indexOf("}", i + 3);
        if (close < 0) reject("unclosed \\x{…}");
        const hex = source.slice(i + 3, close);
        if (!/^[0-9a-fA-F]{1,6}$/.test(hex)) reject(`invalid escape \\x{${hex}}`);
        if (mode === "bytes") {
          if (parseInt(hex, 16) > 0xff) reject(`\\x{${hex}} is not a byte`);
          out += `\\x${parseInt(hex, 16).toString(16).padStart(2, "0")}`;
        } else {
          out += `\\u{${hex}}`;
        }
        i = close + 1;
        previous = "e";
        continue;
      }
      if ((next === "p" || next === "P") && source[i + 2] !== "{") {
        const letter = source[i + 2];
        if (letter === undefined || !/[A-Za-z]/.test(letter)) reject("invalid \\p escape");
        out += `\\${next}{${letter}}`;
        i += 3;
        previous = "e";
        continue;
      }
      if ((next === "p" || next === "P") && source[i + 2] === "{" && mode === "text") {
        const close = source.indexOf("}", i + 3);
        if (close < 0) reject("unclosed \\p{…}");
        const name = source.slice(i + 3, close);
        // a bare script name (`Greek`) needs `Script=` in JavaScript
        out += `\\${next}{${unicodeProperty(name)}}`;
        i = close + 1;
        previous = "e";
        continue;
      }
      if (next === "A" && !inClass) {
        out += "(?<![\\s\\S])";
        i += 2;
        previous = "e";
        continue;
      }
      if (next === "z" && !inClass) {
        out += "(?![\\s\\S])";
        i += 2;
        previous = "e";
        continue;
      }
      if (next === "k" || /[1-9]/.test(next)) reject("backreferences are not supported");
      out += `\\${next}`;
      i += 2;
      previous = "e";
      continue;
    }

    if (inClass) {
      if (ch === "[" && source[i + 1] === ":") {
        const close = source.indexOf(":]", i + 2);
        if (close < 0) reject("unclosed [:class:]");
        let name = source.slice(i + 2, close);
        const negated = name.startsWith("^");
        if (negated) name = name.slice(1);
        const ranges = POSIX_CLASSES[name];
        if (ranges === undefined) reject(`unknown class [:${name}:]`);
        if (negated) {
          // a negated class stands alone in its bracket expression
          if (out.endsWith("[") && source[close + 2] === "]") {
            out = `${out.slice(0, -1)}[^${ranges}`;
          } else {
            reject(`[:^${name}:] must be the only member of its class`);
          }
        } else {
          out += ranges;
        }
        i = close + 2;
        previous = "c";
        continue;
      }
      if (ch === "]") inClass = false;
      out += ch;
      i++;
      previous = ch;
      continue;
    }

    if (extended) {
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      if (ch === "#") {
        const nl = source.indexOf("\n", i);
        i = nl < 0 ? source.length : nl + 1;
        continue;
      }
    }

    if (ch === "[") {
      inClass = true;
      out += ch;
      i++;
      if (source[i] === "^") {
        out += "^";
        i++;
      }
      if (source[i] === "]") {
        // a leading `]` is literal
        out += "\\]";
        i++;
      }
      previous = "[";
      continue;
    }

    if (ch === "(" && source[i + 1] === "?") {
      const rest = source.slice(i + 2);
      if (rest.startsWith("P<")) {
        out += "(?<";
        i += 4;
        previous = "(";
        continue;
      }
      if (
        rest.startsWith("=") ||
        rest.startsWith("!") ||
        rest.startsWith("<=") ||
        rest.startsWith("<!")
      ) {
        reject("lookaround is not supported");
      }
    }

    if (ch === "+" && isQuantifierEnd(previous) && previous !== "") {
      // possessive: the greedy form is the closest JavaScript offers
      i++;
      previous = "p";
      continue;
    }

    out += ch;
    previous = ch;
    i++;
  }
  if (inClass) reject("unclosed character class");
  return { source: out, flags };
};

/**
 * Compiles a dialect source for `mode`.
 *
 * @throws {RegexSyntaxError} for a source the dialect or the engine rejects
 */
export const compilePatternRegex = (source: string, mode: RegexMode): RegExp => {
  const translated = translate(source, mode);
  try {
    return new RegExp(translated.source, translated.flags);
  } catch (e) {
    return reject(e instanceof Error ? e.message : String(e));
  }
};

/** A `PatternRegex` from a dialect source. */
export const patternRegexFromSource = (source: string, mode: RegexMode): PatternRegex =>
  Object.freeze({ source, regex: compilePatternRegex(source, mode) });

/**
 * A `PatternRegex` from a JavaScript regex: its `i`, `m` and `s` flags
 * become inline flags of the source, `u`, `v` and `d` are implied or
 * dropped, and `g` or `y` are refused because a pattern has no cursor.
 *
 * @throws {TypeError} for a `g` or `y` flag, or a source the dialect does not accept
 */
export const patternRegexFromRegExp = (regex: RegExp, mode: RegexMode): PatternRegex => {
  if (regex.global || regex.sticky) {
    throw new TypeError("a pattern regex cannot carry the g or y flag");
  }
  const inline = ["i", "m", "s"].filter((f) => regex.flags.includes(f)).join("");
  const body = regex.source === "(?:)" ? "" : regex.source;
  const source = inline === "" ? body : `(?${inline})${body}`;
  try {
    return patternRegexFromSource(source, mode);
  } catch (e) {
    throw new TypeError(
      `regex /${regex.source}/${regex.flags} is not a pattern regex: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e },
    );
  }
};

/** The regex argument a constructor accepts: a dialect source or a JavaScript regex. */
export type RegexInput = RegExp | string;

/** Resolves a constructor's regex argument. */
export const toPatternRegex = (input: RegexInput, mode: RegexMode): PatternRegex => {
  if (typeof input === "string") {
    try {
      return patternRegexFromSource(input, mode);
    } catch (e) {
      throw new TypeError(
        `regex /${input}/ is not a pattern regex: ${e instanceof Error ? e.message : String(e)}`,
        { cause: e },
      );
    }
  }
  if (!(input instanceof RegExp)) throw new TypeError("regex must be a RegExp or a string");
  return patternRegexFromRegExp(input, mode);
};
