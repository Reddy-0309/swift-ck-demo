import { describe, expect, it } from "vitest";
import { seededStore } from "./helpers";
import { runChecklist } from "../app/checklist";
import { as } from "./helpers";
import { uploadSource } from "../domain/intake";
import { extractDrafts } from "../domain/governance";
import { heuristicExtractor } from "../domain/extraction";
import { PICKUP_SOP_R2, PICKUP_SOP_R2_FILENAME } from "../seed/fixtures";

describe("acceptance checklist (D07 Appendix A)", () => {
  it("verifies every item the demo can show, without changing the data", async () => {
    const store = await seededStore();
    const before = store.getState();
    const results = await runChecklist(before);
    expect(results).toHaveLength(15);
    expect(results.filter((r) => r.status === "fail").map((r) => `${r.title}: ${r.summary} ${r.details.join("; ")}`)).toEqual([]);
    expect(results.filter((r) => r.status === "pass")).toHaveLength(12);
    expect(results.filter((r) => r.status === "outside").map((r) => r.id)).toEqual(["b1", "benchmarks"]);
    expect(store.getState()).toBe(before);
  }, 60000);

  it("still passes after a client revises an SOP and live guidance is suspended", async () => {
    const store = await seededStore();
    const author = as(store, "asha.author");
    const source = await uploadSource(store, author, PICKUP_SOP_R2_FILENAME, new TextEncoder().encode(PICKUP_SOP_R2), { rightsCleared: true, rightsNote: "Synthetic", synthetic: true });
    store.transact((s) => extractDrafts(s, author, source.id, heuristicExtractor));
    const results = await runChecklist(store.getState());
    expect(results.filter((r) => r.status === "fail").map((r) => `${r.title}: ${r.summary} ${r.details.join("; ")}`)).toEqual([]);
  }, 60000);
});
