// Deterministic rule-based extractor (the demo's AI-drafting adapter). It never runs a model,
// never publishes, and quotes the source verbatim so every block links to a source span.
// The production backend adds a local-model adapter behind the same interface.

import { META_LINE, metadataKey, metadataValue, type ParsedSource } from "./ingestion";
import type { BlockType } from "./types";

export interface ExtractedBlock {
  type: BlockType;
  text: string;
  sourceQuote: string;
  uncertain: boolean;
  uncertaintyNote: string;
}

export interface ExtractedObject {
  title: string;
  sectionHeading: string;
  taskIds: string[];
  roles: string[];
  assetIds: string[];
  equipmentModels: string[];
  situationCodes: string[];
  workflowStates: string[];
  escalationRoute: string | null;
  blocks: ExtractedBlock[];
}

export interface Extractor {
  name: string;
  extract(source: ParsedSource): ExtractedObject[];
}

const HEDGES =
  /\b(may|might|should|as needed|if possible|where appropriate|as appropriate|approximately|about|etc\.?|and so on|tbd|to be confirmed)\b/i;

export function uncertaintyFor(text: string): string {
  const notes: string[] = [];
  const hedge = HEDGES.exec(text);
  if (hedge) notes.push(`hedged wording '${hedge[0]}'`);
  if (text.length > 400) notes.push("very long block; may combine several steps");
  if (/[,;-]$|\b(and|or)$/.test(text.trim())) notes.push("block appears truncated");
  return notes.join("; ");
}

const NUMBERED = /^\s*(?:step\s*)?(\d{1,3})[.):]\s+(.+)$/i;
const BULLET = /^\s*[-*•]\s+(.+)$/;
const LABELLED =
  /^\s*(warning|caution|danger|prohibited|exception|escalation|escalate|condition|precondition|prerequisite|note)\s*[:\-–]\s*(.+)$/i;
const LABEL_TYPE: Record<string, BlockType> = {
  warning: "warning",
  caution: "warning",
  danger: "warning",
  prohibited: "prohibition",
  exception: "exception",
  escalation: "escalation",
  escalate: "escalation",
  condition: "condition",
  precondition: "condition",
  prerequisite: "condition",
  note: "note",
};
const PROHIBITION = /^(do not|don't|never|must not|you must not|under no circumstances)\b/i;
const EXCEPTION = /^(if|when|in case|where)\b.+\b(then|,)/i;
const ESCALATION = /\b(escalate|contact (your|the) (supervisor|hub|control)|report (it )?to (your|the) (supervisor|hub))\b/i;
const CONDITION = /^(before (you|starting|beginning)|only (when|if|after)|ensure that|make sure)\b/i;
const SKIP_SECTIONS = /^(purpose|scope|document control|revision history|references)\b/i;

function classify(text: string, numbered: boolean): BlockType | null {
  if (PROHIBITION.test(text)) return "prohibition";
  if (ESCALATION.test(text) && !numbered) return "escalation";
  if (CONDITION.test(text)) return "condition";
  if (EXCEPTION.test(text) && !numbered) return "exception";
  return numbered ? "step" : null;
}

function blockFor(line: string): ExtractedBlock | null {
  const stripped = line.trim();
  const labelled = LABELLED.exec(stripped);
  if (labelled) {
    const text = (labelled[2] as string).trim();
    const note = uncertaintyFor(text);
    return { type: LABEL_TYPE[(labelled[1] as string).toLowerCase()] as BlockType, text, sourceQuote: text, uncertain: !!note, uncertaintyNote: note };
  }
  const numbered = NUMBERED.exec(stripped);
  const bullet = BULLET.exec(stripped);
  const text = (numbered ? (numbered[2] as string) : bullet ? (bullet[1] as string) : stripped).trim();
  const type = classify(text, !!numbered);
  if (!type) return null;
  const note = uncertaintyFor(text);
  return { type, text, sourceQuote: text, uncertain: !!note, uncertaintyNote: note };
}

function asList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export const heuristicExtractor: Extractor = {
  name: "heuristic-v1",
  extract(source) {
    const objects: ExtractedObject[] = [];
    for (const section of source.sections) {
      if (SKIP_SECTIONS.test(section.heading)) continue;
      let body = source.text.slice(section.start, section.end).split("\n");
      if (body[0]?.trim() === section.heading) body = body.slice(1);
      const meta: Record<string, string | string[]> = {};
      const blocks: ExtractedBlock[] = [];
      for (const line of body.filter((l) => l.trim())) {
        const m = META_LINE.exec(line);
        const key = m ? metadataKey(m[1] as string) : undefined;
        if (m && key && !LABELLED.test(line)) {
          meta[key] = metadataValue(key, m[2] as string);
          continue;
        }
        const block = blockFor(line);
        if (block) blocks.push(block);
      }
      if (!blocks.length) continue;
      const pick = (key: string) => asList(meta[key] ?? source.metadata[key]);
      const route = meta.escalation_route ?? source.metadata.escalation_route;
      objects.push({
        title: section.heading,
        sectionHeading: section.heading,
        taskIds: pick("task_id"),
        roles: pick("roles"),
        assetIds: pick("asset_ids"),
        equipmentModels: pick("equipment_models"),
        situationCodes: pick("situation_codes"),
        workflowStates: pick("workflow_states"),
        escalationRoute: typeof route === "string" && route ? route : null,
        blocks,
      });
    }
    return objects;
  },
};
