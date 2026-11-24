// Decision practice: a guided variant with hints (recorded as assisted attempts) and an
// unseen independent variant without hints (recorded separately). Scoring is a fixed,
// versioned rule table: deterministic, no speed score and no certification claim.

import { InvalidState, NotFound, ValidationFailed, newId, nowIso, pseudonym, requireCap, type Principal } from "./core";
import { CONTRACT_VERSION } from "./contracts";
import { sourceVariantOf, variantIn } from "./governance";
import { audit } from "./store";
import type { Block, DemoState, Language, Scenario, ScenarioDefinition, ScenarioText } from "./types";

export type VariantName = "guided" | "independent";

export function validateDefinition(d: ScenarioDefinition): void {
  const rules = new Set(d.rules);
  if (!d.rules.length || rules.size !== d.rules.length) throw new ValidationFailed("Rules must be non-empty and unique");
  for (const [name, choices] of [["guided", d.guided], ["independent", d.independent]] as const) {
    if (choices.length < 2) throw new ValidationFailed(`${name}: at least two choices are required`);
    if (new Set(choices.map((c) => c.id)).size !== choices.length) throw new ValidationFailed(`${name}: choice ids must be unique`);
    for (const c of choices) {
      const keys = Object.keys(c.ruleResults);
      if (keys.length !== rules.size || keys.some((k) => !rules.has(k))) {
        throw new ValidationFailed(`${name}/${c.id}: rule results must cover every rule`);
      }
    }
    if (!choices.some((c) => Object.values(c.ruleResults).every(Boolean))) {
      throw new ValidationFailed(`${name}: at least one choice must meet every rule`);
    }
  }
  const english = d.text.en;
  if (!english) throw new ValidationFailed("English scenario text is required");
  for (const [language, text] of Object.entries(d.text) as [Language, ScenarioText][]) {
    if (text.independent.prompt.trim() === text.guided.prompt.trim()) {
      throw new ValidationFailed(`${language}: the independent variant must be an unseen variation`);
    }
    for (const c of d.guided) if (!text.guided.choices[c.id]) throw new ValidationFailed(`${language}: text missing for guided choice ${c.id}`);
    for (const c of d.independent) if (!text.independent.choices[c.id]) throw new ValidationFailed(`${language}: text missing for independent choice ${c.id}`);
    for (const r of d.rules) if (!text.rules[r]) throw new ValidationFailed(`${language}: text missing for rule ${r}`);
  }
}

export function createScenario(
  s: DemoState,
  p: Principal,
  input: { scenarioKey: string; title: string; taskId: string | null; linkedObjectKey: string | null; definition: ScenarioDefinition; synthetic?: boolean },
): Scenario {
  requireCap(p, "scenario.manage");
  validateDefinition(input.definition);
  const previous = s.scenarios.filter((x) => x.scenarioKey === input.scenarioKey).sort((a, b) => b.version - a.version)[0];
  if (previous) previous.active = false;
  const scenario: Scenario = {
    id: newId(),
    scenarioKey: input.scenarioKey,
    version: previous ? previous.version + 1 : 1,
    title: input.title,
    taskId: input.taskId,
    linkedObjectKey: input.linkedObjectKey,
    definition: structuredClone(input.definition),
    active: true,
    synthetic: input.synthetic ?? true,
    createdBy: p.userId,
    createdAt: nowIso(),
  };
  s.scenarios.push(scenario);
  audit(s, p, "scenario.created", "scenario", scenario.id, { version: scenario.version });
  return scenario;
}

export function getScenario(s: DemoState, id: string): Scenario {
  const scenario = s.scenarios.find((x) => x.id === id);
  if (!scenario) throw new NotFound("Scenario not found");
  return scenario;
}

export function scenarioLanguages(scenario: Scenario): Language[] {
  return Object.keys(scenario.definition.text) as Language[];
}

function textFor(scenario: Scenario, language: Language): { text: ScenarioText; language: Language } {
  const text = scenario.definition.text[language];
  if (text) return { text, language };
  return { text: scenario.definition.text.en as ScenarioText, language: "en" };
}

export interface LearnerView {
  scenarioId: string;
  title: string;
  version: number;
  variant: VariantName;
  mode: "assisted" | "independent";
  language: Language;
  situation: string;
  prompt: string;
  choices: { id: string; label: string }[];
  hints: string[];
}

