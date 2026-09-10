/**
 * Assigns array elements to the patterns of a sequence: a plain match, or
 * the element-to-pattern pairs.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Pattern } from "../../index";
import { hasRepeatPatternsInSlice } from "./helpers";
import { GenericBacktracker, BooleanBacktrackState, AssignmentBacktrackState } from "./backtrack";

/** Maps the elements of an array onto the patterns of a sequence. */
export class SequenceAssigner {
  private readonly _patterns: readonly Pattern[];
  private readonly _arr: readonly Cbor[];
  private readonly _matchFn: (pattern: Pattern, value: Cbor) => boolean;

  constructor(
    patterns: readonly Pattern[],
    arr: readonly Cbor[],
    matchFn: (pattern: Pattern, value: Cbor) => boolean,
  ) {
    this._patterns = patterns;
    this._arr = arr;
    this._matchFn = matchFn;
  }

  /** Whether the sequence consumes the whole array. */
  canMatch(): boolean {
    if (this._patterns.length === 0) return this._arr.length === 0;

    if (this._patterns.length === this._arr.length && !hasRepeatPatternsInSlice(this._patterns)) {
      return this._patterns.every((pattern, i) => this._matchFn(pattern, this._arr[i]));
    }

    const backtracker = new GenericBacktracker(this._patterns, this._arr, this._matchFn);
    return backtracker.backtrack(new BooleanBacktrackState(), 0, 0);
  }

  /** The `[patternIndex, elementIndex]` pairs of a match, or `undefined`. */
  findAssignments(): [number, number][] | undefined {
    if (this._patterns.length === 0) return this._arr.length === 0 ? [] : undefined;

    if (this._patterns.length === this._arr.length && !hasRepeatPatternsInSlice(this._patterns)) {
      const assignments: [number, number][] = [];
      for (let patternIdx = 0; patternIdx < this._patterns.length; patternIdx++) {
        if (!this._matchFn(this._patterns[patternIdx], this._arr[patternIdx])) return undefined;
        assignments.push([patternIdx, patternIdx]);
      }
      return assignments;
    }

    const backtracker = new GenericBacktracker(this._patterns, this._arr, this._matchFn);
    const state = new AssignmentBacktrackState();
    return backtracker.backtrack(state, 0, 0) ? state.assignments : undefined;
  }
}
