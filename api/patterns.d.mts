import { $n as digestPatternPrefix, $t as taggedPatternEquals, An as valueDate, Ar as numberPatternGreaterThan, At as NotPattern, Bn as knownValuePatternAny, Br as numberPatternValue, Bt as anyPattern, Cn as repeatPattern, Cr as textPatternPaths, Ct as SearchPattern, Dn as ValuePattern, Dr as formatNumber, Dt as CapturePattern, En as repeatZeroOrMore, Er as NumberPattern, Et as searchPatternDisplay, Fn as valuePatternDisplay, Fr as numberPatternMatches, Ft as orPatternDisplay, Gn as knownValuePatternRegex, Gr as nullPatternPaths, Gt as index_d_exports, Hn as knownValuePatternMatches, Hr as nullPattern, Ht as anyPatternMatches, In as valuePatternMatches, Ir as numberPatternNaN, It as AndPattern, Jn as digestPatternAny, Jr as boolPatternDisplay, Jt as structurePatternDisplay, Kn as knownValuePatternValue, Kr as BoolPattern, Kt as structureArray, Ln as valuePatternPaths, Lr as numberPatternNegInfinity, Lt as andPattern, Mn as valueKnownValue, Mr as numberPatternInfinity, Mt as notPatternDisplay, Nn as valueNull, Nr as numberPatternLessThan, Nt as OrPattern, On as valueBool, Or as numberPatternAny, Ot as capturePattern, Pn as valueNumber, Pr as numberPatternLessThanOrEqual, Pt as orPattern, Qn as digestPatternPaths, Qt as taggedPatternDisplay, Rn as valueText, Rr as numberPatternPaths, Rt as andPatternDisplay, Sn as repeatOptional, Sr as textPatternMatches, St as sequencePatternPatterns, Tn as repeatRange, Tr as textPatternValue, Tt as searchPattern, Un as knownValuePatternNamed, Ur as nullPatternDisplay, Ut as anyPatternPaths, Vn as knownValuePatternDisplay, Vr as NullPattern, Vt as anyPatternDisplay, Wn as knownValuePatternPaths, Wr as nullPatternMatches, Wt as StructurePattern, Xn as digestPatternDisplay, Xr as boolPatternPaths, Xt as TaggedPattern, Yn as digestPatternBinaryRegex, Yr as boolPatternMatches, Yt as structureTagged, Zn as digestPatternMatches, Zr as boolPatternValue, Zt as taggedPatternAny, _n as arrayPatternWithLengthInterval, _r as byteStringPatternPaths, _t as SequencePattern, an as mapPatternDisplay, ar as datePatternLatest, bn as repeatExact, br as textPatternAny, bt as sequencePatternMatches, c as Instr, cn as mapPatternWithLength, cr as datePatternRange, ct as metaAnd, dn as ArrayPattern, dr as datePatternValue, dt as metaNot, en as taggedPatternWithName, er as digestPatternValue, fn as arrayPatternAny, fr as ByteStringPattern, ft as metaOr, gn as arrayPatternWithLength, gr as byteStringPatternMatches, gt as metaSequence, hn as arrayPatternWithElements, hr as byteStringPatternDisplay, ht as metaSearch, in as mapPatternAny, ir as datePatternEarliest, jn as valueDigest, jr as numberPatternGreaterThanOrEqual, jt as notPattern, kn as valueByteString, kr as numberPatternDisplay, kt as capturePatternDisplay, l as Program, ln as mapPatternWithLengthInterval, lr as datePatternRegex, lt as metaAny, mn as arrayPatternEquals, mr as byteStringPatternBinaryRegex, mt as metaRepeat, n as Pattern, nn as taggedPatternWithTag, nr as datePatternAny, on as mapPatternEquals, or as datePatternMatches, ot as MetaPattern, pn as arrayPatternDisplay, pr as byteStringPatternAny, pt as metaPatternDisplay, qn as DigestPattern, qr as boolPatternAny, qt as structureMap, rn as MapPattern, rr as datePatternDisplay, s as Axis, sn as mapPatternWithConstraints, sr as datePatternPaths, st as index_d_exports$1, t as MatchResult, tn as taggedPatternWithRegex, tr as DatePattern, u as patternEquals, un as mapPatternWithLengthRange, ur as datePatternStringValue, ut as metaCapture, vn as arrayPatternWithLengthRange, vr as byteStringPatternValue, vt as sequencePattern, wn as repeatPatternDisplay, wr as textPatternRegex, wt as SearchWithCaptures, xn as repeatOneOrMore, xr as textPatternDisplay, xt as sequencePatternPaths, yn as RepeatPattern, yr as TextPattern, yt as sequencePatternDisplay, zn as KnownValuePattern, zr as numberPatternRange, zt as AnyPattern } from "./index-DV_TAMcn.mjs";
import { Path } from "./format.mjs";
import { Cbor } from "@blockchaincommons/dcbor";
//#region src/pattern/matcher.d.ts
/** Compiles a pattern into a program ending in `Accept`. */
export declare const compilePattern: (pattern: Pattern) => Program;
/** Appends every capture name in the pattern to `names`, once each, in first-seen order. */
export declare const collectPatternCaptureNames: (pattern: Pattern, names: string[]) => void;
//#endregion
//#region src/patterns.d.ts
/** Whether an array pattern matches. */
export declare const arrayPatternMatches: (pattern: ArrayPattern, haystack: Cbor) => boolean;
/** The paths an array pattern matches. */
export declare const arrayPatternPaths: (pattern: ArrayPattern, haystack: Cbor) => Path[];
/** The paths and captures of an array pattern. */
export declare const arrayPatternPathsWithCaptures: (pattern: ArrayPattern, haystack: Cbor) => [Path[], Map<string, Path[]>];
/** Whether a map pattern matches. */
export declare const mapPatternMatches: (pattern: MapPattern, haystack: Cbor) => boolean;
/** The paths a map pattern matches. */
export declare const mapPatternPaths: (pattern: MapPattern, haystack: Cbor) => Path[];
/** The paths and captures of a map pattern. */
export declare const mapPatternPathsWithCaptures: (pattern: MapPattern, haystack: Cbor) => [Path[], Map<string, Path[]>];
/** Whether a tagged pattern matches. */
export declare const taggedPatternMatches: (pattern: TaggedPattern, haystack: Cbor) => boolean;
/** The paths a tagged pattern matches. */
export declare const taggedPatternPaths: (pattern: TaggedPattern, haystack: Cbor) => Path[];
/** The paths and captures of a tagged pattern. */
export declare const taggedPatternPathsWithCaptures: (pattern: TaggedPattern, haystack: Cbor) => [Path[], Map<string, Path[]>];
/** The paths a structure pattern matches. */
export declare const structurePatternPaths: (pattern: StructurePattern, haystack: Cbor) => Path[];
/** Whether a structure pattern matches. */
export declare const structurePatternMatches: (pattern: StructurePattern, haystack: Cbor) => boolean;
/** The paths and captures of a structure pattern. */
export declare const structurePatternPathsWithCaptures: (pattern: StructurePattern, haystack: Cbor) => [Path[], Map<string, Path[]>];
/** Whether an `and` pattern matches. */
export declare const andPatternMatches: (pattern: AndPattern, haystack: Cbor) => boolean;
/** The paths an `and` pattern matches. */
export declare const andPatternPaths: (pattern: AndPattern, haystack: Cbor) => Path[];
/** Whether an `or` pattern matches. */
export declare const orPatternMatches: (pattern: OrPattern, haystack: Cbor) => boolean;
/** The paths an `or` pattern matches. */
export declare const orPatternPaths: (pattern: OrPattern, haystack: Cbor) => Path[];
/** Whether a `not` pattern matches. */
export declare const notPatternMatches: (pattern: NotPattern, haystack: Cbor) => boolean;
/** The paths a `not` pattern matches. */
export declare const notPatternPaths: (pattern: NotPattern, haystack: Cbor) => Path[];
/** Whether a repeat pattern matches. */
export declare const repeatPatternMatches: (pattern: RepeatPattern, haystack: Cbor) => boolean;
/** The paths a repeat pattern matches. */
export declare const repeatPatternPaths: (pattern: RepeatPattern, haystack: Cbor) => Path[];
/** Whether a capture pattern matches. */
export declare const capturePatternMatches: (pattern: CapturePattern, haystack: Cbor) => boolean;
/** The paths a capture pattern matches. */
export declare const capturePatternPaths: (pattern: CapturePattern, haystack: Cbor) => Path[];
/** Whether a search pattern matches. */
export declare const searchPatternMatches: (pattern: SearchPattern, haystack: Cbor) => boolean;
/** The paths a search pattern matches. */
export declare const searchPatternPaths: (pattern: SearchPattern, haystack: Cbor) => Path[];
/** The paths and captures of a search pattern. */
export declare const searchPatternPathsWithCaptures: (pattern: SearchPattern, haystack: Cbor) => SearchWithCaptures;
/** The paths a meta pattern matches. */
export declare const metaPatternPaths: (pattern: MetaPattern, haystack: Cbor) => Path[];
/** Whether a meta pattern matches. */
export declare const metaPatternMatches: (pattern: MetaPattern, haystack: Cbor) => boolean;
//#endregion
export { type AndPattern, type AnyPattern, type ArrayPattern, type Axis, BoolPattern, ByteStringPattern, type CapturePattern, DatePattern, DigestPattern, type Instr, KnownValuePattern, type MapPattern, type MatchResult, type MetaPattern, type NotPattern, NullPattern, NumberPattern, type OrPattern, type Program, type RepeatPattern, type SearchPattern, type SearchWithCaptures, type SequencePattern, type StructurePattern, type TaggedPattern, TextPattern, ValuePattern, andPattern, andPatternDisplay, anyPattern, anyPatternDisplay, anyPatternMatches, anyPatternPaths, arrayPatternAny, arrayPatternDisplay, arrayPatternEquals, arrayPatternWithElements, arrayPatternWithLength, arrayPatternWithLengthInterval, arrayPatternWithLengthRange, boolPatternAny, boolPatternDisplay, boolPatternMatches, boolPatternPaths, boolPatternValue, byteStringPatternAny, byteStringPatternBinaryRegex, byteStringPatternDisplay, byteStringPatternMatches, byteStringPatternPaths, byteStringPatternValue, capturePattern, capturePatternDisplay, datePatternAny, datePatternDisplay, datePatternEarliest, datePatternLatest, datePatternMatches, datePatternPaths, datePatternRange, datePatternRegex, datePatternStringValue, datePatternValue, digestPatternAny, digestPatternBinaryRegex, digestPatternDisplay, digestPatternMatches, digestPatternPaths, digestPatternPrefix, digestPatternValue, formatNumber, knownValuePatternAny, knownValuePatternDisplay, knownValuePatternMatches, knownValuePatternNamed, knownValuePatternPaths, knownValuePatternRegex, knownValuePatternValue, mapPatternAny, mapPatternDisplay, mapPatternEquals, mapPatternWithConstraints, mapPatternWithLength, mapPatternWithLengthInterval, mapPatternWithLengthRange, metaAnd, metaAny, metaCapture, metaNot, metaOr, metaPatternDisplay, metaRepeat, metaSearch, metaSequence, notPattern, notPatternDisplay, nullPattern, nullPatternDisplay, nullPatternMatches, nullPatternPaths, numberPatternAny, numberPatternDisplay, numberPatternGreaterThan, numberPatternGreaterThanOrEqual, numberPatternInfinity, numberPatternLessThan, numberPatternLessThanOrEqual, numberPatternMatches, numberPatternNaN, numberPatternNegInfinity, numberPatternPaths, numberPatternRange, numberPatternValue, orPattern, orPatternDisplay, patternEquals, repeatExact, repeatOneOrMore, repeatOptional, repeatPattern, repeatPatternDisplay, repeatRange, repeatZeroOrMore, searchPattern, searchPatternDisplay, sequencePattern, sequencePatternDisplay, sequencePatternMatches, sequencePatternPaths, sequencePatternPatterns, structureArray, structureMap, structurePatternDisplay, structureTagged, taggedPatternAny, taggedPatternDisplay, taggedPatternEquals, taggedPatternWithName, taggedPatternWithRegex, taggedPatternWithTag, textPatternAny, textPatternDisplay, textPatternMatches, textPatternPaths, textPatternRegex, textPatternValue, valueBool, valueByteString, valueDate, valueDigest, valueKnownValue, valueNull, valueNumber, valuePatternDisplay, valuePatternMatches, valuePatternPaths, valueText };
//# sourceMappingURL=patterns.d.mts.map