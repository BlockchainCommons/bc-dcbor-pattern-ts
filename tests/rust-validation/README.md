# Rust reference cross-validation (Phase 1.4)

Replays `tests/vectors/vectors.json` against `dcbor-pattern` 0.11.1 (the
tracked commit, via a path dependency on `Rust/bc-dcbor-pattern-rust`).

```sh
cd tests/rust-validation
cargo run --release -- ../vectors/vectors.json
VERBOSE=1 cargo run --release -- ../vectors/vectors.json   # print expected divergences
```

`parse` vectors compare the pattern's display (or the error variant and span,
byte offsets transcoded to UTF-16 units); `match` vectors compare every path
element's dCBOR hex and the captures; `format` vectors compare
`format_paths_with_captures` output. `bc_tags::register_tags()` registers
the tag names the TypeScript adapters register. Exit 0 iff no mismatch.
