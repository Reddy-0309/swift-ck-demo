// Synthetic demonstration data, created through the real governed workflow (upload →
// extract → review → publish → translate → media → practice), so the seeded state obeys
// every rule a user would hit. Everything is fictional. The clock is shifted while seeding
// so the audit trail and review-effort figures show a realistic history.

import { setClockOffset, newId, nowIso, nowMs, principalOf, pseudonym, type Principal } from "../domain/core";
import { CONTRACT_VERSION } from "../domain/contracts";
import { ingestEvent } from "../domain/analytics";
import { resolve } from "../domain/delivery";
import { heuristicExtractor } from "../domain/extraction";
import {
  approveAndPublish,
  bilingualApprove,
  extractDrafts,
  getObject,
  hazardCheck,
  hazardCheckRequired,
  sourceVariantOf,
  submitForReview,
  updateDraft,
  upsertTranslation,
  variantIn,
} from "../domain/governance";
import { uploadSource } from "../domain/intake";
import { annotateFigure, approveMedia, createSlide, importFigure } from "../domain/media";
import { attempt, createScenario } from "../domain/practice";
import { SCHEMA_VERSION, type Store } from "../domain/store";
import { LANGUAGES, type ContextCode, type DemoState, type Language, type RiskClass, type Distribution, type User } from "../domain/types";
import {
  CONVEYOR_FIGURE_FILENAME,
  CONVEYOR_FIGURE_SVG,
  CONVEYOR_SOP,
  CONVEYOR_SOP_FILENAME,
  PICKUP_SOP,
  PICKUP_SOP_FILENAME,
  buildDocx,
} from "./fixtures";
import { SCENARIO_DEFINITION, SCENARIO_KEY } from "./scenario";
import {
  ADDRESS_KEY,
  ANNOTATION_LABELS,
  ANNOTATION_POSITIONS,
  COD_KEY,
  CONVEYOR_KEY,
  DAMAGED_KEY,
  PICKUP_KEY,
  TRANSLATIONS,
  type IndicLanguage,
} from "./translations";

export const TENANT = "swift-demo";

const USERS: [username: string, name: string, roles: string[], workRole: string | null][] = [
  ["admin", "Platform Admin", ["admin"], null],
  ["asha.author", "Asha Rao (Content author)", ["author"], null],
  ["vikram.sme", "Vikram Iyer (SME reviewer)", ["sme"], null],
  ["meera.sme", "Meera Nair (SME reviewer)", ["sme"], null],
  ["kavya.bilingual", "Kavya Gowda (Bilingual reviewer, Indic languages)", ["bilingual_reviewer"], null],
  ["ravi.hazard", "Ravi Shetty (Independent hazard checker)", ["hazard_reviewer"], null],
  ["nisha.analyst", "Nisha Menon (Analyst)", ["analyst"], null],
  ["arjun.rider", "Arjun (Delivery associate)", ["worker"], "delivery_associate"],
  ["lakshmi.tech", "Lakshmi (Maintenance technician)", ["worker"], "maintenance_technician"],
  ["deepa.supervisor", "Deepa (Hub supervisor)", ["worker"], "hub_supervisor"],
];

const CONTEXT: ContextCode[] = [
  { kind: "role", code: "delivery_associate", label: "Delivery associate" },
  { kind: "role", code: "maintenance_technician", label: "Maintenance technician" },
  { kind: "role", code: "hub_supervisor", label: "Hub supervisor" },
  { kind: "task", code: "T-PICKUP", label: "Parcel pickup" },
  { kind: "task", code: "T-COD-REVIEW", label: "Cash-on-delivery discrepancy review" },
  { kind: "task", code: "T-CONV-INSPECT", label: "Conveyor daily inspection" },
  { kind: "task", code: "T-RETURNS", label: "Customer return collection (no approved SOP yet)" },
  { kind: "situation", code: "DAMAGED_PACKAGE", label: "Damaged packaging" },
  { kind: "situation", code: "ADDRESS_MISMATCH", label: "Address mismatch" },
  { kind: "situation", code: "LEAKING_CONTENTS", label: "Leaking contents (not yet covered)" },
  { kind: "asset", code: "EQ-1000-A", label: "Conveyor line A (synthetic)" },
  { kind: "asset", code: "EQ-1000-B", label: "Conveyor line B (synthetic)" },
  { kind: "asset", code: "EQ-2000-X", label: "Sorter X (synthetic, unrelated asset)" },
  { kind: "equipment_model", code: "CV-1000", label: "Conveyor model CV-1000 (fictional)" },
];

