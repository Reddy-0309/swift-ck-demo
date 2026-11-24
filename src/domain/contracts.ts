// Provisional C1–C5 contracts (v0.1-demo), D07 Appendix D. Validated with zod so that the
// same rules apply in the demo and, later, at the production API boundary.

import { z } from "zod";

export const CONTRACT_VERSION = "0.1-demo";

export const CONTRACT_CHANGES = [
  { change: "C2.required_context added for need_context outcomes", reason: "D07 Appendix D proposal; pending D-18 at M0" },
  { change: "C2.reason added: machine code for non-answer outcomes", reason: "Presentations render the correct message; never identifies an object" },
];

const id = z.string().min(1).max(64);
const opt = z.string().max(64).nullish();

export const C1ContextRequest = z
  .object({
    contract_version: z.string(),
    tenant_id: id,
    request_id: id,
    language: z.string().min(2).max(8),
    task_id: opt,
    workflow_state: opt,
    screen_id: opt,
    asset_id: opt,
    equipment_model: opt,
    zone_id: opt,
    situation_code: opt,
    query: z.string().max(500).nullish(),
    host_app_id: id,
    host_version: z.string().min(1).max(32),
  })
  .strict();
export type C1ContextRequest = z.infer<typeof C1ContextRequest>;

export const Outcome = z.enum(["answer", "abstain", "need_context", "not_permitted"]);
export type Outcome = z.infer<typeof Outcome>;

const ContentBlock = z
  .object({
    id: z.string(),
    type: z.enum(["step", "warning", "prohibition", "condition", "exception", "escalation", "note"]),
    order: z.number().int().min(0),
    text: z.string().min(1),
  })
  .strict();

const SourceCitation = z
  .object({
    source_document_id: z.string(),
    document_key: z.string(),
    title: z.string(),
    revision: z.number().int(),
    section: z.string().nullable(),
    span_start: z.number().int().nullable(),
    span_end: z.number().int().nullable(),
  })
  .strict();

const MediaRef = z
  .object({
    media_id: z.string(),
    type: z.enum(["slide", "narration", "source_figure", "annotated_diagram"]),
    title: z.string(),
    rendition_uri: z.string(),
    object_version_hash: z.string(),
  })
  .strict();

export const C2KnowledgeResponse = z
  .object({
    contract_version: z.literal(CONTRACT_VERSION),
    request_id: z.string(),
    outcome: Outcome,
    object_id: z.string().nullable(),
    object_version: z.number().int().nullable(),
    language_version_id: z.string().nullable(),
    risk_class: z.enum(["LOW", "MEDIUM", "HIGH"]).nullable(),
    title: z.string().nullable(),
    content: z.array(ContentBlock).nullable(),
    approved_explanation_id: z.null(),
    source_citation: SourceCitation.nullable(),
    effective_from: z.string().nullable(),
    effective_to: z.string().nullable(),
    media_refs: z.array(MediaRef).nullable(),
    escalation_route: z.string().nullable(),
    required_context: z.array(z.string()).nullable(),
    reason: z.string().nullable(),
  })
  .strict()
  .superRefine((r, ctx) => {
    const objectFields = [r.object_id, r.object_version, r.language_version_id, r.risk_class, r.content, r.source_citation, r.effective_from];
    if (r.outcome === "answer") {
      if (objectFields.some((f) => f === null) || !r.content?.length) {
        ctx.addIssue({ code: "custom", message: "answer requires object, version, content and citation fields" });
      }
      if (r.required_context) ctx.addIssue({ code: "custom", message: "answer must not carry required_context" });
    } else {
      if (objectFields.some((f) => f !== null) || r.media_refs?.length) {
        ctx.addIssue({ code: "custom", message: `${r.outcome} must not carry object fields` });
      }
      if (r.outcome === "need_context" && !r.required_context?.length) {
        ctx.addIssue({ code: "custom", message: "need_context requires required_context" });
      }
      if (r.outcome !== "need_context" && r.required_context) {
        ctx.addIssue({ code: "custom", message: "required_context is only valid for need_context" });
      }
    }
  });
export type C2KnowledgeResponse = z.infer<typeof C2KnowledgeResponse>;
export type MediaRef = z.infer<typeof MediaRef>;

export const C3ContentVersionReference = z
  .object({
    object_id: z.string(),
    version: z.number().int(),
    source_document_id: z.string().nullable(),
    source_hash: z.string().nullable(),
    span: z.array(z.object({ start: z.number(), end: z.number(), quote: z.string(), section: z.string().nullable() })).nullable(),
    approval_state: z.string(),
    approver: z.string().nullable(),
    effective_from: z.string().nullable(),
    effective_to: z.string().nullable(),
    superseded_by: z.string().nullable(),
    withdrawn_at: z.string().nullable(),
  })
  .strict();
export type C3ContentVersionReference = z.infer<typeof C3ContentVersionReference>;

export const C4MediaReference = z
  .object({
    media_id: z.string(),
    type: z.string(),
    object_version_hash: z.string(),
    language_version_id: z.string().nullable(),
    rights_license_id: z.string().min(1),
    approval_state: z.string(),
    rendition_uri: z.string(),
  })
  .strict();
export type C4MediaReference = z.infer<typeof C4MediaReference>;

export const OBJECT_BOUND_EVENTS = new Set(["knowledge.viewed", "media.played", "media.opened"]);
export const CLIENT_EVENTS = new Set(["help.opened", "media.opened", "media.played"]);
const KNOWN_EVENTS = new Set([
  ...OBJECT_BOUND_EVENTS,
  "practice.attempted",
  "knowledge.abstained",
  "knowledge.need_context",
  "knowledge.not_permitted",
  "help.opened",
]);

export const C5AnalyticsEvent = z
  .object({
    event_name: z.string().min(3).max(64),
    schema_version: z.literal(CONTRACT_VERSION),
    event_id: z.string().min(8).max(64),
    tenant: id,
    actor: id,
    timestamp: z.string().datetime({ offset: true }),
    context: z.record(z.string().nullable()).default({}),
    object_id: z.string().nullish(),
    object_version: z.number().int().min(1).nullish(),
    language: z.string().nullish(),
    outcome: z.string().max(32).nullish(),
    channel: z.string().min(1).max(32),
  })
  .strict()
  .superRefine((e, ctx) => {
    if (!KNOWN_EVENTS.has(e.event_name)) ctx.addIssue({ code: "custom", message: `unknown event_name '${e.event_name}'` });
    if (OBJECT_BOUND_EVENTS.has(e.event_name) && (e.object_id == null || e.object_version == null)) {
      ctx.addIssue({ code: "custom", message: `${e.event_name} requires object_id and object_version` });
    }
  });
export type C5AnalyticsEvent = z.infer<typeof C5AnalyticsEvent>;

export function emptyResponse(requestId: string): C2KnowledgeResponse {
  return {
    contract_version: CONTRACT_VERSION,
    request_id: requestId,
    outcome: "abstain",
    object_id: null,
    object_version: null,
    language_version_id: null,
    risk_class: null,
    title: null,
    content: null,
    approved_explanation_id: null,
    source_citation: null,
    effective_from: null,
    effective_to: null,
    media_refs: null,
    escalation_route: null,
    required_context: null,
    reason: null,
  };
}
