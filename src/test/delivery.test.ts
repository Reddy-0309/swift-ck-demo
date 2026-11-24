import { describe, expect, it } from "vitest";
import { as, seededStore } from "./helpers";
import { C2KnowledgeResponse, CONTRACT_VERSION } from "../domain/contracts";
import type { Principal } from "../domain/core";
import { ContractVersionError, resolve } from "../domain/delivery";
import { getObject, variantIn, withdrawVariant, withdrawVersion } from "../domain/governance";
import type { Store } from "../domain/store";
import { LANGUAGES } from "../domain/types";
import { TRANSLATIONS, PICKUP_KEY, CONVEYOR_KEY } from "../seed/translations";

function ask(store: Store, who: Principal, ctx: Record<string, unknown>) {
  const response = store.transact((s) =>
    resolve(s, who, { contract_version: CONTRACT_VERSION, tenant_id: "swift-demo", request_id: "r1", host_app_id: "test", host_version: "1", language: "en", ...ctx }),
  );
  return C2KnowledgeResponse.parse(response); // every response must satisfy the C2 field rules
}

function versionIdOf(store: Store, key: string): string {
  const s = store.getState();
  return s.versions.find((v) => v.state === "published" && getObject(s, v.objectId).objectKey === key)?.id as string;
}

describe("knowledge delivery (C1 → C2)", () => {
  it("answers the pickup task verbatim in each of the eight languages", async () => {
    const store = await seededStore();
    const rider = as(store, "arjun.rider");
    for (const language of LANGUAGES) {
      const r = ask(store, rider, { task_id: "T-PICKUP", language });
      expect(r.outcome).toBe("answer");
      expect(r.title).toBe(language === "en" ? "Standard parcel pickup" : TRANSLATIONS[PICKUP_KEY]?.[language]?.title);
      expect(r.content?.map((b) => b.text).join(" ")).toContain("15 kg");
      expect(r.source_citation?.document_key).toBe("sop-dl-014");
    }
  });

  it("covers the declared non-answer cases without guessing", async () => {
    const store = await seededStore();
    const rider = as(store, "arjun.rider");
    const tech = as(store, "lakshmi.tech");
    expect(ask(store, rider, {})).toMatchObject({ outcome: "need_context", required_context: ["task_id"] });
    expect(ask(store, rider, { task_id: "T-COD-REVIEW" })).toMatchObject({ outcome: "not_permitted", reason: "role_not_permitted" });
    expect(ask(store, rider, { task_id: "T-PICKUP", situation_code: "LEAKING_CONTENTS" })).toMatchObject({ outcome: "abstain", reason: "situation_not_covered" });
    expect(ask(store, rider, { task_id: "T-RETURNS" })).toMatchObject({ outcome: "abstain", reason: "no_applicable_object" });
    expect(ask(store, tech, { task_id: "T-CONV-INSPECT" })).toMatchObject({ outcome: "need_context", required_context: ["asset_id"] });
    expect(ask(store, tech, { task_id: "T-CONV-INSPECT", asset_id: "EQ-2000-X" })).toMatchObject({ outcome: "abstain" });
    expect(ask(store, tech, { task_id: "T-CONV-INSPECT", asset_id: "EQ-1000-B", language: "bn" })).toMatchObject({
      outcome: "answer",
      title: TRANSLATIONS[CONVEYOR_KEY]?.bn.title,
      risk_class: "HIGH",
    });
    expect(ask(store, as(store, "deepa.supervisor"), { task_id: "T-COD-REVIEW" }).outcome).toBe("answer");
    expect(ask(store, rider, { task_id: "T-PICKUP", situation_code: "DAMAGED_PACKAGE", language: "kn" }).title).toBe("ಪಿಕಪ್ ಸಮಯದಲ್ಲಿ ಹಾನಿಗೊಳಗಾದ ಪ್ಯಾಕೇಜಿಂಗ್");
    const other = { ...rider, tenantId: "other" };
    expect(ask(store, other, { task_id: "T-PICKUP" })).toMatchObject({ outcome: "not_permitted", reason: "tenant_mismatch" });
    expect(() => store.transact((s) => resolve(s, rider, { contract_version: "9.9", tenant_id: "swift-demo", request_id: "x", language: "en", host_app_id: "t", host_version: "1" }))).toThrow(ContractVersionError);
  });

  it("records exactly one analytics event per request, with the exact object version", async () => {
    const store = await seededStore();
    const before = store.getState().events.length;
    const r = ask(store, as(store, "arjun.rider"), { task_id: "T-PICKUP", language: "ta" });
    const events = store.getState().events.slice(before);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ eventName: "knowledge.viewed", objectId: r.object_id, objectVersion: r.object_version, language: "ta" });
  });

  it("stops serving a withdrawn language and a withdrawn version, and marks media stale", async () => {
    const store = await seededStore();
    const rider = as(store, "arjun.rider");
    const sme = as(store, "vikram.sme");
    const id = versionIdOf(store, PICKUP_KEY);
    const ml = variantIn(store.getState(), id, "ml")?.id as string;
    store.transact((s) => withdrawVariant(s, sme, ml, "wording error"));
    expect(ask(store, rider, { task_id: "T-PICKUP", language: "ml" })).toMatchObject({ outcome: "abstain", reason: "language_not_approved" });
    expect(ask(store, rider, { task_id: "T-PICKUP", language: "te" }).outcome).toBe("answer");
    store.transact((s) => withdrawVersion(s, sme, id, "procedure retired"));
    expect(ask(store, rider, { task_id: "T-PICKUP", language: "te" }).outcome).toBe("abstain");
    expect(store.getState().media.filter((m) => m.versionId === id).every((m) => m.stale)).toBe(true);
  });
});
