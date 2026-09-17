/**
 * The pattern language's regex dialect, translated to JavaScript. A pattern
 * spells its regexes in the dialect every implementation shares (that of
 * the `regex` crate): Unicode `\w`, `\d`, `\b` and `\s`, `.` as any code
 * point but `\n`, `(?m)` anchors at `\n` only, stacked repetition, the
 * `(?U)` greed swap, `(?x)` verbose mode, nested and set-operated character
 * classes, POSIX classes, Unicode properties with loose names, and the
 * `\a`, `\x`, `\u`, `\U` escapes. Lookaround and backreferences are not part
 * of it. The translator parses that dialect and emits a JavaScript regex
 * that matches the same strings.
 *
 * A text regex runs over the text's code points. A byte regex runs, as the
 * reference's byte regexes do, in Unicode mode over the bytes: the bytes
 * are decoded as UTF-8 and every byte that is not part of a valid sequence
 * becomes a lone surrogate no class can match; under a leading `(?-u)` it
 * runs over one code unit per byte with ASCII classes, `\xHH` as a byte and
 * a non-ASCII literal as its UTF-8 bytes.
 */
import { bytesToLatin1 } from "./pattern/value/bytes-utils";

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

// ---------------------------------------------------------------------------
// Subjects

/** What a compiled regex reads: text code points, escaped UTF-8 bytes, or one code unit per byte. */
type Subject = "text" | "utf8" | "raw";
const BYTE_SUBJECTS = new WeakMap<RegExp, Subject>();

/** The surrogate a byte outside any valid UTF-8 sequence decodes to. */
const escapedByte = (byte: number): string => String.fromCharCode(0xdc00 + byte);

/**
 * `bytes` as text: every valid UTF-8 sequence as its code point, every other
 * byte as the lone surrogate U+DC80–U+DCFF, which `.` and every class exclude.
 */
export const decodeBytesEscaped = (bytes: Uint8Array): string => {
  let out = "";
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i];
    if (b0 < 0x80) {
      out += String.fromCharCode(b0);
      i++;
      continue;
    }
    let need = 0;
    let cp = 0;
    let min = 0;
    if (b0 >= 0xc2 && b0 <= 0xdf) {
      need = 1;
      cp = b0 & 0x1f;
      min = 0x80;
    } else if (b0 >= 0xe0 && b0 <= 0xef) {
      need = 2;
      cp = b0 & 0x0f;
      min = 0x800;
    } else if (b0 >= 0xf0 && b0 <= 0xf4) {
      need = 3;
      cp = b0 & 0x07;
      min = 0x10000;
    }
    let valid = need > 0 && i + need < bytes.length;
    if (valid) {
      for (let k = 1; k <= need; k++) {
        const b = bytes[i + k];
        if ((b & 0xc0) !== 0x80) {
          valid = false;
          break;
        }
        cp = (cp << 6) | (b & 0x3f);
      }
    }
    if (valid && (cp < min || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff))) valid = false;
    if (valid) {
      out += String.fromCodePoint(cp);
      i += need + 1;
    } else {
      out += escapedByte(b0);
      i++;
    }
  }
  return out;
};

/** Whether a byte regex matches `bytes`, read as its mode reads them. */
export const byteRegexTest = (regex: PatternRegex, bytes: Uint8Array): boolean => {
  const subject =
    BYTE_SUBJECTS.get(regex.regex) === "raw" ? bytesToLatin1(bytes) : decodeBytesEscaped(bytes);
  return regex.regex.test(subject);
};

// ---------------------------------------------------------------------------
// Unicode property names, as JavaScript spells them, by their loose form

/** A name in the dialect's loose form: case, spaces, hyphens and underscores do not matter. */
const loose = (name: string): string => name.toLowerCase().replace(/[\s_-]/g, "");

const GENERAL_CATEGORIES: readonly (readonly [string, string])[] = [
  ["C", "Other"],
  ["Cc", "Control"],
  ["Cf", "Format"],
  ["Cn", "Unassigned"],
  ["Co", "Private_Use"],
  ["Cs", "Surrogate"],
  ["L", "Letter"],
  ["LC", "Cased_Letter"],
  ["Ll", "Lowercase_Letter"],
  ["Lm", "Modifier_Letter"],
  ["Lo", "Other_Letter"],
  ["Lt", "Titlecase_Letter"],
  ["Lu", "Uppercase_Letter"],
  ["M", "Mark"],
  ["Mc", "Spacing_Mark"],
  ["Me", "Enclosing_Mark"],
  ["Mn", "Nonspacing_Mark"],
  ["N", "Number"],
  ["Nd", "Decimal_Number"],
  ["Nl", "Letter_Number"],
  ["No", "Other_Number"],
  ["P", "Punctuation"],
  ["Pc", "Connector_Punctuation"],
  ["Pd", "Dash_Punctuation"],
  ["Pe", "Close_Punctuation"],
  ["Pf", "Final_Punctuation"],
  ["Pi", "Initial_Punctuation"],
  ["Po", "Other_Punctuation"],
  ["Ps", "Open_Punctuation"],
  ["S", "Symbol"],
  ["Sc", "Currency_Symbol"],
  ["Sk", "Modifier_Symbol"],
  ["Sm", "Math_Symbol"],
  ["So", "Other_Symbol"],
  ["Z", "Separator"],
  ["Zl", "Line_Separator"],
  ["Zp", "Paragraph_Separator"],
  ["Zs", "Space_Separator"],
];

