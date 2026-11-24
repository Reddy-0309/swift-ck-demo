import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { store, useEngine } from "../../app/engine";
import { tasksForRole } from "../../app/selectors";
import { ingestEvent } from "../../domain/analytics";
import { CONTRACT_VERSION, type C2KnowledgeResponse, type MediaRef } from "../../domain/contracts";
import { newId, pseudonym } from "../../domain/core";
import { resolve } from "../../domain/delivery";
import { CONTEXT_LABELS } from "../../domain/labels";
import { useField } from "../../layouts/FieldLayout";
import { Icon } from "../../ui/icons";
import { ErrorNotice } from "../../ui/kit";
import { FieldAnswer } from "./FieldAnswer";

/** Guidance for a task (with optional situation and equipment) or for a typed question. */
export default function FieldGuide() {
  const { state, principal } = useEngine();
  const { t, language } = useField();
  const [params, setParams] = useSearchParams();
  const task = params.get("task");
  const situation = params.get("situation");
  const asset = params.get("asset");
  const query = params.get("q");
  const entry = tasksForRole(state, principal?.workRole ?? null).find((x) => x.code === task);
  const labels = CONTEXT_LABELS[language];
  const situations = entry?.situations.length ? state.context.filter((c) => c.kind === "situation").map((c) => c.code) : [];
  const assets = state.context.filter((c) => c.kind === "asset").map((c) => c.code);
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
      {response && !waitingForEquipment && <FieldAnswer response={response} language={language} state={state} onMedia={recordMedia} />}
    </>
  );
}
