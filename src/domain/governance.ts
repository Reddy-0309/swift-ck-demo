// Knowledge governance: source intake, drafts, review, publication, translations,
// withdrawal, supersession and source revision. Every rule from the documents is enforced
// here, and every change writes an audit entry.

import {
  Forbidden,
  InvalidState,
  NotFound,
  ValidationFailed,
  canonicalHash,
  newId,
  nowIso,
  requireCap,
  type Principal,
} from "./core";
import type { Extractor } from "./extraction";
import { sectionFor, type ParsedSource } from "./ingestion";
import { missingProtectedTerms } from "./indic";
import { audit } from "./store";
import {
  BLOCK_TYPES,
  HAZARD_TYPES,
  isLanguage,
  type Applicability,
  type Block,
  type BlockType,
  type DemoState,
  type Distribution,
  type KnowledgeObject,
  type Language,
  type LanguageVariant,
  type ObjectVersion,
  type RiskClass,
  type SourceDocument,
  type SourceSpan,
} from "./types";

export class DomainConflict extends ValidationFailed {
  constructor(message: string) {
    super(message, "conflict");
  }
}

// ----------------------------------------------------------------------------- lookups

export function getVersion(s: DemoState, id: string): ObjectVersion {
  const v = s.versions.find((x) => x.id === id);
  if (!v) throw new NotFound("Version not found");
  return v;
}
export function getObject(s: DemoState, id: string): KnowledgeObject {
  const o = s.objects.find((x) => x.id === id);
  if (!o) throw new NotFound("Knowledge object not found");
  return o;
}
export function getSource(s: DemoState, id: string): SourceDocument {
  const d = s.sources.find((x) => x.id === id);
  if (!d) throw new NotFound("Source not found");
  return d;
}
export function getVariant(s: DemoState, id: string): LanguageVariant {
  const v = s.variants.find((x) => x.id === id);
  if (!v) throw new NotFound("Translation not found");
  return v;
}
export function variantsOf(s: DemoState, versionId: string): LanguageVariant[] {
  return s.variants.filter((v) => v.versionId === versionId);
}
export function sourceVariantOf(s: DemoState, versionId: string): LanguageVariant | undefined {
  return s.variants.find((v) => v.versionId === versionId && v.isSource);
}
export function variantIn(s: DemoState, versionId: string, language: string): LanguageVariant | undefined {
  return s.variants.find((v) => v.versionId === versionId && v.language === language);
}
export function versionsOfObject(s: DemoState, objectId: string): ObjectVersion[] {
  return s.versions.filter((v) => v.objectId === objectId).sort((a, b) => a.version - b.version);
}
export function effectiveRisk(v: ObjectVersion): RiskClass {
  return v.riskClass ?? "HIGH"; // unclassified or disputed content is treated as HIGH
}

// ----------------------------------------------------------------------------- helpers

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

export function cleanApplicability(raw: Partial<Applicability>): Applicability {
  const list = (values: string[] | undefined) =>
    [...new Set((values ?? []).map((v) => v.trim()).filter(Boolean))].sort();
  return {
    roles: list(raw.roles),
    taskIds: list(raw.taskIds),
    assetIds: list(raw.assetIds),
    equipmentModels: list(raw.equipmentModels),
    situationCodes: list(raw.situationCodes),
    workflowStates: list(raw.workflowStates),
    screenIds: list(raw.screenIds),
    escalationRoute: raw.escalationRoute?.trim() || null,
  };
}

function locate(text: string, quote: string, used: Set<string>): [number, number] | null {
  let start = text.indexOf(quote);
  while (start !== -1) {
    const key = `${start}:${start + quote.length}`;
    if (!used.has(key)) return [start, start + quote.length];
    start = text.indexOf(quote, start + 1);
  }
  return null;
}

function spanRecord(source: SourceDocument, start: number, end: number): SourceSpan {
  const section = sectionFor(source.sections, start);
  return { start, end, sectionId: section?.id ?? null, section: section?.heading ?? null, quote: source.text.slice(start, end) };
}

function nextVersionNumber(s: DemoState, objectId: string): number {
  return Math.max(0, ...s.versions.filter((v) => v.objectId === objectId).map((v) => v.version)) + 1;
}

function openDraftExists(s: DemoState, objectId: string): boolean {
  return s.versions.some((v) => v.objectId === objectId && (v.state === "draft" || v.state === "in_review"));
}

