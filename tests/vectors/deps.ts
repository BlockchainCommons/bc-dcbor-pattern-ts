/** The working tree's dcbor for haystacks and path elements, and its tag registration. */
import { decodeCbor, encodeCbor, getGlobalTagsStore, type Cbor } from "@blockchaincommons/dcbor";
import { registerTags } from "@blockchaincommons/tags";
import type { CurrentDeps } from "./recipes";

export const currentDeps: CurrentDeps = {
  registerTags: () => registerTags(getGlobalTagsStore()),
  decodeCbor: (bytes) => decodeCbor(bytes),
  encodeCbor: (value) => encodeCbor(value as Cbor),
};
