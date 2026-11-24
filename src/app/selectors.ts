// Read-only views over the state, shared by several screens.

import { clientForKey, clientOfScenario, type Client, type ClientModule } from "../domain/clients";
import { can, type Principal } from "../domain/core";
import { effectiveRisk, getObject, hazardCheckRequired, sourceVariantOf, variantsOf } from "../domain/governance";
import { approvalCapability } from "../domain/media";
import { LANGUAGES, type Applicability, type DemoState, type Language, type ObjectVersion, type RiskClass, type VariantState, type VersionState } from "../domain/types";

export interface VersionSummary {
  id: string;
  objectId: string;
  objectKey: string;
  title: string;
  version: number;
  state: VersionState;
  riskClass: RiskClass | null;
  effectiveRisk: RiskClass;
  distributionClass: ObjectVersion["distributionClass"];
  languages: Partial<Record<Language, VariantState>>;
  applicability: Applicability;
  author: string;
  updatedAt: string;
  uncertainBlocks: number;
  sourceLanguage: Language;
}

export function userName(s: DemoState, id: string | null | undefined): string {
  if (!id) return "—";
  return s.users.find((u) => u.id === id)?.displayName.replace(/\s*\(.*\)$/, "") ?? id;
}

export function summarize(s: DemoState, v: ObjectVersion): VersionSummary {
  const source = sourceVariantOf(s, v.id);
  const obj = getObject(s, v.objectId);
  return {
    id: v.id,
    objectId: v.objectId,
    objectKey: obj.objectKey,
    title: source?.title ?? obj.title,
    version: v.version,
    state: v.state,
    riskClass: v.riskClass,
    effectiveRisk: effectiveRisk(v),
    distributionClass: v.distributionClass,
    languages: Object.fromEntries(variantsOf(s, v.id).map((x) => [x.language, x.state])),
    applicability: v.applicability,
    author: userName(s, v.authorId),
    updatedAt: [v.withdrawnAt, v.publishedAt, v.submittedAt, v.createdAt].find(Boolean) as string,
    uncertainBlocks: source?.blocks.filter((b) => b.uncertain).length ?? 0,
    sourceLanguage: source?.language ?? "en",
  };
}

/** The current version of every knowledge object (newest), most recently changed first. */
export function currentVersions(s: DemoState): VersionSummary[] {
  const latest = new Map<string, ObjectVersion>();
  for (const v of s.versions) {
    const prev = latest.get(v.objectId);
    if (!prev || v.version > prev.version) latest.set(v.objectId, v);
  }
  return [...latest.values()].map((v) => summarize(s, v)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function approvedLanguageCount(v: VersionSummary): number {
  return LANGUAGES.filter((l) => v.languages[l] === "approved").length;
}

// ---------------------------------------------------------------- field app

export interface TaskEntry {
  code: string;
  situations: string[];
  needsEquipment: boolean;
}

/**
 * Tasks this work role has guidance for, with the situations they cover. A task stays listed
 * while its guidance is suspended or withdrawn, so the worker gets a clear "no approved answer"
 * instead of the task silently disappearing.
 */
export function tasksForRole(s: DemoState, workRole: string | null): TaskEntry[] {
  if (!workRole) return [];
  const live = s.versions.filter((v) => v.state !== "draft" && v.state !== "in_review" && v.applicability.roles.includes(workRole));
  const tasks = new Map<string, TaskEntry>();
  for (const v of live) {
    for (const code of v.applicability.taskIds) {
      const entry = tasks.get(code) ?? { code, situations: [], needsEquipment: false };
      for (const sc of v.applicability.situationCodes) if (!entry.situations.includes(sc)) entry.situations.push(sc);
      if (v.applicability.assetIds.length || v.applicability.equipmentModels.length) entry.needsEquipment = true;
      tasks.set(code, entry);
    }
  }
  const order = s.context.filter((c) => c.kind === "task").map((c) => c.code);
  return [...tasks.values()].sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));
}

// ---------------------------------------------------------------- console inbox

