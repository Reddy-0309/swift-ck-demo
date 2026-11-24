import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { as, seededStore } from "./helpers";
import { Forbidden } from "../domain/core";
import { MIN_CELL_SIZE, dashboard, ingestEvent, reviewEffort } from "../domain/analytics";
import { CONTRACT_VERSION } from "../domain/contracts";
import { getObject, withdrawVersion } from "../domain/governance";
import { exportPackage, validatePackageBytes } from "../domain/packaging";
import { pseudonym } from "../domain/core";
import { LANGUAGES } from "../domain/types";
import { COD_KEY, DAMAGED_KEY } from "../seed/translations";

describe("analytics", () => {
  it("reconciles every total with the raw events and suppresses small cells", async () => {
    const store = await seededStore();
    const d = await dashboard(store.getState());
    expect(d.reconciliation.allMatch).toBe(true);
    expect(d.dataLabel).toBe("SYNTHETIC DEMONSTRATION DATA");
    const byLanguage = d.indicators.find((i) => i.id === "requests_by_language");
    expect(new Set(byLanguage?.rows.map((r) => r.keys.language))).toEqual(new Set(LANGUAGES));
    for (const i of d.indicators.filter((x) => x.breakdown)) {
      for (const r of i.rows) if (r.suppressed) expect(r.value).toBeNull();
      for (const r of i.rows) if (!r.suppressed) expect(r.denominator ?? r.value).toBeGreaterThanOrEqual(MIN_CELL_SIZE);
    }
    const effort = reviewEffort(store.getState());
    expect(effort.summary.objectsReviewed).toBe(4);
    expect(effort.summary.translationsReviewed).toBe(21);
  });

  it("accepts client events once and refuses spoofed or system events", async () => {
    const store = await seededStore();
    const rider = as(store, "arjun.rider");
    const s = store.getState();
    const v = s.versions.find((x) => x.state === "published")!;
    const event = {
      event_name: "media.opened",
      schema_version: CONTRACT_VERSION,
      event_id: "evt-0001-test",
      tenant: "swift-demo",
      actor: pseudonym(rider.userId),
      timestamp: new Date().toISOString(),
      context: {},
      object_id: v.objectId,
      object_version: v.version,
      channel: "test",
    };
    expect(store.transact((x) => ingestEvent(x, rider, event))).toBe("accepted");
    expect(store.transact((x) => ingestEvent(x, rider, event))).toBe("duplicate");
    expect(() => store.transact((x) => ingestEvent(x, rider, { ...event, event_id: "evt-0002-test", actor: "p_someone" }))).toThrow(Forbidden);
    expect(() => store.transact((x) => ingestEvent(x, rider, { ...event, event_id: "evt-0003-test", event_name: "knowledge.viewed" }))).toThrow(/recorded by the system/);
  });
});

describe("Model A package", () => {
  it("exports general approved knowledge only, validates, and lists withdrawals next time", async () => {
    const store = await seededStore();
    const admin = as(store, "admin");
    const first = await exportPackage(store, admin);
    expect(first.manifest.object_count).toBe(3);
    expect(first.manifest.languages).toEqual([...LANGUAGES].sort());
    expect(first.manifest.objects.map((o) => o.object_key)).not.toContain(COD_KEY);
    const bytes = store.getFile(first.fileKey);
    const pkg = await validatePackageBytes(bytes);
    expect(pkg.manifest.runtime_requirements).toEqual({ generative_ai: false, network_service: false, telemetry: false });
    const json = await (await JSZip.loadAsync(bytes)).file("package.json")!.async("string");
    expect(json).not.toContain("settlement");
    await expect(exportPackage(store, as(store, "arjun.rider"))).rejects.toThrow(Forbidden);

    const s = store.getState();
    const damaged = s.versions.find((v) => v.state === "published" && getObject(s, v.objectId).objectKey === DAMAGED_KEY)!;
    store.transact((x) => withdrawVersion(x, as(store, "vikram.sme"), damaged.id, "retired"));
    const second = await exportPackage(store, admin);
    expect(second.packageVersion).toBe(2);
    expect(second.manifest.withdrawn).toEqual([expect.objectContaining({ object_key: DAMAGED_KEY, status: "withdrawn", last_packaged_version: 1 })]);
  });
});
