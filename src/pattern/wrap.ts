/**
 * The frozen `Pattern` wrappers around a value, structure or meta pattern.
 */
import type { Pattern } from "./index";
import type { ValuePattern } from "./value";
import type { StructurePattern } from "./structure";
import type { MetaPattern } from "./meta";

/** A frozen value pattern. */
export const valuePattern = (pattern: ValuePattern): Pattern =>
  Object.freeze({ kind: "Value", pattern: Object.freeze(pattern) });

/** A frozen structure pattern. */
export const structurePattern = (pattern: StructurePattern): Pattern =>
  Object.freeze({ kind: "Structure", pattern: Object.freeze(pattern) });

/** A frozen meta pattern. */
export const metaPattern = (pattern: MetaPattern): Pattern =>
  Object.freeze({ kind: "Meta", pattern: Object.freeze(pattern) });
