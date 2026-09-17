/**
 * `map`, `{{n,m}}` and `{k: v, …}`: patterns over maps.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import { isMap, mapSize, mapKeys, mapValue } from "@blockchaincommons/dcbor";
import type { Path } from "../../format";
import type { Pattern } from "../index";
import type { PatternOps } from "../ops";
import { Interval } from "../../interval";

/** A pattern over maps: any map, key/value constraints, or a length. */
export type MapPattern =
  | {
      /** The discriminant. */
      readonly variant: "Any";
    }
  | {
      /** The discriminant. */
      readonly variant: "Constraints";
      /** The `[key, value]` pattern pairs each of which some entry must match. */
      readonly constraints: readonly (readonly [Pattern, Pattern])[];
    }
  | {
      /** The discriminant. */
      readonly variant: "Length";
      /** The interval the map's size must lie in. */
      readonly length: Interval;
    };

/** A `MapPattern` matching any map. */
export const mapPatternAny = (): MapPattern => Object.freeze({ variant: "Any" });

/** A `MapPattern` requiring an entry matching each `[key, value]` pair. */
export const mapPatternWithConstraints = (
  constraints: readonly (readonly [Pattern, Pattern])[],
): MapPattern =>
  Object.freeze({
    variant: "Constraints",
    constraints: Object.freeze(constraints.map(([k, v]) => Object.freeze([k, v] as const))),
  });

/** A `MapPattern` matching maps of exactly `length` entries. */
export const mapPatternWithLength = (length: number): MapPattern =>
  Object.freeze({ variant: "Length", length: Interval.exactly(length) });

/** A `MapPattern` matching maps of `min` to `max` entries (unbounded without `max`). */
export const mapPatternWithLengthRange = (min: number, max?: number): MapPattern =>
  Object.freeze({
    variant: "Length",
    length: max !== undefined ? Interval.from(min, max) : Interval.atLeast(min),
  });

/** A `MapPattern` matching maps whose size lies in `interval`. */
export const mapPatternWithLengthInterval = (interval: Interval): MapPattern =>
  Object.freeze({ variant: "Length", length: interval });

/** Whether the map pattern matches the haystack. */
export const mapPatternMatches = (
  pattern: MapPattern,
  haystack: Cbor,
  ops: PatternOps,
): boolean => {
  if (!isMap(haystack)) return false;

  switch (pattern.variant) {
    case "Any":
      return true;
    case "Constraints": {
      const keys = mapKeys(haystack);
      if (keys === undefined) return false;
      for (const [keyPattern, valuePattern] of pattern.constraints) {
        let foundMatch = false;
        for (const key of keys) {
          if (!ops.matches(keyPattern, key)) continue;
          const value = mapValue(haystack, key);
          if (value !== undefined && value !== null && ops.matches(valuePattern, value)) {
            foundMatch = true;
            break;
          }
        }
        if (!foundMatch) return false;
      }
      return true;
    }
    case "Length": {
      const size = mapSize(haystack);
      return size !== undefined && pattern.length.contains(size);
    }
  }
};

/** The root path when the map pattern matches, else none. */
export const mapPatternPaths = (pattern: MapPattern, haystack: Cbor, ops: PatternOps): Path[] =>
  mapPatternMatches(pattern, haystack, ops) ? [[haystack]] : [];

/**
 * The paths and captures of the map pattern on the haystack. Every capture
 * inside a constraint is reported as `[map, key]` or `[map, value]`, the
 * entry that satisfied the constraint. A map that does not match yields no
 * paths but keeps the captures of the constraints satisfied before the one
 * that failed, as the reference reports them.
 */
export const mapPatternPathsWithCaptures = (
  pattern: MapPattern,
  haystack: Cbor,
  ops: PatternOps,
): [Path[], Map<string, Path[]>] => {
  if (!isMap(haystack)) return [[], new Map<string, Path[]>()];

  switch (pattern.variant) {
    case "Any":
    case "Length":
      return [mapPatternPaths(pattern, haystack, ops), new Map<string, Path[]>()];

    case "Constraints": {
      const keys = mapKeys(haystack);
      if (keys === undefined) return [[], new Map<string, Path[]>()];

      const captures = new Map<string, Path[]>();
      const add = (from: ReadonlyMap<string, readonly Path[]>, value: Cbor): void => {
        for (const [name, capturePaths] of from) {
          const existing = captures.get(name) ?? [];
          for (const _ of capturePaths) existing.push([haystack, value]);
          captures.set(name, existing);
        }
      };

      for (const [keyPattern, valuePattern] of pattern.constraints) {
        let satisfied = false;
        for (const key of keys) {
          const value = mapValue(haystack, key);
          if (value === undefined || value === null) continue;
          const keyResult = ops.pathsWithCaptures(keyPattern, key);
          if (keyResult.paths.length === 0) continue;
          const valueResult = ops.pathsWithCaptures(valuePattern, value);
          if (valueResult.paths.length === 0) continue;
          add(keyResult.captures, key);
          add(valueResult.captures, value);
          satisfied = true;
          break;
        }
        if (!satisfied) return [[], captures];
      }
      return [[[haystack]], captures];
    }
  }
};

/** `map`, `{k: v, …}` or `{{n,m}}`. */
export const mapPatternDisplay = (
  pattern: MapPattern,
  patternDisplay: (p: Pattern) => string,
): string => {
  switch (pattern.variant) {
    case "Any":
      return "map";
    case "Constraints":
      return `{${pattern.constraints.map(([k, v]) => `${patternDisplay(k)}: ${patternDisplay(v)}`).join(", ")}}`;
    case "Length":
      return `{${pattern.length.toString()}}`;
  }
};

/** Whether two map patterns are the same, comparing keys and values with `patternEquals`. */
export const mapPatternEquals = (
  a: MapPattern,
  b: MapPattern,
  patternEquals: (p1: Pattern, p2: Pattern) => boolean,
): boolean => {
  if (a.variant !== b.variant) return false;
  switch (a.variant) {
    case "Any":
      return true;
    case "Constraints": {
      const bConstraints = (b as typeof a).constraints;
      if (a.constraints.length !== bConstraints.length) return false;
      return a.constraints.every(
        ([k, v], i) => patternEquals(k, bConstraints[i][0]) && patternEquals(v, bConstraints[i][1]),
      );
    }
    case "Length":
      return a.length.equals((b as typeof a).length);
  }
};
