# Rust reference cross-validation

Replays `tests/vectors/vectors.json` against the tracked `dcbor-pattern`
release from crates.io (the version in `.github/versions.yml`).

```sh
cd tests/rust-validation
cargo run --release -- ../vectors/vectors.json
VERBOSE=1 cargo run --release -- ../vectors/vectors.json   # print every classified row
```

`parse` vectors compare the pattern's display (or the error variant and span,
byte offsets transcoded to UTF-16 units); `partial` vectors compare
`display@length`; `match` vectors compare every path element's dCBOR hex and
the captures; `format` vectors compare `format_paths_with_captures` output;
`regex` vectors run a bare regex source over a text or byte subject on the
`regex` crate itself and compare `match`, `no-match` or `throw:InvalidRegex`
(the dialect differential); `domain` vectors are JavaScript-only and counted
as such. `bc_tags::register_tags()` registers the same tag names the port's
test setup registers. The run classifies every row (the classes are described
in `RUST_DIVERGENCES.md`): **match**, **R1** (named tags on decoded data),
**R2** (the reference's bare `Unknown` error), **U1** (the `inf` display),
**X4** (regex constructs the engine cannot express), **js-only**, and
**MISMATCH**, which exits 1.

To validate a local checkout of the reference instead of the release, add
to `Cargo.toml`:

```toml
[patch.crates-io]
dcbor-pattern = { path = "../../../../../bc-rust/bc-dcbor-pattern-rust" }
```
