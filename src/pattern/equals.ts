/**
 * Structural equality of patterns.
 */
import { requirePattern } from "./guards";
import type { Pattern } from "./index";
import type { ValuePattern } from "./value";
import type { StructurePattern } from "./structure";
import type { MetaPattern } from "./meta";
import { arrayPatternEquals } from "./structure/array-pattern";
import { mapPatternEquals } from "./structure/map-pattern";
import { taggedPatternEquals } from "./structure/tagged-pattern";
import { bytesEqual } from "./value/bytes-utils";
import type { PatternRegex } from "../regex";

const regexEquals = (a: PatternRegex, b: PatternRegex): boolean => a.source === b.source;

const valuePatternEquals = (a: ValuePattern, b: ValuePattern): boolean => {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "Bool": {
      const o = (b as typeof a).pattern;
      return (
        a.pattern.variant === o.variant &&
        (a.pattern.variant !== "Value" || a.pattern.value === (o as typeof a.pattern).value)
      );
    }
    case "Null":
      return true;
    case "Number": {
      const p = a.pattern;
      const o = (b as typeof a).pattern;
      if (p.variant !== o.variant) return false;
      switch (p.variant) {
        case "Range":
          return p.min === (o as typeof p).min && p.max === (o as typeof p).max;
        case "Value":
        case "GreaterThan":
        case "GreaterThanOrEqual":
        case "LessThan":
        case "LessThanOrEqual":
          return Object.is(p.value, (o as typeof p).value);
        default:
          return true;
      }
    }
    case "Text": {
      const p = a.pattern;
      const o = (b as typeof a).pattern;
      if (p.variant !== o.variant) return false;
      if (p.variant === "Value") return p.value === (o as typeof p).value;
      if (p.variant === "Regex") return regexEquals(p.regex, (o as typeof p).regex);
      return true;
    }
    case "ByteString": {
      const p = a.pattern;
      const o = (b as typeof a).pattern;
      if (p.variant !== o.variant) return false;
      if (p.variant === "Value") return bytesEqual(p.value, (o as typeof p).value);
      if (p.variant === "BinaryRegex") return regexEquals(p.regex, (o as typeof p).regex);
      return true;
    }
    case "Date": {
      const p = a.pattern;
      const o = (b as typeof a).pattern;
      if (p.variant !== o.variant) return false;
      switch (p.variant) {
        case "Range":
          return (
            p.min.epochSeconds === (o as typeof p).min.epochSeconds &&
            p.max.epochSeconds === (o as typeof p).max.epochSeconds
          );
        case "Value":
        case "Earliest":
        case "Latest":
          return p.value.epochSeconds === (o as typeof p).value.epochSeconds;
        case "StringValue":
          return p.value === (o as typeof p).value;
        case "Regex":
          return regexEquals(p.regex, (o as typeof p).regex);
        default:
          return true;
      }
    }
    case "Digest": {
      const p = a.pattern;
      const o = (b as typeof a).pattern;
      if (p.variant !== o.variant) return false;
      switch (p.variant) {
        case "Value":
          return bytesEqual(p.value.bytes, (o as typeof p).value.bytes);
        case "Prefix":
          return bytesEqual(p.prefix, (o as typeof p).prefix);
        case "BinaryRegex":
          return regexEquals(p.regex, (o as typeof p).regex);
        default:
          return true;
      }
    }
    case "KnownValue": {
      const p = a.pattern;
      const o = (b as typeof a).pattern;
      if (p.variant !== o.variant) return false;
      switch (p.variant) {
        case "Value":
          return p.value.valueBigInt === (o as typeof p).value.valueBigInt;
        case "Named":
          return p.name === (o as typeof p).name;
        case "Regex":
          return regexEquals(p.regex, (o as typeof p).regex);
        default:
          return true;
      }
    }
  }
};

const structurePatternEquals = (a: StructurePattern, b: StructurePattern): boolean => {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "Array":
      return arrayPatternEquals(a.pattern, (b as typeof a).pattern, patternEquals);
    case "Map":
      return mapPatternEquals(a.pattern, (b as typeof a).pattern, patternEquals);
    case "Tagged":
      return taggedPatternEquals(a.pattern, (b as typeof a).pattern, patternEquals);
  }
};

const allEqual = (xs: readonly Pattern[], ys: readonly Pattern[]): boolean =>
  xs.length === ys.length && xs.every((x, i) => patternEquals(x, ys[i]));

const metaPatternEquals = (a: MetaPattern, b: MetaPattern): boolean => {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "Any":
      return true;
    case "And":
    case "Or":
    case "Sequence":
      return allEqual(a.pattern.patterns, (b as typeof a).pattern.patterns);
    case "Not":
    case "Search":
      return patternEquals(a.pattern.pattern, (b as typeof a).pattern.pattern);
    case "Capture": {
      const o = (b as typeof a).pattern;
      return a.pattern.name === o.name && patternEquals(a.pattern.pattern, o.pattern);
    }
    case "Repeat": {
      const o = (b as typeof a).pattern;
      return (
        a.pattern.quantifier.equals(o.quantifier) && patternEquals(a.pattern.pattern, o.pattern)
      );
    }
  }
};

/**
 * Whether two patterns are the same pattern: the same kinds, operands,
 * values, quantifiers and regex sources throughout.
 */
export const patternEquals = (a: Pattern, b: Pattern): boolean => {
  requirePattern(a, "a");
  requirePattern(b, "b");
  if (a === b) return true;
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case "Value":
      return valuePatternEquals(a.pattern, (b as typeof a).pattern);
    case "Structure":
      return structurePatternEquals(a.pattern, (b as typeof a).pattern);
    case "Meta":
      return metaPatternEquals(a.pattern, (b as typeof a).pattern);
  }
};
