import { Cbor } from "@blockchaincommons/dcbor";
//#region src/format.d.ts
/** The values from the root of the haystack down to a matched value. */
export type Path = readonly Cbor[];
/** How each path element is rendered; both forms render the summarised one-line diagnostic. */
export type PathElementFormat = "summary" | "flat";
/** Options for `formatPaths` and `formatPath`. */
export interface FormatPathsOptions {
  /** Named captures to list (sorted by name) before the paths. */
  captures?: ReadonlyMap<string, readonly Path[]>;
  /** Indent each element by its depth (on by default). */
  indent?: boolean;
  /** How each element is rendered (`"summary"` by default). */
  elementFormat?: PathElementFormat;
  /** Truncate each element's text to this many characters, with an ellipsis. */
  maxLength?: number;
  /** Render only the last element of each path, unindented. */
  lastElementOnly?: boolean;
}
/** One path, one element per line, indented by depth unless `indent` is false. */
export declare const formatPath: (path: Path, options?: FormatPathsOptions) => string;
/**
 * Match paths as text: each capture (sorted by name) as `@name` followed by
 * its paths indented, then every path, one element per line.
 */
export declare const formatPaths: (paths: readonly Path[], options?: FormatPathsOptions) => string;
//#endregion
//# sourceMappingURL=format.d.mts.map