const BINARY_PROPERTIES: readonly string[] = [
  "ASCII",
  "ASCII_Hex_Digit",
  "Alphabetic",
  "Assigned",
  "Bidi_Control",
  "Bidi_Mirrored",
  "Case_Ignorable",
  "Cased",
  "Changes_When_Casefolded",
  "Changes_When_Casemapped",
  "Changes_When_Lowercased",
  "Changes_When_NFKC_Casefolded",
  "Changes_When_Titlecased",
  "Changes_When_Uppercased",
  "Dash",
  "Default_Ignorable_Code_Point",
  "Deprecated",
  "Diacritic",
  "Emoji",
  "Emoji_Component",
  "Emoji_Modifier",
  "Emoji_Modifier_Base",
  "Emoji_Presentation",
  "Extended_Pictographic",
  "Extender",
  "Grapheme_Base",
  "Grapheme_Extend",
  "Hex_Digit",
  "IDS_Binary_Operator",
  "IDS_Trinary_Operator",
  "ID_Continue",
  "ID_Start",
  "Ideographic",
  "Join_Control",
  "Logical_Order_Exception",
  "Lowercase",
  "Math",
  "Noncharacter_Code_Point",
  "Pattern_Syntax",
  "Pattern_White_Space",
  "Quotation_Mark",
  "Radical",
  "Regional_Indicator",
  "Sentence_Terminal",
  "Soft_Dotted",
  "Terminal_Punctuation",
  "Unified_Ideograph",
  "Uppercase",
  "Variation_Selector",
  "White_Space",
  "XID_Continue",
  "XID_Start",
];

const SCRIPTS: readonly string[] =
  "Adlam Ahom Anatolian_Hieroglyphs Arabic Armenian Avestan Balinese Bamum Bassa_Vah Batak Bengali Bhaiksuki Bopomofo Brahmi Braille Buginese Buhid Canadian_Aboriginal Carian Caucasian_Albanian Chakma Cham Cherokee Chorasmian Common Coptic Cuneiform Cypriot Cypro_Minoan Cyrillic Deseret Devanagari Dives_Akuru Dogra Duployan Egyptian_Hieroglyphs Elbasan Elymaic Ethiopic Garay Georgian Glagolitic Gothic Grantha Greek Gujarati Gunjala_Gondi Gurmukhi Gurung_Khema Han Hangul Hanifi_Rohingya Hanunoo Hatran Hebrew Hiragana Imperial_Aramaic Inherited Inscriptional_Pahlavi Inscriptional_Parthian Javanese Kaithi Kannada Katakana Kawi Kayah_Li Kharoshthi Khitan_Small_Script Khmer Khojki Khudawadi Kirat_Rai Lao Latin Lepcha Limbu Linear_A Linear_B Lisu Lycian Lydian Mahajani Makasar Malayalam Mandaic Manichaean Marchen Masaram_Gondi Medefaidrin Meetei_Mayek Mende_Kikakui Meroitic_Cursive Meroitic_Hieroglyphs Miao Modi Mongolian Mro Multani Myanmar Nabataean Nag_Mundari Nandinagari New_Tai_Lue Newa Nko Nushu Nyiakeng_Puachue_Hmong Ogham Ol_Chiki Ol_Onal Old_Hungarian Old_Italic Old_North_Arabian Old_Permic Old_Persian Old_Sogdian Old_South_Arabian Old_Turkic Old_Uyghur Oriya Osage Osmanya Pahawh_Hmong Palmyrene Pau_Cin_Hau Phags_Pa Phoenician Psalter_Pahlavi Rejang Runic Samaritan Saurashtra Sharada Shavian Siddham SignWriting Sinhala Sogdian Sora_Sompeng Soyombo Sundanese Sunuwar Syloti_Nagri Syriac Tagalog Tagbanwa Tai_Le Tai_Tham Tai_Viet Takri Tamil Tangsa Tangut Telugu Thaana Thai Tibetan Tifinagh Tirhuta Todhri Toto Tulu_Tigalari Ugaritic Vai Vithkuqi Wancho Warang_Citi Yezidi Yi Zanabazar_Square".split(
    " ",
  );

/** `\p{…}` as JavaScript accepts it, or `undefined` when the engine lacks it. */
const jsProperty = (body: string): string | undefined => {
  try {
    new RegExp(`\\p{${body}}`, "v");
    return body;
  } catch {
    return undefined;
  }
};

