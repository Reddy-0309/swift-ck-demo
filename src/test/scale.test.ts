import { describe, expect, it } from "vitest";
import { as, seededStore } from "./helpers";
import { dashboard, periodStart } from "../domain/analytics";
import { approveMedia, createSlide } from "../domain/media";
import { getObject, variantIn } from "../domain/governance";

describe("real-world volume", () => {
  it("seeds 90 days of activity and keeps each change and the dashboard fast", async () => {
    const store = await seededStore();
    const s = store.getState();
    const requests = s.events.filter((e) => e.eventName.startsWith("knowledge.")).length;
    expect(requests).toBeGreaterThan(4000);
    expect(new Set(s.events.map((e) => e.actor)).size).toBeGreaterThan(100);
    const t0 = performance.now();
    const d = await dashboard(s, periodStart(90));
    const dashboardMs = performance.now() - t0;
    expect(d.reconciliation.allMatch).toBe(true);
    expect(dashboardMs).toBeLessThan(3000);
    // A governance change on a store holding thousands of events stays well under 100 ms.
    const v = s.versions.find((x) => x.state === "published" && getObject(s, x.objectId).objectKey.includes("standard-parcel"))!;
    const slide = await createSlide(store, as(store, "asha.author"), v.id, variantIn(s, v.id, "kn")!.id);
    const t1 = performance.now();
    store.transact((x) => approveMedia(x, as(store, "kavya.bilingual"), slide.id));
    expect(performance.now() - t1).toBeLessThan(100);
    console.info(`requests=${requests} events=${s.events.length} attempts=${s.attempts.length} dashboard=${Math.round(dashboardMs)}ms`);
  });
});
