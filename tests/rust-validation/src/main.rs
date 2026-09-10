//! Replays tests/vectors/vectors.json against the tracked dcbor-pattern release.
//!
//!   cargo run --release -- ../vectors/vectors.json
//!   VERBOSE=1 cargo run --release -- ../vectors/vectors.json   # print every classified row
//!
//! Every vector is a pattern's display, `display@length` for a prefix parse,
//! `paths=[…] captures{…}` with every path element as dCBOR hex, a formatted
//! match, or `throw:<Variant>[(<Token>)]@start-end`. Rust spans are byte
//! offsets; the harness converts them to UTF-16 code units so they compare
//! with the port's. Classes (see RUST_DIVERGENCES.md):
//!   match    identical outcome
//!   S1       both reject with the same variant at a different span
//!   S2       both reject with different variants (the reference reports the
//!            token it saw; the port reports what it expected)
//!   R1       a named-tag pattern matches decoded data in the port and never
//!            in the reference (`Tag::name()` does not consult the tags store)
//!   R2       the known values `value` (25) and `Self` (706) resolve in the
//!            port and not in the reference's store
//!   X1       regex dialect: both parse, the match differs (Unicode classes,
//!            `\w`/`\d`/`\b`)
//!   X2       regex syntax: one side rejects
//!   X3       byte regex mode: the port runs bytes, the reference Unicode
//!   U1       `1e400` is `inf` in the reference; the port rejects it
//!   U3       captures reported for a non-matching map in the reference
//!   N1       the port's nesting limit (`NestingTooDeep`); the reference has none
//!   js-only  a `domain` recipe the reference's types cannot express
//!   pending  a divergence a later wave closes; expected to reach zero
//!   MISMATCH anything else; exit 1
use dcbor::prelude::*;
use dcbor_pattern::{
    format_paths_with_captures, Error, FormatPathsOpts, Matcher, Path, PathElementFormat, Pattern,
};
use serde::Deserialize;
use std::collections::{BTreeMap, HashMap};
use std::panic::{catch_unwind, AssertUnwindSafe};

#[derive(Deserialize)]
struct File {
    count: usize,
    vectors: Vec<Vector>,
}
#[derive(Deserialize)]
struct Vector {
    name: String,
    recipe: serde_json::Value,
    expect: String,
}