let propertyTable: Map<string, string> | undefined;
/** The loose name of every property value JavaScript knows, to its `\p{…}` body. */
const properties = (): Map<string, string> => {
  if (propertyTable !== undefined) return propertyTable;
  const table = new Map<string, string>();
  const add = (looseName: string, body: string): void => {
    if (!table.has(looseName) && jsProperty(body) !== undefined) table.set(looseName, body);
  };
  table.set("any", "any");
  for (const [short, long] of GENERAL_CATEGORIES) {
    add(loose(short), short);
    add(loose(long), short);
    add(`gc=${loose(short)}`, short);
    add(`gc=${loose(long)}`, short);
  }
  for (const name of BINARY_PROPERTIES) add(loose(name), name);
  for (const name of SCRIPTS) {
    add(loose(name), `Script=${name}`);
    add(`sc=${loose(name)}`, `Script=${name}`);
    add(`scx=${loose(name)}`, `Script_Extensions=${name}`);
  }
  propertyTable = table;
  return table;
};

/** Resolves `\p{…}`'s body: a bare name, or `name=value` / `name!=value`. */
const resolveProperty = (body: string): { js: string; negated: boolean } => {
  let negated = false;
  let name = body;
  let value: string | undefined;
  const eq = body.indexOf("=");
  if (eq >= 0) {
    name = body.slice(0, eq);
    value = body.slice(eq + 1);
    if (name.endsWith("!")) {
      name = name.slice(0, -1);
      negated = true;
    }
  }
  const table = properties();
  let key: string;
  if (value === undefined) {
    key = loose(name);
  } else {
    const property = loose(name);
    const prefix =
      property === "gc" || property === "generalcategory"
        ? "gc="
        : property === "sc" || property === "script"
          ? "sc="
          : property === "scx" || property === "scriptextensions"
            ? "scx="
            : reject(`unsupported Unicode property ${name}`);
    key = `${prefix}${loose(value)}`;
  }
  const js = table.get(key);
  if (js === undefined) return reject(`unknown Unicode property ${body}`);
  return { js, negated };
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
  punct: "!-\\/:-@\\[-`\\{-~",
  space: "\\t\\n\\v\\f\\r ",
  upper: "A-Z",
  word: "0-9A-Za-z_",
  xdigit: "0-9A-Fa-f",
};

// ---------------------------------------------------------------------------
// The dialect's syntax tree

interface Flags {
  i: boolean;
  m: boolean;
  s: boolean;
  R: boolean;
  U: boolean;
  x: boolean;
  /** Unicode mode; off, classes are ASCII and a `\xHH` escape is a byte. */
  u: boolean;
}

type ClassItem =
  | { readonly t: "char"; readonly cp: number; readonly byte: boolean }
  | { readonly t: "range"; readonly lo: number; readonly hi: number }
  | {
      readonly t: "perl";
      readonly cls: "w" | "d" | "s";
      readonly negated: boolean;
      readonly u: boolean;
    }
  | { readonly t: "prop"; readonly js: string; readonly negated: boolean }
  | { readonly t: "posix"; readonly ranges: string; readonly negated: boolean }
  | { readonly t: "set"; readonly set: ClassSet };

type ClassSet =
  | { readonly kind: "union"; readonly items: readonly ClassItem[]; readonly negated: boolean }
  | {
      readonly kind: "op";
      readonly op: "&&" | "--" | "~~";
      readonly left: ClassSet;
      readonly right: ClassSet;
    };

type Node =
  | { readonly kind: "empty" }
  | { readonly kind: "lit"; readonly cp: number; readonly byte: boolean; readonly i: boolean }
  | { readonly kind: "any"; readonly s: boolean; readonly R: boolean; readonly u: boolean }
  | { readonly kind: "set"; readonly set: ClassSet; readonly i: boolean; readonly u: boolean }
  | {
      readonly kind: "perl";
      readonly cls: "w" | "d" | "s";
      readonly negated: boolean;
      readonly i: boolean;
      readonly u: boolean;
    }
  | { readonly kind: "prop"; readonly js: string; readonly negated: boolean; readonly i: boolean }
  | { readonly kind: "line"; readonly which: "^" | "$"; readonly m: boolean; readonly R: boolean }
  | {
      readonly kind: "assert";
      readonly which: "A" | "z" | "b" | "B" | "start" | "end" | "start-half" | "end-half";
      readonly u: boolean;
    }
  | {
      readonly kind: "group";
      readonly name: string | undefined;
      readonly capture: boolean;
      readonly body: Node;
    }
  | {
      readonly kind: "repeat";
      readonly body: Node;
      readonly min: number;
      readonly max: number | undefined;
      readonly lazy: boolean;
    }
  | { readonly kind: "concat"; readonly items: readonly Node[] }
  | { readonly kind: "alt"; readonly items: readonly Node[] };

/** The reference's nesting limit for groups, classes and repetitions. */
const NEST_LIMIT = 250;

const isWs = (ch: string): boolean =>
  ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f" || ch === "\v";
const isHex = (ch: string): boolean => /^[0-9a-fA-F]$/.test(ch);
const isDigit = (ch: string): boolean => ch >= "0" && ch <= "9";

/** Parses a dialect source into a syntax tree. */
class DialectParser {
  private pos = 0;
  private depth = 0;

  /**
   * @param bytes whether the regex runs over bytes, whose Unicode mode is
   *   fixed for the whole regex by its leading flags (`fixedU`)
   */
  constructor(
    private readonly src: string,
    private readonly bytes: boolean,
    private readonly fixedU: boolean,
  ) {}

  private peek(offset = 0): string {
    return this.src[this.pos + offset] ?? "";
  }

