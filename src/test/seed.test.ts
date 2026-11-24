import { describe, expect, it } from "vitest";
import { as, seededStore } from "./helpers";
import { approveAndPublish, getObject } from "../domain/governance";
import { LANGUAGES } from "../domain/types";
import { ImmutableRecordError } from "../domain/core";

describe("seeded demonstration state", () => {
  it("is built through the governed workflow, with every general object in all eight languages", async () => {
    const store = await seededStore();
    const s = store.getState();
    const published = s.versions.filter((v) => v.state === "published");
    expect(published.map((v) => getObject(s, v.objectId).objectKey).sort()).toEqual([
      "sop-dl-014.cash-on-delivery-discrepancy-review",
      "sop-dl-014.damaged-packaging-at-pickup",
      "sop-dl-014.standard-parcel-pickup",
      "sop-mt-007.daily-inspection-of-conveyor-cv-1000",
    ]);
    for (const v of published) {
      const langs = s.variants.filter((x) => x.versionId === v.id && x.state === "approved").map((x) => x.language).sort();
      expect(langs).toEqual(v.distributionClass === "general" ? [...LANGUAGES].sort() : ["en"]);
    }
    expect(s.versions.filter((v) => v.state === "in_review")).toHaveLength(1);
    expect(s.media.filter((m) => m.type === "slide" && m.state === "approved")).toHaveLength(24);
    expect(s.media.filter((m) => m.type === "annotated_diagram" && m.state === "approved")).toHaveLength(8);
    expect(s.scenarios[0]?.definition.text && Object.keys(s.scenarios[0].definition.text).sort()).toEqual([...LANGUAGES].sort());
    expect(s.events.every((e) => e.synthetic)).toBe(true);
  });

  it("protects published content from change (immutability guard)", async () => {
    const store = await seededStore();
    const before = store.getState();
    const id = before.versions.find((v) => v.state === "published")?.id as string;
    expect(() =>
      store.transact((s) => {
        for (const v of s.versions) if (v.id === id) v.contentHash = "tampered";
      }),
    ).toThrow(ImmutableRecordError);
    expect(store.getState()).toBe(before);
    expect(() => store.transact((s) => s.audit.pop())).toThrow(ImmutableRecordError);
    expect(() => store.transact((s) => approveAndPublish(s, as(store, "vikram.sme"), id, { riskClass: "LOW", distributionClass: "general" }))).toThrow(/under review/);
  });
});