export function blockSnapshot(blocks: Block[]): { id: string; type: BlockType; text: string }[] {
  return blocks.map((b) => ({ id: b.id, type: b.type, text: b.text }));
}

function newVersion(
  s: DemoState,
  p: Principal,
  objectId: string,
  fields: Partial<ObjectVersion> & { applicability: Applicability },
): ObjectVersion {
  const version: ObjectVersion = {
    id: newId(),
    objectId,
    version: nextVersionNumber(s, objectId),
    state: "draft",
    riskClass: null,
    distributionClass: null,
    sourceDocumentId: null,
    sourceHash: null,
    extractionMethod: "manual",
    changeReason: "",
    contentHash: null,
    authorId: p.userId,
    submittedAt: null,
    approverId: null,
    approvedAt: null,
    publishedAt: null,
    effectiveFrom: null,
    effectiveTo: null,
    supersededById: null,
    withdrawnAt: null,
    withdrawnBy: null,
    stateReason: "",
    createdAt: nowIso(),
    ...fields,
  };
  s.versions.push(version);
  return version;
}

function newSourceVariant(s: DemoState, p: Principal, versionId: string, language: Language, title: string, blocks: Block[]): LanguageVariant {
  const variant: LanguageVariant = {
    id: newId(),
    versionId,
    language,
    isSource: true,
    title,
    blocks,
    state: "draft",
    contentHash: null,
    draftedBy: p.userId,
    draftedAt: nowIso(),
    reviewerId: null,
    reviewedAt: null,
    hazardCheckerId: null,
    hazardCheckedAt: null,
    approvedAt: null,
    withdrawnAt: null,
    reviewNotes: "",
  };
  s.variants.push(variant);
  return variant;
}

function findOrCreateObject(s: DemoState, p: Principal, key: string, title: string): KnowledgeObject {
  let obj = s.objects.find((o) => o.objectKey === key);
  if (!obj) {
    obj = { id: newId(), objectKey: key, title, createdBy: p.userId, createdAt: nowIso() };
    s.objects.push(obj);
  }
  return obj;
}

function markMediaStale(s: DemoState, versionId: string, reason: string): void {
  for (const m of s.media) {
    if (m.versionId === versionId && !m.stale) {
      m.stale = true;
      m.staleReason = reason;
    }
  }
}

// ============================================================================ sources

export interface SourceInput {
  parsed: ParsedSource;
  filename: string;
  mediaType: string;
  sha256: string;
  fileKey: string;
  sizeBytes: number;
  rightsCleared: boolean;
  rightsNote: string;
  synthetic: boolean;
  documentKey?: string;
  title?: string;
  language?: Language;
}

export function registerSource(s: DemoState, p: Principal, input: SourceInput): SourceDocument {
  requireCap(p, "source.upload");
  if (!input.rightsCleared) {
    throw new ValidationFailed("Only synthetic or rights-cleared material may be ingested (data rule D-02)", "rights_not_cleared");
  }
  const meta = input.parsed.metadata;
  const key = slugify(input.documentKey || String(meta.document_key ?? "") || input.filename.replace(/\.[^.]+$/, ""));
  const previous = s.sources
    .filter((d) => d.documentKey === key && d.status === "active")
    .sort((a, b) => b.revision - a.revision)[0];
  if (previous && previous.sha256 === input.sha256) {
    throw new DomainConflict("This exact file is already the active revision");
  }
  const metaLanguage = typeof meta.language === "string" && isLanguage(meta.language) ? meta.language : undefined;
  const source: SourceDocument = {
    id: newId(),
    documentKey: key,
    revision: Math.max(0, ...s.sources.filter((d) => d.documentKey === key).map((d) => d.revision)) + 1,
    title: input.title || String(meta.title ?? "") || input.filename.replace(/\.[^.]+$/, ""),
    filename: input.filename,
    mediaType: input.mediaType,
    sha256: input.sha256,
    sizeBytes: input.sizeBytes,
    fileKey: input.fileKey,
    language: metaLanguage ?? input.language ?? "en",
    rightsCleared: true,
    rightsNote: input.rightsNote,
    synthetic: input.synthetic,
    text: input.parsed.text,
    sections: input.parsed.sections,
    metadata: meta,
    status: "active",
    supersededById: null,
    uploadedBy: p.userId,
    uploadedAt: nowIso(),
  };
  s.sources.push(source);
  audit(s, p, "source.uploaded", "source", source.id, { document_key: key, revision: source.revision, sha256: source.sha256 });
  if (previous) supersedeSource(s, p, previous, source);
  return source;
}