export interface InboxItem {
  id: string;
  kind: "review" | "translation" | "hazard" | "media" | "draft" | "suspended";
  title: string;
  detail: string;
  href: string;
  at: string;
}

/** Everything waiting for this person, based on what their roles allow them to do. */
export function inboxFor(s: DemoState, p: Principal): InboxItem[] {
  const items: InboxItem[] = [];
  const title = (versionId: string) => sourceVariantOf(s, versionId)?.title ?? "Untitled";
  for (const v of s.versions) {
    if (v.state === "in_review" && can(p, "version.review") && v.authorId !== p.userId) {
      const flagged = sourceVariantOf(s, v.id)?.blocks.filter((b) => b.uncertain).length ?? 0;
      items.push({
        id: `r-${v.id}`,
        kind: "review",
        title: title(v.id),
        detail: `Review and publish${flagged ? ` · ${flagged} line${flagged === 1 ? "" : "s"} need${flagged === 1 ? "s" : ""} review` : ""}`,
        href: `/knowledge/${v.id}`,
        at: v.submittedAt ?? v.createdAt,
      });
    }
    if (v.state === "draft" && can(p, "draft.edit") && v.authorId === p.userId) {
      items.push({ id: `d-${v.id}`, kind: "draft", title: title(v.id), detail: "Your draft · submit it for review when ready", href: `/knowledge/${v.id}`, at: v.createdAt });
    }
    if (v.state === "suspended" && (can(p, "version.review") || can(p, "draft.edit"))) {
      items.push({ id: `s-${v.id}`, kind: "suspended", title: title(v.id), detail: "Suspended because its source SOP changed · start a new version", href: `/knowledge/${v.id}`, at: v.createdAt });
    }
  }
  for (const variant of s.variants) {
    if (variant.isSource || variant.state !== "draft") continue;
    const version = s.versions.find((v) => v.id === variant.versionId);
    if (version?.state !== "published") continue;
    const href = `/knowledge/${version.id}?tab=languages&lang=${variant.language}`;
    if (can(p, "language.approve") && !variant.reviewerId && variant.draftedBy !== p.userId) {
      items.push({ id: `t-${variant.id}`, kind: "translation", title: title(version.id), detail: `Approve the ${variant.language.toUpperCase()} translation`, href, at: variant.draftedAt });
    }
    if (can(p, "hazard.check") && hazardCheckRequired(s, variant) && !variant.hazardCheckerId && variant.draftedBy !== p.userId && variant.reviewerId !== p.userId) {
      items.push({ id: `h-${variant.id}`, kind: "hazard", title: title(version.id), detail: `Safety check of the ${variant.language.toUpperCase()} translation`, href, at: variant.draftedAt });
    }
  }
  for (const m of s.media) {
    if (m.state === "draft" && !m.stale && can(p, approvalCapability(s, m)) && m.createdBy !== p.userId) {
      items.push({ id: `m-${m.id}`, kind: "media", title: m.title, detail: "Approve media before workers can see it", href: `/knowledge/${m.versionId}?tab=media`, at: m.createdAt });
    }
  }
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

// ---------------------------------------------------------------- activity wording

export const ACTION_LABELS: Record<string, string> = {
  "source.uploaded": "Uploaded a source",
  "source.superseded": "Source replaced by a new revision",
  "extraction.completed": "Extracted drafts",
  "version.drafted": "Created a draft",
  "version.edited": "Edited a draft",
  "version.submitted": "Submitted for review",
  "version.returned": "Returned to draft",
  "version.published": "Published",
  "version.superseded": "Replaced by a newer version",
  "version.withdrawn": "Withdrew",
  "version.suspended": "Suspended",
  "version.discarded": "Discarded a draft",
  "translation.drafted": "Drafted a translation",
  "translation.edited": "Edited a translation",
  "translation.reviewed": "Language review done",
  "translation.hazard_checked": "Safety check done",
  "translation.approved": "Translation approved",
  "translation.withdrawn": "Translation withdrawn",
  "media.created": "Created media",
  "media.approved": "Approved media",
  "media.rejected": "Rejected media",
  "scenario.created": "Created a practice scenario",
  "package.exported": "Exported a knowledge package",
};

/** A readable name for whatever an audit entry is about. */
export function entityName(s: DemoState, type: string, id: string): string {
  if (type === "version") {
    const v = s.versions.find((x) => x.id === id);
    return v ? `${sourceVariantOf(s, v.id)?.title ?? "Knowledge"} v${v.version}` : "Discarded draft";
  }
  if (type === "variant") {
    const variant = s.variants.find((x) => x.id === id);
    return variant ? `${variant.title} (${variant.language.toUpperCase()})` : "Translation";
  }
  if (type === "media") return s.media.find((m) => m.id === id)?.title ?? "Media";
  if (type === "source") {
    const src = s.sources.find((x) => x.id === id);
    return src ? `${src.title} r${src.revision}` : "Source";
  }
  if (type === "package") return s.packages.find((p) => p.id === id) ? `Package v${s.packages.find((p) => p.id === id)?.packageVersion}` : "Package";
  if (type === "scenario") return s.scenarios.find((x) => x.id === id)?.title ?? "Scenario";
  return type;
}

/** Where an audit entry's subject can be opened in the console, if anywhere. */
export function entityHref(s: DemoState, type: string, id: string): string | null {
  if (type === "version") return s.versions.some((v) => v.id === id) ? `/knowledge/${id}` : null;
  if (type === "variant") {
    const variant = s.variants.find((x) => x.id === id);
    return variant ? `/knowledge/${variant.versionId}?tab=languages&lang=${variant.language}` : null;
  }
  if (type === "media") {
    const m = s.media.find((x) => x.id === id);
    return m ? `/knowledge/${m.versionId}?tab=media` : null;
  }
  if (type === "source") return s.sources.some((x) => x.id === id) ? `/sources/${id}` : null;
  return null;
}

// ---------------------------------------------------------------- clients

export type ModuleStatus = "ready" | "partial" | "gap";

export interface ModuleOverview {
  module: ClientModule;
  guides: VersionSummary[];
  missing: string[];
  scenarios: number;
  status: ModuleStatus;
}

export interface ClientOverview {
  client: Client;
  versions: VersionSummary[];
  live: VersionSummary[];
  inProgress: VersionSummary[];
  modules: ModuleOverview[];
  readyModules: number;
  coverage: { language: Language; live: number }[];
  scenarios: number;
  latestPackage: DemoState["packages"][number] | undefined;
}

/** Programme readiness for one client: which modules have live guides, in which languages. */
export function clientOverview(s: DemoState, client: Client, all: VersionSummary[] = currentVersions(s)): ClientOverview {
  const versions = all.filter((v) => clientForKey(v.objectKey)?.id === client.id);
  const live = versions.filter((v) => v.state === "published");
  const modules = client.programme.modules.map((m) => {
    const guides = versions.filter((v) => m.objectKeys.includes(v.objectKey));
    const missing = m.objectKeys.filter((k) => !live.some((v) => v.objectKey === k));
    const scenarios = m.scenarioKeys.filter((k) => s.scenarios.some((x) => x.scenarioKey === k && x.active)).length;
    const status: ModuleStatus = !m.objectKeys.length || missing.length === m.objectKeys.length ? "gap" : missing.length ? "partial" : "ready";
    return { module: m, guides, missing, scenarios, status };
  });
  return {
    client,
    versions,
    live,
    inProgress: versions.filter((v) => v.state !== "published" && v.state !== "superseded" && v.state !== "withdrawn"),
    modules,
    readyModules: modules.filter((m) => m.status === "ready").length,
    coverage: client.languages.map((language) => ({ language, live: live.filter((v) => v.languages[language] === "approved").length })),
    scenarios: s.scenarios.filter((x) => x.active && clientOfScenario(x)?.id === client.id).length,
    latestPackage: s.packages.filter((p) => p.clientId === client.id).sort((a, b) => b.packageVersion - a.packageVersion)[0],
  };
}
