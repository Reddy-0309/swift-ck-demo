import { describe, expect, it } from "vitest";
import { clear } from "idb-keyval";
import { seededStore } from "./helpers";
import { Store } from "../domain/store";
import { sha256 } from "../domain/core";

describe("browser persistence (IndexedDB)", () => {
  it("round-trips the full state, files and chunked event log, and appends incrementally", async () => {
    await clear();
    const seeded = await seededStore();
    const store = new Store();
    await store.adopt(seeded);
    const reloaded = new Store();
    expect(await reloaded.load()).toBe(true);
    expect(reloaded.getState().events.length).toBe(seeded.getState().events.length);
    expect(reloaded.getState().media.length).toBe(seeded.getState().media.length);
    const first = reloaded.getState().media[0]!;
    expect(sha256(new Uint8Array(reloaded.getFile(first.fileKey)))).toBe(first.sha256);

    store.transact((s) => {
      s.events.push({ ...s.events[0]!, id: "extra", eventId: "extra-event" });
    });
    await new Promise((r) => setTimeout(r, 50));
    const again = new Store();
    expect(await again.load()).toBe(true);
    expect(again.getState().events.at(-1)?.eventId).toBe("extra-event");
  });
});
