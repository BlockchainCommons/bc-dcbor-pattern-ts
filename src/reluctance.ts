/**
 * Reluctance for quantifiers: how greedily a quantified pattern consumes
 * input.
 *
 * Controls how a quantified pattern matches:
 * - `Greedy`: Match as many as possible, backtrack if needed
 * - `Lazy`: Match as few as possible, add more if needed
 * - `Possessive`: Match as many as possible, never backtrack
 */
export const Reluctance = {
  /**
   * Grabs as many repetitions as possible, then backtracks if the rest of
   * the pattern cannot match.
   */
  Greedy: "greedy",

  /**
   * Starts with as few repetitions as possible, adding more only if the rest
   * of the pattern cannot match.
   */
  Lazy: "lazy",

  /**
   * Grabs as many repetitions as possible and never backtracks; if the rest
   * of the pattern cannot match, the whole match fails.
   */
  Possessive: "possessive",
} as const;
/** One of the `Reluctance` values. */
export type Reluctance = (typeof Reluctance)[keyof typeof Reluctance];

/** The reluctance a quantifier has when none is written: `Greedy`. */
export const DEFAULT_RELUCTANCE: Reluctance = Reluctance.Greedy;

/**
 * The quantifier suffix for a reluctance: `""` for Greedy, `"?"` for Lazy,
 * `"+"` for Possessive.
 *
 * ```typescript
 * reluctanceSuffix(Reluctance.Greedy)     // ""
 * reluctanceSuffix(Reluctance.Lazy)       // "?"
 * reluctanceSuffix(Reluctance.Possessive) // "+"
 * ```
 */
export const reluctanceSuffix = (reluctance: Reluctance): string => {
  switch (reluctance) {
    case Reluctance.Greedy:
      return "";
    case Reluctance.Lazy:
      return "?";
    case Reluctance.Possessive:
      return "+";
  }
};
