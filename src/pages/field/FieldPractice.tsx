import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { store, useEngine } from "../../app/engine";
import { useAction } from "../../app/useAction";
import { variantIn } from "../../domain/governance";
import { attempt, learnerView, type AttemptResult, type VariantName } from "../../domain/practice";
import type { Language, Scenario } from "../../domain/types";
import { useField } from "../../layouts/FieldLayout";
import { Icon } from "../../ui/icons";
import { Procedure } from "../../ui/Procedure";
import { Button, ErrorNotice } from "../../ui/kit";

/** A scenario's title in the worker's language: the linked procedure's approved title. */
function scenarioTitle(scenario: Scenario, language: Language): string {
  const s = store.getState();
  const obj = s.objects.find((o) => o.objectKey === scenario.linkedObjectKey);
  const version = obj && s.versions.find((v) => v.objectId === obj.id && v.state === "published");
  const variant = version && variantIn(s, version.id, language);
  return variant?.state === "approved" ? variant.title : scenario.title;
}

function Runner({ scenario, mode }: { scenario: Scenario; mode: VariantName }) {
  const { principal } = useEngine();
  const { t, language } = useField();
  const view = useMemo(() => learnerView(scenario, mode, language), [scenario, mode, language]);
  const [choice, setChoice] = useState("");
  const [hints, setHints] = useState(0);
  const action = useAction<AttemptResult>();
  const result = action.result;

  function submit() {
    if (!principal || !choice) return;
    void action.run(() => store.transact((s) => attempt(s, principal, { scenarioId: scenario.id, variant: mode, choiceId: choice, hintsUsed: hints, language: view.language })));
  }

  if (result) {
    return (
      <div className="stack">
        <div className={`result ${result.correct ? "ok" : "bad"}`}>
          <h2>{result.correct ? t.correct : t.incorrect}</h2>
          <p>{result.consequence}</p>
          <p style={{ marginTop: 8 }}>{result.feedback}</p>
        </div>
        <div>
          <p className="question">{t.rules}</p>
          <ul className="rules">
            {result.ruleResults.map((r) => (
              <li key={r.ruleId}>
                <span className={r.met ? "ok" : "bad"}>
                  <Icon name={r.met ? "check" : "x"} />
                </span>
                {r.description}
              </li>
            ))}
          </ul>
        </div>
        {result.approvedGuidance && (
          <div>
            <p className="question">{t.approvedGuidance}</p>
            <Procedure blocks={result.approvedGuidance.content} lang={result.approvedGuidance.language} />
          </div>
        )}
        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            action.reset();
            setChoice("");
            setHints(0);
          }}
        >
          {t.tryAgain}
        </Button>
      </div>
    );
  }

  return (
    <div className="stack">
      <p style={{ fontSize: 16 }}>{view.situation}</p>
      <p className="question" style={{ margin: 0 }}>
        {view.prompt}
      </p>
      <div className="stack-sm" role="radiogroup" aria-label={t.choose}>
        {view.choices.map((c) => (
          <label key={c.id} className={`choice${choice === c.id ? " selected" : ""}`}>
            <input type="radio" name="choice" value={c.id} checked={choice === c.id} onChange={() => setChoice(c.id)} />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
      {mode === "guided" && (
        <div className="stack-sm">
          {view.hints.slice(0, hints).map((h) => (
            <div key={h} className="notice">
              <Icon name="info" size={16} />
              <div>{h}</div>
            </div>
          ))}
          {hints < view.hints.length && (
            <Button variant="ghost" onClick={() => setHints((h) => h + 1)}>
              {t.showHint}
            </Button>
          )}
        </div>
      )}
      <ErrorNotice error={action.error} />
      <Button size="lg" disabled={!choice} busy={action.busy} onClick={submit}>
        {t.submitDecision}
      </Button>
    </div>
  );
}

export default function FieldPractice() {
  const { state } = useEngine();
  const { t, language } = useField();
  const [params, setParams] = useSearchParams();
  const scenarios = state.scenarios.filter((s) => s.active);
  const selected = scenarios.find((s) => s.id === params.get("scenario"));
  const mode = params.get("mode") === "independent" ? "independent" : "guided";

  if (selected) {
    return (
      <>
        <button type="button" className="link-btn row small" style={{ marginBottom: 12 }} onClick={() => setParams({})}>
          <Icon name="chevronLeft" size={16} />
          {t.back}
        </button>
        <h1>{scenarioTitle(selected, language)}</h1>
        <p className="muted" style={{ margin: "4px 0 20px" }}>
          {mode === "guided" ? `${t.guided} · ${t.guidedHint}` : `${t.independent} · ${t.independentHint}`}
        </p>
        <Runner key={`${selected.id}-${mode}-${language}`} scenario={selected} mode={mode} />
      </>
    );
  }

  return (
    <>
      <h1>{t.practice}</h1>
      <p className="muted" style={{ margin: "4px 0 20px" }}>
        {t.practiceIntro}
      </p>
      {scenarios.map((s) => (
        <div key={s.id} className="stack-sm" style={{ marginBottom: 20 }}>
          <h2>{scenarioTitle(s, language)}</h2>
          <button type="button" className="tile" onClick={() => setParams({ scenario: s.id, mode: "guided" })}>
            <span className="tile-icon">
              <Icon name="target" size={22} />
            </span>
            <span style={{ flex: 1 }}>
              <strong style={{ display: "block" }}>{t.guided}</strong>
              <span className="muted">{t.guidedHint}</span>
            </span>
            <Icon name="chevronRight" />
          </button>
          <button type="button" className="tile" onClick={() => setParams({ scenario: s.id, mode: "independent" })}>
            <span className="tile-icon">
              <Icon name="shield" size={22} />
            </span>
            <span style={{ flex: 1 }}>
              <strong style={{ display: "block" }}>{t.independent}</strong>
              <span className="muted">{t.independentHint}</span>
            </span>
            <Icon name="chevronRight" />
          </button>
        </div>
      ))}
    </>
  );
}
