// Read-only views over the state, shared by several screens.

import { effectiveRisk, getObject, sourceVariantOf, variantsOf } from "../domain/governance";
import type { Applicability, DemoState, Language, ObjectVersion, RiskClass, VariantState, VersionState } from "../domain/types";

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
  languages: [Language, VariantState][];
  applicability: Applicability;
  author: string;
  approver: string | null;
  approvedAt: string | null;
  uncertainBlocks: number;
}

export function userName(s: DemoState, id: string | null | undefined): string {
  if (!id) return "—";
  return s.users.find((u) => u.id === id)?.displayName ?? id;
}

export function summarize(s: DemoState, v: ObjectVersion): VersionSummary {
  const source = sourceVariantOf(s, v.id);
  return {
    id: v.id,
    objectId: v.objectId,
    objectKey: getObject(s, v.objectId).objectKey,
    title: source?.title ?? getObject(s, v.objectId).title,
    version: v.version,
    state: v.state,
    riskClass: v.riskClass,
    effectiveRisk: effectiveRisk(v),
    distributionClass: v.distributionClass,
    languages: variantsOf(s, v.id)
      .sort((a, b) => Number(b.isSource) - Number(a.isSource) || a.language.localeCompare(b.language))
      .map((x) => [x.language, x.state]),
    applicability: v.applicability,
    author: userName(s, v.authorId),
    approver: v.approverId ? userName(s, v.approverId) : null,
    approvedAt: v.approvedAt,
    uncertainBlocks: source?.blocks.filter((b) => b.uncertain).length ?? 0,
  };
}

export function versionSummaries(s: DemoState, states?: VersionState[]): VersionSummary[] {
  return s.versions
    .filter((v) => !states || states.includes(v.state))
    .map((v) => summarize(s, v))
    .sort((a, b) => a.objectKey.localeCompare(b.objectKey) || b.version - a.version);
}
