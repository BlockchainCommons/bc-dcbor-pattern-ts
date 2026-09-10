# Frozen baseline build

`dcbor-pattern-baseline.mjs` is the self-contained ESM bundle of `@blockchaincommons/dcbor-pattern` built from
commit `37fef5024c2932376c655abf06b5b4d1cd0b6ea6`, the pre-redesign wire-format reference. Sibling
`@blockchaincommons/*` packages are INLINED from their own frozen baseline
bundles (@blockchaincommons/crypto, @blockchaincommons/rand, @blockchaincommons/envelope, @blockchaincommons/lifehash, @blockchaincommons/dcbor-parse, @blockchaincommons/sskr, @blockchaincommons/tags, @blockchaincommons/known-values, @blockchaincommons/components, @blockchaincommons/uniform-resources, @blockchaincommons/shamir), so this bundle keeps the
pre-redesign behaviour of its dependencies after they change.
`dcbor-pattern-baseline.d.mts` is the public surface at that commit (Phase 0.5).

`tests/differential.test.ts` runs every corpus recipe through this bundle and
the working tree and asserts identical outcomes; it pins the sha256 below so
an accidental rebuild cannot turn the differential into a self-comparison.

Baseline commit: 37fef5024c2932376c655abf06b5b4d1cd0b6ea6
Baseline sha256: 789dd1aea1e9664b29fb01d76b302f0461452dc1f81cce1e85b8bd61f086fef2
