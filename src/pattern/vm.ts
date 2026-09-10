/**
 * A small back-tracking machine that walks a dCBOR tree under a compiled
 * pattern program, recording the paths it accepts and the captures along them.
 */
import type { Cbor } from "@blockchaincommons/dcbor";
import {
  bytesToHex,
  asTaggedValue,
  encodeCbor,
  isArray,
  isMap,
  isTagged,
  arrayLength,
  arrayItem,
  mapKeys,
  mapValues,
} from "@blockchaincommons/dcbor";
import type { Path } from "../format";
import type { MatchResult, Pattern } from "./index";
import type { PatternOps } from "./ops";
import type { Quantifier } from "../quantifier";
import { Reluctance } from "../reluctance";

/** How the machine descends from a node. */
export type Axis = "ArrayElement" | "MapKey" | "MapValue" | "TaggedContent";

/** The children of `cbor` along `axis`. */
export const axisChildren = (axis: Axis, cbor: Cbor): Cbor[] => {
  switch (axis) {
    case "ArrayElement": {
      if (!isArray(cbor)) return [];
      const len = arrayLength(cbor);
      if (len === undefined) return [];
      const children: Cbor[] = [];
      for (let i = 0; i < len; i++) {
        const item = arrayItem(cbor, i);
        if (item !== undefined) children.push(item);
      }
      return children;
    }
    case "MapKey":
      return isMap(cbor) ? (mapKeys(cbor) ?? []) : [];
    case "MapValue":
      return isMap(cbor) ? (mapValues(cbor) ?? []) : [];
    case "TaggedContent": {
      if (!isTagged(cbor)) return [];
      const content = asTaggedValue(cbor)?.[1];
      return content === undefined ? [] : [content];
    }
  }
};

/** One instruction of a compiled pattern. */
export type Instr =
  | {
      /** The discriminant: fails the thread unless the literal matches the current node. */
      type: "MatchPredicate";
      /** The index in `literals` of the pattern to test. */
      literalIndex: number;
    }
  | {
      /** The discriminant: matches a structure literal, continuing along each path it yields. */
      type: "MatchStructure";
      /** The index in `literals` of the structure pattern to match. */
      literalIndex: number;
    }
  | {
      /** The discriminant: continues at `a`, with a fallback thread at `b`. */
      type: "Split";
      /** The address the thread continues at. */
      a: number;
      /** The address the fallback thread starts at. */
      b: number;
    }
  | {
      /** The discriminant: continues at `address`. */
      type: "Jump";
      /** The address to continue at. */
      address: number;
    }
  | {
      /** The discriminant: continues once per child of the current node along `axis`. */
      type: "PushAxis";
      /** The axis to descend along. */
      axis: Axis;
    }
  | {
      /** The discriminant: returns to the parent node. */
      type: "Pop";
    }
  | {
      /** The discriminant: records the current path as a result and continues. */
      type: "Save";
    }
  | {
      /** The discriminant: records the current path as a result and ends the thread. */
      type: "Accept";
    }
  | {
      /** The discriminant: continues once per node below the current one that the pattern matches. */
      type: "Search";
      /** The index in `literals` of the pattern to search for. */
      patternIndex: number;
      /** The capture names the searched pattern uses, each with its index in `captureNames`. */
      captureMap: [string, number][];
    }
  | {
      /** The discriminant: sets aside the current path and starts a fresh one at the current node. */
      type: "ExtendSequence";
    }
  | {
      /** The discriminant: appends the current path to the one set aside. */
      type: "CombineSequence";
    }
  | {
      /** The discriminant: fails the thread when the pattern matches the current node. */
      type: "NotMatch";
      /** The index in `literals` of the pattern that must not match. */
      patternIndex: number;
    }
  | {
      /** The discriminant: continues once per repetition count the quantifier allows. */
      type: "Repeat";
      /** The index in `literals` of the repeated pattern. */
      patternIndex: number;
      /** How many repetitions are allowed, and how eagerly they are taken. */
      quantifier: Quantifier;
    }
  | {
      /** The discriminant: opens a capture at the current path. */
      type: "CaptureStart";
      /** The index in `captureNames` of the capture. */
      captureIndex: number;
    }
  | {
      /** The discriminant: closes a capture, recording the current path under it. */
      type: "CaptureEnd";
      /** The index in `captureNames` of the capture. */
      captureIndex: number;
    };

/** A compiled pattern: the code, the patterns it refers to, and the capture names. */
export interface Program {
  /** The instructions, executed from index 0. */
  code: Instr[];
  /** The patterns the instructions refer to by index. */
  literals: Pattern[];
  /** The capture names, in the order the instructions index them. */
  captureNames: string[];
}

interface Thread {
  pc: number;
  cbor: Cbor;
  path: Cbor[];
  savedPaths: Cbor[][];
  captures: Cbor[][][];
  captureStack: number[][];
}

const cborEquals = (a: Cbor, b: Cbor): boolean => {
  if (a === b) return true;
  const ad = encodeCbor(a);
  const bd = encodeCbor(b);
  if (ad.length !== bd.length) return false;
  for (let i = 0; i < ad.length; i++) if (ad[i] !== bd[i]) return false;
  return true;
};

