/**
 * Baseline bundle entry: the package surface plus the inlined dcbor codec and
 * tag registration, so the differential can hand the bundle haystacks decoded
 * by *its own* copy of dcbor, read path elements back as bytes, and register
 * the tag names the working tree registers.
 */
export * from "../../src/index";
export * from "../../src/format";
import { decodeCbor, encodeCbor, getGlobalTagsStore, type Cbor } from "@blockchaincommons/dcbor";
import { registerTags } from "@blockchaincommons/tags";

export function baselineDecodeCbor(bytes: Uint8Array): Cbor {
  return decodeCbor(bytes);
}

export function baselineEncodeCbor(value: Cbor): Uint8Array {
  return encodeCbor(value);
}

export function baselineRegisterTags(): void {
  registerTags(getGlobalTagsStore());
}
