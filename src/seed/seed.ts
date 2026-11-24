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
  let elapsed = -100 * DAY;
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

/** Language mix of the synthetic workforce (share of workers whose app language it is). */
const LANGUAGE_MIX: [Language, number][] = [
  ["hi", 22],
  ["kn", 18],
  ["en", 16],
  ["ta", 12],
  ["te", 12],
  ["mr", 9],
  ["bn", 6],
  ["ml", 5],
];

const FREE_TEXT: Partial<Record<Language, string[]>> = {
  en: ["parcel packaging is torn", "parcel weight limit kg", "box is wet", "emergency stop check"],
  hi: ["पैकेजिंग फटी", "पार्सल का वज़न"],
  kn: ["ಪ್ಯಾಕೇಜಿಂಗ್ ಹಾನಿ", "ಪಾರ್ಸೆಲ್ ತೂಕ"],
  ta: ["சேதமடைந்த பேக்கேஜிங்"],
  te: ["దెబ్బతిన్న ప్యాకేజింగ్"],
  mr: ["खराब पॅकेजिंग"],
  bn: ["ক্ষতিগ্রস্ত প্যাকেজিং"],
  ml: ["കേടായ പാക്കേജിംഗ്"],
};

interface Worker {
  principal: Principal;
  language: Language;
  kind: "delivery" | "technician" | "supervisor";
}

/** A synthetic workforce: frontline identities that only exist as pseudonymous activity. */
function workforce(random: () => number): Worker[] {
  const make = (kind: Worker["kind"], workRole: string, count: number): Worker[] =>
    Array.from({ length: count }, (_, i) => ({
      kind,
      language: pick(random, LANGUAGE_MIX.map(([l]) => l), LANGUAGE_MIX.map(([, w]) => w)),
      principal: { userId: `w-${kind}-${String(i + 1).padStart(3, "0")}`, tenantId: TENANT, displayName: `${kind} ${i + 1}`, roles: ["worker"], workRole },
    }));
  return [...make("delivery", "delivery_associate", 84), ...make("technician", "maintenance_technician", 26), ...make("supervisor", "hub_supervisor", 14)];
}

function requestFor(kind: Worker["kind"], language: Language, random: () => number): Ctx {
  if (kind === "technician") {
    return pick<Ctx>(
      random,
      [
        { task_id: "T-CONV-INSPECT", equipment_model: "CV-1000" },
        { task_id: "T-CONV-INSPECT", asset_id: "EQ-1000-A" },
        { task_id: "T-CONV-INSPECT", asset_id: "EQ-1000-B" },
        { task_id: "T-CONV-INSPECT" },
        { task_id: "T-CONV-INSPECT", asset_id: "EQ-2000-X" },
      ],
      [52, 20, 14, 9, 5],
    );
  }
  if (kind === "supervisor") {
    return pick<Ctx>(random, [{ task_id: "T-COD-REVIEW" }, { task_id: "T-PICKUP", situation_code: "ADDRESS_MISMATCH" }], [80, 20]);
  }
  const queries = FREE_TEXT[language] ?? FREE_TEXT.en ?? [];
  const query = queries[Math.floor(random() * queries.length)] as string;
  return pick<Ctx>(
    random,
    [
      { task_id: "T-PICKUP" },
      { task_id: "T-PICKUP", situation_code: "DAMAGED_PACKAGE" },
      { task_id: "T-PICKUP", situation_code: "ADDRESS_MISMATCH" },
      { task_id: "T-PICKUP", situation_code: "LEAKING_CONTENTS" },
      { task_id: "T-RETURNS" },
      { task_id: "T-COD-REVIEW" },
      { query },
    ],
    [52, 19, 7, 3, 5, 2, 12],
  );
}

export const ACTIVITY_DAYS = 90;

/**
 * Ninety days of synthetic usage by a workforce of 124 frontline workers, produced by calling
 * the real delivery, event and practice code paths with the clock set to each moment.
 */
export function generateActivity(store: Store, seedValue = 42): void {
  const random = rng(seedValue);
  const workers = workforce(random);
  const scenario = store.getState().scenarios.find((x) => x.scenarioKey === SCENARIO_KEY);
  const today = new Date(nowMs());
  today.setUTCHours(0, 0, 0, 0);
  const at = (day: number) => today.getTime() - day * DAY + (2.5 + random() * 10) * 3600000; // 08:00–18:30 IST
  try {
    store.transact((s) => {
      for (let day = ACTIVITY_DAYS - 1; day >= 0; day--) {
        const weekday = new Date(today.getTime() - day * DAY).getUTCDay();
        const growth = 0.7 + 0.4 * ((ACTIVITY_DAYS - day) / ACTIVITY_DAYS);
        const volume = (weekday === 0 ? 0.45 : weekday === 6 ? 0.75 : 1) * growth;
        for (const worker of workers) {
          const rate = worker.kind === "delivery" ? 0.62 : worker.kind === "technician" ? 0.5 : 0.4;
          let requests = 0;
          while (random() < rate * volume && requests < 3) requests += 1;
          for (let r = 0; r < requests; r++) {
            const when = at(day);
            if (when > Date.now()) continue;
            setClockOffset(when - Date.now());
            const language = random() < 0.9 ? worker.language : "en";
            const ctx = requestFor(worker.kind, language, random);
            const response = resolve(s, worker.principal, {
              contract_version: CONTRACT_VERSION,
              tenant_id: TENANT,
              request_id: newId(),
              host_app_id: "field-app",
              host_version: "1.4.2",
              language,
              ...ctx,
            });
            const refs = response.media_refs ?? [];
            if (response.outcome === "answer" && refs.length && random() < 0.35) {
              const ref = refs[Math.floor(random() * refs.length)] as (typeof refs)[number];
              setClockOffset(when + 60000 - Date.now());
              ingestEvent(s, worker.principal, {
                event_name: "media.opened",
                schema_version: CONTRACT_VERSION,
                event_id: newId(),
                tenant: TENANT,
                actor: pseudonym(worker.principal.userId),
                timestamp: new Date(nowMs()).toISOString(),
                context: { task_id: ctx.task_id ?? null, media_type: ref.type },
                object_id: response.object_id,
                object_version: response.object_version,
                language,
                outcome: "ok",
                channel: "field-app",
              });
            }
          }
        }
        if (!scenario) continue;
        // Practice: guided sessions every day; independent checks become more accurate over time.
        const learners = workers.filter((w) => w.kind === "delivery");
        for (let i = 0; i < 6; i++) {
          const learner = learners[Math.floor(random() * learners.length)] as Worker;
          const when = at(day);
          if (when > Date.now()) continue;
          setClockOffset(when - Date.now());
          const independent = i >= 4;
          const skill = 0.45 + 0.4 * ((ACTIVITY_DAYS - day) / ACTIVITY_DAYS);
          attempt(s, learner.principal, {
            scenarioId: scenario.id,
            variant: independent ? "independent" : "guided",
            choiceId: independent
              ? pick(random, ["Z", "W", "Y", "X"], [skill, (1 - skill) / 2, (1 - skill) / 3, (1 - skill) / 6])
              : pick(random, ["B", "A", "C"], [skill + 0.1, 1 - skill, 0.1]),
            hintsUsed: independent ? 0 : Math.floor(random() * 3),
            language: learner.language,
          });
        }
      }
    });
  } finally {
    setClockOffset(0);
  }
}
