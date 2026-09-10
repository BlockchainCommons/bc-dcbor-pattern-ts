/**
 * `tagged` and `tagged(t, p)`: patterns over tagged values.
 */
import type { Cbor, Tag } from "@blockchaincommons/dcbor";
import { getGlobalTagsStore, isTagged, tagValue, asTaggedValue } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { Pattern } from "../index";
import type { PatternOps } from "../ops";
import { type PatternRegex, type RegexInput, toPatternRegex } from "../../regex";

/** A pattern over tagged values: any, by tag number, by tag name, or by a regex on the name. */
export type TaggedPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Tag";
      /** The tag the value must carry. */
      readonly tag: Tag;
      /** The pattern the tagged content must match. */
      readonly pattern: Pattern;
    }
  | {
      /** The discriminant. */
      readonly variant: "Name";
      /** The registered name the tag must have. */
      readonly name: string;
      /** The pattern the tagged content must match. */
      readonly pattern: Pattern;
    }
  | {
      /** The discriminant. */
      readonly variant: "Regex";
      /** The regex the tag's registered name must match. */
      readonly regex: PatternRegex;
      /** The pattern the tagged content must match. */
      readonly pattern: Pattern;
    };

/** A `TaggedPattern` matching any tagged value. */
export const taggedPatternAny = (): TaggedPattern => Object.freeze({ variant: "Any" });

/** A `TaggedPattern` matching `tag` with content matching `pattern`. */
export const taggedPatternWithTag = (tag: Tag, pattern: Pattern): TaggedPattern =>
  Object.freeze({ variant: "Tag", tag, pattern });

/** A `TaggedPattern` matching the tag registered as `name` with content matching `pattern`. */
export const taggedPatternWithName = (name: string, pattern: Pattern): TaggedPattern =>
  Object.freeze({ variant: "Name", name, pattern });

/** A `TaggedPattern` matching a tag whose registered name matches `regex`, with content matching `pattern`. */
export const taggedPatternWithRegex = (regex: RegexInput, pattern: Pattern): TaggedPattern =>
  Object.freeze({ variant: "Regex", regex: toPatternRegex(regex, "text"), pattern });

/** Whether two tag numbers are equal, over the whole 64-bit range. */
const tagsEqual = (a: number | bigint | undefined, b: number | bigint): boolean =>
  a !== undefined && BigInt(a) === BigInt(b);

/** The name registered for a tag in the global tags store, if any. */
const lookupTagName = (tag: number | bigint): string | undefined =>
  getGlobalTagsStore().tagForValue(tag)?.name;

/** Whether the tagged pattern matches the haystack. */
export const taggedPatternMatches = (
  pattern: TaggedPattern,
  haystack: Cbor,
  ops: PatternOps,
): boolean => {
  if (!isTagged(haystack)) return false;
  const tag = tagValue(haystack);
  const content = asTaggedValue(haystack)?.[1];
  if (content === undefined || tag === undefined) return false;

  switch (pattern.variant) {
    case "Any":
      return true;
    case "Tag":
      return tagsEqual(tag, pattern.tag.value) && ops.matches(pattern.pattern, content);
    case "Name": {
      const tagName = lookupTagName(tag);
      return tagName === pattern.name && ops.matches(pattern.pattern, content);
    }
    case "Regex": {
      const tagName = lookupTagName(tag);
      return (
        tagName !== undefined &&
        pattern.regex.regex.test(tagName) &&
        ops.matches(pattern.pattern, content)
      );
    }
  }
};

/** The root path when the tagged pattern matches, else none. */
export const taggedPatternPaths = (
  pattern: TaggedPattern,
  haystack: Cbor,
  ops: PatternOps,
): Path[] => (taggedPatternMatches(pattern, haystack, ops) ? [[haystack]] : []);

/**
 * The paths and captures of the tagged pattern on the haystack. For a tag
 * number, the content's paths continue below the tagged value and every
 * capture inside the content is reported as `[tagged, content]`; a name or
 * regex selector reports the root path without captures.
 */
export const taggedPatternPathsWithCaptures = (
  pattern: TaggedPattern,
  haystack: Cbor,
  ops: PatternOps,
): [Path[], Map<string, Path[]>] => {
  if (!isTagged(haystack)) return [[], new Map<string, Path[]>()];
  const tag = tagValue(haystack);
  const content = asTaggedValue(haystack)?.[1];
  if (content === undefined) return [[], new Map<string, Path[]>()];

  switch (pattern.variant) {
    case "Any":
      return [[[haystack]], new Map<string, Path[]>()];

    case "Tag": {
      if (!tagsEqual(tag, pattern.tag.value)) return [[], new Map<string, Path[]>()];
      const inner = ops.pathsWithCaptures(pattern.pattern, content);
      if (inner.paths.length === 0) return [[], new Map<string, Path[]>()];
      const taggedPaths: Path[] = inner.paths.map((contentPath) => [
        haystack,
        ...contentPath.slice(1),
      ]);
      const captures = new Map<string, Path[]>();
      for (const [name, capturePaths] of inner.captures) {
        captures.set(
          name,
          capturePaths.map(() => [haystack, content]),
        );
      }
      return [taggedPaths, captures];
    }

    case "Name":
    case "Regex":
      return [taggedPatternPaths(pattern, haystack, ops), new Map<string, Path[]>()];
  }
};

/** `tagged`, `tagged(n, p)`, `tagged(name, p)` or `tagged(/re/,  p)`. */
export const taggedPatternDisplay = (
  pattern: TaggedPattern,
  patternDisplay: (p: Pattern) => string,
): string => {
  switch (pattern.variant) {
    case "Any":
      return "tagged";
    case "Tag":
      return `tagged(${pattern.tag.value}, ${patternDisplay(pattern.pattern)})`;
    case "Name":
      return `tagged(${pattern.name}, ${patternDisplay(pattern.pattern)})`;
    case "Regex":
      // two spaces after the comma, as the reference prints it
      return `tagged(/${pattern.regex.source}/,  ${patternDisplay(pattern.pattern)})`;
  }
};

/** Whether two tagged patterns are the same, comparing content with `patternEquals`. */
export const taggedPatternEquals = (
  a: TaggedPattern,
  b: TaggedPattern,
  patternEquals: (p1: Pattern, p2: Pattern) => boolean,
): boolean => {
  if (a.variant !== b.variant) return false;
  switch (a.variant) {
    case "Any":
      return true;
    case "Tag": {
      const other = b as typeof a;
      return (
        BigInt(a.tag.value) === BigInt(other.tag.value) && patternEquals(a.pattern, other.pattern)
      );
    }
    case "Name": {
      const other = b as typeof a;
      return a.name === other.name && patternEquals(a.pattern, other.pattern);
    }
    case "Regex": {
      const other = b as typeof a;
      return a.regex.source === other.regex.source && patternEquals(a.pattern, other.pattern);
    }
  }
};
