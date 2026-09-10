# Migrating to the redesigned `@blockchaincommons/dcbor-pattern`

The pattern language, its canonical display strings, the paths and captures
a match yields (and their order) and the formatted output are unchanged;
this was proven against a frozen pre-redesign bundle
(`tests/differential.test.ts`, 8 961 golden vectors) and against
`bc-dcbor-pattern-rust` 0.11.1 (`tests/rust-validation`: 8 551 of 8 961
vectors byte-identical, the rest the documented classes in
`RUST_DIVERGENCES.md`). Matching bugs were fixed towards the reference on
the way (see §5). §0 lists the changes of the current tree; §1 onwards
describes the earlier move from the `Result`-based API.


## 0. Checklist for the current API

The pattern language, the canonical display strings and the paths a match
yields are unchanged. The surface around them moved; the differential suite
(`tests/differential.test.ts`, 8 961 vectors against a frozen bundle)
records each change as a named row. Work through the list:

- [ ] `@blockchaincommons/dcbor-pattern/internal` is now
  `@blockchaincommons/dcbor-pattern/patterns` (same names).
- [ ] `@blockchaincommons/dcbor-pattern/lexer` is gone. Languages that embed
  dCBOR patterns use `parsePatternPrefix`, which reports how much of the
  text it consumed.
- [ ] `ParseResult<T>` is `DcborResult<T, DcborPatternError>`; `Result`,
  `Ok`, `Err`, `ParseFailure` and `failureMessage` are gone.
- [ ] `error.details.span` is `error.span`; `error.details` is a
  discriminated union by `code` (`error.details.kind` and
  `error.details.text` for `UnexpectedToken`, `error.details.maxDepth` for
  `NestingTooDeep`, …). `error.message` no longer carries positions; use
  `error.fullMessage(source)` for the message with the source line and a
  caret. `DcborPatternError` has no public constructor: the static
  factories (`DcborPatternError.extraData(span)`, …) build instances.
- [ ] `Interval` and `Quantifier` accessors are getters: `q.min()` →
  `q.min`, `q.max()` → `q.max`, `q.reluctance()` → `q.reluctance`,
  `q.interval()` → `q.interval`, `i.isUnbounded()` → `i.isUnbounded`.
  Their constructors validate: a negative, fractional or inverted bound is
  a `RangeError`.
- [ ] `reluctanceSuffix` is no longer exported; `Quantifier.toString()`
  renders the suffix.
- [ ] Regex-carrying pattern objects hold `{ regex: PatternRegex }` where
  `PatternRegex` is `{ source, regex: RegExp }`; the old `pattern: RegExp`
  field is gone. Constructors take a dialect source or a `RegExp`; a
  `RegExp` with `g` or `y`, or a source the dialect rejects, is a
  `TypeError`.
- [ ] `Path` is `readonly Cbor[]` and `MatchResult` is read-only; every
  pattern is frozen. Copy before mutating.
- [ ] Wrong arguments throw: a non-`Pattern` or non-`Cbor` argument to
  `paths`, `matches`, `display`, `pathsWithCaptures` or `patternEquals` is
  a `TypeError`; invalid constructor values (`number(NaN)`, `capture("a b",
  …)`, `digestPrefix` over 32 bytes, an inverted `numberRange`, an invalid
  `dateIso8601`) are `RangeError`s.
- [ ] `parsePattern` and `parsePatternPrefix` take `{ maxDepth }` (500 by
  default) and reject deeper text with `NestingTooDeep`.
- [ ] Number display no longer uses an exponent (`1e21` displays as
  `1000000000000000000000`); integers beyond 2⁵³ round-trip exactly.
- [ ] Trailing whitespace after a pattern is consumed by
  `parsePatternPrefix` and reported in `length`.
- [ ] `search` de-duplicates its paths; captures inside repeats and groups
  follow the reference's dispatch (see `RUST_DIVERGENCES.md`).

## 1. Entries

| Entry | Contents |
|---|---|
| root | `parsePattern`/`tryParsePattern` (and the `…Prefix` forms), the constructors, `paths`, `matches`, `display`, `pathsWithCaptures`, `Interval`, `Quantifier`, `Reluctance`, `DcborPatternError` |
| `/format` | `formatPaths`, `formatPath`, `FormatPathsOptions`, `PathElementFormat` |
| `/patterns` | the per-kind pattern types, constructors, matchers and displayers, for languages that embed dCBOR patterns |

The internal modules (`vm`, `matcher`, the registries, the per-kind
parsers and matchers) are no longer re-exported.

## 2. Parsing: throw, or `try…`

| Before | After |
|---|---|
| `parse(src): Result<Pattern>` | `parsePattern(src): Pattern` (throws `DcborPatternError`) or `tryParsePattern(src): DcborResult<Pattern, DcborPatternError>` |
| `parsePartial(src): Result<[Pattern, number]>` | `parsePatternPrefix(src): { pattern, length }` or `tryParsePatternPrefix(src)` |
| `Result`, `Ok`, `Err`, `unwrap`, `unwrapOr`, `map`, `errorToString`, `adjustSpan`, the bare `Error` union, `PatternError { errorType }` | `DcborPatternError { code, details, span, fullMessage(source) }`, `DcborPatternErrorCode`, `DcborResult<T, E> = { ok: true, value } \| { ok: false, error: E }` |
| `result.error.type` / `result.error.span` | `result.error.code` / `result.error.span` |

Spans stay UTF-16 code-unit offsets.

## 3. Runners and constructors

