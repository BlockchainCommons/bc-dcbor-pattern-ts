/**
 * `Interval`: how many of something, from a minimum to an optional maximum,
 * as `{n}`, `{n,m}` and `{n,}` spell it.
 */

const requireCount = (name: string, n: number): void => {
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
};

/**
 * An inclusive interval with a minimum and an optional maximum; without a
 * maximum it is unbounded above.
 *
 * @example
 * ```ts
 * Interval.exactly(3);   // {3}
 * Interval.from(1, 5);   // {1,5}
 * Interval.atLeast(2);   // {2,}
 * ```
 */
export class Interval {
  private readonly _min: number;
  private readonly _max: number | undefined;

  /**
   * @param min - The minimum (inclusive), a non-negative integer
   * @param max - The maximum (inclusive), a non-negative integer not below `min`, or `undefined` for unbounded
   * @throws {RangeError} for a bound that is not a non-negative integer, or a maximum below the minimum
   */
  constructor(min: number, max?: number) {
    requireCount("min", min);
    if (max !== undefined) {
      requireCount("max", max);
      if (max < min) throw new RangeError("max must not be below min");
    }
    this._min = min;
    this._max = max;
    Object.freeze(this);
  }

  /** `{start,end}`, or `{start,}` without `end`. */
  static from(start: number, end?: number): Interval {
    return new Interval(start, end);
  }

  /** `{n}`. */
  static exactly(n: number): Interval {
    return new Interval(n, n);
  }

  /** `{n,}`. */
  static atLeast(n: number): Interval {
    return new Interval(n, undefined);
  }

  /** `{0,n}`. */
  static atMost(n: number): Interval {
    return new Interval(0, n);
  }

  /** `{0,}`, as `*` reads. */
  static zeroOrMore(): Interval {
    return new Interval(0, undefined);
  }

  /** `{1,}`, as `+` reads. */
  static oneOrMore(): Interval {
    return new Interval(1, undefined);
  }

  /** `{0,1}`, as `?` reads. */
  static zeroOrOne(): Interval {
    return new Interval(0, 1);
  }

  /** The minimum. */
  get min(): number {
    return this._min;
  }

  /** The maximum, or `undefined` when unbounded. */
  get max(): number | undefined {
    return this._max;
  }

  /** Whether the minimum equals the maximum. */
  get isSingle(): boolean {
    return this._max !== undefined && this._min === this._max;
  }

  /** Whether there is no maximum. */
  get isUnbounded(): boolean {
    return this._max === undefined;
  }

  /** Whether `count` lies in the interval. */
  contains(count: number): boolean {
    return count >= this._min && (this._max === undefined || count <= this._max);
  }

  /** `{n}`, `{n,m}` or `{n,}`. */
  rangeNotation(): string {
    if (this._max !== undefined && this._min === this._max) return `{${this._min}}`;
    if (this._max !== undefined) return `{${this._min},${this._max}}`;
    return `{${this._min},}`;
  }

  /** `?`, `*`, `+` where one applies, else the range notation. */
  shorthandNotation(): string {
    if (this._min === 0 && this._max === 1) return "?";
    if (this._max !== undefined && this._min === this._max) return `{${this._min}}`;
    if (this._max !== undefined) return `{${this._min},${this._max}}`;
    if (this._min === 0) return "*";
    if (this._min === 1) return "+";
    return `{${this._min},}`;
  }

  /** The range notation. */
  toString(): string {
    return this.rangeNotation();
  }

  /** Whether both bounds are the same. */
  equals(other: Interval): boolean {
    return this._min === other._min && this._max === other._max;
  }
}

/** Exactly one. */
export const DEFAULT_INTERVAL: Interval = Interval.exactly(1);
