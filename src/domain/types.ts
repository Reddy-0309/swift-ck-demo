// Domain entities. They mirror the full-stack schema so the demo can later be backed by
// the production API without changing the UI's data shapes.

export const LANGUAGES = ["en", "kn", "ta", "te", "hi", "ml", "mr", "bn"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<Language, { english: string; native: string; script: string }> = {
  en: { english: "English", native: "English", script: "Latin" },
  kn: { english: "Kannada", native: "ಕನ್ನಡ", script: "Kannada" },
  ta: { english: "Tamil", native: "தமிழ்", script: "Tamil" },
  te: { english: "Telugu", native: "తెలుగు", script: "Telugu" },
  hi: { english: "Hindi", native: "हिन्दी", script: "Devanagari" },
  ml: { english: "Malayalam", native: "മലയാളം", script: "Malayalam" },
  mr: { english: "Marathi", native: "मराठी", script: "Devanagari" },
  bn: { english: "Bengali", native: "বাংলা", script: "Bengali" },
};

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

export type VersionState = "draft" | "in_review" | "published" | "superseded" | "withdrawn" | "suspended";
export const IMMUTABLE_STATES: VersionState[] = ["published", "superseded", "withdrawn", "suspended"];
export type RiskClass = "LOW" | "MEDIUM" | "HIGH";
export type Distribution = "general" | "restricted";
export type VariantState = "draft" | "approved" | "withdrawn";
export type BlockType = "step" | "warning" | "prohibition" | "condition" | "exception" | "escalation" | "note";
export const BLOCK_TYPES: BlockType[] = ["step", "warning", "prohibition", "condition", "exception", "escalation", "note"];
export const HAZARD_TYPES: BlockType[] = ["warning", "prohibition", "escalation"];
export type MediaType = "slide" | "narration" | "source_figure" | "annotated_diagram";
export type MediaState = "draft" | "approved" | "rejected";
export type ContextKind = "role" | "task" | "asset" | "equipment_model" | "situation";

export interface User {
  id: string;
  tenantId: string;
  username: string;
  displayName: string;
  roles: string[];
  workRole: string | null;
}

export interface ContextCode {
  kind: ContextKind;
  code: string;
  label: string;
}

export interface Section {
  id: string;
  heading: string;
  start: number;
  end: number;
}

export interface SourceDocument {
  id: string;
  documentKey: string;
  revision: number;
  title: string;
  filename: string;
  mediaType: string;
  sha256: string;
  sizeBytes: number;
  fileKey: string;
  language: Language;
  rightsCleared: boolean;
  rightsNote: string;
  synthetic: boolean;
  text: string;
  sections: Section[];
  metadata: Record<string, string | string[]>;
  status: "active" | "superseded";
  supersededById: string | null;
  uploadedBy: string;
  uploadedAt: string;
}

export interface SourceSpan {
  start: number;
  end: number;
  sectionId: string | null;
  section: string | null;
  quote: string;
}

export interface Block {
  id: string;
  type: BlockType;
  order: number;
  text: string;
  sourceSpan: SourceSpan | null;
  uncertain: boolean;
  uncertaintyNote: string;
}

export interface Applicability {
  roles: string[];
  taskIds: string[];
  assetIds: string[];
  equipmentModels: string[];
  situationCodes: string[];
  workflowStates: string[];
  screenIds: string[];
  escalationRoute: string | null;
}

export interface KnowledgeObject {
  id: string;
  objectKey: string;
  title: string;
  createdBy: string;
  createdAt: string;
}

export interface ObjectVersion {
  id: string;
  objectId: string;
  version: number;
  state: VersionState;
  riskClass: RiskClass | null;
  distributionClass: Distribution | null;
  applicability: Applicability;
  sourceDocumentId: string | null;
  sourceHash: string | null;
  extractionMethod: string;
  changeReason: string;
  contentHash: string | null;
  authorId: string;
  submittedAt: string | null;
  approverId: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  supersededById: string | null;
  withdrawnAt: string | null;
  withdrawnBy: string | null;
  stateReason: string;
  createdAt: string;
}

export interface LanguageVariant {
  id: string;
  versionId: string;
  language: Language;
  isSource: boolean;
  title: string;
  blocks: Block[];
  state: VariantState;
  contentHash: string | null;
  draftedBy: string;
  draftedAt: string;
  reviewerId: string | null;
  reviewedAt: string | null;
  hazardCheckerId: string | null;
  hazardCheckedAt: string | null;
  approvedAt: string | null;
  withdrawnAt: string | null;
  reviewNotes: string;
}

export interface Annotation {
  n: number;
  x: number;
  y: number;
  label: string;
  sourceLabel: string;
}

export interface MediaAsset {
  id: string;
  versionId: string;
  languageVariantId: string | null;
  type: MediaType;
  title: string;
  objectVersionHash: string;
  languageContentHash: string | null;
  rightsId: string;
  licenseNote: string;
  state: MediaState;
  stale: boolean;
  staleReason: string;
  fileKey: string;
  mimeType: string;
  sha256: string;
  sizeBytes: number;
  scriptText: string | null;
  annotations: Annotation[];
  verification: Record<string, unknown>;
  sourceFigureId: string | null;
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface ScenarioChoice {
  id: string;
  ruleResults: Record<string, boolean>;
}

export interface ScenarioText {
  situation: string;
  rules: Record<string, string>;
  guided: { prompt: string; hints: string[]; choices: Record<string, { label: string; consequence: string; feedback: string }> };
  independent: { prompt: string; choices: Record<string, { label: string; consequence: string; feedback: string }> };
}

export interface ScenarioDefinition {
  rules: string[];
  guided: ScenarioChoice[];
  independent: ScenarioChoice[];
  text: Partial<Record<Language, ScenarioText>>;
}

export interface Scenario {
  id: string;
  scenarioKey: string;
  version: number;
  title: string;
  taskId: string | null;
  linkedObjectKey: string | null;
  definition: ScenarioDefinition;
  active: boolean;
  synthetic: boolean;
  createdBy: string;
  createdAt: string;
}

export type AttemptMode = "assisted" | "independent";

export interface ScenarioAttempt {
  id: string;
  scenarioId: string;
  scenarioKey: string;
  scenarioVersion: number;
  variant: "guided" | "independent";
  mode: AttemptMode;
  actor: string;
  language: Language;
  choiceId: string;
  ruleResults: { ruleId: string; met: boolean }[];
  correct: boolean;
  hintsUsed: number;
  knowledgeObjectVersion: number | null;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  eventId: string;
  eventName: string;
  schemaVersion: string;
  actor: string;
  occurredAt: string;
  context: Record<string, string | null>;
  taskId: string | null;
  mediaType: string | null;
  detail: string | null;
  objectId: string | null;
  objectVersion: number | null;
  language: string | null;
  outcome: string | null;
  channel: string;
  synthetic: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
}

export interface KnowledgePackageRecord {
  id: string;
  packageVersion: number;
  generatedAt: string;
  generatedBy: string;
  manifest: PackageManifest;
  sha256: string;
  fileKey: string;
  objectCount: number;
}

export interface PackageManifest {
  format: "swift-ck-knowledge-package";
  format_version: "0.1";
  contract_version: "0.1-demo";
  package_version: number;
  tenant_id: string;
  generated_at: string;
  generated_by: string;
  distribution: "general";
  role_scope: string[];
  languages: string[];
  object_count: number;
  objects: { object_id: string; object_key: string; version: number; content_hash: string; languages: string[]; media: string[] }[];
  withdrawn: { object_id: string; object_key: string; last_packaged_version: number | null; status: string; since: string | null }[];
  update_responsibility: Record<string, string>;
  update_instructions: string[];
  license_notes: string[];
  runtime_requirements: { generative_ai: boolean; network_service: boolean; telemetry: boolean };
}

export interface DemoState {
  schema: number;
  tenantId: string;
  seededAt: string;
  users: User[];
  context: ContextCode[];
  sources: SourceDocument[];
  objects: KnowledgeObject[];
  versions: ObjectVersion[];
  variants: LanguageVariant[];
  media: MediaAsset[];
  scenarios: Scenario[];
  attempts: ScenarioAttempt[];
  events: AnalyticsEvent[];
  audit: AuditEntry[];
  packages: KnowledgePackageRecord[];
}
