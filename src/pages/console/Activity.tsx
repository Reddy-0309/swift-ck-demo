import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useEngine } from "../../app/engine";
import { ACTION_LABELS, entityHref, entityName } from "../../app/selectors";
import { Empty, Notice, PageHeader, Panel, SearchInput, formatDate, usePaged } from "../../ui/kit";

export default function Activity() {
  const { state, can } = useEngine();
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const term = useDeferredValue(search.trim().toLowerCase());
  const actions = useMemo(() => [...new Set(state.audit.map((a) => a.action))].sort(), [state.audit]);
  const rows = useMemo(() => {
    const out = [];
    for (let i = state.audit.length - 1; i >= 0; i--) {
      const a = state.audit[i]!;
      if (action && a.action !== action) continue;
      const name = entityName(state, a.entityType, a.entityId);
      if (term && !`${name} ${a.actorName} ${ACTION_LABELS[a.action] ?? a.action}`.toLowerCase().includes(term)) continue;
      out.push({ a, name });
    }
    return out;
  }, [state, action, term]);
  const { rows: page, pager, reset } = usePaged(rows, 30);
  if (!can("audit.view")) return <div className="page"><Notice tone="warn">Your role cannot see the activity log.</Notice></div>;

  return (
    <div className="page">
      <PageHeader title="Activity" subtitle={`Every governance action, permanently recorded. ${state.audit.length.toLocaleString()} entries.`} />
      <Panel flush>
        <div className="toolbar">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              reset();
            }}
            placeholder="Search by item or person"
          />
          <span className="spacer" />
          <select
            aria-label="Filter by action"
            value={action}
            style={{ width: "auto" }}
            onChange={(e) => {
              setAction(e.target.value);
              reset();
            }}
          >
            <option value="">All actions</option>
            {actions.map((x) => (
              <option key={x} value={x}>
                {ACTION_LABELS[x] ?? x}
              </option>
            ))}
          </select>
        </div>
        {rows.length === 0 ? (
          <Empty title="No matching activity" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>What</th>
                  <th>Item</th>
                </tr>
              </thead>
              <tbody>
                {page.map(({ a, name }) => {
                  const href = entityHref(state, a.entityType, a.entityId);
                  return (
                    <tr key={a.id}>
                      <td className="small muted nowrap">{formatDate(a.at)}</td>
                      <td className="small">{a.actorName.replace(/\s*\(.*\)$/, "")}</td>
                      <td>{ACTION_LABELS[a.action] ?? a.action}</td>
                      <td>{href ? <Link to={href}>{name}</Link> : name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pager}
      </Panel>
    </div>
  );
}