/** What a learner sees: no consequences, feedback or rule results before choosing. */
export function learnerView(scenario: Scenario, variant: VariantName, language: Language): LearnerView {
  const { text, language: shown } = textFor(scenario, language);
  const choices = scenario.definition[variant];
  const t = variant === "guided" ? text.guided : text.independent;
  return {
    scenarioId: scenario.id,
    title: scenario.title,
    version: scenario.version,
    variant,
    mode: variant === "guided" ? "assisted" : "independent",
    language: shown,
    situation: text.situation,
    prompt: t.prompt,
    choices: choices.map((c) => ({ id: c.id, label: (t.choices[c.id] as { label: string }).label })),
    hints: variant === "guided" ? text.guided.hints : [],
  };
}

export interface AttemptResult {
  attemptId: string;
  mode: "assisted" | "independent";
  choiceId: string;
  consequence: string;
  feedback: string;
  ruleResults: { ruleId: string; description: string; met: boolean }[];
  correct: boolean;
  approvedGuidance: { objectVersion: number; title: string; language: Language; content: Block[] } | null;
  scenarioVersion: number;
}

export function attempt(
  s: DemoState,
  p: Principal,
  input: { scenarioId: string; variant: VariantName; choiceId: string; hintsUsed: number; language: Language },
): AttemptResult {
  requireCap(p, "practice.attempt");
  const scenario = getScenario(s, input.scenarioId);
  if (!scenario.active) throw new InvalidState("This scenario version is no longer active");
  const choice = scenario.definition[input.variant].find((c) => c.id === input.choiceId);
  if (!choice) throw new ValidationFailed(`Unknown choice '${input.choiceId}'`);
  const { text, language } = textFor(scenario, input.language);
  const t = input.variant === "guided" ? text.guided : text.independent;
  const maxHints = input.variant === "guided" ? text.guided.hints.length : 0;
  if (input.variant === "independent" && input.hintsUsed) throw new ValidationFailed("Hints are not available in the independent assessment");
  if (input.hintsUsed < 0 || input.hintsUsed > maxHints) throw new ValidationFailed("Invalid hint count");

  const mode = input.variant === "guided" ? "assisted" : "independent";
  const ruleResults = scenario.definition.rules.map((r) => ({ ruleId: r, description: text.rules[r] as string, met: choice.ruleResults[r] as boolean }));
  const correct = ruleResults.every((r) => r.met);

  let approvedGuidance: AttemptResult["approvedGuidance"] = null;
  const obj = scenario.linkedObjectKey ? s.objects.find((o) => o.objectKey === scenario.linkedObjectKey) : undefined;
  const version = obj ? s.versions.find((v) => v.objectId === obj.id && v.state === "published") : undefined;
  if (version) {
    const variant = variantIn(s, version.id, language);
    const shown = variant?.state === "approved" ? variant : sourceVariantOf(s, version.id);
    if (shown?.state === "approved") {
      approvedGuidance = {
        objectVersion: version.version,
        title: shown.title,
        language: shown.language,
        content: [...shown.blocks].sort((a, b) => a.order - b.order),
      };
    }
  }

  const actor = pseudonym(p.userId);
  const now = nowIso();
  const attemptId = newId();
  s.attempts.push({
    id: attemptId,
    scenarioId: scenario.id,
    scenarioKey: scenario.scenarioKey,
    scenarioVersion: scenario.version,
    variant: input.variant,
    mode,
    actor,
    language,
    choiceId: choice.id,
    ruleResults: ruleResults.map((r) => ({ ruleId: r.ruleId, met: r.met })),
    correct,
    hintsUsed: input.hintsUsed,
    knowledgeObjectVersion: version?.version ?? null,
    createdAt: now,
  });
  s.events.push({
    id: newId(),
    eventId: `srv-${newId()}`,
    eventName: "practice.attempted",
    schemaVersion: CONTRACT_VERSION,
    actor,
    occurredAt: now,
    context: { scenario_key: scenario.scenarioKey, scenario_version: String(scenario.version), mode, choice: choice.id },
    taskId: scenario.taskId,
    mediaType: null,
    detail: null,
    objectId: version?.objectId ?? null,
    objectVersion: version?.version ?? null,
    language,
    outcome: correct ? "correct" : "incorrect",
    channel: "practice",
    synthetic: true,
  });
  const choiceText = t.choices[choice.id] as { consequence: string; feedback: string };
  return {
    attemptId,
    mode,
    choiceId: choice.id,
    consequence: choiceText.consequence,
    feedback: choiceText.feedback,
    ruleResults,
    correct,
    approvedGuidance,
    scenarioVersion: scenario.version,
  };
}
