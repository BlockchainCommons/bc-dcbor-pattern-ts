/**
 * Formatting the paths a match yields, one element per line in dCBOR
 * diagnostic notation, indented by depth.
 */
import { type Cbor } from "@blockchaincommons/dcbor";
import { diagnostic } from "@blockchaincommons/dcbor/diagnostic";

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

interface ResolvedFormatOptions {
  readonly indent: boolean;
  readonly elementFormat: PathElementFormat;
  readonly maxLength: number | undefined;
  readonly lastElementOnly: boolean;
}

const resolve = (o: FormatPathsOptions): ResolvedFormatOptions => ({
  indent: o.indent ?? true,
  elementFormat: o.elementFormat ?? "summary",
  maxLength: o.maxLength,
  lastElementOnly: o.lastElementOnly ?? false,
});

const truncateWithEllipsis = (s: string, maxLength?: number): string => {
  if (maxLength === undefined || s.length <= maxLength) return s;
  return maxLength > 1 ? `${s.slice(0, maxLength - 1)}…` : "…";
};

const formatCborElement = (cbor: Cbor, _format: PathElementFormat, maxLength?: number): string =>
  truncateWithEllipsis(diagnostic(cbor, { summarize: true, flat: true }), maxLength);

const formatPathWith = (path: Path, opts: ResolvedFormatOptions): string => {
  if (opts.lastElementOnly) {
    const lastElement = path[path.length - 1];
    return lastElement === undefined
      ? ""
      : formatCborElement(lastElement, opts.elementFormat, opts.maxLength);
  }
  const lines: string[] = [];
  for (let index = 0; index < path.length; index++) {
    const indent = opts.indent ? " ".repeat(index * 4) : "";
    lines.push(`${indent}${formatCborElement(path[index], opts.elementFormat, opts.maxLength)}`);
  }
  return lines.join("\n");
};

/** One path, one element per line, indented by depth unless `indent` is false. */
export const formatPath = (path: Path, options: FormatPathsOptions = {}): string =>
  formatPathWith(path, resolve(options));

/**
 * Match paths as text: each capture (sorted by name) as `@name` followed by
 * its paths indented, then every path, one element per line.
 */
export const formatPaths = (paths: readonly Path[], options: FormatPathsOptions = {}): string => {
  const opts = resolve(options);
  const captures = options.captures ?? new Map<string, readonly Path[]>();
  const result: string[] = [];

  for (const captureName of [...captures.keys()].sort()) {
    const capturePaths = captures.get(captureName);
    if (capturePaths === undefined) continue;
    result.push(`@${captureName}`);
    for (const path of capturePaths) {
      for (const line of formatPathWith(path, opts).split("\n")) {
        if (line.length > 0) result.push(`    ${line}`);
      }
    }
  }

  for (const path of paths) {
    for (const line of formatPathWith(path, opts).split("\n")) {
      if (line.length > 0) result.push(line);
    }
  }

  return result.join("\n");
};
