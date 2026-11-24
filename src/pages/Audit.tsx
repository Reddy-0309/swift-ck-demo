import { useMemo, useState } from "react";
import { useEngine } from "../app/engine";
import { Card, NotAvailable, PageHeader, formatDate } from "../components/ui";

const PAGE = 300;

export function AuditPage() {
  const { state, can } = useEngine();
  const [action, setAction] = useState("");
  const actions = useMemo(() => [...new Set(state.audit.map((a) => a.action))].sort(), [state.audit]);
  const entries = useMemo(() => state.audit.filter((a) => !action || a.action === action).slice(-PAGE).reverse(), [state.audit, action]);
  if (!can("audit.view")) return <NotAvailable />;
  return (
    <>
      <PageHeader title="Audit log" subtitle={`Append-only record of every governance action (latest first; ${state.audit.length} entries).`} />
      <Card
        actions={
          <select value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filter by action">
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        }
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((a) => (
                <tr key={a.id}>
                  <td className="small">{formatDate(a.at)}</td>
                  <td className="small">{a.actorName}</td>
                  <td>
                    <code>{a.action}</code>
                  </td>
                  <td className="small mono">
                    {a.entityType} {a.entityId.slice(0, 8)}
                  </td>
                  <td>
                    <code className="small wrap">{JSON.stringify(a.details)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
