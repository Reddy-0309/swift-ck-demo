// Model A knowledge package (format v0.1): approved, general-distribution knowledge, help
// mappings, media and a manifest, exported for a host application to build in. The
// package has no telemetry and no model dependency. Restricted objects are never included
// (visibility is not authorisation) and the export re-scans its own bytes to prove that no
// restricted text leaked.

import JSZip from "jszip";
import { z } from "zod";
import { NotFound, nowIso, requireCap, type Principal } from "./core";
import { C3ContentVersionReference, C4MediaReference, CONTRACT_VERSION } from "./contracts";
import { effectiveRisk, getObject, sourceVariantOf, variantsOf } from "./governance";
import { extensionOf } from "./ingestion";
import { getClient, type Client } from "./clients";
import { audit, type Store } from "./store";
import type { DemoState, KnowledgePackageRecord, MediaAsset, ObjectVersion, PackageManifest } from "./types";

const ContentBlock = z
  .object({ id: z.string(), type: z.enum(["step", "warning", "prohibition", "condition", "exception", "escalation", "note"]), order: z.number().int(), text: z.string().min(1) })
  .strict();

const HelpMapping = z
  .object({
    task_id: z.string(),
    role: z.string(),
    screen_id: z.string().nullable(),
    asset_id: z.string().nullable(),
    equipment_model: z.string().nullable(),
    situation_code: z.string().nullable(),
    workflow_state: z.string().nullable(),
  })
  .strict();

const PackageObject = z
  .object({
    reference: C3ContentVersionReference,
    object_key: z.string(),
    content_hash: z.string(),
    risk_class: z.enum(["LOW", "MEDIUM", "HIGH"]),
    distribution_class: z.literal("general"),
    publication_status: z.literal("published"),
    escalation_route: z.string().nullable(),
    help_mappings: z.array(HelpMapping).min(1),
    variants: z
      .array(z.object({ language: z.string(), language_version_id: z.string(), content_hash: z.string(), title: z.string(), blocks: z.array(ContentBlock).min(1) }).strict())
      .min(1),
    media: z.array(C4MediaReference),
    course_modules: z.array(z.object({ module_id: z.string(), title: z.string() }).strict()),
  })
  .strict();

const Manifest = z
  .object({
    format: z.literal("swift-ck-knowledge-package"),
    format_version: z.literal("0.1"),
    contract_version: z.literal(CONTRACT_VERSION),
    package_version: z.number().int().min(1),
    tenant_id: z.string(),
    client_id: z.string(),
    client_name: z.string(),
    programme_code: z.string(),
    generated_at: z.string(),
    generated_by: z.string(),
    distribution: z.literal("general"),
    role_scope: z.array(z.string()),
    languages: z.array(z.string()),
    object_count: z.number().int(),
    objects: z.array(
      z.object({ object_id: z.string(), object_key: z.string(), version: z.number().int(), content_hash: z.string(), languages: z.array(z.string()), media: z.array(z.string()) }).strict(),
    ),
    withdrawn: z.array(
      z.object({ object_id: z.string(), object_key: z.string(), last_packaged_version: z.number().int().nullable(), status: z.string(), since: z.string().nullable() }).strict(),
    ),
    update_responsibility: z.record(z.string()),
    update_instructions: z.array(z.string()),
    license_notes: z.array(z.string()),
    runtime_requirements: z.object({ generative_ai: z.literal(false), network_service: z.literal(false), telemetry: z.literal(false) }).strict(),
  })
  .strict();

export const KnowledgePackageV01 = z.object({ manifest: Manifest, objects: z.array(PackageObject) }).strict();
export type KnowledgePackageV01 = z.infer<typeof KnowledgePackageV01>;
type PackageObject = z.infer<typeof PackageObject>;
type HelpMapping = z.infer<typeof HelpMapping>;