export function demoUsers(): User[] {
  return USERS.map(([username, displayName, roles, workRole]) => ({ id: `u-${username}`, tenantId: TENANT, username, displayName, roles, workRole }));
}

export function emptyState(): DemoState {
  return {
    schema: SCHEMA_VERSION,
    tenantId: TENANT,
    seededAt: new Date().toISOString(),
    users: demoUsers(),
    context: structuredClone(CONTEXT),
    sources: [],
    objects: [],
    versions: [],
    variants: [],
    media: [],
    scenarios: [],
    attempts: [],
    events: [],
    audit: [],
    packages: [],
  };
}

/** Small deterministic PRNG so seeded activity is the same on every reset. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i] as number;
    if (r < 0) return items[i] as T;
  }
  return items[items.length - 1] as T;
}

const DAY = 86400000;

export interface SeedOptions {
  withActivity?: boolean;
}

export async function seedDemo(store: Store, options: SeedOptions = {}): Promise<void> {
  const withActivity = options.withActivity ?? true;
  let elapsed = -40 * DAY;
  const tick = (minutes: number) => {
    elapsed += minutes * 60000;
    setClockOffset(elapsed);
  };
  tick(0);
  try {
    store.replaceState(emptyState());
    const users = Object.fromEntries(store.getState().users.map((u) => [u.username, principalOf(u)])) as Record<string, Principal>;
    const author = users["asha.author"] as Principal;
    const sme = users["vikram.sme"] as Principal;
    const sme2 = users["meera.sme"] as Principal;
    const bilingual = users["kavya.bilingual"] as Principal;
    const hazard = users["ravi.hazard"] as Principal;
    const rights = { rightsCleared: true, rightsNote: "Synthetic content written for the demonstrator", synthetic: true };

    // ---------------------------------------------------------------- sources & drafts
    const sop1 = await uploadSource(store, author, PICKUP_SOP_FILENAME, new TextEncoder().encode(PICKUP_SOP), rights);
    tick(4);
    const drafts1 = store.transact((s) => extractDrafts(s, author, sop1.id, heuristicExtractor)).createdVersionIds;
    tick(6);
    const sop2 = await uploadSource(store, author, CONVEYOR_SOP_FILENAME, await buildDocx(CONVEYOR_SOP), rights);
    tick(3);
    const drafts2 = store.transact((s) => extractDrafts(s, author, sop2.id, heuristicExtractor)).createdVersionIds;
    const byKey = (key: string): string => {
      const s = store.getState();
      const id = [...drafts1, ...drafts2].find((v) => getObject(s, s.versions.find((x) => x.id === v)?.objectId ?? "").objectKey === key);
      if (!id) throw new Error(`Seed: expected extracted object '${key}'`);
      return id;
    };

    const publish = (key: string, risk: RiskClass, dist: Distribution, reviewMinutes: number) => {
      const id = byKey(key);
      tick(12);
      store.transact((s) => submitForReview(s, author, id));
      tick(reviewMinutes);
      store.transact((s) => approveAndPublish(s, sme, id, { riskClass: risk, distributionClass: dist, effectiveFrom: nowIso(), note: "Synthetic demonstration content" }));
      return id;
    };

    const pickup = publish(PICKUP_KEY, "LOW", "general", 18);
    // An SME reviews the flagged wording before publication (if the extractor flagged any).
    const damagedId = byKey(DAMAGED_KEY);
    tick(9);
    store.transact((s) => {
      const variant = sourceVariantOf(s, damagedId);
      if (variant?.blocks.some((b) => b.uncertain)) {
        updateDraft(s, sme2, damagedId, { blocks: variant.blocks.map((b) => ({ ...b, uncertain: false, uncertaintyNote: "" })) });
      }
    });
    const damaged = publish(DAMAGED_KEY, "MEDIUM", "general", 27);
    publish(COD_KEY, "MEDIUM", "restricted", 22);
    // Left in review on purpose: its block "as appropriate" is flagged for the SME.
    tick(14);
    store.transact((s) => submitForReview(s, author, byKey(ADDRESS_KEY)));
    const conveyor = publish(CONVEYOR_KEY, "HIGH", "general", 34);

    // ---------------------------------------------------------------- translations (7 Indic languages)
    for (const [key, versionId] of [
      [PICKUP_KEY, pickup],
      [DAMAGED_KEY, damaged],
      [CONVEYOR_KEY, conveyor],
    ] as const) {
      for (const [language, translation] of Object.entries(TRANSLATIONS[key] ?? {}) as [IndicLanguage, { title: string; blocks: string[] }][]) {
        tick(15);
        const variant = store.transact((s) => {
          const source = sourceVariantOf(s, versionId);
          const blocks = [...(source?.blocks ?? [])].sort((a, b) => a.order - b.order);
          if (blocks.length !== translation.blocks.length) throw new Error(`Seed: ${key}/${language} block count mismatch`);
          return upsertTranslation(s, author, versionId, {
            language,
            title: translation.title,
            blocks: blocks.map((b, i) => ({ id: b.id, text: translation.blocks[i] as string })),
          });
        });
        tick(11 + (language.charCodeAt(0) % 9));
        store.transact((s) => bilingualApprove(s, bilingual, variant.id, "Demonstration translation; native-speaker review still required before real use."));
        if (hazardCheckRequired(store.getState(), variant)) {
          tick(6);
          store.transact((s) => hazardCheck(s, hazard, variant.id, "Warning, prohibition and escalation text checked against the English source."));
        }
      }
    }

    // ---------------------------------------------------------------- media: slides in all eight languages
    for (const versionId of [pickup, damaged, conveyor]) {
      for (const language of LANGUAGES) {
        tick(3);
        const variant = variantIn(store.getState(), versionId, language);
        if (variant?.state !== "approved") throw new Error(`Seed: ${language} variant missing`);
        const slide = await createSlide(store, author, versionId, variant.id);
        store.transact((s) => approveMedia(s, language === "en" ? sme : bilingual, slide.id));
      }
    }
    tick(5);
    const figure = importFigure(store, author, {
      versionId: conveyor,
      filename: CONVEYOR_FIGURE_FILENAME,
      bytes: new TextEncoder().encode(CONVEYOR_FIGURE_SVG),
      rightsId: "SYN-IMG-001",
      licenseNote: "Synthetic drawing created for the demonstrator",
    });
    store.transact((s) => approveMedia(s, sme, figure.id));
    for (const language of LANGUAGES) {
      tick(4);
      const variant = variantIn(store.getState(), conveyor, language);
      if (!variant) throw new Error(`Seed: ${language} conveyor variant missing`);
      const labels = ANNOTATION_LABELS[language];
      const diagram = annotateFigure(store, author, {
        versionId: conveyor,
        variantId: variant.id,
        figureId: figure.id,
        annotations: ANNOTATION_POSITIONS.map(([x, y], i) => ({ x, y, label: labels[i] as string, sourceLabel: ANNOTATION_LABELS.en[i] as string })),
      });
      store.transact((s) => approveMedia(s, language === "en" ? sme : bilingual, diagram.id));
    }

    // ---------------------------------------------------------------- practice
    tick(20);
    store.transact((s) =>
      createScenario(s, author, {
        scenarioKey: SCENARIO_KEY,
        title: "Damaged packaging at pickup",
        taskId: "T-PICKUP",
        linkedObjectKey: DAMAGED_KEY,
        definition: SCENARIO_DEFINITION,
      }),
    );
  } finally {
    setClockOffset(0);
  }
  if (withActivity) generateActivity(store);
  store.transact((s) => {
    s.seededAt = new Date(nowMs()).toISOString();
  });
}

type Ctx = { task_id?: string; situation_code?: string; asset_id?: string; equipment_model?: string; query?: string };

/** Synthetic usage produced by calling the real delivery, practice and event code paths. */
export function generateActivity(store: Store, seedValue = 42): void {
  const random = rng(seedValue);
  store.transact((s) => {
    const p = (username: string) => principalOf(s.users.find((u) => u.username === username) as User);
    const rider = p("arjun.rider");
    const tech = p("lakshmi.tech");
    const sup = p("deepa.supervisor");
    const perLanguage = (who: Principal, ctx: Ctx, en: number, other: number): [Principal, Ctx, Language, number][] =>
      LANGUAGES.map((lang) => [who, ctx, lang, lang === "en" ? en : other + (lang.charCodeAt(1) % 4)]);
    const patterns: [Principal, Ctx, Language, number][] = [
      ...perLanguage(rider, { task_id: "T-PICKUP" }, 34, 6),
      ...perLanguage(rider, { task_id: "T-PICKUP", situation_code: "DAMAGED_PACKAGE" }, 22, 5),
      ...perLanguage(tech, { task_id: "T-CONV-INSPECT", equipment_model: "CV-1000" }, 20, 4),
      [tech, { task_id: "T-CONV-INSPECT", asset_id: "EQ-1000-A" }, "en", 12],
      [tech, { task_id: "T-CONV-INSPECT" }, "en", 7],
      [tech, { task_id: "T-CONV-INSPECT", asset_id: "EQ-2000-X" }, "en", 5],
      [rider, { task_id: "T-PICKUP", situation_code: "ADDRESS_MISMATCH" }, "en", 9],
      [rider, { task_id: "T-PICKUP", situation_code: "LEAKING_CONTENTS" }, "en", 6],
      [rider, { task_id: "T-RETURNS" }, "en", 7],
      [rider, { task_id: "T-COD-REVIEW" }, "en", 5],
      [rider, { query: "parcel packaging is torn" }, "en", 8],
      [rider, { query: "parcel weight limit kg" }, "en", 6],
      [rider, { query: "पैकेजिंग फटी" }, "hi", 5],
      [rider, { query: "ಪ್ಯಾಕೇಜಿಂಗ್ ಹಾನಿ" }, "kn", 5],
      [sup, { task_id: "T-COD-REVIEW" }, "en", 10],
    ];
    for (const [who, ctx, language, count] of patterns) {
      for (let i = 0; i < count; i++) {
        const response = resolve(s, who, {
          contract_version: CONTRACT_VERSION,
          tenant_id: TENANT,
          request_id: newId(),
          host_app_id: "demo-mobile",
          host_version: "0.1.0",
          language,
          ...ctx,
        });
        const refs = response.media_refs ?? [];
        if (response.outcome === "answer" && refs.length && random() < 0.6) {
          const ref = refs[Math.floor(random() * refs.length)] as (typeof refs)[number];
          ingestEvent(s, who, {
            event_name: "media.opened",
            schema_version: CONTRACT_VERSION,
            event_id: newId(),
            tenant: TENANT,
            actor: pseudonym(who.userId),
            timestamp: new Date(nowMs()).toISOString(),
            context: { task_id: ctx.task_id ?? null, media_type: ref.type },
            object_id: response.object_id,
            object_version: response.object_version,
            language,
            outcome: "ok",
            channel: "demo-mobile",
          });
        }
      }
    }
    const scenario = s.scenarios.find((x) => x.scenarioKey === SCENARIO_KEY);
    if (scenario) {
      for (let i = 0; i < 34; i++) {
        const language = LANGUAGES[i % LANGUAGES.length] as Language;
        attempt(s, rider, { scenarioId: scenario.id, variant: "guided", choiceId: pick(random, ["A", "B", "C"], [3, 6, 1]), hintsUsed: Math.floor(random() * 3), language });
      }
      for (let i = 0; i < 21; i++) {
        const language = LANGUAGES[(i * 3) % LANGUAGES.length] as Language;
        attempt(s, rider, { scenarioId: scenario.id, variant: "independent", choiceId: pick(random, ["W", "X", "Y", "Z"], [2, 1, 2, 6]), hintsUsed: 0, language });
      }
    }
    const now = nowMs();
    const backdate = () => new Date(now - Math.floor(random() * 28) * DAY - Math.floor(random() * 900) * 60000).toISOString();
    for (const e of s.events) e.occurredAt = backdate();
    for (const a of s.attempts) a.createdAt = backdate();
  });
}
