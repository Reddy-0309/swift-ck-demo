import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { store, useEngine, usePrincipal } from "../../../app/engine";
import { ROLE_LABELS } from "../../../app/people";
import { userName } from "../../../app/selectors";
import { useAction } from "../../../app/useAction";
import { getSource, sourceVariantOf, updateDraft } from "../../../domain/governance";
import { BLOCK_LABELS, CONTEXT_LABELS } from "../../../domain/labels";
import { BLOCK_TYPES, type Applicability, type Block, type BlockType, type ObjectVersion } from "../../../domain/types";
import { Icon } from "../../../ui/icons";
import { Button, ErrorNotice, Field, Notice, Panel, formatDate, useToast } from "../../../ui/kit";
import { Procedure } from "../../../ui/Procedure";

type ListField = Exclude<keyof Applicability, "escalationRoute">;
const FIELDS: [ListField, string, string][] = [
  ["roles", "Roles", "Who may receive it, e.g. delivery_associate"],
  ["taskIds", "Tasks", "e.g. T-PICKUP"],
  ["situationCodes", "Situations", "Only shown when this situation is reported"],
  ["assetIds", "Equipment (assets)", "Optional"],
  ["equipmentModels", "Equipment models", "Optional"],
  ["workflowStates", "Workflow stages", "Optional"],
  ["screenIds", "App screens", "Optional"],
];

const list = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
const named = (codes: string[]) => codes.map((c) => CONTEXT_LABELS.en[c] ?? ROLE_LABELS[c] ?? c).join(", ");

let counter = 0;

function Editor({ version, onDone }: { version: ObjectVersion; onDone: () => void }) {
  const { state } = useEngine();
  const principal = usePrincipal();
  const toast = useToast();
  const source = sourceVariantOf(state, version.id);
  const [title, setTitle] = useState(source?.title ?? "");
  const [blocks, setBlocks] = useState<Block[]>(() => structuredClone(source?.blocks ?? []));
  const [app, setApp] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries(FIELDS.map(([k]) => [k, version.applicability[k].join(", ")])),
    escalationRoute: version.applicability.escalationRoute ?? "",
  }));
  const action = useAction<ObjectVersion>();
  const hasSource = !!version.sourceDocumentId;

  const update = (i: number, patch: Partial<Block>) => setBlocks((all) => all.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const move = (i: number, d: number) =>
    setBlocks((all) => {
      const target = i + d;
      if (target < 0 || target >= all.length) return all;
      const next = [...all];
      [next[i], next[target]] = [next[target] as Block, next[i] as Block];
      return next.map((b, j) => ({ ...b, order: j }));
    });

  function save() {
    const applicability: Partial<Applicability> = Object.fromEntries(FIELDS.map(([k]) => [k, list(app[k] ?? "")]));
    applicability.escalationRoute = app.escalationRoute?.trim() || null;
    void action.run(
      () =>
        store.transact((s) =>
          updateDraft(s, principal, version.id, {
            title,
            applicability,
            blocks: blocks.map((b) => ({ id: b.id, type: b.type, text: b.text, sourceSpan: b.sourceSpan, uncertain: b.uncertain, uncertaintyNote: b.uncertaintyNote })),
          }),
        ),
      () => {
        toast("Changes saved");
        onDone();
      },
    );
  }

  return (
    <div className="stack">
      {hasSource && <Notice>Every line must quote the source SOP word for word. You can shorten a line, change its type or reorder lines, but not add new wording.</Notice>}
      <Panel title="Procedure">
        <div className="stack">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          {blocks.map((b, i) => (
            <div key={b.id} className="panel" style={{ padding: 12 }}>
              <div className="row" style={{ marginBottom: 8 }}>
                <select value={b.type} onChange={(e) => update(i, { type: e.target.value as BlockType })} aria-label={`Line ${i + 1} type`} style={{ width: "auto" }}>
                  {BLOCK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {BLOCK_LABELS.en[t]}
                    </option>
                  ))}
                </select>
                <span className="spacer" />
                <button type="button" className="icon-btn" aria-label="Move up" onClick={() => move(i, -1)}>
                  <Icon name="chevronDown" className="flip" />
                </button>
                <button type="button" className="icon-btn" aria-label="Move down" onClick={() => move(i, 1)}>
                  <Icon name="chevronDown" />
                </button>
                <button type="button" className="icon-btn" aria-label="Remove line" onClick={() => setBlocks((all) => all.filter((_, j) => j !== i).map((x, j) => ({ ...x, order: j })))}>
                  <Icon name="trash" />
                </button>
              </div>
              <textarea
                rows={2}
                value={b.text}
                aria-label={`Line ${i + 1} text`}
                onChange={(e) => {
                  const original = source?.blocks.find((x) => x.id === b.id);
                  update(i, { text: e.target.value, sourceSpan: original && original.text === e.target.value ? original.sourceSpan : null });
                }}
              />
              {b.uncertain && (
                <div className="row" style={{ marginTop: 8 }}>
                  <span className="small" style={{ color: "var(--amber-ink)", flex: 1 }}>
                    Needs review: {b.uncertaintyNote || "unclear wording"}
                  </span>
                  <Button size="sm" variant="secondary" icon="check" onClick={() => update(i, { uncertain: false, uncertaintyNote: "" })}>
                    Mark as reviewed
                  </Button>
                </div>
              )}
            </div>
          ))}
          <div>
            <Button
              variant="ghost"
              icon="plus"
              onClick={() => setBlocks((all) => [...all, { id: `bn${Date.now().toString(36)}${(counter += 1)}`, type: "step", order: all.length, text: "", sourceSpan: null, uncertain: false, uncertaintyNote: "" }])}
            >
              Add line
            </Button>
          </div>
        </div>
      </Panel>
      <Panel title="Who gets it, and when">
        <div className="grid-2">
          {FIELDS.map(([k, label, hint]) => (
            <Field key={k} label={label} hint={hint}>
              <input value={app[k] ?? ""} onChange={(e) => setApp((a) => ({ ...a, [k]: e.target.value }))} />
            </Field>
          ))}
          <Field label="Escalation route">
            <input value={app.escalationRoute ?? ""} onChange={(e) => setApp((a) => ({ ...a, escalationRoute: e.target.value }))} />
          </Field>
        </div>
      </Panel>
      <ErrorNotice error={action.error} />
      <div className="row">
        <span className="spacer" />
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button busy={action.busy} onClick={save}>
          Save changes
        </Button>
      </div>
    </div>
  );
}