function supersedeSource(s: DemoState, p: Principal, old: SourceDocument, next: SourceDocument): void {
  old.status = "superseded";
  old.supersededById = next.id;
  const dependents = s.versions.filter(
    (v) => v.sourceDocumentId === old.id && ["published", "draft", "in_review"].includes(v.state),
  );
  for (const v of dependents) {
    if (v.state === "published") {
      v.state = "suspended";
      v.stateReason = `Source revised to revision ${next.revision}; SME re-review required`;
      markMediaStale(s, v.id, "source document revised");
    } else {
      v.stateReason = "Source revised; re-extract or start a new version before approval";
    }
    audit(s, p, "version.suspended", "version", v.id, { reason: "source_revised", new_source_id: next.id });
  }
  audit(s, p, "source.superseded", "source", old.id, { superseded_by: next.id, dependent_versions: dependents.length });
}

// ============================================================================ drafts

export interface ExtractionReport {
  method: string;
  createdVersionIds: string[];
  rejected: { object: string; type: string; reason: string; text: string }[];
}

export function extractDrafts(s: DemoState, p: Principal, sourceId: string, extractor: Extractor): ExtractionReport {
  requireCap(p, "draft.edit");
  const source = getSource(s, sourceId);
  if (source.status !== "active") throw new InvalidState("Only the active source revision can be extracted");
  const report: ExtractionReport = { method: extractor.name, createdVersionIds: [], rejected: [] };
  const used = new Set<string>();
  for (const extracted of extractor.extract({ text: source.text, sections: source.sections, metadata: source.metadata })) {
    const blocks: Block[] = [];
    extracted.blocks.forEach((b, i) => {
      const span = locate(source.text, b.sourceQuote, used);
      if (!span || !source.text.slice(span[0], span[1]).includes(b.text)) {
        report.rejected.push({ object: extracted.title, type: b.type, reason: "quote_not_in_source", text: b.text.slice(0, 200) });
        return;
      }
      used.add(`${span[0]}:${span[1]}`);
      blocks.push({
        id: `b${i + 1}`,
        type: b.type,
        order: blocks.length,
        text: b.text,
        sourceSpan: spanRecord(source, span[0], span[1]),
        uncertain: b.uncertain,
        uncertaintyNote: b.uncertaintyNote,
      });
    });
    if (!blocks.length) continue;
    const key = `${source.documentKey}.${slugify(extracted.sectionHeading)}`;
    const existing = s.objects.find((o) => o.objectKey === key);
    if (existing && openDraftExists(s, existing.id)) {
      report.rejected.push({ object: extracted.title, type: "object", reason: "open_draft_exists", text: key });
      continue;
    }
    const obj = findOrCreateObject(s, p, key, extracted.title);
    const version = newVersion(s, p, obj.id, {
      applicability: cleanApplicability({
        roles: extracted.roles,
        taskIds: extracted.taskIds,
        assetIds: extracted.assetIds,
        equipmentModels: extracted.equipmentModels,
        situationCodes: extracted.situationCodes,
        workflowStates: extracted.workflowStates,
        escalationRoute: extracted.escalationRoute,
      }),
      sourceDocumentId: source.id,
      sourceHash: source.sha256,
      extractionMethod: extractor.name,
      changeReason: `Extracted from ${source.documentKey} r${source.revision}`,
    });
    newSourceVariant(s, p, version.id, source.language, extracted.title, blocks);
    report.createdVersionIds.push(version.id);
    audit(s, p, "version.drafted", "version", version.id, {
      object_key: key,
      method: extractor.name,
      blocks: blocks.length,
      uncertain: blocks.filter((b) => b.uncertain).length,
      snapshot: blockSnapshot(blocks),
    });
  }
  audit(s, p, "extraction.completed", "source", source.id, {
    method: extractor.name,
    drafts: report.createdVersionIds.length,
    rejected: report.rejected.length,
  });
  return report;
}

