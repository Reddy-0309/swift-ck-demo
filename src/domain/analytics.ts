// Analytics & Insight. Every dashboard figure is produced by running one documented SQL
// statement (shown to users) against the stored events, using SQLite compiled to
// WebAssembly — the same SQL the production backend runs on PostgreSQL. Breakdown cells
// below the minimum size are suppressed. No number is produced by a language model.

import type { Database, SqlJsStatic } from "sql.js";
import { Forbidden, ValidationFailed, newId, nowMs, pseudonym, type Principal } from "./core";
import { C5AnalyticsEvent, CLIENT_EVENTS } from "./contracts";
import { getObject, sourceVariantOf } from "./governance";
import type { DemoState } from "./types";

export const MIN_CELL_SIZE = 5;
export const RETENTION_DAYS = 365;
const REQUEST_EVENTS = ["knowledge.viewed", "knowledge.abstained", "knowledge.need_context", "knowledge.not_permitted"];
const GOVERNANCE_ACTIONS = [
  "version.published",
  "version.returned",
  "version.superseded",
  "version.withdrawn",
  "version.suspended",
  "translation.approved",
  "media.approved",
];

// ----------------------------------------------------------------------------- intake

export function ingestEvent(s: DemoState, p: Principal, raw: unknown): "accepted" | "duplicate" {
  const event = C5AnalyticsEvent.parse(raw);
  if (event.tenant !== p.tenantId) throw new Forbidden("Event tenant does not match the signed-in identity");
  if (event.actor !== pseudonym(p.userId)) throw new Forbidden("Event actor must be the caller's pseudonymous id");
  if (!CLIENT_EVENTS.has(event.event_name)) throw new ValidationFailed(`'${event.event_name}' is recorded by the system and cannot be submitted`, "server_event");
  if (event.object_id != null && !s.versions.some((v) => v.objectId === event.object_id && v.version === event.object_version)) {
    throw new ValidationFailed("object_id/object_version does not exist");
  }
  if (s.events.some((e) => e.eventId === event.event_id)) return "duplicate";
  s.events.push({
    id: newId(),
    eventId: event.event_id,
    eventName: event.event_name,
    schemaVersion: event.schema_version,
    actor: event.actor,
    occurredAt: event.timestamp,
    context: event.context,
    taskId: event.context.task_id ?? null,
    mediaType: event.context.media_type ?? null,
    detail: null,
    objectId: event.object_id ?? null,
    objectVersion: event.object_version ?? null,
    language: event.language ?? null,
    outcome: event.outcome ?? null,
    channel: event.channel,
    synthetic: true,
  });
  return "accepted";
}

export function retentionCutoff(): string {
  return new Date(nowMs() - RETENTION_DAYS * 86400000).toISOString();
}

export function purgeExpired(s: DemoState): number {
  const cutoff = retentionCutoff();
  const before = s.events.length;
  s.events = s.events.filter((e) => e.occurredAt >= cutoff);
  return before - s.events.length;
}

// ----------------------------------------------------------------------------- SQL engine

let sqlPromise: Promise<SqlJsStatic> | null = null;
let wasmLocator: (file: string) => string = (file) => file;

/** Where the sql-wasm.wasm file is served from (set by the app or tests). */
export function setWasmLocator(locator: (file: string) => string): void {
  wasmLocator = locator;
  sqlPromise = null;
}

function sqlEngine(): Promise<SqlJsStatic> {
  // SQLite (WebAssembly) is only downloaded when a dashboard is first opened.
  sqlPromise ??= import("sql.js").then(({ default: initSqlJs }) => initSqlJs({ locateFile: (file: string) => wasmLocator(file), useOldExtensionFunctions: false }));
  return sqlPromise;
}

