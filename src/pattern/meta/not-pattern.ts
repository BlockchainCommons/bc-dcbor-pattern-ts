/**
 * `!a`: matches when the operand does not.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { Pattern } from "../index";
import type { PatternOps } from "../ops";

/** A pattern that matches when the inner pattern does not. */
export interface NotPattern {
  /** The discriminant. */
  readonly variant: "Not";
  /** The pattern that must not match. */
  readonly pattern: Pattern;
}

/** A `NotPattern` over the given pattern. */
export const notPattern = (pattern: Pattern): NotPattern =>
  Object.freeze({ variant: "Not", pattern });

/** Whether the inner pattern fails to match the haystack. */
export const notPatternMatches = (pattern: NotPattern, haystack: Cbor, ops: PatternOps): boolean =>
  !ops.matches(pattern.pattern, haystack);

/** The root path when the inner pattern does not match, else none. */
export const notPatternPaths = (pattern: NotPattern, haystack: Cbor, ops: PatternOps): Path[] =>
  notPatternMatches(pattern, haystack, ops) ? [[haystack]] : [];

/**
 * Whether a pattern's display needs parentheses under `!`: an `and`, `or`
 * or sequence with more than one operand or a complex operand, a `not`,
 * or a capture of a complex pattern.
 */
const isComplex = (pattern: Pattern): boolean => {
  if (pattern.kind !== "Meta") return false;
  const meta = pattern.pattern;
  switch (meta.type) {
    case "Not":
      return true;
    case "And":
    case "Or":
    case "Sequence": {
      const inner = meta.pattern.patterns;
      return inner.length > 1 || inner.some((p) => isComplex(p));
    }
    case "Capture":
      return isComplex(meta.pattern.pattern);
    case "Any":
    case "Repeat":
    case "Search":
      return false;
  }
};

/** `!p`, with parentheses around a complex `p`. */
export const notPatternDisplay = (
  pattern: NotPattern,
  patternDisplay: (p: Pattern) => string,
): string =>
  isComplex(pattern.pattern)
    ? `!(${patternDisplay(pattern.pattern)})`
    : `!${patternDisplay(pattern.pattern)}`;