export interface BlockInput {
  id?: string;
  type: string;
  text: string;
  sourceSpan?: SourceSpan | null;
  uncertain?: boolean;
  uncertaintyNote?: string;
}

function validateBlocks(blocks: BlockInput[], source: SourceDocument | null): Block[] {
  if (!blocks.length) throw new ValidationFailed("At least one content block is required");
  const seen = new Set<string>();
  return blocks.map((raw, order) => {
    if (!BLOCK_TYPES.includes(raw.type as BlockType)) throw new ValidationFailed(`Invalid block type '${raw.type}'`);
    const text = raw.text.trim();
    if (!text) throw new ValidationFailed("Block text cannot be empty");
    const id = raw.id || `b${newId().slice(0, 8)}`;
    if (seen.has(id)) throw new ValidationFailed(`Duplicate block id '${id}'`);
    seen.add(id);
    let span: SourceSpan | null = null;
    if (source) {
      const { start, end } = raw.sourceSpan ?? { start: -1, end: -1 };
      if (raw.sourceSpan && start >= 0 && start < end && end <= source.text.length && source.text.slice(start, end).includes(text)) {
        span = spanRecord(source, start, end);
      } else {
        const located = locate(source.text, text, new Set());
        if (!located) throw new ValidationFailed(`Block '${id}': its text must appear verbatim in the source document`, "quote_not_in_source");
        span = spanRecord(source, located[0], located[1]);
      }
    }
    return {
      id,
      type: raw.type as BlockType,
      order,
      text,
      sourceSpan: span,
      uncertain: !!raw.uncertain,
      uncertaintyNote: raw.uncertain ? raw.uncertaintyNote ?? "" : "",
    };
  });
}

export function newVersionFrom(s: DemoState, p: Principal, baseId: string): ObjectVersion {
  requireCap(p, "draft.edit");
  const base = getVersion(s, baseId);
  if (openDraftExists(s, base.objectId)) throw new DomainConflict("This object already has an open draft");
  const srcVariant = sourceVariantOf(s, base.id);
  if (!srcVariant) throw new InvalidState("Base version has no source-language content");
  let source = base.sourceDocumentId ? getSource(s, base.sourceDocumentId) : null;
  while (source && source.status !== "active") source = source.supersededById ? getSource(s, source.supersededById) : null;
  const blocks = srcVariant.blocks.map((b) => {
    const copy: Block = { ...b };
    if (source && b.sourceSpan) {
      const located = locate(source.text, b.sourceSpan.quote, new Set());
      if (located) copy.sourceSpan = spanRecord(source, located[0], located[1]);
      else {
        copy.sourceSpan = null;
        copy.uncertain = true;
        copy.uncertaintyNote = "quoted text not found in the revised source";
      }
    }
    return copy;
  });
  const version = newVersion(s, p, base.objectId, {
    applicability: structuredClone(base.applicability),
    riskClass: base.riskClass,
    distributionClass: base.distributionClass,
    sourceDocumentId: source?.id ?? null,
    sourceHash: source?.sha256 ?? null,
    extractionMethod: `rebase:v${base.version}`,
    changeReason: `New draft from v${base.version}`,
  });
  newSourceVariant(s, p, version.id, srcVariant.language, srcVariant.title, blocks);
  audit(s, p, "version.drafted", "version", version.id, {
    object_key: getObject(s, base.objectId).objectKey,
    method: version.extractionMethod,
    snapshot: blockSnapshot(blocks),
  });
  return version;
}

export function updateDraft(
  s: DemoState,
  p: Principal,
  versionId: string,
  patch: { title?: string; blocks?: BlockInput[]; applicability?: Partial<Applicability> },
): ObjectVersion {
  requireCap(p, "draft.edit");
  const version = getVersion(s, versionId);
  if (version.state !== "draft" && version.state !== "in_review") throw new InvalidState("Only draft or in-review versions can be edited");
  if (version.state === "in_review") requireCap(p, "version.review");
  const variant = sourceVariantOf(s, version.id);
  if (!variant) throw new InvalidState("Version has no source-language content");
  const changes: Record<string, unknown> = {};
  if (patch.title !== undefined && patch.title.trim() && patch.title.trim() !== variant.title) {
    variant.title = patch.title.trim();
    changes.title = true;
  }
  if (patch.blocks) {
    const source = version.sourceDocumentId ? getSource(s, version.sourceDocumentId) : null;
    const blocks = validateBlocks(patch.blocks, source);
    changes.blocks_before = variant.blocks.length;
    changes.blocks_after = blocks.length;
    variant.blocks = blocks;
  }
  if (patch.applicability) {
    version.applicability = cleanApplicability(patch.applicability);
    changes.applicability = true;
  }
  if (Object.keys(changes).length) audit(s, p, "version.edited", "version", version.id, { state: version.state, ...changes });
  return version;
}

