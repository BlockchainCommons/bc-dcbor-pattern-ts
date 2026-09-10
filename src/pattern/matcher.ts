/**
 * Compiles a pattern into a program for the back-tracking machine.
 */
import type { Instr, Program } from "./vm";
import type { Pattern } from "./index";
import type { StructurePattern } from "./structure";
import type { MetaPattern } from "./meta";

/** Compiles a pattern into a program ending in `Accept`. */
export const compilePattern = (pattern: Pattern): Program => {
  const code: Instr[] = [];
  const literals: Pattern[] = [];
  const captureNames: string[] = [];
  collectPatternCaptureNames(pattern, captureNames);
  compilePatternToCode(pattern, code, literals, captureNames);
  code.push({ type: "Accept" });
  return { code, literals, captureNames };
};

/** Appends every capture name in the pattern to `names`, once each, in first-seen order. */
export const collectPatternCaptureNames = (pattern: Pattern, names: string[]): void => {
  switch (pattern.kind) {
    case "Value":
      break;
    case "Structure":
      collectStructurePatternCaptureNames(pattern.pattern, names);
      break;
    case "Meta":
      collectMetaPatternCaptureNames(pattern.pattern, names);
      break;
  }
};

const collectStructurePatternCaptureNames = (pattern: StructurePattern, names: string[]): void => {
  switch (pattern.type) {
    case "Array":
      if (pattern.pattern.variant === "Elements") {
        collectPatternCaptureNames(pattern.pattern.pattern, names);
      }
      break;
    case "Map":
      if (pattern.pattern.variant === "Constraints") {
        for (const [key, value] of pattern.pattern.constraints) {
          collectPatternCaptureNames(key, names);
          collectPatternCaptureNames(value, names);
        }
      }
      break;
    case "Tagged":
      if (pattern.pattern.variant !== "Any") {
        collectPatternCaptureNames(pattern.pattern.pattern, names);
      }
      break;
  }
};

const collectMetaPatternCaptureNames = (pattern: MetaPattern, names: string[]): void => {
  switch (pattern.type) {
    case "Capture":
      if (!names.includes(pattern.pattern.name)) names.push(pattern.pattern.name);
      collectPatternCaptureNames(pattern.pattern.pattern, names);
      break;
    case "And":
    case "Or":
    case "Sequence":
      for (const p of pattern.pattern.patterns) collectPatternCaptureNames(p, names);
      break;
    case "Not":
    case "Repeat":
    case "Search":
      collectPatternCaptureNames(pattern.pattern.pattern, names);
      break;
    case "Any":
      break;
  }
};

const compilePatternToCode = (
  pattern: Pattern,
  code: Instr[],
  literals: Pattern[],
  captureNames: string[],
): void => {
  switch (pattern.kind) {
    case "Value":
      literals.push(pattern);
      code.push({ type: "MatchPredicate", literalIndex: literals.length - 1 });
      break;
    case "Structure":
      // An array whose element pattern captures descends into each element
      // so every capture is recorded separately; a capturing sequence is
      // matched element-wise by the array matcher instead.
      if (pattern.pattern.type === "Array" && pattern.pattern.pattern.variant === "Elements") {
        const innerElement = pattern.pattern.pattern.pattern;
        const innerCaptures: string[] = [];
        collectPatternCaptureNames(innerElement, innerCaptures);
        const isSequenceInner =
          innerElement.kind === "Meta" && innerElement.pattern.type === "Sequence";
        if (innerCaptures.length > 0 && !isSequenceInner) {
          literals.push({
            kind: "Structure",
            pattern: { type: "Array", pattern: { variant: "Any" } },
          });
          code.push({ type: "MatchStructure", literalIndex: literals.length - 1 });
          code.push({ type: "PushAxis", axis: "ArrayElement" });
          compilePatternToCode(innerElement, code, literals, captureNames);
          code.push({ type: "Pop" });
          break;
        }
      }
      literals.push(pattern);
      code.push({ type: "MatchStructure", literalIndex: literals.length - 1 });
      break;
    case "Meta":
      compileMetaPattern(pattern.pattern, code, literals, captureNames);
      break;
  }
};

const compileMetaPattern = (
  pattern: MetaPattern,
  code: Instr[],
  literals: Pattern[],
  captureNames: string[],
): void => {
  switch (pattern.type) {
    case "Any":
      code.push({ type: "Save" });
      break;

    case "And":
      for (const p of pattern.pattern.patterns)
        compilePatternToCode(p, code, literals, captureNames);
      break;

    case "Or": {
      const patterns = pattern.pattern.patterns;
      if (patterns.length === 0) break;
      if (patterns.length === 1) {
        compilePatternToCode(patterns[0], code, literals, captureNames);
        break;
      }
      const jumpAddrs: number[] = [];
      for (let i = 0; i < patterns.length - 1; i++) {
        const split: Instr = { type: "Split", a: 0, b: 0 };
        code.push(split);
        split.a = code.length;
        compilePatternToCode(patterns[i], code, literals, captureNames);
        jumpAddrs.push(code.length);
        code.push({ type: "Jump", address: 0 });
        split.b = code.length;
      }
      compilePatternToCode(patterns[patterns.length - 1], code, literals, captureNames);
      const endAddr = code.length;
      for (const addr of jumpAddrs) (code[addr] as { address: number }).address = endAddr;
      break;
    }

    case "Not":
      literals.push(pattern.pattern.pattern);
      code.push({ type: "NotMatch", patternIndex: literals.length - 1 });
      break;

    case "Repeat":
      literals.push(pattern.pattern.pattern);
      code.push({
        type: "Repeat",
        patternIndex: literals.length - 1,
        quantifier: pattern.pattern.quantifier,
      });
      break;

    case "Capture": {
      const captureIndex = captureNames.indexOf(pattern.pattern.name);
      code.push({ type: "CaptureStart", captureIndex });
      compilePatternToCode(pattern.pattern.pattern, code, literals, captureNames);
      code.push({ type: "CaptureEnd", captureIndex });
      break;
    }

    case "Search": {
      const captureMap: [string, number][] = [];
      const innerNames: string[] = [];
      collectPatternCaptureNames(pattern.pattern.pattern, innerNames);
      for (const name of innerNames) {
        const idx = captureNames.indexOf(name);
        if (idx >= 0) captureMap.push([name, idx]);
      }
      literals.push(pattern.pattern.pattern);
      code.push({ type: "Search", patternIndex: literals.length - 1, captureMap });
      break;
    }

    case "Sequence": {
      const patterns = pattern.pattern.patterns;
      if (patterns.length === 0) break;
      compilePatternToCode(patterns[0], code, literals, captureNames);
      for (let i = 1; i < patterns.length; i++) {
        code.push({ type: "ExtendSequence" });
        compilePatternToCode(patterns[i], code, literals, captureNames);
        code.push({ type: "CombineSequence" });
      }
      break;
    }
  }
};
