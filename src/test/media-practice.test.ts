import { describe, expect, it } from "vitest";
import { as, seededStore } from "./helpers";
import { Forbidden, ValidationFailed } from "../domain/core";
import { getObject, variantIn } from "../domain/governance";
import { annotateFigure, approveMedia, attachNarration, createSlide, importFigure, narrationScript, slideText } from "../domain/media";
import { attempt, learnerView } from "../domain/practice";
import type { Store } from "../domain/store";
import { CONVEYOR_KEY, PICKUP_KEY } from "../seed/translations";

function published(store: Store, key: string): string {
  const s = store.getState();
  return s.versions.find((v) => v.state === "published" && getObject(s, v.objectId).objectKey === key)?.id as string;
}

describe("controlled media", () => {
  it("renders a slide that contains the approved localized text verbatim", async () => {
    const store = await seededStore();
    const id = published(store, PICKUP_KEY);
    const te = variantIn(store.getState(), id, "te");
    const slide = await createSlide(store, as(store, "asha.author"), id, te?.id as string);
    const text = await slideText(store.getFile(slide.fileKey));
    for (const b of te?.blocks ?? []) expect(text).toContain(b.text);
    expect(slide.verification).toMatchObject({ rendered_text_matches: true, font: "Noto Sans Telugu" });
    expect(() => store.transact((s) => approveMedia(s, as(store, "asha.author"), slide.id))).toThrow(Forbidden);
    expect(() => store.transact((s) => approveMedia(s, as(store, "vikram.sme"), slide.id))).toThrow(/bilingual reviewer/);
    expect(store.transact((s) => approveMedia(s, as(store, "kavya.bilingual"), slide.id)).state).toBe("approved");
  });

  it("binds narration to the approved script and rejects unsafe or altered images", async () => {
    const store = await seededStore();
    const author = as(store, "asha.author");
    const id = published(store, CONVEYOR_KEY);
    const mr = variantIn(store.getState(), id, "mr");
    const narration = attachNarration(store, author, { versionId: id, variantId: mr?.id as string, filename: "voice.wav", bytes: new Uint8Array([1, 2, 3]), rightsId: "VOICE-01", licenseNote: "" });
    expect(narration.scriptText).toBe(narrationScript(mr!));
    expect(narration.scriptText).toContain("पायरी 1");
    expect(() => importFigure(store, author, { versionId: id, filename: "x.svg", bytes: new TextEncoder().encode('<svg onload="x()"></svg>'), rightsId: "R", licenseNote: "" })).toThrow(/script/);
    const figure = store.getState().media.find((m) => m.versionId === id && m.type === "source_figure");
    expect(() =>
      annotateFigure(store, author, {
        versionId: id,
        variantId: mr?.id as string,
        figureId: figure?.id as string,
        annotations: [{ x: 10, y: 10, label: "गार्ड G-3", sourceLabel: "Guard G-2" }],
      }),
    ).toThrow(ValidationFailed);
  });
});

describe("decision practice", () => {
  it("keeps guided and independent attempts apart, in the learner's language", async () => {
    const store = await seededStore();
    const rider = as(store, "arjun.rider");
    const scenario = store.getState().scenarios[0]!;
    const view = learnerView(scenario, "independent", "ml");
    expect(view.hints).toEqual([]);
    expect(view.language).toBe("ml");
    expect(JSON.stringify(view)).not.toContain("ruleResults");
    expect(() => store.transact((s) => attempt(s, rider, { scenarioId: scenario.id, variant: "independent", choiceId: "Z", hintsUsed: 1, language: "ml" }))).toThrow(/Hints/);
    const before = store.getState().attempts.length;
    const result = store.transact((s) => attempt(s, rider, { scenarioId: scenario.id, variant: "independent", choiceId: "Z", hintsUsed: 0, language: "ml" }));
    expect(result).toMatchObject({ mode: "independent", correct: true });
    expect(result.approvedGuidance?.language).toBe("ml");
    const wrong = store.transact((s) => attempt(s, rider, { scenarioId: scenario.id, variant: "guided", choiceId: "C", hintsUsed: 2, language: "bn" }));
    expect(wrong).toMatchObject({ mode: "assisted", correct: false });
    expect(wrong.ruleResults.every((r) => !r.met)).toBe(true);
    expect(store.getState().attempts.slice(before).map((a) => a.mode)).toEqual(["independent", "assisted"]);
  });
});