export function deleteDraft(s: DemoState, p: Principal, versionId: string): void {
  requireCap(p, "draft.edit");
  const version = getVersion(s, versionId);
  if (version.state !== "draft") throw new InvalidState("Only drafts can be discarded");
  s.versions = s.versions.filter((v) => v.id !== versionId);
  s.variants = s.variants.filter((v) => v.versionId !== versionId);
  if (!s.versions.some((v) => v.objectId === version.objectId)) s.objects = s.objects.filter((o) => o.id !== version.objectId);
  audit(s, p, "version.discarded", "version", versionId);
}

// ============================================================================ review

export function submitForReview(s: DemoState, p: Principal, versionId: string): ObjectVersion {
  requireCap(p, "draft.edit");
  const version = getVersion(s, versionId);
  if (version.state !== "draft") throw new InvalidState("Only drafts can be submitted");
  if (!sourceVariantOf(s, version.id)?.blocks.length) throw new ValidationFailed("Draft has no content");
  version.state = "in_review";
  version.submittedAt = nowIso();
  audit(s, p, "version.submitted", "version", version.id);
  return version;
}

export function returnToDraft(s: DemoState, p: Principal, versionId: string, reason: string): ObjectVersion {
  requireCap(p, "version.review");
  const version = getVersion(s, versionId);
  if (version.state !== "in_review") throw new InvalidState("Only versions under review can be returned");
  if (!reason.trim()) throw new ValidationFailed("A reason is required");
  version.state = "draft";
  version.stateReason = reason.trim();
  audit(s, p, "version.returned", "version", version.id, { reason: reason.trim() });
  return version;
}

function blocksForHash(blocks: Block[]) {
  return blocks.map((b) => ({ id: b.id, type: b.type, order: b.order, text: b.text }));
}

export function versionContentHash(s: DemoState, v: ObjectVersion): string {
  const variant = sourceVariantOf(s, v.id);
  return canonicalHash({
    object_id: v.objectId,
    version: v.version,
    applicability: v.applicability,
    risk_class: v.riskClass,
    distribution_class: v.distributionClass,
    source_hash: v.sourceHash,
    language: variant?.language ?? null,
    title: variant?.title ?? null,
    blocks: blocksForHash(variant?.blocks ?? []),
  });
}

export function variantContentHash(v: LanguageVariant): string {
  return canonicalHash({ version_id: v.versionId, language: v.language, title: v.title, blocks: blocksForHash(v.blocks) });
}

