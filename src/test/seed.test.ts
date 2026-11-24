import { describe, expect, it } from "vitest";
import { as, seededStore } from "./helpers";
import { approveAndPublish, getObject } from "../domain/governance";
import { LANGUAGES } from "../domain/types";
import { ImmutableRecordError } from "../domain/core";
import { CLIENTS, clientForKey } from "../domain/clients";
import { COD_KEY, CONVEYOR_KEY, DAMAGED_KEY, PICKUP_KEY } from "../seed/translations";
import { LOTO_KEY, SPILL_KEY } from "../seed/clientContent";

describe("seeded demonstration state", () => {
  it("is built through the governed workflow, with each client's content in its workforce's languages", async () => {
    const store = await seededStore();
    const s = store.getState();
    const published = s.versions.filter((v) => v.state === "published");
    const keys = published.map((v) => getObject(s, v.objectId).objectKey);
    expect(keys).toHaveLength(11);
    // Every published object belongs to exactly one client, and every course module's guide exists.
    for (const key of keys) expect(clientForKey(key)).toBeDefined();
    for (const client of CLIENTS) {
      for (const m of client.programme.modules) for (const k of m.objectKeys) expect(s.objects.some((o) => o.objectKey === k)).toBe(true);
    }
    const approved = (key: string) => {
      const v = published.find((x) => getObject(s, x.objectId).objectKey === key)!;
      return s.variants.filter((x) => x.versionId === v.id && x.state === "approved").map((x) => x.language).sort();
    };
    for (const key of [PICKUP_KEY, DAMAGED_KEY, CONVEYOR_KEY]) expect(approved(key)).toEqual([...LANGUAGES].sort());
    expect(approved(COD_KEY)).toEqual(["en"]);
    expect(approved(LOTO_KEY)).toEqual(["en", "kn", "ta"]);
    expect(approved(SPILL_KEY)).toEqual(["en", "hi", "mr"]);
    // Two procedures are waiting for an expert, and a Bengali translation is waiting for approval.
    expect(s.versions.filter((v) => v.state === "in_review")).toHaveLength(2);
    expect(s.variants.filter((v) => v.state === "draft" && !v.isSource).map((v) => v.language)).toEqual(["bn"]);
    expect(s.media.filter((m) => m.type === "annotated_diagram" && m.state === "approved")).toHaveLength(8);
    expect(s.scenarios.filter((x) => x.active)).toHaveLength(4);
    expect(Object.keys(s.scenarios[0]!.definition.text).sort()).toEqual([...LANGUAGES].sort());
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