const pathHash = (path: readonly Cbor[]): string =>
  path.map((item) => bytesToHex(encodeCbor(item))).join("|");

const fork = (th: Thread, pc: number, cbor: Cbor, path: Cbor[]): Thread => ({
  pc,
  cbor,
  path,
  savedPaths: th.savedPaths.map((p) => [...p]),
  captures: th.captures.map((c) => [...c]),
  captureStack: th.captureStack.map((s) => [...s]),
});

/** The paths of a pattern that never compiles to more than a predicate. */
export const atomicPaths = (pattern: Pattern, cbor: Cbor, ops: PatternOps): Path[] => {
  switch (pattern.kind) {
    case "Value":
    case "Structure":
      return ops.paths(pattern, cbor);
    case "Meta":
      if (pattern.pattern.type === "Any") return [[cbor]];
      throw new Error(`Non-atomic meta pattern used in MatchPredicate: ${pattern.pattern.type}`);
  }
};

/** Every state a repeat may leave the machine in, in the order the quantifier prefers. */
const repeatPaths = (
  pattern: Pattern,
  cbor: Cbor,
  path: Cbor[],
  quantifier: Quantifier,
  ops: PatternOps,
): { cbor: Cbor; path: Cbor[] }[] => {
  const states: { cbor: Cbor; path: Cbor[] }[][] = [[{ cbor, path: [...path] }]];
  const bound = quantifier.max ?? Number.MAX_SAFE_INTEGER;

  for (let rep = 0; rep < bound; rep++) {
    const next: { cbor: Cbor; path: Cbor[] }[] = [];
    for (const state of states[states.length - 1]) {
      for (const subPath of ops.paths(pattern, state.cbor)) {
        const last = subPath[subPath.length - 1];
        if (last === undefined) continue;
        if (cborEquals(last, state.cbor)) continue; // no progress
        const combined = [...state.path];
        const firstElement = subPath[0];
        const startIdx = firstElement !== undefined && cborEquals(firstElement, state.cbor) ? 1 : 0;
        for (let i = startIdx; i < subPath.length; i++) combined.push(subPath[i]);
        next.push({ cbor: last, path: combined });
      }
    }
    if (next.length === 0) break;
    states.push(next);
  }

  const hasZeroRep = quantifier.min === 0;
  const zeroRepResult = hasZeroRep ? [{ cbor, path: [...path] }] : [];
  const maxAllowed = Math.min(bound, states.length - 1);
  if (maxAllowed < quantifier.min && quantifier.min > 0) return [];

  const minCount = quantifier.min === 0 ? 1 : quantifier.min;
  if (maxAllowed < minCount) return zeroRepResult;
  const maxCount = maxAllowed;

  const reluctance = quantifier.reluctance;
  let counts: number[] = [];
  if (reluctance === Reluctance.Greedy) {
    for (let i = maxCount; i >= minCount; i--) counts.push(i);
  } else if (reluctance === Reluctance.Lazy) {
    for (let i = minCount; i <= maxCount; i++) counts.push(i);
  } else {
    counts = [maxCount];
  }

  const out: { cbor: Cbor; path: Cbor[] }[] = [];
  if (reluctance === Reluctance.Greedy) {
    for (const c of counts) out.push(...(states[c] ?? []));
    if (hasZeroRep && out.length === 0) out.push({ cbor, path: [...path] });
  } else {
    if (hasZeroRep) out.push({ cbor, path: [...path] });
    for (const c of counts) out.push(...(states[c] ?? []));
  }
  return out;
};