export function approveAndPublish(
  s: DemoState,
  p: Principal,
  versionId: string,
  input: { riskClass: RiskClass | null; distributionClass: Distribution; effectiveFrom?: string | null; effectiveTo?: string | null; note?: string },
): ObjectVersion {
  requireCap(p, "version.review");
  const version = getVersion(s, versionId);
  if (version.state !== "in_review") throw new InvalidState("Only versions under review can be approved");
  const variant = sourceVariantOf(s, version.id);
  if (!variant?.blocks.length) throw new ValidationFailed("Version has no source-language content");
  if (p.userId === version.authorId || p.userId === variant.draftedBy) {
    throw new Forbidden("An author cannot approve their own object", "self_approval");
  }
  if (!version.applicability.taskIds.length || !version.applicability.roles.length) {
    throw new ValidationFailed("Applicability needs at least one task and one role");
  }
  const unresolved = variant.blocks.filter((b) => b.uncertain).map((b) => b.id);
  if (unresolved.length) throw new ValidationFailed("Resolve flagged uncertain blocks before approval", "unresolved_flags", { blocks: unresolved });
  if (version.sourceDocumentId) {
    const source = getSource(s, version.sourceDocumentId);
    if (source.status !== "active") throw new InvalidState("The cited source is no longer the active revision");
    if (source.sha256 !== version.sourceHash) throw new InvalidState("Source hash mismatch");
    const missing = variant.blocks.filter((b) => !b.sourceSpan).map((b) => b.id);
    if (missing.length) throw new ValidationFailed("Every block must link to a source span", "missing_span", { blocks: missing });
  }
  const now = nowIso();
  const start = input.effectiveFrom || now;
  if (input.effectiveTo && input.effectiveTo <= start) throw new ValidationFailed("Effective-until must be after effective-from");

  version.riskClass = input.riskClass;
  version.distributionClass = input.distributionClass;
  version.approverId = p.userId;
  version.approvedAt = now;
  version.effectiveFrom = start;
  version.effectiveTo = input.effectiveTo || null;
  version.contentHash = versionContentHash(s, version);
  version.state = "published";
  version.publishedAt = now;
  version.stateReason = input.note ?? "";

  variant.contentHash = variantContentHash(variant);
  variant.reviewerId = p.userId;
  variant.reviewedAt = now;
  variant.approvedAt = now;
  variant.state = "approved";

  for (const old of s.versions) {
    if (old.objectId === version.objectId && old.id !== version.id && (old.state === "published" || old.state === "suspended")) {
      old.state = "superseded";
      old.supersededById = version.id;
      old.stateReason = `Superseded by v${version.version}`;
      markMediaStale(s, old.id, `superseded by v${version.version}`);
      audit(s, p, "version.superseded", "version", old.id, { superseded_by: version.id });
    }
  }
  audit(s, p, "version.published", "version", version.id, {
    risk_class: input.riskClass,
    effective_risk: effectiveRisk(version),
    distribution_class: input.distributionClass,
    content_hash: version.contentHash,
  });
  return version;
}

export function withdrawVersion(s: DemoState, p: Principal, versionId: string, reason: string): ObjectVersion {
  requireCap(p, "version.review");
  const version = getVersion(s, versionId);
  if (version.state !== "published" && version.state !== "suspended") throw new InvalidState("Only published or suspended versions can be withdrawn");
  if (!reason.trim()) throw new ValidationFailed("A withdrawal reason is required");
  const now = nowIso();
  version.state = "withdrawn";
  version.withdrawnAt = now;
  version.withdrawnBy = p.userId;
  version.stateReason = reason.trim();
  for (const v of variantsOf(s, version.id)) {
    if (v.state === "approved") {
      v.state = "withdrawn";
      v.withdrawnAt = now;
    }
  }
  markMediaStale(s, version.id, "version withdrawn");
  audit(s, p, "version.withdrawn", "version", version.id, { reason: reason.trim() });
  return version;
}

// ============================================================================ languages

export function hazardCheckRequired(s: DemoState, variant: LanguageVariant): boolean {
  return variant.blocks.some((b) => HAZARD_TYPES.includes(b.type)) || effectiveRisk(getVersion(s, variant.versionId)) === "HIGH";
}

export function upsertTranslation(
  s: DemoState,
  p: Principal,
  versionId: string,
  input: { language: Language; title: string; blocks: { id: string; text: string }[] },
): LanguageVariant {
  requireCap(p, "language.draft");
  const version = getVersion(s, versionId);
  if (version.state !== "published") throw new InvalidState("Only published versions can be translated");
  const source = sourceVariantOf(s, version.id);
  if (!source) throw new InvalidState("Version has no source-language content");
  if (input.language === source.language) throw new ValidationFailed("Translation language must differ from the source language");
  const byId = new Map(input.blocks.map((b) => [b.id, b.text]));
  if (byId.size !== input.blocks.length || byId.size !== source.blocks.length || source.blocks.some((b) => !byId.has(b.id))) {
    throw new ValidationFailed("Translation must provide exactly one block per source block");
  }
  if (!input.title.trim()) throw new ValidationFailed("Title is required");
  const problems: Record<string, string[]> = {};
  const blocks: Block[] = source.blocks.map((src) => {
    const text = (byId.get(src.id) ?? "").trim();
    if (!text) throw new ValidationFailed(`Block '${src.id}' has no translated text`);
    const missing = missingProtectedTerms(src.text, text);
    if (missing.length) problems[src.id] = missing;
    return { id: src.id, type: src.type, order: src.order, text, sourceSpan: null, uncertain: false, uncertaintyNote: "" };
  });
  if (Object.keys(problems).length) {
    throw new ValidationFailed("Protected codes, units or numbers were altered", "protected_terms", { blocks: problems });
  }
  let variant = variantIn(s, version.id, input.language);
  if (!variant) {
    variant = {
      id: newId(),
      versionId: version.id,
      language: input.language,
      isSource: false,
      title: input.title.trim(),
      blocks,
      state: "draft",
      contentHash: null,
      draftedBy: p.userId,
      draftedAt: nowIso(),
      reviewerId: null,
      reviewedAt: null,
      hazardCheckerId: null,
      hazardCheckedAt: null,
      approvedAt: null,
      withdrawnAt: null,
      reviewNotes: "",
    };
    s.variants.push(variant);
    audit(s, p, "translation.drafted", "variant", variant.id, { version_id: version.id, language: input.language });
  } else {
    if (variant.state !== "draft") throw new InvalidState("Approved or withdrawn translations cannot be edited");
    Object.assign(variant, {
      title: input.title.trim(),
      blocks,
      draftedBy: p.userId,
      draftedAt: nowIso(),
      reviewerId: null,
      reviewedAt: null,
      hazardCheckerId: null,
      hazardCheckedAt: null,
    });
    audit(s, p, "translation.edited", "variant", variant.id, { version_id: version.id, language: input.language });
  }
  return variant;
}

