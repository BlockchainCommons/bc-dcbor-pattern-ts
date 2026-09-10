# Rust reference cross-validation

Replays `tests/vectors/vectors.json` against the tracked `dcbor-pattern`
release from crates.io (the version in `.github/versions.yml`).

```sh
cd tests/rust-validation
cargo run --release -- ../vectors/vectors.json
VERBOSE=1 cargo run --release -- ../vectors/vectors.json   # print every classified row
```

`parse` vectors compare the pattern's display (or the error variant and span,
byte offsets transcoded to UTF-16 units); `prefix` vectors compare
`display@length`; `match` vectors compare every path element's dCBOR hex and
the captures; `format` vectors compare `format_paths_with_captures` output;
`domain` vectors are JavaScript-only and counted as such.
`bc_tags::register_tags()` registers the same tag names the port's test setup
registers. The run classifies every row (the classes are described in
`RUST_DIVERGENCES.md`): **match**, **S1–S2** (error taxonomy), **R1–R2**
(the port resolves names the reference does not), **X1–X3** (regex dialect,
syntax and byte mode), **U1–U3** (reference defects), **N1** (the port's
nesting limit), **js-only**, **pending** (a divergence a later change closes;
expected to reach zero), and **MISMATCH**, which exits 1.

To validate a local checkout of the reference instead of the release, add
to `Cargo.toml`:

```toml
[patch.crates-io]
dcbor-pattern = { path = "../../../../../bc-rust/bc-dcbor-pattern-rust" }
```