const SCHEMA = `
CREATE TABLE analytics_events (event_id TEXT PRIMARY KEY, event_name TEXT, actor TEXT, occurred_at TEXT,
  task_id TEXT, media_type TEXT, detail TEXT, object_id TEXT, object_version INTEGER, language TEXT,
  outcome TEXT, channel TEXT, synthetic INTEGER);
CREATE INDEX events_by_time ON analytics_events (occurred_at, event_name);
CREATE TABLE knowledge_objects (id TEXT PRIMARY KEY, object_key TEXT, title TEXT);
CREATE TABLE scenario_attempts (id TEXT PRIMARY KEY, mode TEXT, correct INTEGER, language TEXT, created_at TEXT);
CREATE TABLE scenario_rule_results (attempt_id TEXT, mode TEXT, rule_id TEXT, met INTEGER, created_at TEXT);
CREATE TABLE audit_log (id TEXT PRIMARY KEY, action TEXT, at TEXT);
`;

function load(db: Database, s: DemoState): void {
  db.run(SCHEMA);
  db.run("BEGIN");
  const ev = db.prepare("INSERT INTO analytics_events VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
  for (const e of s.events) {
    ev.run([e.eventId, e.eventName, e.actor, e.occurredAt, e.taskId, e.mediaType, e.detail, e.objectId, e.objectVersion, e.language, e.outcome, e.channel, e.synthetic ? 1 : 0]);
  }
  ev.free();
  const ob = db.prepare("INSERT INTO knowledge_objects VALUES (?,?,?)");
  for (const o of s.objects) ob.run([o.id, o.objectKey, o.title]);
  ob.free();
  const at = db.prepare("INSERT INTO scenario_attempts VALUES (?,?,?,?,?)");
  const rr = db.prepare("INSERT INTO scenario_rule_results VALUES (?,?,?,?,?)");
  for (const a of s.attempts) {
    at.run([a.id, a.mode, a.correct ? 1 : 0, a.language, a.createdAt]);
    for (const r of a.ruleResults) rr.run([a.id, a.mode, r.ruleId, r.met ? 1 : 0, a.createdAt]);
  }
  at.free();
  rr.free();
  const au = db.prepare("INSERT INTO audit_log VALUES (?,?,?)");
  for (const a of s.audit) au.run([a.id, a.action, a.at]);
  au.free();
  db.run("COMMIT");
}

// ----------------------------------------------------------------------------- indicators

export interface IndicatorDef {
  id: string;
  title: string;
  description: string;
  /** Documented SQL; `:since` is the start of the selected period (ISO-8601). */
  sql: string;
  keys: string[];
  denominatorLabel: string;
  breakdown: boolean;
}

const REQ = REQUEST_EVENTS.map((e) => `'${e}'`).join(", ");
const GOV = GOVERNANCE_ACTIONS.map((a) => `'${a}'`).join(", ");
const IN_PERIOD = "occurred_at >= :since";

export const INDICATORS: IndicatorDef[] = [
  {
    id: "retrieval_outcomes",
    title: "What workers got",
    description: "Every request for guidance, by outcome.",
    sql: `SELECT outcome AS k1, COUNT(*) AS n FROM analytics_events WHERE event_name IN (${REQ}) AND ${IN_PERIOD} GROUP BY outcome ORDER BY n DESC`,
    keys: ["outcome"],
    denominatorLabel: "requests",
    breakdown: false,
  },
  {
    id: "requests_by_day",
    title: "Requests per day",
    description: "Requests for guidance per calendar day (IST).",
    sql: `SELECT date(occurred_at, '+330 minutes') AS k1, COUNT(*) AS n FROM analytics_events WHERE event_name IN (${REQ}) AND ${IN_PERIOD} GROUP BY k1 ORDER BY k1`,
    keys: ["day"],
    denominatorLabel: "requests",
    breakdown: false,
  },
  {
    id: "active_workers",
    title: "Active workers",
    description: "Distinct pseudonymous workers who asked for guidance.",
    sql: `SELECT 'workers' AS k1, COUNT(DISTINCT actor) AS n FROM analytics_events WHERE event_name IN (${REQ}) AND ${IN_PERIOD}`,
    keys: ["metric"],
    denominatorLabel: "workers",
    breakdown: false,
  },
  {
    id: "object_views",
    title: "Most-used procedures",
    description: "Answers served, by procedure and exact version.",
    sql: `SELECT o.title AS k1, CAST(e.object_version AS TEXT) AS k2, COUNT(*) AS n FROM analytics_events e JOIN knowledge_objects o ON o.id = e.object_id WHERE e.event_name = 'knowledge.viewed' AND e.${IN_PERIOD} GROUP BY o.title, e.object_version ORDER BY n DESC`,
    keys: ["procedure", "version"],
    denominatorLabel: "answers",
    breakdown: true,
  },
  {
    id: "requests_by_language",
    title: "Requests by language",
    description: "Requests per language the worker used.",
    sql: `SELECT COALESCE(language, '-') AS k1, COUNT(*) AS n FROM analytics_events WHERE event_name IN (${REQ}) AND ${IN_PERIOD} GROUP BY language ORDER BY n DESC`,
    keys: ["language"],
    denominatorLabel: "requests",
    breakdown: true,
  },
  {
    id: "requests_by_task",
    title: "Requests by task",
    description: "Requests per task and outcome.",
    sql: `SELECT COALESCE(task_id, 'Search') AS k1, outcome AS k2, COUNT(*) AS n FROM analytics_events WHERE event_name IN (${REQ}) AND ${IN_PERIOD} GROUP BY task_id, outcome ORDER BY k1, n DESC`,
    keys: ["task", "outcome"],
    denominatorLabel: "requests",
    breakdown: true,
  },
  {
    id: "unresolved_gaps",
    title: "Unanswered requests",
    description: "Requests with no applicable approved answer, by task and reason. Diagnose before acting.",
    sql: `SELECT COALESCE(task_id, 'Search') AS k1, COALESCE(detail, '-') AS k2, COUNT(*) AS n FROM analytics_events WHERE event_name IN ('knowledge.abstained', 'knowledge.need_context') AND ${IN_PERIOD} GROUP BY task_id, detail ORDER BY n DESC`,
    keys: ["task", "reason"],
    denominatorLabel: "unanswered requests",
    breakdown: true,
  },
  {
    id: "practice_by_mode",
    title: "Practice results",
    description: "Correct decisions out of attempts, guided and independent kept apart.",
    sql: "SELECT mode AS k1, SUM(correct) AS n, COUNT(*) AS d FROM scenario_attempts WHERE created_at >= :since GROUP BY mode ORDER BY mode",
    keys: ["mode"],
    denominatorLabel: "attempts",
    breakdown: true,
  },
  {
    id: "rule_accuracy_independent",
    title: "Independent checks by rule",
    description: "Share of independent attempts that met each rule.",
    sql: "SELECT rule_id AS k1, SUM(met) AS n, COUNT(*) AS d FROM scenario_rule_results WHERE mode = 'independent' AND created_at >= :since GROUP BY rule_id ORDER BY rule_id",
    keys: ["rule"],
    denominatorLabel: "rule checks",
    breakdown: true,
  },
  {
    id: "media_consumption",
    title: "Media opened",
    description: "Slides, diagrams and audio opened from answers. Opening is not understanding.",
    sql: `SELECT COALESCE(media_type, '-') AS k1, event_name AS k2, COUNT(*) AS n FROM analytics_events WHERE event_name IN ('media.opened', 'media.played') AND ${IN_PERIOD} GROUP BY media_type, event_name ORDER BY n DESC`,
    keys: ["media", "event"],
    denominatorLabel: "media events",
    breakdown: true,
  },
  {
    id: "governance_events",
    title: "Content changes",
    description: "Publications, translations and withdrawals from the audit log.",
    sql: `SELECT action AS k1, COUNT(*) AS n FROM audit_log WHERE action IN (${GOV}) AND at >= :since GROUP BY action ORDER BY n DESC`,
    keys: ["action"],
    denominatorLabel: "changes",
    breakdown: false,
  },
];

export interface IndicatorRow {
  keys: Record<string, string>;
  value: number | null;
  denominator: number | null;
  rate: number | null;
  suppressed: boolean;
}

export interface IndicatorResult extends IndicatorDef {
  total: number;
  denominatorTotal: number;
  rows: IndicatorRow[];
  suppressedCells: number;
  minCellSize: number;
}

function compute(db: Database, def: IndicatorDef, since: string): IndicatorResult {
  const result = db.exec(def.sql, { ":since": since })[0];
  const rows: IndicatorRow[] = [];
  let total = 0;
  let denominatorTotal = 0;
  let suppressed = 0;
  for (const values of result?.values ?? []) {
    const record = Object.fromEntries((result?.columns ?? []).map((c, i) => [c, values[i]]));
    const n = Number(record.n ?? 0);
    const d = record.d === undefined || record.d === null ? null : Number(record.d);
    total += n;
    denominatorTotal += d ?? n;
    const hide = def.breakdown && (d ?? n) < MIN_CELL_SIZE;
    if (hide) suppressed += 1;
    rows.push({
      keys: Object.fromEntries(def.keys.map((k, i) => [k, String(record[`k${i + 1}`] ?? "-")])),
      value: hide ? null : n,
      denominator: hide ? null : d,
      rate: hide || !d ? null : Math.round((n / d) * 10000) / 10000,
      suppressed: hide,
    });
  }
  return { ...def, total, denominatorTotal, rows, suppressedCells: suppressed, minCellSize: MIN_CELL_SIZE };
}

export interface ReconciliationCheck {
  indicator: string;
  dashboardTotal: number;
  rawCount: number;
  match: boolean;
}

export interface Dashboard {
  dataLabel: string;
  generatedAt: string;
  since: string;
  indicators: IndicatorResult[];
  reconciliation: { allMatch: boolean; checks: ReconciliationCheck[] };
  caveats: string[];
}

/** Start of a period of `days` days ending now (whole IST days). */
export function periodStart(days: number): string {
  const ist = new Date(nowMs() + 330 * 60000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - (days - 1) * 86400000 - 330 * 60000).toISOString();
}

export async function dashboard(s: DemoState, since = periodStart(30)): Promise<Dashboard> {
  const SQL = await sqlEngine();
  const db = new SQL.Database();
  try {
    load(db, s);
    const indicators = INDICATORS.map((d) => compute(db, d, since));
    const byId = Object.fromEntries(indicators.map((i) => [i.id, i]));
    const inPeriod = s.events.filter((e) => e.occurredAt >= since);
    const count = (...names: string[]) => inPeriod.filter((e) => names.includes(e.eventName)).length;
    const attempts = s.attempts.filter((a) => a.createdAt >= since).length;
    const checks: [string, number, number][] = [
      ["retrieval_outcomes", byId.retrieval_outcomes?.total ?? -1, count(...REQUEST_EVENTS)],
      ["requests_by_day", byId.requests_by_day?.total ?? -1, count(...REQUEST_EVENTS)],
      ["requests_by_task", byId.requests_by_task?.total ?? -1, count(...REQUEST_EVENTS)],
      ["object_views", byId.object_views?.total ?? -1, count("knowledge.viewed")],
      ["practice_by_mode", byId.practice_by_mode?.denominatorTotal ?? -1, attempts],
      ["practice_events", count("practice.attempted"), attempts],
      ["media_consumption", byId.media_consumption?.total ?? -1, count("media.opened", "media.played")],
    ];
    const results = checks.map(([indicator, dashboardTotal, rawCount]) => ({ indicator, dashboardTotal, rawCount, match: dashboardTotal === rawCount }));
    return {
      dataLabel: s.events.every((e) => e.synthetic) ? "Synthetic demonstration data" : "Authorized event data",
      generatedAt: new Date(nowMs()).toISOString(),
      since,
      indicators,
      reconciliation: { allMatch: results.every((r) => r.match), checks: results },
      caveats: [
        "Opening a slide or playing audio is not proof of understanding.",
        "A correlation is not an operational improvement.",
        "Frequent help requests are not evidence of low competence. Diagnose the cause first.",
      ],
    };
  } finally {
    db.close();
  }
}

// ----------------------------------------------------------------------------- review effort

function minutes(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  return Math.round(((Date.parse(end) - Date.parse(start)) / 60000) * 10) / 10;
}

export function corrections(snapshot: { id: string; type: string; text: string }[], final: { id: string; type: string; text: string }[]) {
  const before = new Map(snapshot.map((b) => [b.id, b]));
  const after = new Map(final.map((b) => [b.id, b]));
  const added = [...after.keys()].filter((k) => !before.has(k)).length;
  const removed = [...before.keys()].filter((k) => !after.has(k)).length;
  const changed = [...after.keys()].filter((k) => {
    const a = before.get(k);
    const b = after.get(k);
    return a && b && (a.type !== b.type || a.text !== b.text);
  }).length;
  return { added, removed, changed, total: added + removed + changed };
}

export interface ReviewEffortRow {
  objectKey: string;
  version: number;
  language: string;
  kind: "source (SME)" | "translation (bilingual)";
  method: string;
  blocks: number;
  reviewMinutes: number | null;
  hazardMinutes: number | null;
  corrections: ReturnType<typeof corrections> | null;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/** AP-07: elapsed review minutes per object and language, with SME correction counts. */
export function reviewEffort(s: DemoState) {
  const snapshots = new Map(
    s.audit.filter((a) => a.action === "version.drafted").map((a) => [a.entityId, a.details.snapshot as { id: string; type: string; text: string }[] | undefined]),
  );
  const rows: ReviewEffortRow[] = [];
  for (const v of [...s.versions].filter((x) => x.approvedAt).sort((a, b) => getObject(s, a.objectId).objectKey.localeCompare(getObject(s, b.objectId).objectKey) || a.version - b.version)) {
    const key = getObject(s, v.objectId).objectKey;
    const src = sourceVariantOf(s, v.id);
    const snapshot = snapshots.get(v.id);
    rows.push({
      objectKey: key,
      version: v.version,
      language: src?.language ?? "-",
      kind: "source (SME)",
      method: v.extractionMethod,
      blocks: src?.blocks.length ?? 0,
      reviewMinutes: minutes(v.submittedAt, v.approvedAt),
      hazardMinutes: null,
      corrections: snapshot && src ? corrections(snapshot, src.blocks) : null,
    });
    for (const t of s.variants.filter((x) => x.versionId === v.id && !x.isSource).sort((a, b) => a.language.localeCompare(b.language))) {
      rows.push({
        objectKey: key,
        version: v.version,
        language: t.language,
        kind: "translation (bilingual)",
        method: "human translation",
        blocks: t.blocks.length,
        reviewMinutes: minutes(t.draftedAt, t.reviewedAt),
        hazardMinutes: minutes(t.draftedAt, t.hazardCheckedAt),
        corrections: null,
      });
    }
  }
  const sme = rows.filter((r) => r.kind === "source (SME)" && r.reviewMinutes !== null).map((r) => r.reviewMinutes as number);
  const bil = rows.filter((r) => r.kind !== "source (SME)" && r.reviewMinutes !== null).map((r) => r.reviewMinutes as number);
  const corr = rows.filter((r) => r.corrections).map((r) => (r.corrections as { total: number }).total);
  return {
    rows,
    summary: {
      objectsReviewed: sme.length,
      medianSmeMinutes: median(sme),
      translationsReviewed: bil.length,
      medianBilingualMinutes: median(bil),
      correctionsPerObject: corr.length ? Math.round((corr.reduce((a, b) => a + b, 0) / corr.length) * 100) / 100 : null,
    },
    note: "Elapsed minutes between workflow steps (submit → approve, draft → sign-off). They bound effort from above; timed SME sessions are still needed for B1.",
  };
}