| Before | After |
|---|---|
| `patternPaths(p, cbor)` / `paths` | `paths(p, cbor)` |
| `patternMatches(p, cbor)` / `matches` | `matches(p, cbor)` |
| `patternDisplay(p)` | `display(p)` |
| `patternPathsWithCaptures(p, cbor)` / `pathsWithCaptures` / `pathsWithCapturesDirect` | `pathsWithCaptures(p, cbor)` → `{ paths, captures: Map<string, Path[]> }` |
| `nullPattern()` / `bool(v)` | `nullValue()` / `boolean(v)` |
| `Lexer.new(src)` | `parsePatternPrefix(src)` |

Every other constructor (`any`, `number`, `numberRange`, `text`, `textRegex`,
`byteString`, `date…`, `digest…`, `knownValue…`, `anyArray`, `anyMap`,
`anyTagged`, `and`, `or`, `not`, `capture`, `search`, `sequence`, `repeat`,
`group`, …) keeps its name.

## 4. Formatting (`/format`)

| Before | After |
|---|---|
| `formatPaths(paths)` / `formatPathsOpt(paths, opts)` / `formatPathsWithCaptures(paths, captures, opts)` | `formatPaths(paths, { captures?, indent?, elementFormat?, maxLength?, lastElementOnly? })` |
| `formatPath(path)` / `formatPathOpt(path, opts)` | `formatPath(path, options?)` |
| `FormatPathsOptsBuilder.new().indent(false).build()`, `DEFAULT_FORMAT_OPTS` | the options object; every field optional with the same defaults |
| `PathElementFormat.DiagnosticSummary` / `DiagnosticFlat` (enum) | `"summary"` / `"flat"` |

`Reluctance` is an `as const` object with the same string values
(`Reluctance.Greedy === "greedy"`), so both spellings type-check.

## 5. Behaviour fixed towards the reference

- A parenthesised group outside an array (`(number | text)`, `(number) &
  !bool`) matches as its content; it never matched before.
- `[]` is *any* array (displayed `[{0,}]`); `[{0}]` is the empty array.
- `[@any_item(*)]` lists each element's path among the match paths, and
  `@rest((*)*)` captures the matched sub-sequence.
- A tag-1 value formats as a date once the standard tags are registered
  (`registerTags(getGlobalTagsStore())` from `@blockchaincommons/tags`), as
  the canonical dcbor's summarisers do.

## 6. Dependencies

`@blockchaincommons/dcbor-compat` is gone; `@blockchaincommons/dcbor`,
`tags` and `uniform-resources` are runtime dependencies alongside
`components`, `dcbor-parse` and `known-values`.

## Appendix: migrating from `@bcts/dcbor-pattern`

`@blockchaincommons/dcbor-pattern` is the canonical home of this library. It was extracted from the
[`paritytech/bcts`](https://github.com/paritytech/bcts) monorepo, where it was
published as `@bcts/dcbor-pattern`, into its own Blockchain Commons repository at
[`BlockchainCommons/bc-dcbor-pattern-ts`](https://github.com/BlockchainCommons/bc-dcbor-pattern-ts).

For the extraction release, **`1.0.0-beta.1`, the public API is unchanged.** The
migration is a rename. `@bcts/dcbor-pattern` remains published for one beta cycle as a
thin re-export of this package, so nothing breaks the moment you update.

### TL;DR checklist

- [ ] Replace the `@bcts/dcbor-pattern` dependency with `@blockchaincommons/dcbor-pattern`.
- [ ] Rewrite import specifiers: `@bcts/dcbor-pattern` becomes `@blockchaincommons/dcbor-pattern`.
- [ ] Raise your Node floor to **22.12**.
- [ ] Ensure TypeScript **>= 5.7** to consume the published types.
- [ ] If you relied on the `browser` field or a global-script build, switch to the ESM or CJS entry point.

### 1. Package name and imports

```diff
- import { /* ... */ } from "@bcts/dcbor-pattern";
+ import { /* ... */ } from "@blockchaincommons/dcbor-pattern";
```

```diff
  "dependencies": {
-   "@bcts/dcbor-pattern": "^1.0.0-beta.6"
+   "@blockchaincommons/dcbor-pattern": "^1.0.0-beta.1"
  }
```

### 2. Version numbering restarts

`@bcts/dcbor-pattern` versions moved in lockstep with every other package in the
monorepo, which is why it reached `1.0.0-beta.6`. Each extracted package now
versions independently and starts again at `1.0.0-beta.1`. A lower version
number here does **not** mean older code.

### 3. Node and TypeScript floors moved up

| | `@bcts/dcbor-pattern` | `@blockchaincommons/dcbor-pattern` |
|---|---|---|
| Node | `>= 18` | `>= 22.12` |
| TypeScript (consumers) | 6.x | `>= 5.7` |

### 4. The IIFE / global-script build is gone

`@bcts/dcbor-pattern` shipped an additional IIFE bundle exposed through the `browser`
field. That build is dropped: IIFE entry points cannot share chunks, which forks
module-level singletons across entry points. Use the ESM entry (`import`) or the
CJS entry (`require`); both are declared in `exports` and validated in CI by
`publint` and `@arethetypeswrong/cli`.

### 5. Peer packages renamed too

Every sibling library moved from the `@bcts` scope to `@blockchaincommons`. If
you depend on more than one, rename them together so a single copy of each
shared type is resolved:

| Old | New |
|---|---|
| `@bcts/dcbor` | `@blockchaincommons/dcbor` |
| `@bcts/<name>` | `@blockchaincommons/<name>` |

### 6. What did not change

- The public API: every exported name, signature and type is identical.
- The wire format. Encodings produced by `@bcts/dcbor-pattern` decode here, and the reverse.
- Parity with the Rust reference implementation. See [`RUST_DIVERGENCES.md`](./RUST_DIVERGENCES.md).