/// Byte offset → UTF-16 code-unit offset.
fn cu(src: &str, byte: usize) -> usize {
    let b = byte.min(src.len());
    let mut i = b;
    while i > 0 && !src.is_char_boundary(i) {
        i -= 1;
    }
    src[..i].encode_utf16().count() + (b - i)
}
fn span(src: &str, s: &std::ops::Range<usize>) -> String {
    format!("@{}-{}", cu(src, s.start), cu(src, s.end))
}
fn variant_name(e: &Error) -> String {
    let d = format!("{e:?}");
    d.split(|c| c == '(' || c == ' ').next().unwrap_or(&d).to_string()
}
fn describe(src: &str, e: &Error) -> String {
    let name = variant_name(e);
    match e {
        Error::UnexpectedToken(t, s) => {
            let td = format!("{t:?}");
            let tn = td
                .split(|c| c == '(' || c == ' ' || c == '{')
                .next()
                .unwrap_or(&td)
                .to_string();
            format!("UnexpectedToken({}){}", tn, span(src, s))
        }
        Error::EmptyInput | Error::UnexpectedEndOfInput | Error::Unknown => name,
        Error::ExtraData(s)
        | Error::UnrecognizedToken(s)
        | Error::InvalidRegex(s)
        | Error::UnterminatedRegex(s)
        | Error::UnterminatedString(s)
        | Error::InvalidRange(s)
        | Error::InvalidHexString(s)
        | Error::UnterminatedHexString(s)
        | Error::InvalidDateFormat(s)
        | Error::InvalidNumberFormat(s)
        | Error::ExpectedOpenParen(s)
        | Error::ExpectedCloseParen(s)
        | Error::ExpectedCloseBracket(s)
        | Error::ExpectedCloseBrace(s)
        | Error::ExpectedColon(s)
        | Error::ExpectedPattern(s)
        | Error::UnmatchedParentheses(s)
        | Error::UnmatchedBraces(s)
        | Error::UnterminatedDigestQuoted(s)
        | Error::UnterminatedDateQuoted(s) => format!("{name}{}", span(src, s)),
        Error::InvalidUr(_, s) | Error::InvalidCaptureGroupName(_, s) | Error::InvalidDigestPattern(_, s) => {
            format!("{name}{}", span(src, s))
        }
    }
}
fn render(paths: &[Path]) -> String {
    paths
        .iter()
        .map(|p| p.iter().map(|c| hex::encode(c.to_cbor_data())).collect::<Vec<_>>().join(","))
        .collect::<Vec<_>>()
        .join("|")
}
fn render_match(paths: &[Path], captures: &HashMap<String, Vec<Path>>) -> String {
    let mut names: Vec<&String> = captures.keys().collect();
    names.sort();
    let caps = names
        .iter()
        .map(|n| format!("{n}=[{}]", render(&captures[*n])))
        .collect::<Vec<_>>()
        .join(";");
    format!(
        "paths=[{}]{}",
        render(paths),
        if caps.is_empty() { String::new() } else { format!(" captures{{{caps}}}") }
    )
}
fn opts(o: &serde_json::Value) -> FormatPathsOpts {
    let mut f = FormatPathsOpts::default();
    if let Some(i) = o.get("indent").and_then(|v| v.as_bool()) {
        f = f.indent(i);
    }
    let max = o.get("maxLength").and_then(|v| v.as_u64()).map(|v| v as usize);
    if o.get("flat").and_then(|v| v.as_bool()) == Some(true) {
        f = f.element_format(PathElementFormat::DiagnosticFlat(max));
    } else if max.is_some() {
        f = f.element_format(PathElementFormat::DiagnosticSummary(max));
    }
    if let Some(l) = o.get("lastElementOnly").and_then(|v| v.as_bool()) {
        f = f.last_element_only(l);
    }
    f
}

enum Outcome {
    Value(String),
    Panic,
    JsOnly,
}

fn run(r: &serde_json::Value) -> Outcome {
    let k = r["k"].as_str().unwrap();
    if k == "domain" {
        return Outcome::JsOnly;
    }
    let out = catch_unwind(AssertUnwindSafe(|| {
        let src = r.get("src").or_else(|| r.get("pattern")).and_then(|s| s.as_str()).unwrap();
        if k == "prefix" {
            return match Pattern::parse_partial(src) {
                Ok((p, n)) => format!("{p}@{}", cu(src, n)),
                Err(e) => format!("throw:{}", describe(src, &e)),
            };
        }
        let pattern = match Pattern::parse(src) {
            Ok(p) => p,
            Err(e) => return format!("throw:{}", describe(src, &e)),
        };
        if k == "parse" {
            return format!("{pattern}");
        }
        let haystack = CBOR::try_from_data(hex::decode(r["hex"].as_str().unwrap()).unwrap()).unwrap();
        let (paths, captures) = pattern.paths_with_captures(&haystack);
        if k == "match" {
            return render_match(&paths, &captures);
        }
        let o = r.get("opts").cloned().unwrap_or(serde_json::Value::Null);
        format_paths_with_captures(&paths, &captures, opts(&o))
    }));
    match out {
        Ok(s) => Outcome::Value(s),
        Err(_) => Outcome::Panic,
    }
}

fn variant(s: &str) -> String {
    s.trim_start_matches("throw:").split('@').next().unwrap_or("").to_string()
}
fn source(recipe: &serde_json::Value) -> &str {
    recipe.get("src").or_else(|| recipe.get("pattern")).and_then(|s| s.as_str()).unwrap_or("")
}
fn haystack_hex(recipe: &serde_json::Value) -> &str {
    recipe.get("hex").and_then(|s| s.as_str()).unwrap_or("")
}
fn is_named_tag_pattern(src: &str) -> bool {
    src.trim_start().starts_with("tagged(")
        && !src
            .trim_start()
            .trim_start_matches("tagged(")
            .trim_start()
            .starts_with(|c: char| c.is_ascii_digit() || c == '+' || c == '-' || c == '*')
}
fn is_text_regex(src: &str) -> bool {
    let s = src.trim_start_matches(|c: char| c == '@' || c.is_alphanumeric() || c == '_' || c == '(');
    s.starts_with('/') || src.starts_with("'/") || src.contains("date'/") || src.contains("tagged(/")
}
fn is_byte_regex(src: &str) -> bool {
    src.contains("h'/") || src.contains("digest'/")
}

