//! Replays tests/vectors/vectors.json against dcbor-pattern 0.11.1.
//!
//!   cargo run --release -- ../vectors/vectors.json
use dcbor::prelude::*;
use dcbor_pattern::{format_paths_with_captures, FormatPathsOpts, Matcher, Path, PathElementFormat, Pattern, Error};
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Deserialize)]
struct File { count: usize, vectors: Vec<Vector> }
#[derive(Deserialize)]
struct Vector { name: String, recipe: serde_json::Value, expect: String }

fn cu(src: &str, byte: usize) -> usize {
    let b = byte.min(src.len());
    let mut i = b;
    while i > 0 && !src.is_char_boundary(i) { i -= 1; }
    src[..i].encode_utf16().count() + (b - i)
}
fn span(src: &str, s: &std::ops::Range<usize>) -> String { format!("@{}-{}", cu(src, s.start), cu(src, s.end)) }
fn variant_name(e: &Error) -> String {
    let d = format!("{e:?}");
    d.split(|c| c == '(' || c == ' ').next().unwrap_or(&d).to_string()
}
fn describe(src: &str, e: &Error) -> String {
    let name = variant_name(e);
    match e {
        Error::UnexpectedToken(t, s) => {
            let td = format!("{t:?}");
            let tn = td.split(|c| c == '(' || c == ' ' || c == '{').next().unwrap_or(&td).to_string();
            format!("UnexpectedToken({}){}", tn, span(src, s))
        }
        Error::EmptyInput | Error::UnexpectedEndOfInput | Error::Unknown => name,
        Error::ExtraData(s) | Error::UnrecognizedToken(s) | Error::InvalidRegex(s) | Error::UnterminatedRegex(s)
        | Error::UnterminatedString(s) | Error::InvalidRange(s) | Error::InvalidHexString(s)
        | Error::UnterminatedHexString(s) | Error::InvalidDateFormat(s) | Error::InvalidNumberFormat(s)
        | Error::ExpectedOpenParen(s) | Error::ExpectedCloseParen(s) | Error::ExpectedCloseBracket(s)
        | Error::ExpectedCloseBrace(s) | Error::ExpectedColon(s) | Error::ExpectedPattern(s)
        | Error::UnmatchedParentheses(s) | Error::UnmatchedBraces(s) | Error::UnterminatedDigestQuoted(s)
        | Error::UnterminatedDateQuoted(s) => format!("{name}{}", span(src, s)),
        Error::InvalidUr(_, s) | Error::InvalidCaptureGroupName(_, s) | Error::InvalidDigestPattern(_, s) => format!("{name}{}", span(src, s)),
    }
}
fn render(paths: &[Path]) -> String {
    paths.iter().map(|p| p.iter().map(|c| hex::encode(c.to_cbor_data())).collect::<Vec<_>>().join(",")).collect::<Vec<_>>().join("|")
}
fn opts(o: &serde_json::Value) -> FormatPathsOpts {
    let mut f = FormatPathsOpts::default();
    if let Some(i) = o.get("indent").and_then(|v| v.as_bool()) { f = f.indent(i); }
    let max = o.get("maxLength").and_then(|v| v.as_u64()).map(|v| v as usize);
    if o.get("flat").and_then(|v| v.as_bool()) == Some(true) {
        f = f.element_format(PathElementFormat::DiagnosticFlat(max));
    } else if max.is_some() {
        f = f.element_format(PathElementFormat::DiagnosticSummary(max));
    }
    if let Some(l) = o.get("lastElementOnly").and_then(|v| v.as_bool()) { f = f.last_element_only(l); }
    f
}
fn run(r: &serde_json::Value) -> String {
    let k = r["k"].as_str().unwrap();
    let src = r.get("src").or_else(|| r.get("pattern")).and_then(|s| s.as_str()).unwrap();
    let pattern = match Pattern::parse(src) { Ok(p) => p, Err(e) => return format!("throw:{}", describe(src, &e)) };
    if k == "parse" { return format!("{pattern}"); }
    let haystack = CBOR::try_from_data(hex::decode(r["hex"].as_str().unwrap()).unwrap()).unwrap();
    let (paths, captures) = pattern.paths_with_captures(&haystack);
    if k == "match" {
        let mut names: Vec<&String> = captures.keys().collect();
        names.sort();
        let caps = names.iter().map(|n| format!("{n}=[{}]", render(&captures[*n]))).collect::<Vec<_>>().join(";");
        return format!("paths=[{}]{}", render(&paths), if caps.is_empty() { String::new() } else { format!(" captures{{{caps}}}") });
    }
    let o = r.get("opts").cloned().unwrap_or(serde_json::Value::Null);
    let caps: HashMap<String, Vec<Path>> = captures;
    format_paths_with_captures(&paths, &caps, opts(&o))
}
/// Expected divergences (see RUST_DIVERGENCES.md):
/// S1  both reject with the same variant at a different span.
/// S2  both reject with different variants (the reference's parser reports
///     the token it saw; TypeScript reports what it expected).
/// P1  (pending) a parenthesised group outside an array never matches.
/// P2  (pending) `[]` means "empty array" here and "any array" (displayed
///     `[{0,}]`) in the reference.
/// P3  (pending) captures of `*` inside arrays: the reference reports the
///     element paths (and lists them among the match paths).
fn expected_divergence(recipe: &serde_json::Value, got: &str, want: &str) -> Option<&'static str> {
    let variant = |s: &str| s.trim_start_matches("throw:").split('@').next().unwrap_or("").to_string();
    let both_reject = got.starts_with("throw:") && want.starts_with("throw:");
    if both_reject { return Some(if variant(got) == variant(want) { "S1" } else { "S2" }); }
    let src = recipe.get("src").or_else(|| recipe.get("pattern")).and_then(|s| s.as_str()).unwrap_or("");
    if got.contains("{0,}") && want.contains("{0}") && got.replace("{0,}", "{0}") == *want { return Some("P2"); }
    if src.contains("[]") && !got.starts_with("throw") { return Some("P2"); }
    if src.contains("(*)") || src.contains("@any_item(*)") || src.contains("@a(*)") { return Some("P3"); }
    if src.starts_with('(') || src.contains("| (") || src.contains("(number") || src.contains("((") { return Some("P1"); }
    None
}
fn main() {
    bc_tags::register_tags();
    let path = std::env::args().nth(1).expect("vectors.json");
    let file: File = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
    assert_eq!(file.count, file.vectors.len());
    let (mut mismatches, mut expected) = (0, 0);
    for v in &file.vectors {
        let got = std::panic::catch_unwind(|| run(&v.recipe)).unwrap_or_else(|_| "throw:panic".to_string());
        if got == v.expect { continue; }
        if let Some(class) = expected_divergence(&v.recipe, &got, &v.expect) {
            expected += 1;
            if std::env::var("VERBOSE").is_ok() { eprintln!("expected [{class}] {}\n  rust: {got}\n  ts:   {}", v.name, v.expect); }
            continue;
        }
        mismatches += 1;
        eprintln!("MISMATCH {}\n  rust: {}\n  ts:   {}", v.name, got.replace('\n', "\\n"), v.expect.replace('\n', "\\n"));
    }
    println!("{} vectors - {} match, {} expected-divergence, {} MISMATCH", file.vectors.len(), file.vectors.len() - mismatches - expected, expected, mismatches);
    if mismatches > 0 { std::process::exit(1); }
}
