/**
 * Runs before every test file (`vitest.config.ts` `setupFiles`).
 *
 * The known-values directory configuration is pinned to no directories, so
 * the global registry never reads the machine's `~/.known-values`; the BC
 * tag names are registered in dcbor's global store, as the reference's
 * tests call `bc_components::register_tags()`, so a digest renders as a UR.
 */
import { getGlobalTagsStore } from "@blockchaincommons/dcbor";
import { DirectoryConfig, setDirectoryConfig } from "@blockchaincommons/known-values";
import { registerTags } from "@blockchaincommons/tags";

setDirectoryConfig(new DirectoryConfig());
registerTags(getGlobalTagsStore());
