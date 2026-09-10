/**
 * Baseline bundle entry (Phase 0.6): the package surface plus the inlined
 * dcbor-compat codec and tags store, so the differential can hand the bundle
 * haystacks decoded by *its own* CBOR implementation, read path elements
 * back as bytes, and register the tag names the working tree registers.
 */
export * from "../../src/index";
import { decodeCbor, cborData, getGlobalTagsStore, type Cbor } from "@blockchaincommons/dcbor-compat";

export function baselineDecodeCbor(bytes: Uint8Array): Cbor {
  return decodeCbor(bytes);
}

export function baselineEncodeCbor(value: Cbor): Uint8Array {
  return cborData(value);
}

export function baselineRegisterTags(tags: readonly { value: number | bigint; name: string }[]): void {
  const store = getGlobalTagsStore();
  for (const t of tags) {
    if (store.tagForValue(t.value) === undefined) store.insert({ value: t.value, name: t.name });
  }
}