export const UPDATE_INSTRUCTIONS = [
  "Replace the previous package as a whole; never merge object files by hand.",
  "Remove every object listed in manifest.withdrawn from the host before release.",
  "Display each object's version and effective date with the guidance.",
  "Deployed packages cannot be revoked remotely; withdrawn guidance stays visible until the host releases this update unless a publication-status check is implemented.",
  "Show only content whose help mapping matches the host's screen, task and role; the host must enforce role visibility.",
];

/** Human-readable description of the package format, shipped inside every package. */
export const PACKAGE_SCHEMA_DOC = {
  title: "Swift CK knowledge package v0.1",
  files: {
    "package.json": "{ manifest, objects[] } — validated against this format before export",
    "media/<media_id>.<ext>": "approved, non-stale media referenced by objects[].media[].rendition_uri",
  },
  object_fields: ["reference (C3)", "object_key", "content_hash", "risk_class", "distribution_class = general", "publication_status = published", "escalation_route", "help_mappings[]", "variants[] (approved languages only)", "media[] (C4)", "course_modules[] (client e-learning modules that link to this object)"],
  manifest_fields: Object.keys(Manifest.shape),
};

function product<T>(lists: T[][]): T[][] {
  return lists.reduce<T[][]>((acc, list) => acc.flatMap((prefix) => list.map((item) => [...prefix, item])), [[]]);
}

export function helpMappings(version: ObjectVersion): HelpMapping[] {
  const a = version.applicability;
  const orNull = (xs: string[]): (string | null)[] => (xs.length ? xs : [null]);
  const combos = product<string | null>([orNull(a.screenIds), orNull(a.assetIds), orNull(a.equipmentModels), orNull(a.situationCodes), orNull(a.workflowStates)]);
  const out: HelpMapping[] = [];
  for (const task of a.taskIds) {
    for (const role of a.roles) {
      for (const [screen, asset, model, situation, workflow] of combos) {
        out.push({
          task_id: task,
          role,
          screen_id: screen ?? null,
          asset_id: asset ?? null,
          equipment_model: model ?? null,
          situation_code: situation ?? null,
          workflow_state: workflow ?? null,
        });
      }
    }
  }
  return out;
}

export function c3Reference(s: DemoState, version: ObjectVersion): C3ContentVersionReference {
  const spans = (sourceVariantOf(s, version.id)?.blocks ?? [])
    .map((b) => b.sourceSpan)
    .filter((x): x is NonNullable<typeof x> => !!x)
    .map((x) => ({ start: x.start, end: x.end, quote: x.quote, section: x.section }));
  return {
    object_id: version.objectId,
    version: version.version,
    source_document_id: version.sourceDocumentId,
    source_hash: version.sourceHash,
    span: spans.length ? spans : null,
    approval_state: version.state,
    approver: version.approverId,
    effective_from: version.effectiveFrom,
    effective_to: version.effectiveTo,
    superseded_by: version.supersededById,
    withdrawn_at: version.withdrawnAt,
  };
}

function latestReleased(s: DemoState): Map<string, ObjectVersion> {
  const latest = new Map<string, ObjectVersion>();
  for (const v of [...s.versions].sort((a, b) => a.version - b.version)) {
    if (v.state !== "draft" && v.state !== "in_review") latest.set(v.objectId, v);
  }
  return latest;
}

function jsonFragment(text: string): string {
  return JSON.stringify(text).slice(1, -1);
}

/** File name a client's package downloads as. */
export function packageFilename(record: Pick<KnowledgePackageRecord, "clientId" | "packageVersion">): string {
  return `swift-knowledge-${record.clientId.replace(/^cl-/, "")}-v${record.packageVersion}.zip`;
}

export interface AssembledPackage {
  client: Client;
  nextVersion: number;
  manifest: PackageManifest;
  packageJson: string;
  mediaFiles: { name: string; media: MediaAsset }[];
}

/**
 * Build (without storing) the next Model A package for one client: only that client's approved
 * general content, schema-validated and scanned for restricted or other-client text.
 */