  private atEnd(): boolean {
    return this.pos >= this.src.length;
  }

  private nest(): void {
    if (++this.depth > NEST_LIMIT) reject("exceeded the maximum nesting depth");
  }

  private unnest(): void {
    this.depth--;
  }

  /** Skips whitespace and `#` comments in verbose mode. */
  private trivia(flags: Flags): void {
    if (!flags.x) return;
    for (;;) {
      if (isWs(this.peek())) {
        this.pos++;
        continue;
      }
      if (this.peek() === "#") {
        while (!this.atEnd() && this.peek() !== "\n") this.pos++;
        continue;
      }
      return;
    }
  }

  parse(flags: Flags): Node {
    const node = this.alternation(flags);
    if (!this.atEnd()) reject(`unexpected \`${this.peek()}\``);
    return node;
  }

  /** `a|b|…`; inline flags set in one branch persist into the next, as in the dialect. */
  private alternation(flags: Flags): Node {
    const items: Node[] = [this.concat(flags)];
    while (this.peek() === "|") {
      this.pos++;
      items.push(this.concat(flags));
    }
    return items.length === 1 ? items[0] : { kind: "alt", items };
  }

  private concat(flags: Flags): Node {
    const items: Node[] = [];
    for (;;) {
      this.trivia(flags);
      const ch = this.peek();
      if (ch === "" || ch === "|" || ch === ")") break;
      const atom = this.atom(flags);
      if (atom === undefined) continue;
      items.push(this.quantified(atom, flags));
    }
    if (items.length === 0) return { kind: "empty" };
    return items.length === 1 ? items[0] : { kind: "concat", items };
  }

  /** The quantifiers after an atom, stacked: `a**` is `(a*)*`. */
  private quantified(atom: Node, flags: Flags): Node {
    let node = atom;
    let stacked = 0;
    for (;;) {
      this.trivia(flags);
      const ch = this.peek();
      let min: number;
      let max: number | undefined;
      if (ch === "*") {
        min = 0;
        max = undefined;
        this.pos++;
      } else if (ch === "+") {
        min = 1;
        max = undefined;
        this.pos++;
      } else if (ch === "?") {
        min = 0;
        max = 1;
        this.pos++;
      } else if (ch === "{") {
        [min, max] = this.counted();
      } else {
        break;
      }
      let lazy = false;
      if (this.peek() === "?") {
        lazy = true;
        this.pos++;
      }
      if (flags.U) lazy = !lazy;
      if (++stacked + this.depth > NEST_LIMIT) reject("exceeded the maximum nesting depth");
      node = { kind: "repeat", body: node, min, max, lazy };
    }
    return node;
  }

  /** `{n}`, `{n,}` or `{n,m}` at a `{`. */
  private counted(): [number, number | undefined] {
    this.pos++;
    const digits = (): number | undefined => {
      const start = this.pos;
      while (isDigit(this.peek())) this.pos++;
      if (this.pos === start) return undefined;
      const n = Number(this.src.slice(start, this.pos));
      if (n > 0xffffffff) reject("repetition count too large");
      return n;
    };
    const min = digits();
    if (min === undefined) return reject("counted repetition expects a decimal");
    let max: number | undefined = min;
    if (this.peek() === ",") {
      this.pos++;
      max = digits();
      if (max !== undefined && max < min) reject("invalid repetition count range");
    }
    if (this.peek() !== "}") return reject("unclosed counted repetition");
    this.pos++;
    return [min, max];
  }

  /** One atom, or `undefined` for an inline flags group (which changes `flags`). */
  private atom(flags: Flags): Node | undefined {
    const ch = this.peek();
    switch (ch) {
      case "(":
        return this.group(flags);
      case "[":
        return { kind: "set", set: this.classSet(flags), i: flags.i, u: flags.u };
      case ".":
        this.pos++;
        return { kind: "any", s: flags.s, R: flags.R, u: flags.u };
      case "^":
      case "$":
        this.pos++;
        return { kind: "line", which: ch, m: flags.m, R: flags.R };
      case "\\":
        return this.escape(flags, false);
      case "*":
      case "+":
      case "?":
        return reject("repetition operator missing expression");
      case "{":
        return reject("counted repetition missing expression");
      default: {
        const cp = this.src.codePointAt(this.pos) ?? 0;
        this.pos += cp > 0xffff ? 2 : 1;
        return { kind: "lit", cp, byte: false, i: flags.i };
      }
    }
  }

  /** `(…)`, `(?:…)`, `(?<name>…)`, `(?P<name>…)`, `(?flags)` or `(?flags:…)`. */
  private group(flags: Flags): Node | undefined {
    this.pos++;
    let capture = true;
    let name: string | undefined;
    let inner: Flags = { ...flags };
    if (this.peek() === "?") {
      this.pos++;
      if (this.peek() === "P" && this.peek(1) === "<") {
        this.pos += 2;
        name = this.groupName();
      } else if (this.peek() === "<" && this.peek(1) !== "=" && this.peek(1) !== "!") {
        this.pos++;
        name = this.groupName();
      } else if (this.peek() === "=" || this.peek() === "!" || this.peek() === "<") {
        return reject("lookaround is not supported");
      } else {
        capture = false;
        const scoped = this.flagGroup(flags);
        if (scoped === undefined) return undefined;
        inner = scoped;
      }
    }
    this.nest();
    const body = this.alternation(inner);
    if (this.peek() !== ")") reject("unclosed group");
    this.pos++;
    this.unnest();
    return { kind: "group", name, capture, body };
  }

