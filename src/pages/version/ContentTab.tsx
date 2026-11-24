import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { store, useEngine, usePrincipal } from "../../app/engine";
import { useAction } from "../../app/useAction";
import { BlockView, Button, Card, ErrorBanner, Field, Notice } from "../../components/ui";
import { BLOCK_LABELS } from "../../domain/labels";
import {
  approveAndPublish,
  deleteDraft,
  getSource,
  newVersionFrom,
  returnToDraft,
  sourceVariantOf,
  submitForReview,
  updateDraft,
  withdrawVersion,
} from "../../domain/governance";
import { BLOCK_TYPES, type Applicability, type Block, type BlockType, type Distribution, type ObjectVersion, type RiskClass } from "../../domain/types";

type ListField = Exclude<keyof Applicability, "escalationRoute">;
const APPLICABILITY_FIELDS: [ListField, string, string][] = [
  ["roles", "Roles", "Operational roles that may receive this knowledge"],
  ["taskIds", "Tasks", "Task identifiers"],
  ["situationCodes", "Situations", "Only served when this situation is reported"],
  ["assetIds", "Assets", "Specific asset identifiers (optional)"],
  ["equipmentModels", "Equipment models", "Equipment models (optional)"],
  ["workflowStates", "Workflow states", "Required workflow state (optional)"],
  ["screenIds", "Screens", "Host screen identifiers (optional)"],
];

