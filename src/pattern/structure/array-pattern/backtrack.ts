/**
 * Backtracking over a sequence of patterns against array elements, with a
 * pluggable state: a plain yes/no, or the element-to-pattern assignments.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import type { Pattern } from "../../index";
import type { RepeatPattern } from "../../meta/repeat-pattern";
import { extractCaptureWithRepeat, calculateRepeatBounds, canRepeatMatch } from "./helpers";

/** What a backtracking search records as it advances and retreats. */
export interface BacktrackState<T> {
  /** Records that `patternIdx` consumed `elementIdx`; `false` refuses the step. */
  tryAdvance(patternIdx: number, elementIdx: number): boolean;
  /** Undoes the last recorded step. */
  backtrack(): void;
  /** Whether every pattern and every element has been consumed. */
  isSuccess(
    patternIdx: number,
    elementIdx: number,
    patternsLen: number,
    elementsLen: number,
  ): boolean;
  /** The result once `isSuccess` holds. */
  getResult(): T;
}

/** A state that only answers whether the sequence matches. */
export class BooleanBacktrackState implements BacktrackState<boolean> {
  tryAdvance(_patternIdx: number, _elementIdx: number): boolean {
    return true;
  }

  backtrack(): void {
    // nothing recorded
  }

  isSuccess(
    patternIdx: number,
    elementIdx: number,
    patternsLen: number,
    elementsLen: number,
  ): boolean {
    return patternIdx >= patternsLen && elementIdx >= elementsLen;
  }

  getResult(): boolean {
    return true;
  }
}

/** A state that records which element each pattern consumed. */
export class AssignmentBacktrackState implements BacktrackState<[number, number][]> {
  readonly assignments: [number, number][] = [];

  tryAdvance(patternIdx: number, elementIdx: number): boolean {
    this.assignments.push([patternIdx, elementIdx]);
    return true;
  }

  backtrack(): void {
    this.assignments.pop();
  }

  isSuccess(
    patternIdx: number,
    elementIdx: number,
    patternsLen: number,
    elementsLen: number,
  ): boolean {
    return patternIdx >= patternsLen && elementIdx >= elementsLen;
  }

  getResult(): [number, number][] {
    return this.assignments;
  }
}

/** Backtracking over patterns and elements with any `BacktrackState`. */
export class GenericBacktracker {
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

  /** Whether the patterns from `patternIdx` consume the elements from `elementIdx`. */
  backtrack<T>(state: BacktrackState<T>, patternIdx: number, elementIdx: number): boolean {
    if (state.isSuccess(patternIdx, elementIdx, this._patterns.length, this._arr.length)) {
      return true;
    }
    if (patternIdx >= this._patterns.length) return false;

    const currentPattern = this._patterns[patternIdx];

    if (currentPattern.kind === "Meta" && currentPattern.pattern.type === "Repeat") {
      return this.tryRepeatBacktrack(currentPattern.pattern.pattern, state, patternIdx, elementIdx);
    }

    if (currentPattern.kind === "Meta" && currentPattern.pattern.type === "Capture") {
      const repeatPattern = extractCaptureWithRepeat(currentPattern);
      if (repeatPattern !== undefined) {
        return this.tryRepeatBacktrack(repeatPattern, state, patternIdx, elementIdx);
      }
    }

    // any other pattern consumes exactly one element
    if (elementIdx < this._arr.length) {
      const element = this._arr[elementIdx];
      if (this._matchFn(currentPattern, element) && state.tryAdvance(patternIdx, elementIdx)) {
        if (this.backtrack(state, patternIdx + 1, elementIdx + 1)) return true;
        state.backtrack();
      }
    }
    return false;
  }

  private tryRepeatBacktrack<T>(
    repeatPattern: RepeatPattern,
    state: BacktrackState<T>,
    patternIdx: number,
    elementIdx: number,
  ): boolean {
    const [minCount, maxCount] = calculateRepeatBounds(
      repeatPattern.quantifier,
      elementIdx,
      this._arr.length,
    );

    // greedy: the most repetitions first
    for (let repCount = maxCount; repCount >= minCount; repCount--) {
      if (
        elementIdx + repCount > this._arr.length ||
        !canRepeatMatch(repeatPattern, this._arr, elementIdx, repCount, this._matchFn)
      ) {
        continue;
      }
      let advanced = 0;
      let canAdvance = true;
      for (let i = 0; i < repCount; i++) {
        if (!state.tryAdvance(patternIdx, elementIdx + i)) {
          for (let j = 0; j < advanced; j++) state.backtrack();
          canAdvance = false;
          break;
        }
        advanced++;
      }
      if (!canAdvance) continue;

      if (this.backtrack(state, patternIdx + 1, elementIdx + repCount)) return true;

      for (let i = 0; i < repCount; i++) state.backtrack();
    }
    return false;
  }
}
