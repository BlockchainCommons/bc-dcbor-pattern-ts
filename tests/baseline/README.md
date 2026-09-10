# Frozen build of the previous behaviour

`dcbor-pattern-baseline.mjs` is the self-contained ESM bundle of `@blockchaincommons/dcbor-pattern` built from
commit `a6d376f39e0e3be61f0dff12f3ffd7780d667c4f`, the reference for the language wire before the changes this
tree carries. Its sibling `@blockchaincommons/*` dependencies are INLINED as
they were in the workspace at that moment, so the bundle keeps their behaviour
after they change. `dcbor-pattern-baseline.d.mts` is the public surface at that commit.

`tests/differential.test.ts` runs every corpus recipe through this bundle and
the working tree and asserts identical outcomes outside the enumerated
tombstones; it pins the sha256 below so an accidental rebuild cannot turn the
differential into a self-comparison.

Baseline commit: a6d376f39e0e3be61f0dff12f3ffd7780d667c4f
Baseline sha256: 092790672b9bdde04419515d8e714a234668e672a892be98fcb61a5075a14e90