/// The class of an expected divergence, or `None` for a mismatch.
fn classify(recipe: &serde_json::Value, got: &str, want: &str) -> Option<&'static str> {
    let k = recipe["k"].as_str().unwrap_or("");
    let src = source(recipe);
    let both_reject = got.starts_with("throw:") && want.starts_with("throw:");
    let (gv, wv) = (variant(got), variant(want));
    if wv == "NestingTooDeep" {
        return Some("N1");
    }
    // the reference parses `1e400` to inf and displays `inf`; the port rejects the literal
    if wv == "InvalidNumberFormat" && src.contains("e400") {
        return Some("U1");
    }
    if k == "match" && got.starts_with("paths=[] captures{") && want == "paths=[]" {
        return Some("U3");
    }
    // named tags on decoded data; known values the reference's store lacks
    if is_named_tag_pattern(src) && k != "parse" && got.starts_with("paths=[]") && !want.starts_with("paths=[]") {
        return Some("R1");
    }
    // regexes
    let text_regex = is_text_regex(src);
    let byte_regex = is_byte_regex(src);
    if (text_regex || byte_regex) && (gv == "InvalidRegex") != (wv == "InvalidRegex") {
        return Some("X2");
    }
    if byte_regex && k != "parse" && !both_reject && got != want {
        return Some("X3");
    }
    if text_regex && k != "parse" && !both_reject && got != want && !src.contains('@') && !src.contains("search") {
        return Some("X1");
    }
    if both_reject && gv == wv {
        return Some("S1");
    }
    if both_reject {
        return Some("S2");
    }
    let h = haystack_hex(recipe);
    if (src.contains("'value'") || src.contains("'Self'") || src.contains("'/^value$/'")
        || (src.starts_with("'/") && (h == "d99c401819" || h == "d99c401902c2")))
        && got != want
    {
        return Some("R2");
    }
    // pending waves
    None
}

fn main() {
    std::panic::set_hook(Box::new(|_| {}));
    bc_tags::register_tags();
    let path = std::env::args().nth(1).expect("vectors.json");
    let file: File = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
    assert_eq!(file.count, file.vectors.len());
    let verbose = std::env::var("VERBOSE").is_ok();
    let mut counts: BTreeMap<&'static str, usize> = BTreeMap::new();
    let mut mismatches = 0usize;
    for v in &file.vectors {
        let class: &'static str = match run(&v.recipe) {
            Outcome::JsOnly => "js-only",
            Outcome::Panic => {
                if v.expect.starts_with("throw:") {
                    "U-panic"
                } else {
                    mismatches += 1;
                    eprintln!("MISMATCH {} (reference panicked)\n  ts: {}", v.name, v.expect);
                    continue;
                }
            }
            Outcome::Value(got) if got == v.expect => "match",
            Outcome::Value(got) => match classify(&v.recipe, &got, &v.expect) {
                Some(class) => {
                    if verbose {
                        eprintln!(
                            "{class} {}\n  rust: {}\n  ts:   {}",
                            v.name,
                            got.replace('\n', "\\n"),
                            v.expect.replace('\n', "\\n")
                        );
                    }
                    class
                }
                None => {
                    mismatches += 1;
                    eprintln!(
                        "MISMATCH {}\n  rust: {}\n  ts:   {}",
                        v.name,
                        got.replace('\n', "\\n"),
                        v.expect.replace('\n', "\\n")
                    );
                    continue;
                }
            },
        };
        *counts.entry(class).or_insert(0) += 1;
    }
    let summary: Vec<String> = counts.iter().map(|(k, n)| format!("{n} {k}")).collect();
    println!("{} vectors - {}, {} MISMATCH", file.vectors.len(), summary.join(", "), mismatches);
    if mismatches > 0 {
        std::process::exit(1);
    }
}
