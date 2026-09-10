/**
 * Golden snapshot (Phase 0.2): the display of every hand-written pattern and
 * the outcome of every rejection. Reviewable, auto-updatable with -u.
 */
import { describe, it, expect } from "vitest";
import * as src from "../src";
import { materialize, redesignedAdapterFor } from "./vectors/recipes";
import { currentDeps } from "./vectors/deps";
import { PATTERNS } from "./corpus/patterns";

const api = redesignedAdapterFor(src, currentDeps);

describe("golden: hand patterns", () => {
  it("display or rejection of every pattern", () => {
    const rows = PATTERNS.map(
      (src) => `${JSON.stringify(src)}: ${materialize(api, { k: "parse", src })}`,
    );
    expect(rows.length).toBeGreaterThan(250);
    expect(rows).toMatchSnapshot();
  });
});
