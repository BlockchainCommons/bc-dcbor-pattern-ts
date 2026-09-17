# Blockchain Commons dCBOR Pattern Matching

### _by Leonardo Custodio_

**`bc-dcbor-pattern-ts`** matches, searches, and captures structure inside dCBOR values using a declarative pattern language.

`@blockchaincommons/dcbor-pattern` provides a powerful pattern matching language for querying and extracting data from [dCBOR](https://datatracker.ietf.org/doc/draft-mcnally-deterministic-cbor) (Deterministic CBOR) structures. It supports value matching, structural patterns, and meta-patterns with named captures.

The pattern language is designed to be expressive yet concise, allowing you to match complex nested structures with simple pattern expressions.

## Installation Instructions

[@blockchaincommons/dcbor-pattern](https://www.npmjs.com/package/@blockchaincommons/dcbor-pattern) is published to npm. Install it with your package manager of choice:

```sh
npm install @blockchaincommons/dcbor-pattern
# or
pnpm add @blockchaincommons/dcbor-pattern
# or
yarn add @blockchaincommons/dcbor-pattern
# or
bun add @blockchaincommons/dcbor-pattern
```

## Usage Instructions

A pattern is text such as `search(@n(number))`, parsed once into a frozen
`Pattern` and run against any `Cbor` value. A match yields *paths*: each
path is the list of values from the root down to the matched node.

```typescript
import { cbor } from "@blockchaincommons/dcbor";
import {
  parsePattern,
  paths,
  matches,
  pathsWithCaptures,
  display,
} from "@blockchaincommons/dcbor-pattern";
import { formatPaths } from "@blockchaincommons/dcbor-pattern/format";

const pattern = parsePattern("search(@n(number))");
const haystack = cbor({ a: [1, "x", { b: 2 }] });

display(pattern); // "search(@n(number))"
matches(pattern, haystack); // true
paths(pattern, haystack).length; // 2

const { paths: found, captures } = pathsWithCaptures(pattern, haystack);
console.log(formatPaths(found, { captures }));
```

Patterns can also be composed from the constructors:

```typescript
import { and, search, capture, text, anyNumber, or, number } from "@blockchaincommons/dcbor-pattern";

const built = and(search(capture("t", text("x"))), search(or(number(1), number(2))));
display(built); // 'search(@t("x")) & search(1 | 2)'
```

Every constructor and every parsed pattern returns a frozen object; a
`Pattern` is compared with `patternEquals`, never with `===`.

### Errors

`parsePattern` throws a `DcborPatternError` for text that is not a pattern.
Its `code` says why (`DcborPatternErrorCode` lists every code), `details`
carries the span and any code-specific fields, and `fullMessage(source)`
renders the message with the source line and a caret under the span.
`tryParsePattern` returns `{ ok: true, value }` or `{ ok: false, error }`
instead of throwing.

```typescript
import { tryParsePattern, parsePattern, DcborPatternError } from "@blockchaincommons/dcbor-pattern";

const rejected = tryParsePattern("[1, 2");
if (!rejected.ok) {
  rejected.error.code; // "ExpectedCloseBracket"
  rejected.error.span; // { start: 5, end: 5 }
}

try {
  parsePattern("(1 2)");
} catch (e) {
  if (DcborPatternError.isDcborPatternError(e)) console.log(e.fullMessage("(1 2)"));
  // line 1: Unexpected token `2`
  // (1 2)
  //    ^
}
```

Errors name the token the parser met (`UnexpectedToken`, or
`UnrecognizedToken` for text no token starts) or the end of the source
(`UnexpectedEndOfInput`, or `ExpectedCloseParen`, `ExpectedCloseBracket`,
`ExpectedCloseBrace` and `ExpectedColon` when it ends inside a capture,
`search(…)`, `tagged(…)`, an array or a map), with the reference's variants
and spans: an unterminated literal spans its opening delimiter, and
unrecognised text spans what a single-pass scanner reads before giving up.

Spans are UTF-16 code-unit offsets; `spanToByteOffsets(source, span)`
converts one to UTF-8 byte offsets. A wrong argument type (a haystack that
is not a `Cbor`, a pattern that is not a `Pattern`, a non-string source) is
a `TypeError`; a wrong value (`number(NaN)`, an inverted range, a capture
name that is not an identifier, a `maxDepth` that is not a positive
integer) is a `RangeError`.

`parsePatternPartial` parses the pattern at the start of a longer text and
reports how much it consumed, for languages that embed dCBOR patterns.
Nesting is not limited by default, as in the reference: text nested a few
thousand levels deep exhausts the engine's stack with a `RangeError`.
`ParseOptions.maxDepth` sets a limit when one is wanted; deeper text is
then rejected with `NestingTooDeep`.

### Entries

| Entry | Contents |
|---|---|
| root | parsing, the constructors, `paths`, `matches`, `display`, `pathsWithCaptures`, `patternEquals`, `Interval`, `Quantifier`, `Reluctance`, `DcborPatternError` |
| `/format` | `formatPaths` and `formatPath`, the diagnostic rendering of paths and captures |
| `/patterns` | the per-kind pattern types, constructors, matchers and displayers, for languages built on dCBOR patterns |

### Pattern syntax

Whitespace between tokens is ignored. Keywords are case-sensitive.

**Value patterns** match single values.

| Pattern | Matches |
|---|---|
| `bool`, `true`, `false` | any boolean, or the given one |
| `null` | the null value |
| `number` | any number |
| `42`, `-1.5`, `1e3` | that number |
| `1...10` | a number in the inclusive range |
| `>=1`, `<=1`, `>1`, `<1` | a number in the half-open range |
| `NaN`, `Infinity`, `-Infinity` | those values |
| `text` | any text |
| `"string"` | that text (`\"`, `\\`, `\n`, `\r`, `\t` escapes) |
| `/regex/` | text the regex matches |
| `bstr` | any byte string |
| `h'0a0b'` | those bytes |
| `h'/regex/'` | a byte string the regex matches, read as UTF-8 (or as raw bytes under `(?-u)`) |
| `date` | any date (tag 1) |
| `date'2024-01-01'` | that date (ISO-8601, a bare date or a full timestamp) |
| `date'2024-01-01...2024-12-31'`, `date'2024-01-01...'`, `date'...2024-12-31'` | a date in the range, from the date on, or up to the date |
| `date'/regex/'` | a date whose ISO-8601 text the regex matches |
| `known` | any known value (tag 40000) |
| `'12'`, `'isA'`, `'/regex/'` | the known value with that number, that name, or a name the regex matches |
| `digest` | any digest (tag 40001) |
| `digest'0a0b'`, `digest'ur:digest/…'`, `digest'/regex/'` | a digest with that prefix (up to 32 bytes), that digest, or one whose bytes the regex matches |

**Structure patterns** match containers and their contents.

| Pattern | Matches |
|---|---|
| `array`, `[{n}]`, `[{n,m}]`, `[{n,}]` | any array, or one with that many elements |
| `[p1, p2, …]` | an array whose elements match the sequence; elements may carry repeats: `[(*)*, 42, (*)*]` is an array containing 42 |
| `map`, `{{n}}`, `{{n,m}}`, `{{n,}}` | any map, or one with that many entries |
| `{k1: v1, k2: v2, …}` | a map where each key pattern has an entry whose value matches, in any order |
| `tagged` | any tagged value |
| `tagged(1, p)`, `tagged(date, p)`, `tagged(/regex/, p)` | a tagged value with that tag number, that registered tag name, or a name the regex matches, whose content matches `p` |

**Meta patterns** combine patterns. Precedence, highest first: repeat, `&`, `!`, sequence, `|`.

| Pattern | Matches |
|---|---|
| `*` | any single value |
| `p & q` | both |
| `p \| q` | either |
| `!p` | anything but `p` |
| `(p)` | `p`, as a group |
| `(p)*`, `(p)+`, `(p)?`, `(p){n,m}` | `p` repeated, greedy |
| `(p)*?`, `(p)+?`, `(p)??`, `(p){n,m}?` | the same, lazy |
| `(p)*+`, `(p)++`, `(p)?+`, `(p){n,m}+` | the same, possessive (never backtracks) |
| `@name(p)` | `p`, with the matched paths recorded under `name` |
| `search(p)` | `p` at any node of the tree |

`display` prints a pattern in canonical form, which parses back to an equal
pattern.

### Regex dialect

A regex inside a pattern (`/…/`, `'/…/'`, `date'/…/'`, `tagged(/…/, p)`,
`h'/…/'`, `digest'/…/'`) is written in the dialect every implementation of
the pattern language shares, and translated to a JavaScript regex that
matches the same strings when the pattern is parsed:

- `\w`, `\d`, `\s` and `\b` are Unicode-aware; `.` matches any code point
  but `\n`; `(?m)` anchors at `\n` only; `(?s)`, `(?R)`, `(?U)` (the greed
  swap), `(?x)` (verbose mode) and scoped `(?i:…)` work as in the dialect;
  `a**` is nested repetition; `\a`, `\x{…}`, `\u`, `\U`, `\b{start}` and
  the escapable punctuation are accepted; `\p{…}` takes loose names
  (`\p{greek}`, `\p{sc=Greek}`, `\p{any}`); classes nest and take `&&`,
  `--`, `~~` and `[:alpha:]`.
- A text regex runs over the text's code points. A byte regex runs in
  Unicode mode over the bytes: `h'/é/'` matches the UTF-8 bytes of `é`,
  `\xff` is U+00FF and a byte that is not part of a valid sequence matches
  nothing; under a leading `(?-u)` it runs over the raw bytes with ASCII
  classes and `\xNN` names byte NN.
- Lookaround, backreferences, `\Z`, octal escapes, `{,n}` and more than
  250 nested groups are rejected with `InvalidRegex`, as the dialect
  rejects them.
- Not translated: the Unicode property tables the engine lacks (`Age`,
  `gcb`, `wb`, `sb`), and Unicode mode changing inside a byte regex
  (`a(?-u:\xff)`); these are `InvalidRegex` here and accepted by the
  reference. The regex runs on JavaScript's backtracking engine, so a
  pathological regex can take exponential time where the reference's
  engine is linear.

The translation is proven against the reference's engine by a differential
corpus of regex sources over text and byte subjects, replayed by
`tests/rust-validation`.

## Status - Beta

`bc-dcbor-pattern-ts` is currently under active development and in beta testing. It should not be used for production tasks until it has had further testing and auditing. See [Blockchain Commons' Development Phases](https://github.com/BlockchainCommons/Community/blob/master/release-path.md).

### Version History

- **1.0.0-beta.1 (September 9, 2026)** - Initial beta implementation.

### Roadmap

- Continued testing and auditing on the path from beta to a stable **1.0.0** release.
- Continued parity with the Rust reference implementation as it evolves (see [`RUST_DIVERGENCES.md`](./RUST_DIVERGENCES.md)).

### Dependencies

`@blockchaincommons/dcbor-pattern` depends on `@blockchaincommons/components`, `@blockchaincommons/dcbor`, `@blockchaincommons/dcbor-parse`, `@blockchaincommons/known-values`, `@blockchaincommons/tags` and `@blockchaincommons/uniform-resources` at runtime.

To build and work on this library, you'll need the following tools:

- [Node.js](https://nodejs.org/) >= 22.12 - JavaScript runtime.
- [Bun](https://bun.sh/) - used to install dependencies and run scripts (any node package manager works).
- [TypeScript](https://www.typescriptlang.org/) >= 5.7 - language and type checker.

### Derived from ...

This `bc-dcbor-pattern-ts` project is either derived from or was inspired by:

- [BlockchainCommons/bc-dcbor-pattern-rust](https://github.com/BlockchainCommons/bc-dcbor-pattern-rust) - The reference Rust implementation, by [Wolf McNally](https://github.com/wolfmcnally).
- [paritytech/bcts](https://github.com/paritytech/bcts) - A TypeScript port of many Blockchain Commons' specs, by [Parity Technologies](https://github.com/paritytech).

## Financial Support

`bc-dcbor-pattern-ts` is a project of [Blockchain Commons](https://www.blockchaincommons.com/). We are proudly a "not-for-profit" social benefit corporation committed to open source & open development. Our work is funded entirely by donations and collaborative partnerships with people like you. Every contribution will be spent on building open tools, technologies, and techniques that sustain and advance blockchain and internet security infrastructure and promote an open web.

To financially support further development of `bc-dcbor-pattern-ts` and other projects, please consider becoming a Patron of Blockchain Commons through ongoing monthly patronage as a [GitHub Sponsor](https://github.com/sponsors/BlockchainCommons). You can also support Blockchain Commons with bitcoins at our [BTCPay Server](https://btcpay.blockchaincommons.com/).

## Contributing

We encourage public contributions through issues and pull requests! Please review [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our development process. All contributions to this repository require a GPG signed [Contributor License Agreement](./CLA.md).

### Discussions

The best place to talk about Blockchain Commons and its projects is in our GitHub Discussions areas.

[**Gordian Developer Community**](https://github.com/BlockchainCommons/Gordian-Developer-Community/discussions). For standards and open-source developers who want to talk about interoperable wallet specifications, please use the Discussions area of the [Gordian Developer Community repo](https://github.com/BlockchainCommons/Gordian-Developer-Community/discussions). This is where you talk about Gordian specifications such as [Gordian Envelope](https://github.com/BlockchainCommons/Gordian/tree/master/Envelope#articles), [bc-shamir](https://github.com/BlockchainCommons/bc-shamir), [Sharded Secret Key Reconstruction](https://github.com/BlockchainCommons/bc-sskr), and [bc-ur](https://github.com/BlockchainCommons/bc-ur) as well as the larger [Gordian Architecture](https://github.com/BlockchainCommons/Gordian/blob/master/Docs/Overview-Architecture.md), its [Principles](https://github.com/BlockchainCommons/Gordian#gordian-principles) of independence, privacy, resilience, and openness, and its macro-architectural ideas such as functional partition (including airgapping, the original name of this community).

[**Gordian User Community**](https://github.com/BlockchainCommons/Gordian/discussions). For users of the Gordian reference apps, including [Gordian Coordinator](https://github.com/BlockchainCommons/iOS-GordianCoordinator), [Gordian Seed Tool](https://github.com/BlockchainCommons/GordianSeedTool-iOS), [Gordian Server](https://github.com/BlockchainCommons/GordianServer-macOS), [Gordian Wallet](https://github.com/BlockchainCommons/GordianWallet-iOS), and [SpotBit](https://github.com/BlockchainCommons/spotbit) as well as our whole series of [CLI apps](https://github.com/BlockchainCommons/Gordian/blob/master/Docs/Overview-Apps.md#cli-apps). This is a place to talk about bug reports and feature requests as well as to explore how our reference apps embody the [Gordian Principles](https://github.com/BlockchainCommons/Gordian#gordian-principles).

[**Blockchain Commons Discussions**](https://github.com/BlockchainCommons/Community/discussions). For developers, interns, and patrons of Blockchain Commons, please use the discussions area of the [Community repo](https://github.com/BlockchainCommons/Community) to talk about general Blockchain Commons issues, the intern program, or topics other than those covered by the [Gordian Developer Community](https://github.com/BlockchainCommons/Gordian-Developer-Community/discussions) or the 
[Gordian User Community](https://github.com/BlockchainCommons/Gordian/discussions).

### Other Questions & Problems

As an open-source, open-development community, Blockchain Commons does not have the resources to provide direct support of our projects. Please consider the discussions area as a locale where you might get answers to questions. Alternatively, please use this repository's [issues](https://github.com/BlockchainCommons/bc-dcbor-pattern-ts/issues) feature. Unfortunately, we can not make any promises on response time.

If your company requires support to use our projects, please feel free to contact us directly about options. We may be able to offer you a contract for support from one of our contributors, or we might be able to point you to another entity who can offer the contractual support that you need.

### Credits

The following people directly contributed to this repository. You can add your name here by getting involved. The first step is learning how to contribute from our [CONTRIBUTING.md](./CONTRIBUTING.md) documentation.

| Name              | Role                | Github                                            | Email                                 | GPG Fingerprint                                    |
| ----------------- | ------------------- | ------------------------------------------------- | ------------------------------------- | -------------------------------------------------- |
| Christopher Allen | Principal Architect | [@ChristopherA](https://github.com/ChristopherA) | \<ChristopherA@LifeWithAlacrity.com\> | FDFE 14A5 4ECB 30FC 5D22  74EF F8D3 6C91 3574 05ED |
| Wolf McNally      | Lead Researcher/Engineer | [@wolfmcnally](https://github.com/wolfmcnally) | \<Wolf@WolfMcNally.com\> | 9436 52EE 3844 1760 C3DC  3536 4B6C 2FCF 8947 80AE |
| Leonardo Custodio | Software Engineer | [@leonardocustodio](https://github.com/leonardocustodio) | \<leonardo@snowpine.io\> | 59DA D997 67EF 3BAB 2B90 D057 5384 DEF3 B582 450D |

### Contributing Sponsor

**Blockchain Commons dCBOR Pattern Matching for TypeScript** was produced as a collaboration between Blockchain Commons and one of our patrons, [Parity Technologies](https://parity.io): Parity wrote the wrappers based on Blockchain Commons' specifications and reference libraries. Blockchain Commons is dedicated to not just creating open infrastructure on our own, but also coordinating the work of other companies in benefiting the Commons. Thanks to Parity for working directly with us in this manner.

![](.github/assets/parity.svg)

## Responsible Disclosure

We want to keep all of our software safe for everyone. If you have discovered a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner. We are unfortunately not able to offer bug bounties at this time.

We do ask that you offer us good faith and use best efforts not to leak information or harm any user, their data, or our developer community. Please give us a reasonable amount of time to fix the issue before you publish it. Do not defraud our users or us in the process of discovery. We promise not to bring legal action against researchers who point out a problem provided they do their best to follow the these guidelines.

### Reporting a Vulnerability

Please report suspected security vulnerabilities in private via email to ChristopherA@BlockchainCommons.com (do not use this email for support). Please do NOT create publicly viewable issues for suspected security vulnerabilities.

The following keys may be used to communicate sensitive information to developers:

| Name              | Fingerprint                                        |
| ----------------- | -------------------------------------------------- |
| Christopher Allen | FDFE 14A5 4ECB 30FC 5D22  74EF F8D3 6C91 3574 05ED |

You can import a key by running the following command with that individual’s fingerprint: `gpg --recv-keys "<fingerprint>"` Ensure that you put quotes around fingerprints that contain spaces.