export function assemblePackage(s: DemoState, p: Principal, clientId: string): AssembledPackage {
  requireCap(p, "package.export");
  const client = getClient(clientId);
  if (!client) throw new NotFound(`Unknown client '${clientId}'`);
  const now = nowIso();
  const previous = s.packages.filter((x) => x.clientId === clientId).sort((a, b) => b.packageVersion - a.packageVersion)[0];
  const nextVersion = previous ? previous.packageVersion + 1 : 1;
  const objects: PackageObject[] = [];
  const mediaFiles: { name: string; media: MediaAsset }[] = [];
  const restrictedTexts: string[] = [];
  const ownKey = (objectId: string) => {
    const key = getObject(s, objectId).objectKey.toLowerCase();
    return client.documentPrefixes.some((prefix) => key.startsWith(prefix));
  };
  const latest = new Map([...latestReleased(s)].filter(([objectId]) => ownKey(objectId)));
  const included = new Set<string>();

  for (const [objectId, version] of latest) {
    const variants = variantsOf(s, version.id);
    const eligible =
      version.state === "published" &&
      version.distributionClass === "general" &&
      version.effectiveFrom !== null &&
      version.effectiveFrom <= now &&
      (version.effectiveTo === null || version.effectiveTo > now);
    if (!eligible) {
      if (version.distributionClass !== "general") restrictedTexts.push(...variants.flatMap((v) => [v.title, ...v.blocks.map((b) => b.text)]));
      continue;
    }
    const approved = variants
      .filter((v) => v.state === "approved")
      .sort((a, b) => Number(b.isSource) - Number(a.isSource) || a.language.localeCompare(b.language))
      .map((v) => ({
        language: v.language,
        language_version_id: v.id,
        content_hash: v.contentHash ?? "",
        title: v.title,
        blocks: [...v.blocks].sort((a, b) => a.order - b.order).map((b) => ({ id: b.id, type: b.type, order: b.order, text: b.text })),
      }));
    const mappings = helpMappings(version);
    if (!approved.length || !mappings.length) continue;
    const media = s.media
      .filter((m) => m.versionId === version.id && m.state === "approved" && !m.stale && m.objectVersionHash === version.contentHash)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const refs = media.map((m) => {
      const name = `media/${m.id}${extensionOf(m.fileKey)}`;
      mediaFiles.push({ name, media: m });
      return {
        media_id: m.id,
        type: m.type,
        object_version_hash: m.objectVersionHash,
        language_version_id: m.languageVariantId,
        rights_license_id: m.rightsId,
        approval_state: m.state,
        rendition_uri: name,
      };
    });
    objects.push({
      reference: c3Reference(s, version),
      object_key: getObject(s, objectId).objectKey,
      content_hash: version.contentHash ?? "",
      risk_class: effectiveRisk(version),
      distribution_class: "general",
      publication_status: "published",
      escalation_route: version.applicability.escalationRoute,
      help_mappings: mappings,
      variants: approved,
      media: refs,
      course_modules: client.programme.modules
        .filter((m) => m.objectKeys.includes(getObject(s, objectId).objectKey))
        .map((m) => ({ module_id: m.id, title: m.title.en })),
    });
    included.add(objectId);
  }

  const previously = new Map((previous?.manifest.objects ?? []).map((o) => [o.object_id, o]));
  const withdrawn: PackageManifest["withdrawn"] = [];
  for (const [objectId, version] of latest) {
    if (included.has(objectId)) continue;
    if (previously.has(objectId) || version.state === "withdrawn") {
      withdrawn.push({
        object_id: objectId,
        object_key: getObject(s, objectId).objectKey,
        last_packaged_version: previously.get(objectId)?.version ?? null,
        status: version.distributionClass === "general" ? version.state : "restricted",
        since: version.withdrawnAt,
      });
    }
  }

  const manifest: PackageManifest = {
    format: "swift-ck-knowledge-package",
    format_version: "0.1",
    contract_version: CONTRACT_VERSION,
    package_version: nextVersion,
    tenant_id: p.tenantId,
    client_id: client.id,
    client_name: client.name,
    programme_code: client.programme.code,
    generated_at: now,
    generated_by: p.displayName,
    distribution: "general",
    role_scope: [...new Set(objects.flatMap((o) => o.help_mappings.map((m) => m.role)))].sort(),
    languages: [...new Set(objects.flatMap((o) => o.variants.map((v) => v.language)))].sort(),
    object_count: objects.length,
    objects: objects.map((o) => ({
      object_id: o.reference.object_id,
      object_key: o.object_key,
      version: o.reference.version,
      content_hash: o.content_hash,
      languages: o.variants.map((v) => v.language),
      media: o.media.map((m) => m.media_id),
    })),
    withdrawn,
    update_responsibility: {
      swift: "revise, re-approve and issue a new package version with change notes",
      host_team: "install, test and release the package",
      customer_smes: "approve authoritative content",
    },
    update_instructions: UPDATE_INSTRUCTIONS,
    license_notes: [...new Set(mediaFiles.map(({ media }) => `${media.rightsId}: ${media.licenseNote || "see rights register"}`))].sort(),
    runtime_requirements: { generative_ai: false, network_service: false, telemetry: false },
  };
  const pkg = KnowledgePackageV01.parse({ manifest, objects });
  const packageJson = JSON.stringify(pkg, null, 2);

  // Defence in depth: prove that no restricted text, and no other client's text, leaked in.
  const versionById = new Map(s.versions.map((v) => [v.id, v]));
  for (const variant of s.variants) {
    const version = versionById.get(variant.versionId);
    if (!version || (ownKey(version.objectId) && version.distributionClass === "general")) continue;
    restrictedTexts.push(variant.title, ...variant.blocks.map((b) => b.text));
  }
  const generalTexts = new Set(objects.flatMap((o) => o.variants.flatMap((v) => [v.title, ...v.blocks.map((b) => b.text)])));
  for (const text of restrictedTexts) {
    if (text && !generalTexts.has(text) && packageJson.includes(jsonFragment(text))) {
      throw new Error("Restricted or other-client text detected in package export; export aborted");
    }
  }

  return { client, nextVersion, manifest, packageJson, mediaFiles };
}

