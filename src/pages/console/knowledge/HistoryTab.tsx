import { useEngine } from "../../../app/engine";
import { ACTION_LABELS, entityName } from "../../../app/selectors";
import type { ObjectVersion } from "../../../domain/types";
import { Empty, Panel, formatDate } from "../../../ui/kit";

export function HistoryTab({ version }: { version: ObjectVersion }) {
  const { state } = useEngine();
  const related = new Set([version.id, ...state.variants.filter((v) => v.versionId === version.id).map((v) => v.id), ...state.media.filter((m) => m.versionId === version.id).map((m) => m.id)]);
  const entries = state.audit.filter((a) => related.has(a.entityId)).reverse();
  return (
    <Panel title="History" actions={<span className="small muted">Permanent record, newest first</span>}>
      {entries.length === 0 ? (
        <Empty title="No history yet" />
      ) : (
        <ol className="timeline">
          {entries.map((a) => (
            <li key={a.id}>
              <span className="muted">{formatDate(a.at)}</span>
              <span>
                <strong>{ACTION_LABELS[a.action] ?? a.action}</strong> · {entityName(state, a.entityType, a.entityId)}
                <span className="muted" style={{ display: "block" }}>
                  by {a.actorName.replace(/\s*\(.*\)$/, "")}
                  {typeof a.details.reason === "string" && a.details.reason ? ` · “${a.details.reason}”` : ""}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