  private groupName(): string {
    const start = this.pos;
    while (!this.atEnd() && this.peek() !== ">") this.pos++;
    if (this.atEnd()) return reject("unclosed capture name");
    const name = this.src.slice(start, this.pos);
    this.pos++;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) reject(`invalid capture name ${name}`);
    return name;
  }

  /**
   * After `(?`: the flags up to `)` (applied to the rest of the enclosing
   * group, returns `undefined`) or up to `:` (returned for the group).
   */
  private flagGroup(flags: Flags): Flags | undefined {
    const next: Flags = { ...flags };
    let negate = false;
    let seen = false;
    for (;;) {
      const ch = this.peek();
      if (ch === "") return reject("unclosed flags group");
      if (ch === ")" || ch === ":") break;
      this.pos++;
      if (ch === "-") {
        if (negate) reject("flag negation given twice");
        negate = true;
        continue;
      }
      seen = true;
      switch (ch) {
        case "i":
        case "m":
        case "s":
        case "R":
        case "U":
        case "x":
          next[ch] = !negate;
          break;
        case "u":
          // a byte regex reads its bytes one way for the whole regex
          if (this.bytes && !negate !== this.fixedU) {
            reject("Unicode mode cannot change inside a byte regex");
          }
          next.u = !negate;
          break;
        default:
          reject(`unknown flag ${ch}`);
      }
    }
    if (negate && !seen) reject("flag negation without flags");
    if (this.peek() === ")") {
      if (!seen && !negate) reject("empty flags group");
      this.pos++;
      Object.assign(flags, next);
      return undefined;
    }
    this.pos++;
    return next;
  }

  /** `[…]` at a `[`: a union, possibly nested and set-operated. */
  private classSet(flags: Flags): ClassSet {
    this.pos++;
    this.nest();
    let negated = false;
    if (this.peek() === "^") {
      negated = true;
      this.pos++;
    }
    let set: ClassSet = { kind: "union", items: this.classItems(flags, true), negated: false };
    for (;;) {
      const op = this.src.slice(this.pos, this.pos + 2);
      if (op !== "&&" && op !== "--" && op !== "~~") break;
      this.pos += 2;
      const right: ClassSet = {
        kind: "union",
        items: this.classItems(flags, false),
        negated: false,
      };
      set = { kind: "op", op, left: set, right };
    }
    if (this.peek() !== "]") return reject("unclosed character class");
    this.pos++;
    this.unnest();
    if (negated) {
      set =
        set.kind === "union"
          ? { ...set, negated: true }
          : { kind: "union", items: [{ t: "set", set }], negated: true };
    }
    return set;
  }

  /** The items of a class up to `]` or a set operator; a leading `]` is a literal. */
  private classItems(flags: Flags, first: boolean): ClassItem[] {
    const items: ClassItem[] = [];
    let leading = first;
    for (;;) {
      this.trivia(flags);
      const ch = this.peek();
      if (ch === "") return reject("unclosed character class");
      if (ch === "]" && !leading) break;
      const op = this.src.slice(this.pos, this.pos + 2);
      if (!leading && (op === "&&" || op === "--" || op === "~~")) break;
      leading = false;
      if (ch === "[" && this.peek(1) === ":") {
        // `[:name:]` is a POSIX class by a known name; otherwise a nested class
        const close = this.src.indexOf(":]", this.pos + 2);
        let name = close < 0 ? "" : this.src.slice(this.pos + 2, close);
        const negated = name.startsWith("^");
        if (negated) name = name.slice(1);
        const ranges = POSIX_CLASSES[name];
        if (ranges !== undefined) {
          items.push({ t: "posix", ranges, negated });
          this.pos = close + 2;
          continue;
        }
      }
      if (ch === "[") {
        items.push({ t: "set", set: this.classSet(flags) });
        continue;
      }
      const item = this.classAtom(flags);
      // a range `a-z`; a `-` before `]` or an operator is literal
      if (item.t === "char" && this.peek() === "-" && this.peek(1) !== "]" && this.peek(1) !== "") {
        const after = this.src.slice(this.pos + 1, this.pos + 3);
        if (after === "--" || after === "&&" || after === "~~") {
          items.push(item);
          continue;
        }
        this.pos++;
        const hi = this.classAtom(flags);
        if (hi.t !== "char") return reject("invalid character class range");
        if (hi.cp < item.cp) reject("invalid character class range");
        items.push({ t: "range", lo: item.cp, hi: hi.cp });
        continue;
      }
      items.push(item);
    }
    return items;
  }

  /** A single class member: a character, or a class escape. */
  private classAtom(flags: Flags): ClassItem {
    if (this.peek() === "\\") {
      const node = this.escape(flags, true);
      switch (node.kind) {
        case "lit":
          return { t: "char", cp: node.cp, byte: node.byte };
        case "perl":
          return { t: "perl", cls: node.cls, negated: node.negated, u: node.u };
        case "prop":
          return { t: "prop", js: node.js, negated: node.negated };
        default:
          return reject("this escape is not allowed in a character class");
      }
    }
    const cp = this.src.codePointAt(this.pos) ?? 0;
    this.pos += cp > 0xffff ? 2 : 1;
    return { t: "char", cp, byte: false };
  }

  /** An escape at a `\`; `inClass` says whether it is a class member. */
  private escape(flags: Flags, inClass: boolean): Node {
    this.pos++;
    const ch = this.peek();
    if (ch === "") return reject("trailing backslash");
    this.pos++;
    const i = flags.i;
    const lit = (cp: number, byte = false): Node => ({ kind: "lit", cp, byte, i });
    switch (ch) {
      case "a":
        return lit(0x07);
      case "f":
        return lit(0x0c);
      case "t":
        return lit(0x09);
      case "n":
        return lit(0x0a);
      case "r":
        return lit(0x0d);
      case "v":
        return lit(0x0b);
      case "d":
      case "D":
      case "s":
      case "S":
      case "w":
      case "W":
        return {
          kind: "perl",
          cls: ch.toLowerCase() as "w" | "d" | "s",
          negated: ch === ch.toUpperCase(),
          i,
          u: flags.u,
        };
      case "p":
      case "P": {
        if (!flags.u) reject("Unicode classes are not allowed without Unicode mode");
        let body: string;
        if (this.peek() === "{") {
          const close = this.src.indexOf("}", this.pos);
          if (close < 0) return reject("unclosed \\p{…}");
          body = this.src.slice(this.pos + 1, close);
          this.pos = close + 1;
        } else {
          body = this.peek();
          if (!/^[A-Za-z]$/.test(body)) return reject("invalid \\p escape");
          this.pos++;
        }
        const { js, negated } = resolveProperty(body);
        return { kind: "prop", js, negated: negated !== (ch === "P"), i };
      }
      case "x":
      case "u":
      case "U": {
        // `\xHH` is a byte without Unicode mode; every other form is a code point
        const fixed = ch === "x" && this.peek() !== "{";
        const cp = this.codeUnitEscape(ch, flags.u);
        return lit(cp, fixed && !flags.u);
      }
      case "A":
      case "z":
        if (inClass) reject("an anchor is not allowed in a character class");
        return { kind: "assert", which: ch, u: flags.u };
      case "b":
      case "B": {
        if (inClass) reject("a word boundary is not allowed in a character class");
        if (ch === "b" && this.peek() === "{") {
          const close = this.src.indexOf("}", this.pos);
          if (close < 0) return reject("unclosed \\b{…}");
          const which = this.src.slice(this.pos + 1, close);
          this.pos = close + 1;
          if (
            which !== "start" &&
            which !== "end" &&
            which !== "start-half" &&
            which !== "end-half"
          ) {
            return reject(`unknown word boundary \\b{${which}}`);
          }
          return { kind: "assert", which, u: flags.u };
        }
        return { kind: "assert", which: ch, u: flags.u };
      }
      case "<":
      case ">":
        if (inClass) reject("a word boundary is not allowed in a character class");
        return { kind: "assert", which: ch === "<" ? "start" : "end", u: flags.u };
      default:
        if (/[0-9]/.test(ch)) reject("backreferences and octal escapes are not supported");
        if (ch === "k") reject("backreferences are not supported");
        if (/[A-Za-z]/.test(ch) || ch.charCodeAt(0) > 0x7f) reject(`unrecognized escape \\${ch}`);
        return lit(ch.codePointAt(0) ?? 0);
    }
  }

  /** The code point of `\xHH`, `\x{…}`, `\uHHHH`, `\u{…}`, `\UHHHHHHHH` or `\U{…}`, after the letter. */
  private codeUnitEscape(letter: "x" | "u" | "U", unicode: boolean): number {
    let hex: string;
    if (this.peek() === "{") {
      const close = this.src.indexOf("}", this.pos);
      if (close < 0) return reject(`unclosed \\${letter}{…}`);
      hex = this.src.slice(this.pos + 1, close);
      this.pos = close + 1;
      if (!/^[0-9a-fA-F]{1,8}$/.test(hex)) reject(`invalid escape \\${letter}{${hex}}`);
    } else {
      const width = letter === "x" ? 2 : letter === "u" ? 4 : 8;
      hex = this.src.slice(this.pos, this.pos + width);
      if (hex.length !== width || ![...hex].every(isHex)) reject(`invalid escape \\${letter}`);
      this.pos += width;
    }
    const cp = parseInt(hex, 16);
    if (!unicode && letter === "x" && hex.length === 2) return cp;
    if (cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) {
      reject(`\\${letter}{${hex}} is not a code point`);
    }
    return cp;
  }
}

