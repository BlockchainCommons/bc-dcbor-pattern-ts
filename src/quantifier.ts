/**
 * `Quantifier`: how many times a pattern repeats (an `Interval`) and how
 * eagerly (a `Reluctance`), as `*`, `+?`, `{2,5}+` spell it.
 */
import { Interval } from "./interval";
import { type Reluctance, DEFAULT_RELUCTANCE, reluctanceSuffix } from "./reluctance";

const requireReluctance = (reluctance: Reluctance): void => {
  if (reluctance !== "greedy" && reluctance !== "lazy" && reluctance !== "possessive") {
    throw new RangeError("reluctance must be greedy, lazy or possessive");
  }
};

/**
 * How many times a pattern may or must match, with an interval and a reluctance.
 *
 * @example
 * ```ts
 * Quantifier.zeroOrMore();                   // *
 * Quantifier.oneOrMore(Reluctance.Lazy);     // +?
 * Quantifier.exactly(3);                     // {3}
 * Quantifier.between(2, 5, Reluctance.Possessive); // {2,5}+
 * ```
 */
export class Quantifier {
  private readonly _interval: Interval;
  private readonly _reluctance: Reluctance;

  /**
   * @param interval - How many times to match
   * @param reluctance - How eagerly (greedy by default)
   * @throws {RangeError} for a reluctance that is not one of the three
   */
  constructor(interval: Interval, reluctance: Reluctance = DEFAULT_RELUCTANCE) {
    if (!(interval instanceof Interval)) throw new RangeError("interval must be an Interval");
    requireReluctance(reluctance);
    this._interval = interval;
    this._reluctance = reluctance;
    Object.freeze(this);
  }

  /** `{min,max}` (unbounded without `max`) with the reluctance. */
  static from(min: number, max?: number, reluctance: Reluctance = DEFAULT_RELUCTANCE): Quantifier {
    return new Quantifier(new Interval(min, max), reluctance);
  }

  /** `{n}`. */
  static exactly(n: number, reluctance: Reluctance = DEFAULT_RELUCTANCE): Quantifier {
    return new Quantifier(Interval.exactly(n), reluctance);
  }

  /** `{n,}`. */
  static atLeast(n: number, reluctance: Reluctance = DEFAULT_RELUCTANCE): Quantifier {
    return new Quantifier(Interval.atLeast(n), reluctance);
  }

  /** `{0,n}`. */
  static atMost(n: number, reluctance: Reluctance = DEFAULT_RELUCTANCE): Quantifier {
    return new Quantifier(Interval.atMost(n), reluctance);
  }

  /** `{min,max}`. */
  static between(
    min: number,
    max: number,
    reluctance: Reluctance = DEFAULT_RELUCTANCE,
  ): Quantifier {
    return new Quantifier(new Interval(min, max), reluctance);
  }

  /** `*`. */
  static zeroOrMore(reluctance: Reluctance = DEFAULT_RELUCTANCE): Quantifier {
    return new Quantifier(Interval.zeroOrMore(), reluctance);
  }

  /** `+`. */
  static oneOrMore(reluctance: Reluctance = DEFAULT_RELUCTANCE): Quantifier {
    return new Quantifier(Interval.oneOrMore(), reluctance);
  }

  /** `?`. */
  static zeroOrOne(reluctance: Reluctance = DEFAULT_RELUCTANCE): Quantifier {
    return new Quantifier(Interval.zeroOrOne(), reluctance);
  }

  /** The least number of repetitions. */
  get min(): number {
    return this._interval.min;
  }

  /** The most repetitions, or `undefined` when unbounded. */
  get max(): number | undefined {
    return this._interval.max;
  }

  /** The interval. */
  get interval(): Interval {
    return this._interval;
  }

  /** How eagerly the pattern repeats. */
  get reluctance(): Reluctance {
    return this._reluctance;
  }

  /** Whether there is no maximum. */
  get isUnbounded(): boolean {
    return this._interval.isUnbounded;
  }

  /** Whether `count` repetitions are allowed. */
  contains(count: number): boolean {
    return this._interval.contains(count);
  }

  /** The shorthand notation with the reluctance suffix: `*`, `+?`, `{1,5}+`. */
  toString(): string {
    return `${this._interval.shorthandNotation()}${reluctanceSuffix(this._reluctance)}`;
  }

  /** Whether the interval and the reluctance are the same. */
  equals(other: Quantifier): boolean {
    return this._interval.equals(other._interval) && this._reluctance === other._reluctance;
  }
}

/** Exactly one, greedy. */
export const DEFAULT_QUANTIFIER: Quantifier = Quantifier.exactly(1);
