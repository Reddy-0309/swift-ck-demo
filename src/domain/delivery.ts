// Knowledge delivery: C1 context request → C2 knowledge response.
// 1. contract version and identity; 2. only published, effective, approved-language content;
// 3. deterministic permission and applicability checks; 4. context-key lookup, or retrieval
// when a free-text query is given; 5. verbatim rendering with citation (no generative path);
// 6. one analytics event with the exact object version.

import { DomainError, newId, nowIso, pseudonym, type Principal } from "./core";
import {
  C1ContextRequest,
  CONTRACT_VERSION,
  emptyResponse,
  type C2KnowledgeResponse,
  type MediaRef,
} from "./contracts";
import { effectiveRisk, getObject, getSource, sourceVariantOf, variantIn } from "./governance";
import { rank } from "./retrieval";
import type { DemoState, Language, LanguageVariant, ObjectVersion } from "./types";

export const RETRIEVAL_MIN_SCORE = 0.35;
const AMBIGUITY_MARGIN = 0.05;

export class ContractVersionError extends DomainError {
  constructor(version: string) {
    super(`Unsupported contract_version '${version}'; expected ${CONTRACT_VERSION}`, "unsupported_contract_version");
  }
}

interface Decision {
  outcome: C2KnowledgeResponse["outcome"];
  version?: ObjectVersion;
  variant?: LanguageVariant;
  requiredContext?: string[];
  reason?: string;
}

export function eligibleVersions(s: DemoState, at = nowIso()): ObjectVersion[] {
  return s.versions.filter(
    (v) =>
      v.state === "published" &&
      !v.withdrawnAt &&
      v.effectiveFrom !== null &&
      v.effectiveFrom <= at &&
      (v.effectiveTo === null || v.effectiveTo > at),
  );
}

function distinguishing(versions: ObjectVersion[]): string[] {
  const fields: [keyof ObjectVersion["applicability"], string][] = [
    ["situationCodes", "situation_code"],
    ["screenIds", "screen_id"],
    ["assetIds", "asset_id"],
    ["workflowStates", "workflow_state"],
  ];
  const needed = fields
    .filter(([key]) => new Set(versions.map((v) => JSON.stringify(v.applicability[key]))).size > 1)
    .map(([, name]) => name);
  return needed.length ? needed : ["query"];
}

function decide(s: DemoState, req: C1ContextRequest, p: Principal): Decision {
  if (req.tenant_id !== p.tenantId) return { outcome: "not_permitted", reason: "tenant_mismatch" };
  if (!req.task_id && !req.query) return { outcome: "need_context", requiredContext: ["task_id"], reason: "missing_task" };

  const role = p.workRole;
  const byTask = eligibleVersions(s).filter((v) => !req.task_id || v.applicability.taskIds.includes(req.task_id));
  const roleOk: ObjectVersion[] = [];
  let restrictedRefused = false;
  for (const v of byTask) {
    if (role && v.applicability.roles.includes(role)) roleOk.push(v);
    // Only a task-scoped request is told "not permitted"; a free-text search never reveals
    // that restricted guidance exists for other roles.
    else if (v.distributionClass !== "general" && req.task_id) restrictedRefused = true;
  }

  const applicable: ObjectVersion[] = [];
  const missing = new Set<string>();
  let situationUncovered = false;
  const freeTextSearch = !!req.query && !req.situation_code;
  for (const v of roleOk) {
    const a = v.applicability;
    if (a.assetIds.length || a.equipmentModels.length) {
      if (!req.asset_id && !req.equipment_model) {
        missing.add("asset_id");
        continue;
      }
      if (!a.assetIds.includes(req.asset_id ?? "") && !a.equipmentModels.includes(req.equipment_model ?? "")) continue;
    }
    if (a.workflowStates.length) {
      if (!req.workflow_state) {
        missing.add("workflow_state");
        continue;
      }
      if (!a.workflowStates.includes(req.workflow_state)) continue;
    }
    if (!freeTextSearch) {
      // A reported situation is never answered with general task steps that may not apply.
      const matches = req.situation_code ? a.situationCodes.includes(req.situation_code) : !a.situationCodes.length;
      if (!matches) {
        if (req.situation_code && !a.situationCodes.length) situationUncovered = true;
        continue;
      }
    }
    if (a.screenIds.length && !a.screenIds.includes(req.screen_id ?? "")) continue;
    applicable.push(v);
  }
  const screenSpecific = applicable.filter((v) => req.screen_id && v.applicability.screenIds.includes(req.screen_id));
  const candidates = screenSpecific.length ? screenSpecific : applicable;

  if (!candidates.length) {
    if (missing.size) return { outcome: "need_context", requiredContext: [...missing].sort(), reason: "missing_context" };
    if (restrictedRefused && !roleOk.length) return { outcome: "not_permitted", reason: "role_not_permitted" };
    if (situationUncovered) return { outcome: "abstain", reason: "situation_not_covered" };
    return { outcome: "abstain", reason: "no_applicable_object" };
  }

  const inLanguage = candidates
    .map((v) => ({ version: v, variant: variantIn(s, v.id, req.language) }))
    .filter((x): x is { version: ObjectVersion; variant: LanguageVariant } => x.variant?.state === "approved");
  if (!inLanguage.length) return { outcome: "abstain", reason: "language_not_approved" };

  if (req.query) {
    const ranked = rank(
      req.query,
      inLanguage.map(({ version, variant }) => {
        const texts: Partial<Record<Language, string>> = {
          [variant.language]: [variant.title, ...variant.blocks.map((b) => b.text)].join(" "),
        };
        const src = sourceVariantOf(s, version.id);
        if (src && src.language !== variant.language) texts[src.language] = [src.title, ...src.blocks.map((b) => b.text)].join(" ");
        return { key: version.id, texts };
      }),
    );
    const top = ranked[0];
    const second = ranked[1];
    if (!top || top.score < RETRIEVAL_MIN_SCORE) return { outcome: "abstain", reason: "no_confident_match" };
    if (second && second.score >= RETRIEVAL_MIN_SCORE && top.score - second.score < AMBIGUITY_MARGIN) {
      return { outcome: "need_context", requiredContext: distinguishing(inLanguage.map((x) => x.version)), reason: "ambiguous_match" };
    }
    const chosen = inLanguage.find((x) => x.version.id === top.key) as { version: ObjectVersion; variant: LanguageVariant };
    return { outcome: "answer", version: chosen.version, variant: chosen.variant };
  }
  if (inLanguage.length > 1) {
    return { outcome: "need_context", requiredContext: distinguishing(inLanguage.map((x) => x.version)), reason: "several_objects_apply" };
  }
  const only = inLanguage[0] as { version: ObjectVersion; variant: LanguageVariant };
  return { outcome: "answer", version: only.version, variant: only.variant };
}

