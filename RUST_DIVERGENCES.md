# Divergences from the Rust reference implementation

This library is a TypeScript port of
[`BlockchainCommons/bc-dcbor-pattern-rust`](https://github.com/BlockchainCommons/bc-dcbor-pattern-rust),
tracked at version **0.11.1**
([`f796d75`](https://github.com/BlockchainCommons/bc-dcbor-pattern-rust/commit/f796d7560f8d39b57b9c1e925cb932ee70860804)).

The tracked version and commit are recorded in
[`.github/versions.yml`](./.github/versions.yml), and the `upstream.yml`
workflow opens a tracking issue whenever the reference implementation moves
ahead of it.

This document is the deliberate record of every place the TypeScript behaviour
differs from the Rust reference. It has three kinds of entry:

1. **True behavioral divergences** - the same input produces a different outcome.
2. **JS-only input domain** - inputs that have no Rust analog, so there is nothing to diverge from.
3. **Mapping equivalences** - JS-specific inputs that are validated through the bytes they produce.

Every entry below is checked by `tests/rust-validation`, a Rust program that
builds `dcbor-pattern` at the tracked commit and replays
`tests/vectors/vectors.json` (2 151 vectors: every pattern string of both
implementations' suites parsed and displayed, matched against a fixed set of
haystacks, and formatted; plus generated patterns), comparing displays, path
elements as dCBOR hex, captures, formatted output, and error variants and
spans. The current run: **1 886 match, 265 expected divergences, 0
mismatches.**

## 1. True behavioral divergences

### Pending fixes (Phase 3)

- **P1. Parenthesised groups (8 vectors).** `(number | text)`,
  `((number))`, `(number) & !bool`: a group that is not inside an array
  never matches here; the reference matches it as its content. `[(number)]`
  and `search((number))` work. A real bug.
- **P2. The empty array pattern (23 vectors).** `[]` matches only an empty
  array here and displays as `[{0}]`; in the reference `[]` is *any* array
  (displayed `[{0,}]`).
- **P3. Captures of `*` inside arrays (2 vectors).** `[@any_item(*)]`
  against `[1, "x", 3]`: the reference lists each element's path among the
  match paths as well as the root, and `@rest((*)*)` captures the path to the
  matched sub-sequence; here the match paths hold the root only and the
  sequence capture holds the root.

## 2. JS-only input domain

- **Error taxonomy on rejected patterns (S1, 63 vectors; S2, 169 vectors).**
  Both sides reject the same strings. The reference's parser reports the
  token it saw (`UnexpectedToken(ParenOpen)`, `UnexpectedEndOfInput`,
  `UnrecognizedToken` at the first character); TypeScript reports what it
  expected (`ExpectedCloseParen`, `ExpectedColon`,
  `InvalidCaptureGroupName`) and spans the whole offending run. Spans are
  UTF-16 code units here; the harness transcodes.

## 3. Mapping equivalences

- Haystacks are built from dCBOR bytes on both sides; path elements compare
  as their canonical encoding. Tag names resolve through the registered tags
  on both sides (`bc_tags::register_tags()` / `registerTags(store)`), and a
  tag-1 value formats as a date on both.
- The display of an explicit group carries its default quantifier on both
  sides (`(bool)` → `(bool){1}`), so displays reach a fixpoint after one
  re-parse rather than one round; recorded, not diverged.

## Maintenance

When the upstream reference moves:

1. Review the diff via the link in the `upstream.yml` tracking issue.
2. Port the relevant changes.
3. Update `.github/versions.yml` with the new version and commit.
4. Update the tracked version at the top of this file.
5. Add, amend, or remove divergence entries as the port requires.
