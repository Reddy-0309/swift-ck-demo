import { describe, expect, it } from "vitest";
import { as, seededStore } from "./helpers";
import { Forbidden, ValidationFailed } from "../domain/core";
import {
  approveAndPublish,
  bilingualApprove,
  extractDrafts,
  getObject,
  hazardCheck,
  newVersionFrom,
  sourceVariantOf,
  submitForReview,
  updateDraft,
  upsertTranslation,
} from "../domain/governance";
import { heuristicExtractor } from "../domain/extraction";
import { uploadSource } from "../domain/intake";
import type { Store } from "../domain/store";
import { PICKUP_SOP_R2 } from "../seed/fixtures";
import { ADDRESS_KEY, PICKUP_KEY } from "../seed/translations";

const rights = { rightsCleared: true, rightsNote: "synthetic", synthetic: true };

function idOf(store: Store, key: string, state: string): string {
  const s = store.getState();
  return s.versions.find((v) => v.state === state && getObject(s, v.objectId).objectKey === key)?.id as string;
}

describe("governance", () => {
  it("requires flags resolved and forbids self-approval", async () => {
    const store = await seededStore();
    const id = idOf(store, ADDRESS_KEY, "in_review");
    const sme = as(store, "vikram.sme");
    expect(() => store.transact((s) => approveAndPublish(s, sme, id, { riskClass: "LOW", distributionClass: "general" }))).toThrow(/Resolve flagged/);
    const blocks = sourceVariantOf(store.getState(), id)?.blocks.map((b) => ({ ...b, uncertain: false })) ?? [];
    store.transact((s) => updateDraft(s, sme, id, { blocks }));
    const author = as(store, "asha.author");
    expect(() => store.transact((s) => approveAndPublish(s, { ...author, roles: ["author", "sme"] }, id, { riskClass: "LOW", distributionClass: "general" }))).toThrow(Forbidden);
    const v = store.transact((s) => approveAndPublish(s, sme, id, { riskClass: null, distributionClass: "general" }));
    expect(v.state).toBe("published");
  });

  it("rejects edited text that is not in the source, and uploads without rights clearance", async () => {
    const store = await seededStore();
    const id = idOf(store, ADDRESS_KEY, "in_review");
    const blocks = sourceVariantOf(store.getState(), id)?.blocks.map((b, i) => (i === 0 ? { ...b, text: "Invented guidance." } : b)) ?? [];
    expect(() => store.transact((s) => updateDraft(s, as(store, "vikram.sme"), id, { blocks }))).toThrow(/verbatim/);
    await expect(uploadSource(store, as(store, "asha.author"), "x.md", new TextEncoder().encode("# A\n1. Step"), { ...rights, rightsCleared: false })).rejects.toThrow(/rights-cleared/);
    await expect(uploadSource(store, as(store, "arjun.rider"), "x.md", new TextEncoder().encode("# A\n1. Step"), rights)).rejects.toThrow(Forbidden);
  });

  it("suspends published knowledge when its source is revised, and rebases a new version", async () => {
    const store = await seededStore();
    const author = as(store, "asha.author");
    const pickup = idOf(store, PICKUP_KEY, "published");
    const r2 = await uploadSource(store, author, "sop-dl-014-parcel-pickup-r2.md", new TextEncoder().encode(PICKUP_SOP_R2), rights);
    expect(r2.revision).toBe(2);
    const s = store.getState();
    expect(s.versions.find((v) => v.id === pickup)?.state).toBe("suspended");
    expect(s.media.filter((m) => m.versionId === pickup).every((m) => m.stale)).toBe(true);
    const next = store.transact((x) => newVersionFrom(x, author, pickup));
    const changed = sourceVariantOf(store.getState(), next.id)?.blocks.find((b) => b.text.includes("15 kg"));
    expect(changed).toMatchObject({ sourceSpan: null, uncertain: true });
    const report = store.transact((x) => extractDrafts(x, author, r2.id, heuristicExtractor));
    expect(report.rejected.some((r) => r.reason === "open_draft_exists")).toBe(true);
  });

  it("approves each language separately with an independent hazard check", async () => {
    const store = await seededStore();
    const author = as(store, "asha.author");
    const id = idOf(store, ADDRESS_KEY, "in_review");
    const sme = as(store, "vikram.sme");
    const blocks = sourceVariantOf(store.getState(), id)?.blocks.map((b) => ({ ...b, uncertain: false })) ?? [];
    store.transact((s) => updateDraft(s, sme, id, { blocks }));
    store.transact((s) => approveAndPublish(s, sme, id, { riskClass: "MEDIUM", distributionClass: "general" }));
    const src = sourceVariantOf(store.getState(), id)?.blocks ?? [];
    const bad = src.map((b) => ({ id: b.id, text: `अनुवाद ${b.id}` }));
    expect(() => store.transact((s) => upsertTranslation(s, author, id, { language: "hi", title: "पता", blocks: bad.slice(1) }))).toThrow(ValidationFailed);
    const draft = store.transact((s) => upsertTranslation(s, author, id, { language: "hi", title: "पिकअप पर पते में अंतर", blocks: bad }));
    expect(() => store.transact((s) => bilingualApprove(s, author, draft.id))).toThrow(Forbidden);
    const reviewed = store.transact((s) => bilingualApprove(s, as(store, "kavya.bilingual"), draft.id));
    expect(reviewed.state).toBe("draft"); // escalation block → hazard check still required
    expect(() => store.transact((s) => hazardCheck(s, author, draft.id))).toThrow(Forbidden);
    const approved = store.transact((s) => hazardCheck(s, as(store, "ravi.hazard"), draft.id));
    expect(approved.state).toBe("approved");
    expect(approved.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(() => store.transact((s) => submitForReview(s, author, id))).toThrow(/Only drafts/);
  });
});