function toList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function SourcePane({ text, highlight, lang }: { text: string; highlight: Block | null; lang: string }) {
  const span = highlight?.sourceSpan;
  useEffect(() => {
    if (span) document.getElementById("span-mark")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [span]);
  return (
    <pre className="source-text" lang={lang}>
      {span ? (
        <>
          {text.slice(0, span.start)}
          <mark id="span-mark">{text.slice(span.start, span.end)}</mark>
          {text.slice(span.end)}
        </>
      ) : (
        text
      )}
    </pre>
  );
}

let blockCounter = 0;

export function ContentTab({ version }: { version: ObjectVersion }) {
  const { state, can } = useEngine();
  const principal = usePrincipal();
  const navigate = useNavigate();
  const source = sourceVariantOf(state, version.id);
  const sourceDoc = version.sourceDocumentId ? getSource(state, version.sourceDocumentId) : null;
  const editable = (version.state === "draft" && can("draft.edit")) || (version.state === "in_review" && can("version.review"));

  const [title, setTitle] = useState(source?.title ?? "");
  const [blocks, setBlocks] = useState<Block[]>(() => structuredClone(source?.blocks ?? []));
  const [applicability, setApplicability] = useState<Record<string, string>>(() => {
    const app: Record<string, string> = Object.fromEntries(APPLICABILITY_FIELDS.map(([key]) => [key, version.applicability[key].join(", ")]));
    app.escalationRoute = version.applicability.escalationRoute ?? "";
    return app;
  });
  const [selected, setSelected] = useState<Block | null>(null);
  const [risk, setRisk] = useState<RiskClass | "">(version.riskClass ?? "");
  const [distribution, setDistribution] = useState<Distribution | "">(version.distributionClass ?? "");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [reason, setReason] = useState("");
  const action = useAction<unknown>();

  const appliedApplicability = (): Partial<Applicability> => {
    const app: Partial<Applicability> = Object.fromEntries(APPLICABILITY_FIELDS.map(([key]) => [key, toList(applicability[key] ?? "")]));
    app.escalationRoute = applicability.escalationRoute?.trim() || null;
    return app;
  };

  const dirty = useMemo(() => {
    if (!source) return false;
    const app = appliedApplicability();
    const appChanged = APPLICABILITY_FIELDS.some(([k]) => JSON.stringify(app[k]) !== JSON.stringify(version.applicability[k])) || (app.escalationRoute ?? null) !== version.applicability.escalationRoute;
    return title !== source.title || JSON.stringify(blocks) !== JSON.stringify(source.blocks) || appChanged;
  }, [title, blocks, applicability, source, version]); // appliedApplicability only reads `applicability`

  const run = (fn: () => unknown, after?: () => void) => {
    void action.run(fn, () => {
      setReason("");
      after?.();
    });
  };

  function updateBlock(index: number, patch: Partial<Block>) {
    setBlocks((current) => current.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }
  function move(index: number, delta: number) {
    setBlocks((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target] as Block, next[index] as Block];
      return next.map((b, i) => ({ ...b, order: i }));
    });
  }

  const flagged = blocks.filter((b) => b.uncertain).length;
  const isAuthor = principal.userId === version.authorId || principal.userId === source?.draftedBy;
  const labels = BLOCK_LABELS.en;

  return (
    <div className="workbench">
      <div className="workbench-main">
        <Card title="Content (source language)" tone="knowledge">
          {editable ? (
            <div className="stack">
              <Field label="Title">
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <ol className="block-editor">
                {blocks.map((b, i) => (
                  <li key={b.id} className={`block-edit block-${b.type}${selected?.id === b.id ? " selected" : ""}`}>
                    <div className="row">
                      <select value={b.type} onChange={(e) => updateBlock(i, { type: e.target.value as BlockType })} aria-label="Block type">
                        {BLOCK_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {labels[t]}
                          </option>
                        ))}
                      </select>
                      {b.sourceSpan && (
                        <button type="button" className="link small" onClick={() => setSelected(b)}>
                          Show source span
                        </button>
                      )}
                      <span className="spacer" />
                      <button type="button" className="icon" aria-label="Move up" onClick={() => move(i, -1)}>
                        ↑
                      </button>
                      <button type="button" className="icon" aria-label="Move down" onClick={() => move(i, 1)}>
                        ↓
                      </button>
                      <button
                        type="button"
                        className="icon danger"
                        aria-label="Remove block"
                        onClick={() => setBlocks((c) => c.filter((_, j) => j !== i).map((x, j) => ({ ...x, order: j })))}
                      >
                        ×
                      </button>
                    </div>
                    <textarea
                      value={b.text}
                      rows={2}
                      lang={source?.language}
                      onChange={(e) => {
                        const original = source?.blocks.find((x) => x.id === b.id);
                        updateBlock(i, { text: e.target.value, sourceSpan: original && original.text === e.target.value ? original.sourceSpan : null });
                      }}
                      aria-label={`Block ${i + 1} text`}
                    />
                    {b.uncertain && (
                      <div className="row">
                        <span className="flag">Flagged: {b.uncertaintyNote || "needs review"}</span>
                        <Button variant="secondary" onClick={() => updateBlock(i, { uncertain: false, uncertaintyNote: "" })}>
                          Mark flag resolved
                        </Button>
                      </div>
                    )}
                    {!b.sourceSpan && sourceDoc && <span className="muted small">Edited or new block: its text must appear verbatim in the source.</span>}
                  </li>
                ))}
              </ol>
              <div className="row">
                <Button
                  variant="ghost"
                  onClick={() =>
                    setBlocks((c) => [
                      ...c,
                      { id: `bn${Date.now().toString(36)}${(blockCounter += 1)}`, type: "step", order: c.length, text: "", sourceSpan: null, uncertain: false, uncertaintyNote: "" },
                    ])
                  }
                >
                  + Add block
                </Button>
              </div>
            </div>
          ) : (
            <BlockView blocks={source?.blocks ?? []} showFlags lang={source?.language} />
          )}
          {!editable && source && sourceDoc && (
            <div className="row wrap">
              {source.blocks.map((b, i) => (
                <button key={b.id} type="button" className="link small" onClick={() => setSelected(b)}>
                  span {i + 1}
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Applicability (deterministic checks before retrieval)">
          {editable ? (
            <div className="grid-2 tight">
              {APPLICABILITY_FIELDS.map(([key, label, hint]) => (
                <Field key={key} label={label} hint={hint}>
                  <input value={applicability[key] ?? ""} onChange={(e) => setApplicability((a) => ({ ...a, [key]: e.target.value }))} placeholder="comma-separated" />
                </Field>
              ))}
              <Field label="Escalation route">
                <input value={applicability.escalationRoute ?? ""} onChange={(e) => setApplicability((a) => ({ ...a, escalationRoute: e.target.value }))} />
              </Field>
            </div>
          ) : (
            <dl className="kv">
              {APPLICABILITY_FIELDS.map(([key, label]) => (
                <div key={key} className="kv-row">
                  <dt>{label}</dt>
                  <dd>{version.applicability[key].join(", ") || "—"}</dd>
                </div>
              ))}
              <div className="kv-row">
                <dt>Escalation route</dt>
                <dd>{version.applicability.escalationRoute ?? "—"}</dd>
              </div>
            </dl>
          )}
        </Card>
      </div>

      <div className="workbench-side">
        <Card title="Actions">
          <div className="stack">
            <ErrorBanner error={action.error} />
            {editable && (
              <Button
                variant="secondary"
                busy={action.busy}
                disabled={!dirty}
                onClick={() =>
                  run(() =>
                    store.transact((s) =>
                      updateDraft(s, principal, version.id, {
                        title,
                        applicability: appliedApplicability(),
                        blocks: blocks.map((b) => ({ id: b.id, type: b.type, text: b.text, sourceSpan: b.sourceSpan, uncertain: b.uncertain, uncertaintyNote: b.uncertaintyNote })),
                      }),
                    ),
                  )
                }
              >
                Save changes{dirty ? " *" : ""}
              </Button>
            )}
            {version.state === "draft" && can("draft.edit") && (
              <>
                {version.stateReason && <Notice tone="warn">{version.stateReason}</Notice>}
                <Button busy={action.busy} disabled={dirty} onClick={() => run(() => store.transact((s) => submitForReview(s, principal, version.id)))}>
                  Submit for review
                </Button>
                <Button variant="ghost" onClick={() => run(() => store.transact((s) => deleteDraft(s, principal, version.id)), () => navigate("/studio"))}>
                  Discard draft
                </Button>
              </>
            )}
            {version.state === "in_review" && can("version.review") && (
              <>
                {isAuthor && <Notice tone="warn">You drafted this object, so another SME must approve it.</Notice>}
                {flagged > 0 && <Notice tone="warn">{flagged} flagged block(s) must be resolved and saved first.</Notice>}
                <Field label="Risk class" hint="Unclassified is treated as HIGH">
                  <select value={risk} onChange={(e) => setRisk(e.target.value as RiskClass | "")}>
                    <option value="">Unclassified (→ HIGH)</option>
                    <option value="LOW">LOW — informational</option>
                    <option value="MEDIUM">MEDIUM — service/compliance impact</option>
                    <option value="HIGH">HIGH — safety-critical</option>
                  </select>
                </Field>
                <Field label="Distribution class" hint="Only general knowledge may ship in a Model A package">
                  <select value={distribution} onChange={(e) => setDistribution(e.target.value as Distribution | "")}>
                    <option value="">Choose…</option>
                    <option value="general">General — any user of the host app</option>
                    <option value="restricted">Restricted — server-side, role-limited</option>
                  </select>
                </Field>
                <Field label="Effective until (optional)">
                  <input type="datetime-local" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} />
                </Field>
                <Button
                  busy={action.busy}
                  disabled={!distribution || dirty}
                  onClick={() =>
                    run(() =>
                      store.transact((s) =>
                        approveAndPublish(s, principal, version.id, {
                          riskClass: risk || null,
                          distributionClass: distribution as Distribution,
                          effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : null,
                        }),
                      ),
                    )
                  }
                >
                  Approve and publish
                </Button>
                <Field label="Reason to return">
                  <input value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
                <Button variant="secondary" disabled={!reason.trim()} onClick={() => run(() => store.transact((s) => returnToDraft(s, principal, version.id, reason)))}>
                  Return to draft
                </Button>
              </>
            )}
            {(version.state === "published" || version.state === "suspended") && can("version.review") && (
              <>
                <Field label="Withdrawal reason">
                  <input value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
                <Button variant="danger" disabled={!reason.trim()} onClick={() => run(() => store.transact((s) => withdrawVersion(s, principal, version.id, reason)))}>
                  Withdraw now
                </Button>
              </>
            )}
            {["published", "superseded", "suspended", "withdrawn"].includes(version.state) && can("draft.edit") && (
              <Button
                variant="secondary"
                onClick={() =>
                  void action.run(
                    () => store.transact((s) => newVersionFrom(s, principal, version.id)),
                    (created) => navigate(`/versions/${(created as ObjectVersion).id}`),
                  )
                }
              >
                Start new version
              </Button>
            )}
            {!editable && version.state !== "published" && version.state !== "suspended" && !can("draft.edit") && (
              <p className="muted small">No actions for your role on a {version.state.replace("_", " ")} version.</p>
            )}
          </div>
        </Card>
        {sourceDoc && (
          <Card title={`Source: ${sourceDoc.documentKey} r${sourceDoc.revision}`}>
            {sourceDoc.status !== "active" && <Notice tone="warn">This source revision has been superseded.</Notice>}
            <p className="muted small">{selected ? `Highlighting: ${selected.text.slice(0, 60)}…` : "Select a block to see its source span."}</p>
            <SourcePane text={sourceDoc.text} highlight={selected} lang={sourceDoc.language} />
          </Card>
        )}
      </div>
    </div>
  );
}
