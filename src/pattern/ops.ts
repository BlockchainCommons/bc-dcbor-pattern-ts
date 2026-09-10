/**
 * The whole-pattern operations a per-kind matcher recurses through. The
 * root module builds one `PatternOps` from its own `paths`, `matches`,
 * `display` and `pathsWithCaptures` and hands it down, so no per-kind
 * module imports the root and the module graph stays a tree.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../format";
import type { Pattern, MatchResult } from "./index";

/** The operations over any pattern, as the root module implements them. */
export interface PatternOps {
  /** Every path the pattern matches in the haystack. */
  readonly paths: (pattern: Pattern, haystack: Cbor) => Path[];
  /** Whether the pattern matches the haystack. */
  readonly matches: (pattern: Pattern, haystack: Cbor) => boolean;
  /** The paths and the captures the pattern yields on the haystack. */
  readonly pathsWithCaptures: (pattern: Pattern, haystack: Cbor) => MatchResult;
  /** The canonical text of the pattern. */
  readonly display: (pattern: Pattern) => string;
}
