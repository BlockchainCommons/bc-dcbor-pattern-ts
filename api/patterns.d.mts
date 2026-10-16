import { Path } from "./format.mjs";
import { $n as DatePattern, $t as taggedPatternWithRegex, An as valueKnownValue, Ar as numberPatternInfinity, At as notPattern, Bn as knownValuePatternMatches, Br as nullPattern, Bt as anyPatternDisplay, Cn as repeatRange, Cr as textPatternValue, Ct as SearchWithCaptures, Dn as valueByteString, Dr as numberPatternDisplay, Dt as capturePattern, En as valueBool, Er as numberPatternAny, Et as CapturePattern, Fn as valuePatternPaths, Fr as numberPatternNegInfinity, Ft as AndPattern, Gn as DigestPattern, Gr as boolPatternAny, Gt as structureMap, Hn as knownValuePatternPaths, Hr as nullPatternMatches, Ht as anyPatternPaths, In as valueText, Ir as numberPatternPaths, It as andPattern, Jn as digestPatternDisplay, Jr as boolPatternPaths, Jt as TaggedPattern, Kn as digestPatternAny, Kr as boolPatternDisplay, Kt as structurePatternDisplay, Ln as KnownValuePattern, Lr as numberPatternRange, Lt as andPatternDisplay, Mn as valueNumber, Mr as numberPatternLessThanOrEqual, Mt as OrPattern, Nn as valuePatternDisplay, Nr as numberPatternMatches, Nt as orPattern, On as valueDate, Or as numberPatternGreaterThan, Ot as capturePatternDisplay, Pn as valuePatternMatches, Pr as numberPatternNaN, Pt as orPatternDisplay, Qn as digestPatternValue, Qt as taggedPatternWithName, Rn as knownValuePatternAny, Rr as numberPatternValue, Rt as AnyPattern, Sn as repeatPatternDisplay, Sr as textPatternRegex, St as SearchPattern, Tn as ValuePattern, Tr as formatNumber, Tt as searchPatternDisplay, Un as knownValuePatternRegex, Ur as nullPatternPaths, Ut as StructurePattern, Vn as knownValuePatternNamed, Vr as nullPatternDisplay, Vt as anyPatternMatches, Wn as knownValuePatternValue, Wr as BoolPattern, Wt as structureArray, Xn as digestPatternPaths, Xt as taggedPatternDisplay, Yn as digestPatternMatches, Yr as boolPatternValue, Yt as taggedPatternAny, Zn as digestPatternPrefix, Zt as taggedPatternEquals, _n as RepeatPattern, _r as TextPattern, _t as sequencePattern, an as mapPatternWithConstraints, ar as datePatternPaths, bn as repeatOptional, br as textPatternMatches, bt as sequencePatternPaths, c as Instr, cn as mapPatternWithLengthRange, cr as datePatternStringValue, ct as metaAny, dn as arrayPatternDisplay, dr as byteStringPatternAny, dt as metaOr, en as taggedPatternWithTag, er as datePatternAny, fn as arrayPatternEquals, fr as byteStringPatternBinaryRegex, ft as metaPatternDisplay, gn as arrayPatternWithLengthRange, gr as byteStringPatternValue, gt as SequencePattern, hn as arrayPatternWithLengthInterval, hr as byteStringPatternPaths, ht as metaSequence, in as mapPatternEquals, ir as datePatternMatches, jn as valueNull, jr as numberPatternLessThan, jt as notPatternDisplay, kn as valueDigest, kr as numberPatternGreaterThanOrEqual, kt as NotPattern, l as Program, ln as ArrayPattern, lr as datePatternValue, lt as metaCapture, mn as arrayPatternWithLength, mr as byteStringPatternMatches, mt as metaSearch, n as Pattern, nn as mapPatternAny, nr as datePatternEarliest, on as mapPatternWithLength, or as datePatternRange, ot as MetaPattern, pn as arrayPatternWithElements, pr as byteStringPatternDisplay, pt as metaRepeat, qn as digestPatternBinaryRegex, qr as boolPatternMatches, qt as structureTagged, rn as mapPatternDisplay, rr as datePatternLatest, s as Axis, sn as mapPatternWithLengthInterval, sr as datePatternRegex, st as metaAnd, t as MatchResult, tn as MapPattern, tr as datePatternDisplay, u as patternEquals, un as arrayPatternAny, ur as ByteStringPattern, ut as metaNot, vn as repeatExact, vr as textPatternAny, vt as sequencePatternDisplay, wn as repeatZeroOrMore, wr as NumberPattern, wt as searchPattern, xn as repeatPattern, xr as textPatternPaths, xt as sequencePatternPatterns, yn as repeatOneOrMore, yr as textPatternDisplay, yt as sequencePatternMatches, zn as knownValuePatternDisplay, zr as NullPattern, zt as anyPattern } from "./index-B6Oi6MUV.mjs";
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