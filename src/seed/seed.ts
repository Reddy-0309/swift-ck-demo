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
  BANK_SOP,
  BANK_SOP_FILENAME,
  PICKUP_SOP,
  PICKUP_SOP_FILENAME,
  PLANT_SOP,
  PLANT_SOP_FILENAME,
  STORE_SOP,
  STORE_SOP_FILENAME,
  buildDocx,
} from "./fixtures";
import { SCENARIO_DEFINITION, SCENARIO_KEY } from "./scenario";
import {
  CASH_KEY,
  CLIENT_TRANSLATIONS,
  FIRE_KEY,
  FORKLIFT_KEY,
  INJURY_KEY,
  KYC_KEY,
  KYC_SCENARIO,
  KYC_SCENARIO_KEY,
  LOTO_KEY,
  LOTO_SCENARIO,
  LOTO_SCENARIO_KEY,
  PENDING_TRANSLATIONS,
  SPILL_KEY,
  SPILL_SCENARIO,
  SPILL_SCENARIO_KEY,
  SUSPICIOUS_KEY,
} from "./clientContent";
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
  ["karthik.forklift", "Karthik (Forklift operator)", ["worker"], "forklift_operator"],
  ["farhan.officer", "Farhan (Branch officer)", ["worker"], "branch_officer"],
  ["priya.store", "Priya (Store associate)", ["worker"], "store_associate"],
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
  { kind: "role", code: "forklift_operator", label: "Forklift operator" },
  { kind: "role", code: "branch_officer", label: "Branch officer" },
  { kind: "role", code: "branch_manager", label: "Branch manager" },
  { kind: "role", code: "store_associate", label: "Store associate" },
  { kind: "task", code: "T-LOTO", label: "Lockout and tagout" },
  { kind: "task", code: "T-FORKLIFT-CHECK", label: "Forklift pre-use check" },
  { kind: "task", code: "T-CASH-OPEN", label: "Opening the cash counter" },
  { kind: "task", code: "T-KYC-CHECK", label: "Customer identity check" },
  { kind: "task", code: "T-SUSPICIOUS-TXN", label: "Suspicious transaction" },
  { kind: "task", code: "T-SPILL", label: "Spill on the shop floor" },
  { kind: "task", code: "T-FIRE-CHECK", label: "Fire exit and extinguisher check" },
  { kind: "task", code: "T-CUSTOMER-INJURY", label: "Customer injury (in review)" },
  { kind: "asset", code: "FL-25-01", label: "Forklift FL-25-01 (synthetic)" },
  { kind: "asset", code: "FL-25-02", label: "Forklift FL-25-02 (synthetic)" },
  { kind: "equipment_model", code: "FL-25", label: "Forklift model FL-25 (fictional)" },
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
    const allDrafts = [...drafts1, ...drafts2];
    const byKey = (key: string): string => {
      const s = store.getState();
      const id = allDrafts.find((v) => getObject(s, s.versions.find((x) => x.id === v)?.objectId ?? "").objectKey === key);
      if (!id) throw new Error(`Seed: expected extracted object '${key}'`);
      return id;
    };

    const publish = (key: string, risk: RiskClass, dist: Distribution, reviewMinutes: number, approver: Principal = sme) => {
      const id = byKey(key);
      tick(12);
      store.transact((s) => submitForReview(s, author, id));
      tick(reviewMinutes);
      store.transact((s) => approveAndPublish(s, approver, id, { riskClass: risk, distributionClass: dist, effectiveFrom: nowIso(), note: "Synthetic demonstration content" }));
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

    const translate = (key: string, versionId: string, language: Language, translation: { title: string; blocks: string[] }, approve = true) => {
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
      if (!approve) return;
      tick(11 + (language.charCodeAt(0) % 9));
      store.transact((s) => bilingualApprove(s, bilingual, variant.id, "Demonstration translation; native-speaker review still required before real use."));
      if (hazardCheckRequired(store.getState(), variant)) {
        tick(6);
        store.transact((s) => hazardCheck(s, hazard, variant.id, "Warning, prohibition and escalation text checked against the English source."));
      }
    };

    // ---------------------------------------------------------------- translations (7 Indic languages)
    for (const [key, versionId] of [
      [PICKUP_KEY, pickup],
      [DAMAGED_KEY, damaged],
      [CONVEYOR_KEY, conveyor],
    ] as const) {
      for (const [language, translation] of Object.entries(TRANSLATIONS[key] ?? {}) as [IndicLanguage, { title: string; blocks: string[] }][]) {
        translate(key, versionId, language, translation);
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

    // ---------------------------------------------------------------- Swift's other clients
    for (const [filename, text] of [
      [PLANT_SOP_FILENAME, PLANT_SOP],
      [BANK_SOP_FILENAME, BANK_SOP],
      [STORE_SOP_FILENAME, STORE_SOP],
    ] as const) {
      tick(60 * 26); // clients were onboarded on different days
      const source = await uploadSource(store, author, filename, new TextEncoder().encode(text), rights);
      tick(4);
      allDrafts.push(...store.transact((s) => extractDrafts(s, author, source.id, heuristicExtractor)).createdVersionIds);
    }
    const released: [string, string][] = [
      [LOTO_KEY, publish(LOTO_KEY, "HIGH", "general", 41)],
      [FORKLIFT_KEY, publish(FORKLIFT_KEY, "MEDIUM", "general", 23, sme2)],
      [CASH_KEY, publish(CASH_KEY, "LOW", "general", 16, sme2)],
      [KYC_KEY, publish(KYC_KEY, "MEDIUM", "general", 29)],
      [SUSPICIOUS_KEY, publish(SUSPICIOUS_KEY, "HIGH", "restricted", 37)],
      [SPILL_KEY, publish(SPILL_KEY, "LOW", "general", 14, sme2)],
      [FIRE_KEY, publish(FIRE_KEY, "MEDIUM", "general", 21, sme2)],
    ];
    // Left in review on purpose: the extractor flagged "may" for the expert to settle.
    tick(18);
    store.transact((s) => submitForReview(s, author, byKey(INJURY_KEY)));
    for (const [key, versionId] of released) {
      for (const [language, translation] of Object.entries(CLIENT_TRANSLATIONS[key] ?? {}) as [Language, { title: string; blocks: string[] }][]) {
        translate(key, versionId, language, translation);
      }
    }
    for (const pending of PENDING_TRANSLATIONS) translate(pending.key, byKey(pending.key), pending.language, pending.translation, false);
    for (const [key, versionId] of released) {
      if (key === SUSPICIOUS_KEY) continue;
      for (const language of LANGUAGES) {
        const variant = variantIn(store.getState(), versionId, language);
        if (variant?.state !== "approved") continue;
        tick(3);
        const slide = await createSlide(store, author, versionId, variant.id);
        store.transact((s) => approveMedia(s, language === "en" ? sme2 : bilingual, slide.id));
      }
    }
    for (const [scenarioKey, title, taskId, linkedObjectKey, definition] of [
      [LOTO_SCENARIO_KEY, "Restart request during lockout", "T-LOTO", LOTO_KEY, LOTO_SCENARIO],
      [KYC_SCENARIO_KEY, "Names that do not match", "T-KYC-CHECK", KYC_KEY, KYC_SCENARIO],
      [SPILL_SCENARIO_KEY, "Spill in a busy aisle", "T-SPILL", SPILL_KEY, SPILL_SCENARIO],
    ] as const) {
      tick(25);
      store.transact((s) => createScenario(s, author, { scenarioKey, title, taskId, linkedObjectKey, definition }));
    }
  } finally {
    setClockOffset(0);
  }
  if (withActivity) generateActivity(store);
  store.transact((s) => {
    s.seededAt = new Date(nowMs()).toISOString();
  });
}

type Ctx = { task_id?: string; situation_code?: string; asset_id?: string; equipment_model?: string; query?: string };

type Kind = "delivery" | "supervisor" | "technician" | "forklift" | "officer" | "manager" | "store";
type Mix = [Language, number][];

/** Share of each client's workforce using each app language (some not yet approved). */
const LOGISTICS_MIX: Mix = [["hi", 22], ["kn", 18], ["en", 16], ["ta", 12], ["te", 12], ["mr", 9], ["bn", 6], ["ml", 5]];
const KINDS: Record<Kind, { role: string; count: number; rate: number; mix: Mix }> = {
  delivery: { role: "delivery_associate", count: 84, rate: 0.62, mix: LOGISTICS_MIX },
  supervisor: { role: "hub_supervisor", count: 14, rate: 0.4, mix: LOGISTICS_MIX },
  technician: { role: "maintenance_technician", count: 26, rate: 0.5, mix: [["ta", 40], ["kn", 20], ["ml", 12], ["en", 13], ["hi", 10], ["te", 5]] },
  forklift: { role: "forklift_operator", count: 20, rate: 0.5, mix: [["ta", 48], ["hi", 24], ["en", 22], ["ml", 6]] },
  officer: { role: "branch_officer", count: 30, rate: 0.45, mix: [["kn", 50], ["en", 30], ["hi", 15], ["te", 5]] },
  manager: { role: "branch_manager", count: 8, rate: 0.3, mix: [["kn", 45], ["en", 55]] },
  store: { role: "store_associate", count: 52, rate: 0.4, mix: [["mr", 45], ["hi", 33], ["en", 15], ["bn", 7]] },
};

const FREE_TEXT: Partial<Record<Kind, Partial<Record<Language, string[]>>>> = {
  delivery: {
    en: ["parcel packaging is torn", "parcel weight limit kg", "box is wet"],
    hi: ["पैकेजिंग फटी", "पार्सल का वज़न"],
    kn: ["ಪ್ಯಾಕೇಜಿಂಗ್ ಹಾನಿ", "ಪಾರ್ಸೆಲ್ ತೂಕ"],
    ta: ["சேதமடைந்த பேக்கேஜிங்"],
    te: ["దెబ్బతిన్న ప్యాకేజింగ్"],
    mr: ["खराब पॅकेजिंग"],
    bn: ["ক্ষতিগ্রস্ত প্যাকেজিং"],
    ml: ["കേടായ പാക്കേജിംഗ്"],
  },
  officer: {
    en: ["photocopy of identity document", "opening cash count differs"],
    kn: ["ಫೋಟೋಕಾಪಿ ಸ್ವೀಕರಿಸಬೇಡಿ"],
    hi: ["मूल दस्तावेज़ फ़ोटोकॉपी"],
  },
  store: {
    en: ["wet floor sign spill", "extinguisher gauge red"],
    hi: ["वेट-फ़्लोर साइन"],
    mr: ["सांडलेले पुसा"],
  },
};

interface Worker {
  principal: Principal;
  language: Language;
  kind: Kind;
}

/** A synthetic workforce across Swift's four clients: pseudonymous identities only. */
function workforce(random: () => number): Worker[] {
  return (Object.entries(KINDS) as [Kind, (typeof KINDS)[Kind]][]).flatMap(([kind, k]) =>
    Array.from({ length: k.count }, (_, i) => ({
      kind,
      language: pick(random, k.mix.map(([l]) => l), k.mix.map(([, w]) => w)),
      principal: { userId: `w-${kind}-${String(i + 1).padStart(3, "0")}`, tenantId: TENANT, displayName: `${kind} ${i + 1}`, roles: ["worker"], workRole: k.role },
    })),
  );
}

function requestFor(kind: Kind, language: Language, random: () => number): Ctx {
  const queries = FREE_TEXT[kind]?.[language] ?? FREE_TEXT[kind]?.en ?? [];
  const query = queries[Math.floor(random() * queries.length)] as string;
  const options: Record<Kind, [Ctx, number][]> = {
    technician: [
      [{ task_id: "T-CONV-INSPECT", equipment_model: "CV-1000" }, 36],
      [{ task_id: "T-CONV-INSPECT", asset_id: "EQ-1000-A" }, 14],
      [{ task_id: "T-CONV-INSPECT", asset_id: "EQ-1000-B" }, 10],
      [{ task_id: "T-CONV-INSPECT" }, 6],
      [{ task_id: "T-CONV-INSPECT", asset_id: "EQ-2000-X" }, 4],
      [{ task_id: "T-LOTO" }, 30],
    ],
    forklift: [
      [{ task_id: "T-FORKLIFT-CHECK", asset_id: "FL-25-01" }, 45],
      [{ task_id: "T-FORKLIFT-CHECK", asset_id: "FL-25-02" }, 35],
      [{ task_id: "T-FORKLIFT-CHECK" }, 12],
      [{ task_id: "T-LOTO" }, 8],
    ],
    supervisor: [
      [{ task_id: "T-COD-REVIEW" }, 80],
      [{ task_id: "T-PICKUP", situation_code: "ADDRESS_MISMATCH" }, 20],
    ],
    delivery: [
      [{ task_id: "T-PICKUP" }, 52],
      [{ task_id: "T-PICKUP", situation_code: "DAMAGED_PACKAGE" }, 19],
      [{ task_id: "T-PICKUP", situation_code: "ADDRESS_MISMATCH" }, 7],
      [{ task_id: "T-PICKUP", situation_code: "LEAKING_CONTENTS" }, 3],
      [{ task_id: "T-RETURNS" }, 5],
      [{ task_id: "T-COD-REVIEW" }, 2],
      [{ query }, 12],
    ],
    officer: [
      [{ task_id: "T-CASH-OPEN" }, 40],
      [{ task_id: "T-KYC-CHECK" }, 34],
      [{ task_id: "T-SUSPICIOUS-TXN" }, 10],
      [{ query }, 16],
    ],
    manager: [
      [{ task_id: "T-SUSPICIOUS-TXN" }, 70],
      [{ task_id: "T-CASH-OPEN" }, 30],
    ],
    store: [
      [{ task_id: "T-SPILL" }, 38],
      [{ task_id: "T-FIRE-CHECK" }, 34],
      [{ task_id: "T-CUSTOMER-INJURY" }, 16],
      [{ query }, 12],
    ],
  };
  const list = options[kind].filter(([ctx]) => !("query" in ctx) || ctx.query);
  return pick<Ctx>(random, list.map(([c]) => c), list.map(([, w]) => w));
}

/** Practice volume per scenario per day, who practises, and the choice that meets every rule. */
const PRACTICE: { key: string; kind: Kind; perDay: number; guided: [string, string[]]; independent: [string, string[]] }[] = [
  { key: SCENARIO_KEY, kind: "delivery", perDay: 6, guided: ["B", ["A", "C"]], independent: ["Z", ["W", "Y", "X"]] },
  { key: LOTO_SCENARIO_KEY, kind: "technician", perDay: 2, guided: ["B", ["A", "C"]], independent: ["X", ["Z", "Y", "W"]] },
  { key: KYC_SCENARIO_KEY, kind: "officer", perDay: 2, guided: ["B", ["A", "C"]], independent: ["X", ["Y", "Z", "W"]] },
  { key: SPILL_SCENARIO_KEY, kind: "store", perDay: 3, guided: ["B", ["A", "C"]], independent: ["X", ["W", "Z", "Y"]] },
];

export const ACTIVITY_DAYS = 90;

/**
 * Ninety days of synthetic usage by 234 frontline workers across four clients, produced by calling
 * the real delivery, event and practice code paths with the clock set to each moment.
 */
export function generateActivity(store: Store, seedValue = 42): void {
  const random = rng(seedValue);
  const workers = workforce(random);
  const scenarios = new Map(store.getState().scenarios.filter((x) => x.active).map((x) => [x.scenarioKey, x]));
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
          const rate = KINDS[worker.kind].rate;
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
        // Practice: guided sessions every day; independent checks become more accurate over time.
        for (const plan of PRACTICE) {
          const scenario = scenarios.get(plan.key);
          if (!scenario) continue;
          const learners = workers.filter((w) => w.kind === plan.kind);
          for (let i = 0; i < plan.perDay; i++) {
            const learner = learners[Math.floor(random() * learners.length)] as Worker;
            const when = at(day);
            if (when > Date.now()) continue;
            setClockOffset(when - Date.now());
            const independent = i >= plan.perDay - Math.max(1, Math.round(plan.perDay / 3));
            const skill = 0.45 + 0.4 * ((ACTIVITY_DAYS - day) / ACTIVITY_DAYS);
            const [right, wrong] = independent ? plan.independent : plan.guided;
            const choiceId = random() < skill + (independent ? 0 : 0.1) ? right : (wrong[Math.floor(random() * wrong.length)] as string);
            attempt(s, learner.principal, {
              scenarioId: scenario.id,
              variant: independent ? "independent" : "guided",
              choiceId,
              hintsUsed: independent ? 0 : Math.floor(random() * 3),
              language: learner.language,
            });
          }
        }
      }
    });
  } finally {
    setClockOffset(0);
  }
}
