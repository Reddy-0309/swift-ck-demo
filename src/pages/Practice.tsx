import { useMemo, useState } from "react";
import { store, useEngine } from "../app/engine";
import { useAction } from "../app/useAction";
import { BlockView, Button, Card, Empty, ErrorBanner, LanguageSelect, Notice, PageHeader, SyntheticLabel } from "../components/ui";
import { WORKER_TEXT } from "../domain/labels";
import { attempt, learnerView, scenarioLanguages, type AttemptResult, type VariantName } from "../domain/practice";
import { LANGUAGES, type Language, type Scenario } from "../domain/types";

function Runner({ scenario, variant, language }: { scenario: Scenario; variant: VariantName; language: Language }) {
  const { principal } = useEngine();
  const view = useMemo(() => learnerView(scenario, variant, language), [scenario, variant, language]);
  const t = WORKER_TEXT[view.language];
  const [choice, setChoice] = useState("");
  const [hints, setHints] = useState(0);
  const action = useAction<AttemptResult>();
  const result = action.result;

  function submit() {
    if (!principal) return;
    void action.run(() =>
      store.transact((s) => attempt(s, principal, { scenarioId: scenario.id, variant, choiceId: choice, hintsUsed: hints, language: view.language })),
    );
  }

  return (
    <div className="stack" lang={view.language}>
      <Notice tone={variant === "guided" ? "info" : "warn"}>
        <span lang="en">
          {variant === "guided"
            ? "Guided practice: hints and feedback are available. Recorded as an assisted attempt."
            : "Independent assessment: an unseen variant without hints. Recorded separately as independent evidence."}
        </span>
      </Notice>
      <div className="scenario-step">
        <span className="step-n">1</span>
        <div>
          <p>{view.situation}</p>
          <p>
            <strong>{view.prompt}</strong>
          </p>
        </div>
      </div>
      <fieldset className="choices" disabled={!!result}>
        <legend>2 · {t.choose}</legend>
        {view.choices.map((c) => (
          <label key={c.id} className={`choice${choice === c.id ? " selected" : ""}`}>
            <input type="radio" name={`choice-${variant}`} value={c.id} checked={choice === c.id} onChange={() => setChoice(c.id)} />
            <span className="choice-id">{c.id}</span> {c.label}
          </label>
        ))}
      </fieldset>
      {variant === "guided" && !result && (
        <div className="stack-sm">
          {view.hints.slice(0, hints).map((h, i) => (
            <Notice key={h}>
              {i + 1}. {h}
            </Notice>
          ))}
          {hints < view.hints.length && (
            <Button variant="ghost" onClick={() => setHints((h) => h + 1)}>
              {t.showHint}
            </Button>
          )}
        </div>
      )}
      {variant === "independent" && !result && <p className="muted small">{t.noHints}</p>}
      <ErrorBanner error={action.error} />
      {!result && (
        <Button disabled={!choice} busy={action.busy} onClick={submit}>
          {t.submitDecision}
        </Button>
      )}
      {result && (
        <>
          <div className={`scenario-result ${result.correct ? "ok" : "bad"}`}>
            <strong>3 · {result.correct ? t.correct : t.incorrect}</strong>
            <p>{result.consequence}</p>
            <p>{result.feedback}</p>
          </div>
          <Card title={`4 · ${t.approvedGuidance}`}>
            {result.approvedGuidance ? (
              <>
                <p className="muted small" lang={result.approvedGuidance.language}>
                  {result.approvedGuidance.title} · v{result.approvedGuidance.objectVersion}
                </p>
                <BlockView blocks={result.approvedGuidance.content} lang={result.approvedGuidance.language} />
              </>
            ) : (
              <Empty>No approved guidance is linked yet.</Empty>
            )}
          </Card>
          <Card title={`5 · ${t.rules}`}>
            <table>
              <tbody>
                {result.ruleResults.map((r) => (
                  <tr key={r.ruleId}>
                    <td className="mono">{r.ruleId}</td>
                    <td>{r.description}</td>
                    <td>{r.met ? "✓" : "✗"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted small" lang="en">
              mode: {result.mode} · scenario v{result.scenarioVersion} · choice {result.choiceId} · no speed score, no certification
            </p>
          </Card>
          <Button
            variant="secondary"
            onClick={() => {
              action.reset();
              setChoice("");
              setHints(0);
            }}
          >
            {t.tryAgain}
          </Button>
        </>
      )}
    </div>
  );
}

export function PracticePage() {
  const { state } = useEngine();
  const scenarios = state.scenarios.filter((s) => s.active);
  const [selected, setSelected] = useState<{ id: string; variant: VariantName } | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const scenario = scenarios.find((s) => s.id === selected?.id);
  const languages = scenario ? scenarioLanguages(scenario) : [];
  const t = WORKER_TEXT[language];

  return (
    <>
      <PageHeader title="Decision practice" subtitle="Correct, safe behaviour — not speed. Guided and independent results are kept apart." />
      <div className="grid-ask">
        <Card title="Scenarios" tone="context">
          {scenarios.length === 0 && <Empty>No scenarios.</Empty>}
          <ul className="list">
            {scenarios.map((s) => (
              <li key={s.id} className="stack-sm">
                <strong>{s.title}</strong>
                <span className="muted small">
                  v{s.version} · task {s.taskId ?? "—"} · {scenarioLanguages(s).length} languages {s.synthetic && <SyntheticLabel />}
                </span>
                <div className="row wrap">
                  <Button variant="secondary" onClick={() => setSelected({ id: s.id, variant: "guided" })}>
                    <span lang={language}>{t.practiceGuided}</span>
                  </Button>
                  <Button variant="secondary" onClick={() => setSelected({ id: s.id, variant: "independent" })}>
                    <span lang={language}>{t.practiceIndependent}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        {scenario && selected ? (
          <Card
            title={`${scenario.title} — ${selected.variant}`}
            actions={<LanguageSelect value={language} onChange={setLanguage} languages={languages} />}
          >
            <Runner key={`${scenario.id}-${selected.variant}-${language}`} scenario={scenario} variant={selected.variant} language={language} />
          </Card>
        ) : (
          <Card>
            <LanguageSelect value={language} onChange={setLanguage} languages={LANGUAGES} />
            <p className="muted">Choose a scenario and a mode to start.</p>
          </Card>
        )}
      </div>
    </>
  );
}