function completeIfReady(s: DemoState, p: Principal, variant: LanguageVariant): void {
  if (!variant.reviewerId) return;
  if (hazardCheckRequired(s, variant) && !variant.hazardCheckerId) return;
  variant.contentHash = variantContentHash(variant);
  variant.approvedAt = nowIso();
  variant.state = "approved";
  audit(s, p, "translation.approved", "variant", variant.id, { language: variant.language, content_hash: variant.contentHash });
}

function checkReviewable(s: DemoState, variant: LanguageVariant): void {
  if (variant.isSource) throw new InvalidState("Source-language content is approved with the version");
  if (variant.state !== "draft") throw new InvalidState("Translation is not awaiting review");
  if (getVersion(s, variant.versionId).state !== "published") throw new InvalidState("The version is no longer published");
}

export function bilingualApprove(s: DemoState, p: Principal, variantId: string, note = ""): LanguageVariant {
  requireCap(p, "language.approve");
  const variant = getVariant(s, variantId);
  checkReviewable(s, variant);
  if (p.userId === variant.draftedBy) throw new Forbidden("The translator cannot approve their own translation", "self_approval");
  if (p.userId === variant.hazardCheckerId) throw new Forbidden("Bilingual review and hazard check need different people");
  variant.reviewerId = p.userId;
  variant.reviewedAt = nowIso();
  variant.reviewNotes = note;
  audit(s, p, "translation.reviewed", "variant", variant.id, { language: variant.language });
  completeIfReady(s, p, variant);
  return variant;
}

export function hazardCheck(s: DemoState, p: Principal, variantId: string, note = ""): LanguageVariant {
  requireCap(p, "hazard.check");
  const variant = getVariant(s, variantId);
  checkReviewable(s, variant);
  if (p.userId === variant.draftedBy || p.userId === variant.reviewerId) {
    throw new Forbidden("The hazard check must be independent of translator and reviewer");
  }
  variant.hazardCheckerId = p.userId;
  variant.hazardCheckedAt = nowIso();
  if (note) variant.reviewNotes = `${variant.reviewNotes}\n${note}`.trim();
  audit(s, p, "translation.hazard_checked", "variant", variant.id, { language: variant.language });
  completeIfReady(s, p, variant);
  return variant;
}

export function withdrawVariant(s: DemoState, p: Principal, variantId: string, reason: string): LanguageVariant {
  requireCap(p, "version.review");
  const variant = getVariant(s, variantId);
  if (variant.isSource) throw new InvalidState("Withdraw the whole version to withdraw source-language content");
  if (variant.state !== "approved") throw new InvalidState("Only approved translations can be withdrawn");
  variant.state = "withdrawn";
  variant.withdrawnAt = nowIso();
  for (const m of s.media) {
    if (m.languageVariantId === variant.id) {
      m.stale = true;
      m.staleReason = "translation withdrawn";
    }
  }
  audit(s, p, "translation.withdrawn", "variant", variant.id, { reason });
  return variant;
}