function SourcePane({ text, start, end }: { text: string; start: number | null; end: number | null }) {
  useEffect(() => {
    if (start !== null) document.getElementById("span-mark")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [start]);
  return (
    <pre className="source-text">
      {start !== null && end !== null ? (
        <>
          {text.slice(0, start)}
          <mark id="span-mark">{text.slice(start, end)}</mark>
          {text.slice(end)}
        </>
      ) : (
        text
      )}
    </pre>
  );
}

export function ContentTab({ version, editing, onDone }: { version: ObjectVersion; editing: boolean; onDone: () => void }) {
  const { state } = useEngine();
  const [selected, setSelected] = useState<string | null>(null);
  if (editing) return <Editor version={version} onDone={onDone} />;
  const source = sourceVariantOf(state, version.id);
  const doc = version.sourceDocumentId ? getSource(state, version.sourceDocumentId) : null;
  const span = source?.blocks.find((b) => b.id === selected)?.sourceSpan ?? null;
  const a = version.applicability;

  return (
    <div className="split">
      <div className="stack">
        <Procedure blocks={source?.blocks ?? []} lang={source?.language} showFlags selectedId={selected} onSelect={doc ? setSelected : undefined} />
        {a.escalationRoute && (
          <div className="escalate">
            <Icon name="alert" />
            <span>
              <strong>Escalation route:</strong> {a.escalationRoute}
            </span>
          </div>
        )}
      </div>
      <div className="stack">
        <Panel title="Who gets it">
          <dl className="kv">
            <dt>Roles</dt>
            <dd>{named(a.roles) || "—"}</dd>
            <dt>Tasks</dt>
            <dd>{named(a.taskIds) || "—"}</dd>
            {a.situationCodes.length > 0 && (
              <>
                <dt>Only when</dt>
                <dd>{named(a.situationCodes)}</dd>
              </>
            )}
            {(a.assetIds.length > 0 || a.equipmentModels.length > 0) && (
              <>
                <dt>Equipment</dt>
                <dd>{named([...a.equipmentModels, ...a.assetIds])}</dd>
              </>
            )}
            <dt>Approved by</dt>
            <dd>{version.approverId ? `${userName(state, version.approverId)}, ${formatDate(version.approvedAt, false)}` : "Not yet approved"}</dd>
            <dt>Written by</dt>
            <dd>{userName(state, version.authorId)}</dd>
          </dl>
        </Panel>
        {doc && (
          <Panel
            title="Source SOP"
            actions={
              <Link to={`/sources/${doc.id}`} className="small">
                {doc.documentKey.toUpperCase()} r{doc.revision}
              </Link>
            }
          >
            <p className="small muted" style={{ marginBottom: 10 }}>
              {selected ? "The selected line is highlighted in the source." : "Select a line to see exactly where it comes from."}
            </p>
            <SourcePane text={doc.text} start={span?.start ?? null} end={span?.end ?? null} />
          </Panel>
        )}
      </div>
    </div>
  );
}
