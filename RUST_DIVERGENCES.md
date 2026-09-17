# Divergences from the Rust reference implementation

This library is a TypeScript port of
[`BlockchainCommons/bc-dcbor-pattern-rust`](https://github.com/BlockchainCommons/bc-dcbor-pattern-rust),
tracked at version **0.11.1**
([`f796d75`](https://github.com/BlockchainCommons/bc-dcbor-pattern-rust/commit/f796d7560f8d39b57b9c1e925cb932ee70860804)).

The tracked version and commit are recorded in
[`.github/versions.yml`](./.github/versions.yml), and the `upstream.yml`
workflow opens a tracking issue whenever the reference implementation moves
ahead of it.

This document is the deliberate record of every place the TypeScript
behaviour differs from the reference. It has five kinds of entry:

1. **Behavioural divergences** - the same input produces a different outcome, by design or by a limit of the platform.
2. **JS-only input domain** - inputs that have no Rust analog, so there is nothing to diverge from.
3. **Mapping equivalences** - rules of the reference reproduced through a different mechanism, validated through the bytes and errors they produce.
4. **Port-right rows** - inputs where this library follows the documented behaviour and the reference does not.
5. **Upstream items** - reference behaviours this library reproduces on purpose while they are open.

Every entry is checked by `tests/rust-validation`, a Rust program that
pins the tracked `dcbor-pattern` release from crates.io (`=0.11.1`) and
replays `tests/vectors/vectors.json`: every pattern of the corpus parsed
and displayed, parsed as a partial, matched against a fixed set of
haystacks and formatted; every regex source of the dialect corpus run over
text and byte subjects on the `regex` crate itself; and the JavaScript-only
domain rows.
It compares displays, path elements as dCBOR hex, captures, formatted
output, regex outcomes and error variants and spans, and classifies every
difference into one of the classes below. The current run:

**23 350 vectors - 23 141 match, 6 R1, 2 R2, 2 U1, 129 X4, 70 js-only, 0
mismatches.**

A mismatch is a bug on one side, never a new class. A JavaScript-only input
becomes a domain row, not an entry here.

## 1. Behavioural divergences

### X4. Regex constructs the engine cannot express (129 vectors)

A pattern's regex is written in the reference's dialect and translated to a
JavaScript regex that matches the same strings (§3). Two constructs have no
translation and are `InvalidRegex` here where the reference accepts them:

- a Unicode property table JavaScript does not ship: `\p{gcb=CR}`
  (`Grapheme_Cluster_Break`), `Word_Break`, `Sentence_Break` and `Age`;
- Unicode mode changing inside a byte regex (`a(?-u:\xff)`, `(?-u)(?u)é`,
  `^(?-u)$`): a byte regex is read as UTF-8 for the whole regex, or as raw
  bytes under a leading `(?-u)`, because the two readings need two
  different subjects.

### Regex engine

A regex means the same thing on both sides, but this library runs it on
JavaScript's backtracking engine: a pathological regex can take exponential
time here where the reference's engine is linear, and the reference's
compiled-size limit is not enforced. The reference's nesting limit (250
groups, classes and repetitions) is.

### Stack depth

Neither side limits nesting. The reference aborts the process near 2 700
nested brackets or 4 800 nested groups; this library throws the engine's
`RangeError` at a depth that depends on the engine and on the caller's own
stack (Node 24 near 1 500 brackets or 4 800 groups, Bun near 4 700 and
7 400), so it can give up earlier or later than the reference.
`ParseOptions.maxDepth` sets a limit when one is wanted, and rejects deeper
text with `NestingTooDeep`, a code the reference does not have.

## 2. JS-only input domain

- **Argument guards (70 domain rows).** A haystack that is not a `Cbor`, a
  pattern that is not a `Pattern`, a non-string source or a wrong argument
  type is a `TypeError`; `number(NaN)`, an inverted or `NaN` range given to
  a constructor, a capture name that is not an identifier, a tag name that
  is not a bare word, an invalid ISO-8601 date, a digest prefix over 32
  bytes, an `Interval` with a negative, fractional or inverted bound, or a
  `maxDepth` that is not a positive integer is a `RangeError`. The
  reference's type system rules these out, or (an inverted `Interval`)
  constructs a value its lexer rejects. The parser accepts what the
  reference's parser accepts: `5...1` parses and matches nothing.
- **Spans** are UTF-16 code units (`spanToByteOffsets` converts); the
  reference's are bytes. Variants and token boundaries are the reference's.

## 3. Mapping equivalences

- Haystacks are built from dCBOR bytes on both sides; path elements compare
  as their canonical encoding. Tag names resolve through the registered tags
  on both sides, and a tag-1 value formats as a date on both.
- The display of an explicit group carries its default quantifier on both
  sides (`(bool)` → `(bool){1}`), so displays reach a fixpoint after one
  re-parse rather than one round.
- Number display is the shortest round-tripping decimal without an
  exponent on both sides (`1e21` → `1000000000000000000000`). A literal
  beyond the double range (`1e400`) is the infinity pattern on both sides;
  see U1 for its display.
- Dates parse through `@blockchaincommons/dcbor-parse`, which accepts the
  same ISO-8601 forms as the reference's `dcbor-parse`, fractions included.
- **Regexes.** The dialect is the `regex` crate's, translated at parse
  time: Unicode `\w`, `\d`, `\s` and `\b`; `.` as any code point but `\n`;
  `(?m)` anchors at `\n` only (`\r\n` too under `(?R)`); stacked
  quantifiers as nested repetition; `(?U)`; `(?x)`; scoped `(?i:…)`; `\a`,
  `\x`, `\u`, `\U`; `\p{…}` with the reference's loose property names;
  nested classes, `&&`, `--`, `~~` and POSIX classes (an unknown
  `[:name:]` is a plain nested class). A text regex runs over code points;
  a byte regex runs in Unicode mode over the bytes (an invalid byte never
  matches `.` or a class) and over raw bytes under a leading `(?-u)`. A
  text regex without Unicode mode keeps ASCII classes and rejects `.`,
  negated classes and byte escapes above 0x7F, as the reference does.
  Lookaround and backreferences are rejected on both sides. The harness
  proves the translation on a generated regex corpus against the crate.
- **Errors.** Every rejection carries the reference's variant at the
  reference's site: `UnexpectedToken` names the token the parser met;
  `UnexpectedEndOfInput` the end of the source, or `ExpectedCloseParen`,
  `ExpectedCloseBracket`, `ExpectedCloseBrace` and `ExpectedColon` when it
  ends inside a capture, `search(…)`, `tagged(…)`, an array or a map;
  `UnrecognizedToken` spans what a single-pass scanner reads before giving
  up (a keyword's prefix, a bare `@`, one code point); a malformed literal
  is reported when its token is consumed, over the span the lexer had (an
  unterminated literal spans its opening delimiter, a range that does not
  read spans its `{`); `(1){3,1}` is `InvalidRange` over the range.
  `ExpectedOpenParen`, `ExpectedPattern`, `UnmatchedParentheses`,
  `UnmatchedBraces` and `InvalidCaptureGroupName` are declared and never
  raised, as in the reference.
- A map pattern whose keys match and whose values do not reports the
  captures of the constraints it satisfied with no paths, as the
  reference's `MapPattern::paths_with_captures` does.

## 4. Port-right rows

- **R1 (6).** `tagged(date, *)` and `tagged(/dat/, *)` match a decoded
  tag-1 value here, as the syntax document promises. The reference's
  `Tag::name()` does not consult the tags store on decoded data, so it
  matches nothing (its known-value patterns do consult the registry). U5.
- **R2 (2).** Text no token starts, met where a specific token was
  required (`1..2` inside a capture or a map value): the reference
  propagates its bare `Unknown` error with no span; this library reports
  `UnrecognizedToken` with the text's span. U9.
- **U1 (2).** `1e400` displays `Infinity` here and `inf` in the reference,
  which its own lexer cannot read back; the literal parses to the same
  infinity pattern on both sides and matches the same values.

## 5. Upstream items reproduced on purpose

None of these is filed upstream yet.

| # | Item |
|---|---|
| U1 | `1e400` displays as `inf`, which does not re-parse (§4). |
| U2 | `Date::from_timestamp` truncates negative fractional timestamps toward zero (`1969-12-31T23:59:59.5Z` → `1970-01-01`); reproduced. |
| U3 | Capture paths are truncated to `[container, value]` under maps and tagged values but extended under arrays; captures are returned for a non-matching map; `paths()` and `paths_with_captures().0` differ for `or`. All reproduced. |
| U4 | `tagged(/re/,  p)` displays with two spaces after the comma; reproduced. |
| U5 | `tagged(name, …)` and `tagged(/re/, …)` never match decoded data in the reference (R1). |
| U6 | Bracket nesting of ~3 000 overflows the reference's stack (§1). |
| U7 | A `search` inside a capturing array element (`[@x(search(1))]`) is matched at the element only, and the thread's path is replaced by the search path, so `[@x(search(1))]` on `[[1], [1]]` matches nothing and on `[1, [1]]` yields an empty path with a rootless capture. Reproduced, harness-proven. |
| U8 | The content of `tagged(selector, p)` is found by counting parentheses in the raw text, so a `)` inside a string or regex in the content ends the construct early (`tagged(1, ")")` is `UnterminatedString`). Reproduced. |
| U9 | The bare `Unknown` error propagated from non-primary sites (R2). |

## Maintenance

When the upstream reference moves:

1. Review the diff via the link in the `upstream.yml` tracking issue.
2. Port the relevant changes.
3. Update `.github/versions.yml` with the new version and commit, and the
   `dcbor-pattern` pin in `tests/rust-validation/Cargo.toml`.
4. Update the tracked version at the top of this file.
5. Regenerate the vectors (`bun run vectors:generate`), replay them
   (`cargo run --release -- ../vectors/vectors.json` in
   `tests/rust-validation`) and update the result line and the entries
   above as the port requires. A `MISMATCH` is a bug on one side, never a
   new class; when an item of §5 is fixed upstream, the port follows and
   the row goes.