function mediaRefs(s: DemoState, version: ObjectVersion, variant: LanguageVariant): MediaRef[] {
  return s.media
    .filter(
      (m) =>
        m.versionId === version.id &&
        m.state === "approved" &&
        !m.stale &&
        m.objectVersionHash === version.contentHash &&
        (m.languageVariantId === variant.id || m.languageVariantId === null),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((m) => ({ media_id: m.id, type: m.type, title: m.title, rendition_uri: `media:${m.id}`, object_version_hash: m.objectVersionHash }));
}

const EVENT_FOR: Record<C2KnowledgeResponse["outcome"], string> = {
  answer: "knowledge.viewed",
  abstain: "knowledge.abstained",
  need_context: "knowledge.need_context",
  not_permitted: "knowledge.not_permitted",
};

/** Resolve a C1 request. Mutates `s` only to append the analytics event. */
export function resolve(s: DemoState, p: Principal, input: unknown): C2KnowledgeResponse {
  const req = C1ContextRequest.parse(input);
  if (req.contract_version !== CONTRACT_VERSION) throw new ContractVersionError(req.contract_version);
  const d = decide(s, req, p);
  const response = emptyResponse(req.request_id);
  response.outcome = d.outcome;
  if (d.outcome === "answer" && d.version && d.variant) {
    const { version, variant } = d;
    const src = sourceVariantOf(s, version.id) ?? variant;
    const spans = src.blocks.map((b) => b.sourceSpan).filter((x): x is NonNullable<typeof x> => !!x);
    const source = version.sourceDocumentId ? getSource(s, version.sourceDocumentId) : null;
    Object.assign(response, {
      object_id: version.objectId,
      object_version: version.version,
      language_version_id: variant.id,
      risk_class: effectiveRisk(version),
      title: variant.title,
      content: [...variant.blocks].sort((a, b) => a.order - b.order).map((b) => ({ id: b.id, type: b.type, order: b.order, text: b.text })),
      source_citation: source
        ? {
            source_document_id: source.id,
            document_key: source.documentKey,
            title: source.title,
            revision: source.revision,
            section: spans[0]?.section ?? null,
            span_start: spans.length ? Math.min(...spans.map((x) => x.start)) : null,
            span_end: spans.length ? Math.max(...spans.map((x) => x.end)) : null,
          }
        : {
            source_document_id: "manual",
            document_key: getObject(s, version.objectId).objectKey,
            title: variant.title,
            revision: version.version,
            section: null,
            span_start: null,
            span_end: null,
          },
      effective_from: version.effectiveFrom,
      effective_to: version.effectiveTo,
      media_refs: mediaRefs(s, version, variant),
      escalation_route: version.applicability.escalationRoute,
    });
  } else {
    response.required_context = d.requiredContext?.length ? d.requiredContext : null;
    response.reason = d.reason ?? null;
  }
  s.events.push({
    id: newId(),
    eventId: `srv-${newId()}`,
    eventName: EVENT_FOR[d.outcome],
    schemaVersion: CONTRACT_VERSION,
    actor: pseudonym(p.userId),
    occurredAt: nowIso(),
    context: Object.fromEntries(
      Object.entries({
        request_id: req.request_id,
        task_id: req.task_id,
        asset_id: req.asset_id,
        equipment_model: req.equipment_model,
        situation_code: req.situation_code,
        role: p.workRole,
        reason: d.reason,
        query_mode: req.query ? "free_text" : "context_key",
      }).filter(([, v]) => v != null),
    ) as Record<string, string>,
    taskId: req.task_id ?? null,
    mediaType: null,
    detail: d.reason ?? null,
    objectId: response.object_id,
    objectVersion: response.object_version,
    language: req.language,
    outcome: d.outcome,
    channel: req.host_app_id.slice(0, 32),
    synthetic: true,
  });
  return response;
}