const runThread = (
  prog: Program,
  start: Thread,
  out: { path: Cbor[]; captures: Cbor[][][] }[],
  ops: PatternOps,
): void => {
  const stack: Thread[] = [start];

  while (stack.length > 0) {
    const th = stack.pop();
    if (th === undefined) break;

    threadLoop: while (true) {
      const instr = prog.code[th.pc];

      switch (instr.type) {
        case "MatchPredicate": {
          if (atomicPaths(prog.literals[instr.literalIndex], th.cbor, ops).length === 0) {
            break threadLoop;
          }
          th.pc += 1;
          break;
        }

        case "MatchStructure": {
          const pattern = prog.literals[instr.literalIndex];
          if (pattern.kind !== "Structure") {
            throw new Error("MatchStructure used with non-structure pattern");
          }
          const result = ops.pathsWithCaptures(pattern, th.cbor);
          if (result.paths.length === 0) break threadLoop;

          for (let i = 0; i < prog.captureNames.length; i++) {
            const capturedPaths = result.captures.get(prog.captureNames[i]);
            if (capturedPaths !== undefined) {
              while (th.captures.length <= i) th.captures.push([]);
              th.captures[i].push(...capturedPaths.map((p) => [...p]));
            }
          }

          if (result.paths.length === 1 && result.paths[0].length === 1) {
            th.pc += 1;
          } else {
            for (const structurePath of result.paths) {
              const target = structurePath[structurePath.length - 1];
              if (target !== undefined) {
                stack.push(fork(th, th.pc + 1, target, [...th.path, ...structurePath.slice(1)]));
              }
            }
            break threadLoop;
          }
          break;
        }

        case "Split": {
          stack.push(fork(th, instr.b, th.cbor, [...th.path]));
          th.pc = instr.a;
          break;
        }

        case "Jump": {
          th.pc = instr.address;
          break;
        }

        case "PushAxis": {
          // pushed in source order, so the stack pops them in reverse
          for (const child of axisChildren(instr.axis, th.cbor)) {
            stack.push(fork(th, th.pc + 1, child, [...th.path, child]));
          }
          break threadLoop;
        }

        case "Pop": {
          if (th.path.length === 0) break threadLoop;
          th.path.pop();
          const parent = th.path[th.path.length - 1];
          if (parent !== undefined) th.cbor = parent;
          th.pc += 1;
          break;
        }

        case "Save": {
          out.push({ path: [...th.path], captures: th.captures.map((c) => [...c]) });
          th.pc += 1;
          break;
        }

        case "Accept": {
          out.push({ path: [...th.path], captures: th.captures.map((c) => [...c]) });
          break threadLoop;
        }

        case "Search": {
          // the searched pattern is matched where the thread stands; its
          // paths and captures continue the thread
          const result = ops.pathsWithCaptures(prog.literals[instr.patternIndex], th.cbor);
          for (const searchPath of [...result.paths].reverse()) {
            const newThread = fork(th, th.pc + 1, th.cbor, [...searchPath]);
            for (const [name, captureIdx] of instr.captureMap) {
              if (captureIdx < newThread.captures.length) {
                const capturePaths = result.captures.get(name);
                if (capturePaths !== undefined) {
                  for (const capturePath of capturePaths) {
                    newThread.captures[captureIdx].push([...capturePath]);
                  }
                }
              }
            }
            stack.push(newThread);
          }
          break threadLoop;
        }

        case "ExtendSequence": {
          th.savedPaths.push([...th.path]);
          const last = th.path[th.path.length - 1];
          if (last !== undefined) {
            th.path = [last];
            th.cbor = last;
          }
          th.pc += 1;
          break;
        }

        case "CombineSequence": {
          const saved = th.savedPaths.pop();
          if (saved !== undefined) {
            const combined = [...saved];
            if (th.path.length > 1) combined.push(...th.path.slice(1));
            th.path = combined;
          }
          th.pc += 1;
          break;
        }

        case "NotMatch": {
          if (ops.paths(prog.literals[instr.patternIndex], th.cbor).length > 0) break threadLoop;
          th.pc += 1;
          break;
        }

        case "Repeat": {
          const results = repeatPaths(
            prog.literals[instr.patternIndex],
            th.cbor,
            th.path,
            instr.quantifier,
            ops,
          );
          for (const result of results) {
            stack.push(fork(th, th.pc + 1, result.cbor, result.path));
          }
          break threadLoop;
        }

        case "CaptureStart": {
          const idx = instr.captureIndex;
          while (th.captures.length <= idx) th.captures.push([]);
          while (th.captureStack.length <= idx) th.captureStack.push([]);
          th.captureStack[idx].push(th.path.length);
          th.pc += 1;
          break;
        }

        case "CaptureEnd": {
          const idx = instr.captureIndex;
          const captureStack = th.captureStack[idx];
          if (captureStack !== undefined && captureStack.length > 0) {
            captureStack.pop();
            th.captures[idx]?.push([...th.path]);
          }
          th.pc += 1;
          break;
        }
      }
    }
  }
};

/** Runs a program against a value: every accepted path and the captures, each reported once. */
export const run = (prog: Program, root: Cbor, ops: PatternOps): MatchResult => {
  const start: Thread = {
    pc: 0,
    cbor: root,
    path: [root],
    savedPaths: [],
    captures: prog.captureNames.map(() => []),
    captureStack: [],
  };

  const results: { path: Cbor[]; captures: Cbor[][][] }[] = [];
  runThread(prog, start, results, ops);

  const seenPaths = new Set<string>();
  const paths: Path[] = [];
  for (const result of results) {
    const hash = pathHash(result.path);
    if (!seenPaths.has(hash)) {
      seenPaths.add(hash);
      paths.push(result.path);
    }
  }

  const captures = new Map<string, Path[]>();
  for (let i = 0; i < prog.captureNames.length; i++) {
    const capturedPaths: Cbor[][] = [];
    for (const result of results) {
      const captureGroup = result.captures[i];
      if (captureGroup !== undefined) capturedPaths.push(...captureGroup);
    }
    if (capturedPaths.length > 0) {
      const seen = new Set<string>();
      const deduplicated: Path[] = [];
      for (const path of capturedPaths) {
        const hash = pathHash(path);
        if (!seen.has(hash)) {
          seen.add(hash);
          deduplicated.push(path);
        }
      }
      captures.set(prog.captureNames[i], deduplicated);
    }
  }

  return { paths, captures };
};
