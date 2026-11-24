import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { store, useEngine } from "../../app/engine";
import { clientForRole } from "../../domain/clients";
import { tasksForRole } from "../../app/selectors";
import { ingestEvent } from "../../domain/analytics";
import { CONTRACT_VERSION, type C2KnowledgeResponse, type MediaRef } from "../../domain/contracts";
import { newId, pseudonym } from "../../domain/core";
import { eligibleVersions, resolve } from "../../domain/delivery";
import { LANGUAGES, type Language } from "../../domain/types";
import { CONTEXT_LABELS } from "../../domain/labels";
import { useField } from "../../layouts/FieldLayout";
import { Icon } from "../../ui/icons";
import { ErrorNotice } from "../../ui/kit";
import { FieldAnswer } from "./FieldAnswer";

/** Guidance for a task (with optional situation and equipment) or for a typed question. */
export default function FieldGuide() {
  const { state, principal } = useEngine();
  const { t, language, setLanguage } = useField();
  const [params, setParams] = useSearchParams();
  const task = params.get("task");
  const situation = params.get("situation");
  const asset = params.get("asset");
  const query = params.get("q");
  const entry = tasksForRole(state, principal?.workRole ?? null).find((x) => x.code === task);
  const labels = CONTEXT_LABELS[language];
  // Situations and equipment come from the client's task set-up, so a worker only sees their own.
  const taskSetup = clientForRole(principal?.workRole)?.tasks.find((x) => x.code === task);
  const situations = entry?.situations.length ? (taskSetup?.situations ?? entry.situations) : [];
  const assets = taskSetup?.assets ?? [];
  const waitingForEquipment = !!entry?.needsEquipment && !asset;

  const [response, setResponse] = useState<C2KnowledgeResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const lastKey = useRef("");
  const key = JSON.stringify([task, situation, asset, query, language]);

  // One request per distinct context, made when the worker changes the context.
  useEffect(() => {
    if (!principal || waitingForEquipment || (!task && !query) || lastKey.current === key) return;
    lastKey.current = key;
    try {
      setError(null);
      setResponse(
        store.transact((s) =>
          resolve(s, principal, {
            contract_version: CONTRACT_VERSION,
            tenant_id: principal.tenantId,
            request_id: newId(),
            language,
            task_id: task,
            situation_code: situation,
            asset_id: asset,
            query,
            host_app_id: "field-app",
            host_version: "1.4.2",
          }),
        ),
      );
    } catch (e) {
      setResponse(null);
      setError(e);
    }
  }, [key, principal, waitingForEquipment, task, situation, asset, query, language]);

  /** Languages in which this task already has approved guidance for the worker's role. */
  function approvedLanguagesFor(code: string | null, role: string | null): Language[] {
    const versions = eligibleVersions(state).filter((v) => (!code || v.applicability.taskIds.includes(code)) && !!role && v.applicability.roles.includes(role));
    const found = new Set(state.variants.filter((x) => x.state === "approved" && versions.some((v) => v.id === x.versionId)).map((x) => x.language));
    return LANGUAGES.filter((l) => found.has(l));
  }

  function choose(name: "situation" | "asset", value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  function recordMedia(ref: MediaRef, eventName: "media.opened" | "media.played") {
    if (!principal || response?.outcome !== "answer") return;
    try {
      store.transact((s) =>
        ingestEvent(s, principal, {
          event_name: eventName,
          schema_version: CONTRACT_VERSION,
          event_id: newId(),
          tenant: principal.tenantId,
          actor: pseudonym(principal.userId),
          timestamp: new Date().toISOString(),
          context: { task_id: task, media_type: ref.type },
          object_id: response.object_id,
          object_version: response.object_version,
          language,
          outcome: "ok",
          channel: "field-app",
        }),
      );
    } catch {
      /* usage tracking never blocks the worker */
    }
  }

  return (
    <>
      <Link to="/field" className="row small" style={{ marginBottom: 12 }}>
        <Icon name="chevronLeft" size={16} />
        {t.back}
      </Link>
      <h1>{task ? labels[task] ?? task : `“${query ?? ""}”`}</h1>

      {situations.length > 0 && (
        <>
          <p className="question">{t.situationQuestion}</p>
          <div className="chips">
            <button type="button" className="chip" aria-pressed={!situation} onClick={() => choose("situation", null)}>
              {t.normal}
            </button>
            {situations.map((code) => (
              <button key={code} type="button" className="chip" aria-pressed={situation === code} onClick={() => choose("situation", code)}>
                {labels[code] ?? code}
              </button>
            ))}
          </div>
        </>
      )}

      {entry?.needsEquipment && (
        <>
          <p className="question">{t.whichEquipment}</p>
          <div className="chips">
            {assets.map((code) => (
              <button key={code} type="button" className="chip" aria-pressed={asset === code} onClick={() => choose("asset", code)}>
                {labels[code] ?? code}
              </button>
            ))}
          </div>
        </>
      )}

      <ErrorNotice error={error} />
      {response && !waitingForEquipment && (
        <FieldAnswer
          response={response}
          language={language}
          state={state}
          onMedia={recordMedia}
          alternatives={response.reason === "language_not_approved" ? approvedLanguagesFor(task, principal?.workRole ?? null) : []}
          onLanguage={setLanguage}
        />
      )}
    </>
  );
}
