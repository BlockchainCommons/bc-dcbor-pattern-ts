/**
 * Parsing, matching, capturing and formatting dCBOR patterns.
 *
 *   bun examples/patterns.ts
 */
import { cbor, getGlobalTagsStore } from "@blockchaincommons/dcbor";
import { registerTags } from "@blockchaincommons/tags";
import {
  DcborPatternError,
  and,
  anyNumber,
  capture,
  display,
  matches,
  parsePattern,
  paths,
  pathsWithCaptures,
  search,
  text,
  tryParsePattern,
} from "@blockchaincommons/dcbor-pattern";
import { formatPaths } from "@blockchaincommons/dcbor-pattern/format";

registerTags(getGlobalTagsStore());

// A pattern from text, matched against a value.
const haystack = cbor({ name: "Alice", scores: [7, 9, 12], tags: ["x", "y"] });
const pattern = parsePattern("search(@n(number))");
console.log(display(pattern)); // search(@n(number))
console.log(matches(pattern, haystack)); // true
console.log(paths(pattern, haystack).length); // 3

// The same match with its captures, formatted one element per line.
const { paths: found, captures } = pathsWithCaptures(pattern, haystack);
console.log(formatPaths(found, { captures }));

// A pattern built programmatically.
const built = and(search(capture("t", text("x"))), search(anyNumber()));
console.log(display(built)); // search(@t("x")) & search(number)
console.log(pathsWithCaptures(built, haystack).captures.get("t")?.length); // 1

// A rejected pattern: the error names the code and where it was found.
const rejected = tryParsePattern("[1, 2");
if (!rejected.ok) {
  console.log(rejected.error.code); // ExpectedCloseBracket
  console.log(rejected.error.span); // { start: 5, end: 5 }
}
try {
  parsePattern("@(1)");
} catch (e) {
  // the message with the source line and a caret under the span
  if (DcborPatternError.isDcborPatternError(e)) console.log(e.fullMessage("@(1)"));
}
