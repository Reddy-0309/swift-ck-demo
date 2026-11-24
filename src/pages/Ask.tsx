import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { store, useEngine } from "../app/engine";
import { useAction } from "../app/useAction";
import { AnswerCard } from "../components/AnswerCard";
import { Card, ErrorBanner, Field, LanguageSelect, Notice, PageHeader } from "../components/ui";
import { ingestEvent } from "../domain/analytics";
import { CONTRACT_CHANGES, CONTRACT_VERSION, type C1ContextRequest, type C2KnowledgeResponse, type MediaRef } from "../domain/contracts";
import { newId, pseudonym } from "../domain/core";
import { eligibleVersions, resolve } from "../domain/delivery";
import { WORKER_TEXT } from "../domain/labels";
import { LANGUAGES, type Language } from "../domain/types";

export function AskPage() {
  const { state, principal } = useEngine();
  const [task, setTask] = useState("");
  const [situation, setSituation] = useState("");
  const [asset, setAsset] = useState("");
  const [model, setModel] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [query, setQuery] = useState("");
  const [showJson, setShowJson] = useState(false);
  const [lastRequest, setLastRequest] = useState<C1ContextRequest | null>(null);
  const [answeredIn, setAnsweredIn] = useState<Language>("en");
  const action = useAction<C2KnowledgeResponse>();
  const t = WORKER_TEXT[language];

  const catalogue = useMemo(() => {
    const byKind = (kind: string) => state.context.filter((c) => c.kind === kind);
    const role = principal?.workRole;
    const roleTasks = new Set(
      role ? eligibleVersions(state).filter((v) => v.applicability.roles.includes(role)).flatMap((v) => v.applicability.taskIds) : [],
    );
    const tasks = byKind("task");
    return {
      roleTasks: tasks.filter((x) => roleTasks.has(x.code)),
      otherTasks: tasks.filter((x) => !roleTasks.has(x.code)),
      situations: byKind("situation"),
      assets: byKind("asset"),
      models: byKind("equipment_model"),
    };
  }, [state, principal]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!principal) return;
    const body: C1ContextRequest = {
      contract_version: CONTRACT_VERSION,
      tenant_id: principal.tenantId,
      request_id: newId(),
      language,
      task_id: task || null,
      situation_code: situation || null,
      asset_id: asset || null,
      equipment_model: model || null,
      query: query.trim() || null,
      host_app_id: "standalone-web",
      host_version: "0.1.0",
    };
    setLastRequest(body);
    setAnsweredIn(language);
    void action.run(() => store.transact((s) => resolve(s, principal, body)));
  }

  function recordMedia(ref: MediaRef, eventName: "media.opened" | "media.played") {
    const r = action.result;
    if (!principal || !r || r.outcome !== "answer") return;
    try {
      store.transact((s) =>
        ingestEvent(s, principal, {
          event_name: eventName,
          schema_version: CONTRACT_VERSION,
          event_id: newId(),
          tenant: principal.tenantId,
          actor: pseudonym(principal.userId),
          timestamp: new Date().toISOString(),
          context: { task_id: task || null, media_type: ref.type },
          object_id: r.object_id,
          object_version: r.object_version,
          language: answeredIn,
          outcome: "ok",
          channel: "standalone-web",
        }),
      );
    } catch {
      /* analytics must never break the answer screen */
    }
  }

  return (
    <>
      <PageHeader
        title="Ask — task-and-answer"
        subtitle="Map-free standalone interface. Your role comes from your signed identity; context comes from you."
      />
      {!principal?.workRole && (
        <Notice tone="warn">
          You are signed in without an operational role, so no guidance applies to you. Switch to a demo worker (Arjun, Lakshmi or
          Deepa) to see answers.
        </Notice>
      )}
      <div className="grid-ask">
        <Card title="Your context" tone="context">
          <form className="stack" onSubmit={submit} lang={language}>
            <LanguageSelect label={t.language} value={language} onChange={setLanguage} languages={LANGUAGES} />
            <Field label={t.task}>
              <select value={task} onChange={(e) => setTask(e.target.value)}>
                <option value="">{t.freeText}</option>
                {catalogue.roleTasks.length > 0 && (
                  <optgroup label="Tasks for your role">
                    {catalogue.roleTasks.map((x) => (
                      <option key={x.code} value={x.code}>
                        {x.label} ({x.code})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Other catalogue tasks (to test refusals)">
                  {catalogue.otherTasks.map((x) => (
                    <option key={x.code} value={x.code}>
                      {x.label} ({x.code})
                    </option>
                  ))}
                </optgroup>
              </select>
            </Field>
            <Field label={t.situation}>
              <select value={situation} onChange={(e) => setSituation(e.target.value)}>
                <option value="">{t.none}</option>
                {catalogue.situations.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid-2 tight">
              <Field label={t.asset}>
                <select value={asset} onChange={(e) => setAsset(e.target.value)}>
                  <option value="">{t.none}</option>
                  {catalogue.assets.map((x) => (
                    <option key={x.code} value={x.code}>
                      {x.code}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t.model}>
                <select value={model} onChange={(e) => setModel(e.target.value)}>
                  <option value="">{t.none}</option>
                  {catalogue.models.map((x) => (
                    <option key={x.code} value={x.code}>
                      {x.code}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={t.question} hint={t.questionHint}>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. parcel packaging is torn" />
            </Field>
            <button type="submit" className="btn btn-primary" disabled={action.busy}>
              {action.busy ? t.checking : t.submit}
            </button>
          </form>
        </Card>
        <div className="stack">
          <ErrorBanner error={action.error} />
          {action.result ? (
            <AnswerCard response={action.result} language={answeredIn} state={state} onMedia={recordMedia} />
          ) : (
            <Card>
              <p className="muted">
                Choose a task (and any situation or asset) and the system returns the exact approved procedure in your language — or
                abstains, asks for the missing identifier, or refuses if your role is not permitted.
              </p>
            </Card>
          )}
          {action.result && (
            <Card
              title="Developer view: C1 request → C2 response"
              actions={
                <button type="button" className="link" onClick={() => setShowJson((v) => !v)}>
                  {showJson ? "Hide" : "Show"}
                </button>
              }
            >
              {showJson && (
                <>
                  <div className="grid-2 tight">
                    <pre className="json">{JSON.stringify(lastRequest, null, 2)}</pre>
                    <pre className="json">{JSON.stringify(action.result, null, 2)}</pre>
                  </div>
                  <p className="small">Contract {CONTRACT_VERSION} — changes proposed against D07 Appendix D:</p>
                  <ul className="list small">
                    {CONTRACT_CHANGES.map((c) => (
                      <li key={c.change}>
                        <code>{c.change}</code> — {c.reason}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
