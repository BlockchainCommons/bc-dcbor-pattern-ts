/**
 * The regex dialect, as the reference's engine reads it: Unicode classes,
 * `.` and anchors under flags, stacked and swapped repetition, verbose mode,
 * escapes, loose property names, class set operations, and what the dialect
 * rejects. The corpus in `tests/corpus/regexes.ts` proves every case here
 * against the `regex` crate through the reference harness; this file keeps
 * the rules readable.
 */
import { describe, it, expect } from "vitest";
import { cbor } from "@blockchaincommons/dcbor";
import { matches, textRegex, byteStringRegex, tryParsePattern } from "../src";

const text = (source: string, subject: string): boolean =>
  matches(textRegex(source), cbor(subject));
const bytes = (source: string, hex: string): boolean =>
  matches(byteStringRegex(source), cbor(Uint8Array.from(Buffer.from(hex, "hex"))));
const accepted = (source: string): boolean => tryParsePattern(`/${source}/`).ok;
const acceptedBytes = (source: string): boolean => tryParsePattern(`h'/${source}/'`).ok;

describe("regex dialect", () => {
  it("has Unicode-aware \\w, \\d, \\s and \\b", () => {
    expect(text("\\w+", "é")).toBe(true);
    expect(text("^\\d$", "\u0663")).toBe(true);
    expect(text("\\bé", "é")).toBe(true);
    expect(text("^\\W$", "é")).toBe(false);
    expect(text("^\\s$", "\u0085")).toBe(true);
    expect(text("^\\s$", "\ufeff")).toBe(false);
    expect(text("\\b{start}a", "a")).toBe(true);
    expect(text("a\\b{end}", "ab")).toBe(false);
    expect(text("\\<a", "a")).toBe(true);
  });

  it("matches any code point but \\n with `.`, and anchors at \\n only under (?m)", () => {
    expect(text("^.$", "\r")).toBe(true);
    expect(text("^.$", "\u{1F600}")).toBe(true);
    expect(text("^.$", "\n")).toBe(false);
    expect(text("(?s)^.$", "\n")).toBe(true);
    expect(text("(?R)^.$", "\r")).toBe(false);
    expect(text("(?m)^b$", "a\nb")).toBe(true);
    expect(text("(?m)^b$", "a\rb")).toBe(false);
    expect(text("(?mR)^b$", "a\rb")).toBe(true);
  });

  it("reads stacked quantifiers as nested repetition and (?U) as the greed swap", () => {
    expect(accepted("a**")).toBe(true);
    expect(text("^a?+$", "aa")).toBe(true);
    expect(text("^a{2}{3}$", "aaaaaa")).toBe(true);
    expect(accepted("(?U)a+")).toBe(true);
    expect(text("^(?U)a+?$", "aaa")).toBe(true);
    expect(accepted("a{,3}")).toBe(false);
    expect(accepted("a{")).toBe(false);
    expect(accepted("{2}")).toBe(false);
  });

  it("scopes case-insensitivity like the reference", () => {
    expect(text("(?i)k", "\u212a")).toBe(true);
    expect(text("a(?i)b", "aB")).toBe(true);
    expect(text("a(?i)b", "AB")).toBe(false);
    expect(text("(?i:a)b", "Ab")).toBe(true);
    expect(text("(?i:a)b", "AB")).toBe(false);
    expect(text("(?i)^\\p{Lu}$", "a")).toBe(true);
  });

  it("accepts the reference's escapes and verbose mode", () => {
    expect(text("\\a", "\u0007")).toBe(true);
    expect(text("^\\U00000041$", "A")).toBe(true);
    expect(text("^\\x{1F600}$", "\u{1F600}")).toBe(true);
    expect(text("(?x) a  b # comment", "ab")).toBe(true);
    expect(text("^\\ $", " ")).toBe(true);
    expect(text("^}$", "}")).toBe(true);
    expect(text("^]$", "]")).toBe(true);
    expect(accepted("\\Z")).toBe(false);
    expect(accepted("\\e")).toBe(false);
    expect(accepted("\\0")).toBe(false);
  });

  it("resolves Unicode properties by their loose names", () => {
    expect(text("^\\pL$", "é")).toBe(true);
    expect(text("^\\p{greek}$", "\u03b1")).toBe(true);
    expect(text("^\\p{uppercase_letter}$", "A")).toBe(true);
    expect(text("^\\p{sc=Greek}$", "\u03b1")).toBe(true);
    expect(text("^\\p{sc!=Greek}$", "a")).toBe(true);
    expect(text("^\\p{any}$", "\n")).toBe(true);
    expect(text("^\\P{any}$", "a")).toBe(false);
    expect(text("^\\p{ascii}$", "a")).toBe(true);
    expect(accepted("\\p{Foo}")).toBe(false);
  });

  it("reads nested classes, set operations and POSIX classes", () => {
    expect(text("^[a-z&&[^aeiou]]$", "b")).toBe(true);
    expect(text("^[a-z&&[^aeiou]]$", "a")).toBe(false);
    expect(text("^[a-z--b]$", "b")).toBe(false);
    expect(text("^[\\w~~\\p{Greek}]$", "\u03b1")).toBe(false);
    expect(text("^[\\w~~\\p{Greek}]$", "a")).toBe(true);
    expect(text("^[[:^alpha:]]$", "1")).toBe(true);
    expect(text("^[]a]$", "]")).toBe(true);
    expect(text("^[a-]$", "-")).toBe(true);
    expect(text("[[:foo:]]", "hello")).toBe(true);
    expect(accepted("[z-a]")).toBe(false);
    expect(accepted("[a-\\d]")).toBe(false);
  });

  it("rejects lookaround, backreferences and the reference's nesting limit", () => {
    expect(accepted("(?=a)")).toBe(false);
    expect(accepted("(?<=a)b")).toBe(false);
    expect(accepted("(a)\\1")).toBe(false);
    expect(accepted("(?<n>a)\\k<n>")).toBe(false);
    expect(accepted("(".repeat(251) + "a" + ")".repeat(251))).toBe(false);
    expect(accepted("(".repeat(249) + "a" + ")".repeat(249))).toBe(true);
  });

  it("runs a byte regex in Unicode mode over the bytes", () => {
    expect(bytes("é", "c3a9")).toBe(true);
    expect(bytes("^.$", "c3a9")).toBe(true);
    expect(bytes("^.$", "ff")).toBe(false);
    expect(bytes("\\xff", "ff")).toBe(false);
    expect(bytes("\\xff", "c3bf")).toBe(true);
    expect(bytes("\\x{e9}", "c3a9")).toBe(true);
    expect(bytes("^\\W$", "ff")).toBe(false);
    expect(bytes("^\\p{any}$", "ff")).toBe(false);
    expect(bytes("A.*", "41ff41")).toBe(true);
  });

  it("runs a byte regex over raw bytes under a leading (?-u)", () => {
    expect(bytes("(?-u)\\xff", "ff")).toBe(true);
    expect(bytes("(?-u)^.+$", "41ff41")).toBe(true);
    expect(bytes("(?-u)^\\W$", "ff")).toBe(true);
    expect(bytes("(?-u)é", "c3a9")).toBe(true);
    expect(bytes("(?-u)é", "e9")).toBe(false);
    expect(acceptedBytes("(?-u)\\p{L}")).toBe(false);
    expect(acceptedBytes("a(?-u:\\xff)")).toBe(false);
  });

  it("keeps a text regex without Unicode mode to ASCII classes and whole characters", () => {
    expect(text("(?-u)é", "é")).toBe(true);
    expect(text("(?-u)^\\w$", "é")).toBe(false);
    expect(text("(?-u)^\\w$", "a")).toBe(true);
    expect(accepted("(?-u).")).toBe(false);
    expect(accepted("(?-u)[^a]")).toBe(false);
    expect(accepted("(?-u)\\xff")).toBe(false);
    expect(accepted("(?-u)[é]")).toBe(false);
  });
});