/** Export and store the next Model A package for one client. */
export async function exportPackage(store: Store, p: Principal, clientId: string): Promise<KnowledgePackageRecord> {
  const { client, nextVersion, manifest, packageJson, mediaFiles } = assemblePackage(store.getState(), p, clientId);
  const now = manifest.generated_at;
  const zip = new JSZip();
  zip.file("package.json", packageJson);
  zip.file("schema.json", JSON.stringify(PACKAGE_SCHEMA_DOC, null, 2));
  for (const { name, media } of mediaFiles) zip.file(name, store.getFile(media.fileKey));
  const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  const { key, sha256 } = store.putFile(bytes, ".zip");

  return store.transact((draft) => {
    const record: KnowledgePackageRecord = {
      id: `pkg-${client.id}-${nextVersion}-${sha256.slice(0, 8)}`,
      clientId: client.id,
      packageVersion: nextVersion,
      generatedAt: now,
      generatedBy: p.userId,
      manifest,
      sha256,
      fileKey: key,
      objectCount: manifest.object_count,
    };
    if (draft.packages.some((x) => x.clientId === client.id && x.packageVersion === nextVersion)) throw new Error("Another export finished first; export again");
    draft.packages.push(record);
    audit(draft, p, "package.exported", "package", record.id, { client: client.name, package_version: nextVersion, objects: manifest.object_count, withdrawn: manifest.withdrawn.length, sha256 });
    return record;
  });
}

export async function validatePackageBytes(bytes: Uint8Array): Promise<KnowledgePackageV01> {
  const zip = await JSZip.loadAsync(bytes);
  const file = zip.file("package.json");
  if (!file) throw new NotFound("package.json missing from package");
  return KnowledgePackageV01.parse(JSON.parse(await file.async("string")));
}