// ---------------------------------------------------------------------------
// Emission, as a JavaScript regex with the `v` flag

/** What the emitter targets. */
interface Target {
  readonly subject: Subject;
  /** The `i` flag of the emitted regex; atoms with another case mode get a modifier group. */
  readonly ambientI: boolean;
}

const ESCAPED_RANGE = "\\u{DC80}-\\u{DCFF}";

/** The UTF-8 bytes of a code point. */
const utf8Bytes = (cp: number): number[] => [...new TextEncoder().encode(String.fromCodePoint(cp))];

/**
 * Rejects an ASCII-mode construct that could match part of a multi-byte
 * character in a text regex, as the reference does.
 */
const asciiInText = (t: Target, what: string): void => {
  if (t.subject === "text") reject(`${what} without Unicode mode can match invalid UTF-8`);
};

/** A code point as a regex literal outside a class. */
const literal = (cp: number): string => {
  const ch = String.fromCodePoint(cp);
  if (cp < 0x20 || (cp >= 0x7f && cp <= 0x9f) || (cp >= 0xd800 && cp <= 0xdfff)) {
    return `\\u{${cp.toString(16)}}`;
  }
  return /[\^$\\.*+?()[\]{}|/]/.test(ch) ? `\\${ch}` : ch;
};

/** A code point as a member of a `v`-mode class. */
const classLiteral = (cp: number): string => {
  const ch = String.fromCodePoint(cp);
  if (cp < 0x20 || (cp >= 0x7f && cp <= 0x9f) || (cp >= 0xd800 && cp <= 0xdfff)) {
    return `\\u{${cp.toString(16)}}`;
  }
  return /[()[\]{}/\-\\|&!#$%*+,.:;<=>?@^`~]/.test(ch) ? `\\${ch}` : ch;
};

/** A class member: a code point, or a byte where Unicode mode is off. */
const classChar = (cp: number, byte: boolean, u: boolean): string => {
  if (u || byte || cp < 0x80) return classLiteral(cp);
  return reject("a multi-byte character cannot be a class member without Unicode mode");
};

const WORD_CLASS = (u: boolean): string =>
  u ? "[\\p{Alphabetic}\\p{M}\\p{Nd}\\p{Pc}\\p{Join_C}]" : "[0-9A-Za-z_]";
const DIGIT_CLASS = (u: boolean): string => (u ? "[\\p{Nd}]" : "[0-9]");
const SPACE_CLASS = (u: boolean): string => (u ? "[\\p{White_Space}]" : "[\\t\\n\\v\\f\\r ]");

const perlClass = (cls: "w" | "d" | "s", negated: boolean, u: boolean, t: Target): string => {
  if (!u && negated) asciiInText(t, `\\${cls.toUpperCase()}`);
  const positive = cls === "w" ? WORD_CLASS(u) : cls === "d" ? DIGIT_CLASS(u) : SPACE_CLASS(u);
  return negated ? `[^${positive}]` : positive;
};

/** `\p{…}` or `\P{…}`; `any` is every code point. */
const propertyClass = (js: string, negated: boolean): string => {
  if (js === "any") return negated ? "[]" : "[\\s\\S]";
  return `\\${negated ? "P" : "p"}{${js}}`;
};

/** A class fragment with the escaped-byte surrogates removed, in byte mode. */
const excludeEscaped = (cls: string, t: Target): string =>
  t.subject === "utf8" ? `[${cls}--[${ESCAPED_RANGE}]]` : cls;

const emitItem = (item: ClassItem, t: Target, u: boolean): string => {
  switch (item.t) {
    case "char":
      return classChar(item.cp, item.byte, u);
    case "range":
      return `${classChar(item.lo, true, u)}-${classChar(item.hi, true, u)}`;
    case "perl":
      return perlClass(item.cls, item.negated, item.u, t);
    case "prop":
      return propertyClass(item.js, item.negated);
    case "posix":
      return item.negated ? `[^${item.ranges}]` : `[${item.ranges}]`;
    case "set":
      return emitSet(item.set, t, u);
  }
};

const emitSet = (set: ClassSet, t: Target, u: boolean): string => {
  if (set.kind === "union") {
    if (set.negated && !u) asciiInText(t, "a negated class");
    return `[${set.negated ? "^" : ""}${set.items.map((item) => emitItem(item, t, u)).join("")}]`;
  }
  const left = emitSet(set.left, t, u);
  const right = emitSet(set.right, t, u);
  if (set.op === "~~") return `[[${left}--${right}][${right}--${left}]]`;
  return `[${left}${set.op}${right}]`;
};

/** `\b` and its relatives over the word class of the mode. */
const boundary = (which: string, u: boolean): string => {
  const w = WORD_CLASS(u);
  switch (which) {
    case "b":
      return `(?:(?<=${w})(?!${w})|(?<!${w})(?=${w}))`;
    case "B":
      return `(?:(?<=${w})(?=${w})|(?<!${w})(?!${w}))`;
    case "start":
      return `(?<!${w})(?=${w})`;
    case "end":
      return `(?<=${w})(?!${w})`;
    case "start-half":
      return `(?<!${w})`;
    default:
      return `(?!${w})`;
  }
};

/** Wraps `s` so a quantifier applies to all of it. */
const atomic = (node: Node, s: string): string =>
  node.kind === "lit" ||
  node.kind === "any" ||
  node.kind === "set" ||
  node.kind === "perl" ||
  node.kind === "prop" ||
  node.kind === "group"
    ? s
    : `(?:${s})`;

const cased = (s: string, i: boolean, t: Target): string =>
  i === t.ambientI ? s : i ? `(?i:${s})` : `(?-i:${s})`;

const emit = (node: Node, t: Target): string => {
  switch (node.kind) {
    case "empty":
      return "";
    case "lit": {
      if (node.byte && node.cp >= 0x80) asciiInText(t, "a byte escape");
      const text =
        t.subject === "raw" && !node.byte && node.cp >= 0x80
          ? utf8Bytes(node.cp).map(literal).join("")
          : literal(node.cp);
      return cased(text, node.i, t);
    }
    case "any": {
      if (!node.u) asciiInText(t, "`.`");
      if (node.s) return t.subject === "utf8" ? `[^${ESCAPED_RANGE}]` : "[\\s\\S]";
      const excluded = node.R ? "\\r\\n" : "\\n";
      return `[^${excluded}${t.subject === "utf8" ? ESCAPED_RANGE : ""}]`;
    }
    case "set":
      return cased(excludeEscaped(emitSet(node.set, t, node.u), t), node.i, t);
    case "perl":
      return cased(excludeEscaped(perlClass(node.cls, node.negated, node.u, t), t), node.i, t);
    case "prop":
      return cased(excludeEscaped(propertyClass(node.js, node.negated), t), node.i, t);
    case "line":
      if (!node.m) return node.which;
      if (node.which === "^") {
        return node.R ? "(?:^|(?<=\\n)|(?<=\\r)(?!\\n))" : "(?:^|(?<=\\n))";
      }
      return node.R ? "(?:$|(?<!\\r)(?=\\n)|(?=\\r))" : "(?:$|(?=\\n))";
    case "assert":
      if (node.which === "A") return "^";
      if (node.which === "z") return "$";
      return boundary(node.which, node.u);
    case "group": {
      const body = emit(node.body, t);
      if (node.name !== undefined) return `(?<${node.name}>${body})`;
      return node.capture ? `(${body})` : `(?:${body})`;
    }
    case "repeat": {
      const body = atomic(node.body, emit(node.body, t));
      const count =
        node.max === undefined
          ? node.min === 0
            ? "*"
            : node.min === 1
              ? "+"
              : `{${node.min},}`
          : node.min === 0 && node.max === 1
            ? "?"
            : node.min === node.max
              ? `{${node.min}}`
              : `{${node.min},${node.max}}`;
      return `${body}${count}${node.lazy ? "?" : ""}`;
    }
    case "concat":
      return node.items.map((item) => emit(item, t)).join("");
    case "alt":
      return node.items.map((item) => emit(item, t)).join("|");
  }
};

// ---------------------------------------------------------------------------
// Translation

/** The flags a source starts with, read from its leading `(?flags)` groups without consuming them. */
const leadingFlags = (source: string): { i: boolean; u: boolean } => {
  let i = false;
  let u = true;
  let pos = 0;
  for (;;) {
    const m = /^\(\?([imsRUux-]*)\)/.exec(source.slice(pos));
    if (m === null) break;
    let negate = false;
    for (const flag of m[1]) {
      if (flag === "-") negate = true;
      else if (flag === "u") u = !negate;
      else if (flag === "i") i = !negate;
    }
    pos += m[0].length;
  }
  return { i, u };
};

/**
 * Translates a dialect source to a JavaScript source, flags and subject. A
 * byte regex reads its bytes in Unicode mode, or as raw bytes under a
 * leading `(?-u)`.
 */
const translate = (
  source: string,
  mode: RegexMode,
): { source: string; flags: string; subject: Subject } => {
  const leading = leadingFlags(source);
  const subject: Subject = mode === "text" ? "text" : leading.u ? "utf8" : "raw";
  const flags: Flags = { i: false, m: false, s: false, R: false, U: false, x: false, u: true };
  const tree = new DialectParser(source, mode === "bytes", leading.u).parse(flags);
  const emitted = emit(tree, { subject, ambientI: leading.i });
  return { source: emitted, flags: `v${leading.i ? "i" : ""}`, subject };
};

/**
 * Compiles a dialect source for `mode`.
 *
 * @throws {RegexSyntaxError} for a source the dialect or the engine rejects
 */
export const compilePatternRegex = (source: string, mode: RegexMode): RegExp => {
  const translated = translate(source, mode);
  let regex: RegExp;
  try {
    regex = new RegExp(translated.source, translated.flags);
  } catch (e) {
    return reject(e instanceof Error ? e.message : String(e));
  }
  if (mode === "bytes") BYTE_SUBJECTS.set(regex, translated.subject);
  return regex;
};

/** A `PatternRegex` from a dialect source. */
export const patternRegexFromSource = (source: string, mode: RegexMode): PatternRegex =>
  Object.freeze({ source, regex: compilePatternRegex(source, mode) });

/**
 * A `PatternRegex` from a JavaScript regex: its `i`, `m` and `s` flags
 * become inline flags of the source, `u`, `v` and `d` are implied or
 * dropped, and `g` or `y` are refused because a pattern has no cursor. The
 * source is then read as the dialect, whose `m` and `.` follow the
 * reference (`\n` only).
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
