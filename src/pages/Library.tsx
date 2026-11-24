import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useEngine } from "../app/engine";
import { versionSummaries } from "../app/selectors";
import { Card, Empty, NotAvailable, PageHeader, RiskBadge, StateBadge, Tag, formatDate } from "../components/ui";
import type { VersionState } from "../domain/types";

const STATES: (VersionState | "all")[] = ["all", "draft", "in_review", "published", "suspended", "superseded", "withdrawn"];

export function LibraryPage() {
  const { state, can } = useEngine();
  const [filter, setFilter] = useState<VersionState | "all">("all");
  const [search, setSearch] = useState("");
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return versionSummaries(state).filter(
      (v) => (filter === "all" || v.state === filter) && (!term || v.title.toLowerCase().includes(term) || v.objectKey.includes(term)),
    );
  }, [state, filter, search]);
  if (!can("knowledge.read")) return <NotAvailable />;

  return (
    <>
      <PageHeader title="Knowledge library" subtitle="Every object version, its state, risk, distribution and languages." />
      <Card
        actions={
          <div className="row">
            <input placeholder="Search title or key" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
            <select value={filter} onChange={(e) => setFilter(e.target.value as VersionState | "all")} aria-label="Filter by state">
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All states" : s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {rows.length === 0 && <Empty>No versions match.</Empty>}
        {rows.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Knowledge object</th>
                  <th>State</th>
                  <th>Risk</th>
                  <th>Distribution</th>
                  <th>Languages</th>
                  <th>Tasks / roles</th>
                  <th>Approved</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link to={`/versions/${v.id}`}>{v.title}</Link>
                      <div className="muted small mono">
                        {v.objectKey} · v{v.version}
                      </div>
                    </td>
                    <td>
                      <StateBadge state={v.state} />
                    </td>
                    <td>{v.state === "draft" || v.state === "in_review" ? "—" : <RiskBadge risk={v.riskClass} />}</td>
                    <td>{v.distributionClass ?? "—"}</td>
                    <td className="langs">
                      {v.languages.map(([lang, st]) => (
                        <Tag key={lang}>
                          {lang}
                          {st === "approved" ? "" : `: ${st}`}
                        </Tag>
                      ))}
                    </td>
                    <td className="small">
                      {v.applicability.taskIds.join(", ")}
                      <div className="muted">{v.applicability.roles.join(", ")}</div>
                      {v.applicability.situationCodes.length > 0 && <div className="muted">situation: {v.applicability.situationCodes.join(", ")}</div>}
                    </td>
                    <td className="small">
                      {v.approver ?? "—"}
                      <div className="muted">{formatDate(v.approvedAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
