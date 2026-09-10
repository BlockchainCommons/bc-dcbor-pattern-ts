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

1. **Behavioural divergences** - the same input produces a different outcome, by design.
2. **JS-only input domain** - inputs that have no Rust analog, so there is nothing to diverge from.
3. **Mapping equivalences** - JS-specific inputs validated through the bytes they produce.
4. **Port-right rows** - inputs where this library follows the documented behaviour and the reference does not.
5. **Upstream items** - reference behaviours this library reproduces on purpose while they are open.

Every entry is checked by `tests/rust-validation`, a Rust program that
builds `dcbor-pattern` at the tracked release and replays
`tests/vectors/vectors.json`: every pattern of the corpus parsed and
displayed, parsed as a prefix, matched against a fixed set of haystacks and
formatted, plus the JavaScript-only domain rows. It compares displays, path
elements as dCBOR hex, captures, formatted output and error variants, and
classifies every difference into one of the classes below. The current run:

**8 961 vectors - 8 551 match, 6 R1, 83 S1, 179 S2, 28 U1, 4 U3, 6 X1,
28 X2, 7 X3, 69 js-only, 0 mismatches.**

## 1. Behavioural divergences

### X1-X3. Regex dialect (41 vectors)

A regex inside a pattern is written in the dialect shared by every
implementation and translated to a JavaScript regex at parse time
(`src/regex.ts`): leading inline flags become flags, `(?P<n>` becomes
`(?<n>`, `\x{…}` becomes `\u{…}` (text) or `\xNN` (bytes), `\pL` becomes
`\p{L}`, bare script names get `Script=`, `\A`/`\z` become anchors, POSIX
classes become ranges and possessive quantifiers run greedy. Lookaround,
backreferences and `(?U)` are rejected with `InvalidRegex`. Three residues
remain:

- **X1 (6).** `\w`, `\d` and `\b` are ASCII in JavaScript and Unicode-aware
  in the reference, so `/\w+/` does not match `"é"` here.
- **X2 (28).** `a**` (a doubled quantifier) and `(?U)` (the greed swap) are
  accepted by the reference's engine and rejected here.
- **X3 (7).** A byte regex written for Unicode mode (`h'/é/'`) matches the
  UTF-8 bytes of `é` in the reference and one character per byte here.

### U3. Captures on a map that does not match (4 vectors)

The reference returns capture paths for a map pattern whose keys match but
whose values do not, alongside an empty path list. This library returns no
captures when there is no match. See the upstream table.

## 2. JS-only input domain

- **Error taxonomy on rejected patterns (S1 83, S2 179).** Both sides
  reject the same strings. The reference reports the token it saw
  (`UnexpectedToken(ParenOpen)`, `UnexpectedEndOfInput`, `UnrecognizedToken`
  at the first character); this library reports what it expected
  (`ExpectedCloseParen`, `ExpectedColon`, `InvalidCaptureGroupName`) and
  spans the offending run. Spans are UTF-16 code units here
  (`spanToByteOffsets` converts); the harness transcodes.
- **`NestingTooDeep`.** A pattern nested deeper than `ParseOptions.maxDepth`
  (500 by default) is rejected with a code the reference does not have; the
  reference overflows its stack at a few thousand levels.
- **Argument guards (69 domain rows).** A haystack that is not a `Cbor`, a
  pattern that is not a `Pattern`, a non-string source or a wrong argument
  type is a `TypeError`; `number(NaN)`, an inverted or `NaN` range, a
  capture name that is not an identifier, a tag name that is not a bare
  word, an invalid ISO-8601 date, a digest prefix over 32 bytes, an
  `Interval` with a negative, fractional or inverted bound, or a `maxDepth`
  that is not a positive integer is a `RangeError`. The reference's type
  system rules these inputs out.
- **`1e400` (U1, 28).** A number literal beyond the double range is
  rejected here with `InvalidNumberFormat`; the reference parses it as
  infinity and displays `inf`, which does not re-parse.

## 3. Mapping equivalences

- Haystacks are built from dCBOR bytes on both sides; path elements compare
  as their canonical encoding. Tag names resolve through the registered tags
  on both sides, and a tag-1 value formats as a date on both.
- The display of an explicit group carries its default quantifier on both
  sides (`(bool)` → `(bool){1}`), so displays reach a fixpoint after one
  re-parse rather than one round.
- Number display is the shortest round-tripping decimal without an
  exponent on both sides (`1e21` → `1000000000000000000000`).
- Dates parse through `@blockchaincommons/dcbor-parse`, which accepts the
  same ISO-8601 forms as the reference's `dcbor-parse`, fractions included.

## 4. Port-right rows

- **R1 (6).** `tagged(date, *)` and `tagged(/dat/, *)` match a decoded
  tag-1 value here, as the syntax document promises. The reference's
  `Tag::name()` does not consult the tags store on decoded data, so it
  matches nothing.
- **R2.** `'value'`, `'Self'` and `'/^value$/'` match a decoded known value
  by its registered name here; the reference resolves names only on values
  it constructed itself.

## 5. Upstream items reproduced on purpose

| # | Item |
|---|---|
| U1 | `1e400` parses to `inf` in the reference and displays `inf`, which does not re-parse (this library rejects it; see §2). |
| U2 | `Date::from_timestamp` truncates negative fractional timestamps toward zero (`1969-12-31T23:59:59.5Z` → `1970-01-01`); dates here keep the fraction. |
| U3 | Capture paths are truncated to `[container, value]` under maps and tagged values but extended under arrays; captures are returned for a non-matching map (this library returns none); `paths()` and `paths_with_captures().0` differ for `or`. The path shapes are reproduced. |
| U4 | `tagged(/re/,  p)` displays with two spaces after the comma; reproduced. |
| U5 | `tagged(name, …)` and `tagged(/re/, …)` never match decoded data in the reference (R1 above). |
| U6 | Bracket nesting of ~3 000 overflows the reference's stack; this library rejects with `NestingTooDeep` at 500 (§2). |
| U7 | A `search` inside a capturing array element (`[@x(search(1))]`) is matched at the element only, and the thread's path is replaced by the search path, so `[@x(search(1))]` on `[[1], [1]]` matches nothing and on `[1, [1]]` yields an empty path with a rootless capture. Reproduced, harness-proven. |

## Maintenance

When the upstream reference moves:

1. Review the diff via the link in the `upstream.yml` tracking issue.
2. Port the relevant changes.
3. Update `.github/versions.yml` with the new version and commit.
4. Update the tracked version at the top of this file.
5. Regenerate the vectors (`bun run vectors:generate`), replay them
   (`cargo run --release -- ../vectors/vectors.json` in
   `tests/rust-validation`) and update the result line and the entries
   above as the port requires.
