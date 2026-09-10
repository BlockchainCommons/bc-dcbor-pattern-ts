/**
 * `@name(p)`: matches as `p` and names the paths it matched.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { Pattern } from "../index";
import type { PatternOps } from "../ops";

/** A pattern that names the paths its inner pattern matches. */
export interface CapturePattern {
  /** The discriminant. */
  readonly variant: "Capture";
  /** The name the matched paths are recorded under. */
  readonly name: string;
  /** The pattern whose matches are captured. */
  readonly pattern: Pattern;
}

/** A `CapturePattern` with the given name over the given pattern. */
export const capturePattern = (name: string, pattern: Pattern): CapturePattern =>
  Object.freeze({ variant: "Capture", name, pattern });

/** Whether the inner pattern matches; the capture itself never changes the answer. */
export const capturePatternMatches = (
  pattern: CapturePattern,
  haystack: Cbor,
  ops: PatternOps,
): boolean => ops.matches(pattern.pattern, haystack);

/** The inner pattern's paths. */
export const capturePatternPaths = (
  pattern: CapturePattern,
  haystack: Cbor,
  ops: PatternOps,
): Path[] => ops.paths(pattern.pattern, haystack);

/** `@name(p)`. */
export const capturePatternDisplay = (
  pattern: CapturePattern,
  patternDisplay: (p: Pattern) => string,
): string => `@${pattern.name}(${patternDisplay(pattern.pattern)})`;
