import { useDeferredValue, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEngine } from "../../app/engine";
import { ROLE_LABELS } from "../../app/people";
import { currentVersions, type VersionSummary } from "../../app/selectors";
import { Coverage } from "../../ui/Coverage";
import { Button, Empty, PageHeader, Panel, RiskPill, SearchInput, Segmented, StatusPill, timeAgo, usePaged } from "../../ui/kit";

type Filter = "all" | "live" | "progress" | "attention" | "retired";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "progress", label: "In progress" },
  { id: "attention", label: "Needs attention" },
  { id: "retired", label: "Retired" },
];

function matches(v: VersionSummary, f: Filter): boolean {
  if (f === "live") return v.state === "published";
  if (f === "progress") return v.state === "draft" || v.state === "in_review";
  if (f === "attention") return v.state === "suspended" || v.uncertainBlocks > 0;
  if (f === "retired") return v.state === "withdrawn" || v.state === "superseded";
  return true;
}

export default function KnowledgeList() {
  const { state, can } = useEngine();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const term = useDeferredValue(search.trim().toLowerCase());
  const rows = useMemo(
    () => currentVersions(state).filter((v) => matches(v, filter) && (!term || v.title.toLowerCase().includes(term) || v.objectKey.includes(term))),
    [state, filter, term],
  );
  const { rows: page, pager, reset } = usePaged(rows);

  return (
    <div className="page">
      <PageHeader
        title="Knowledge"
        subtitle="Every procedure workers can be given, with its status, risk and languages."
        actions={can("source.upload") && <Button icon="upload" onClick={() => navigate("/sources")}>Upload SOP</Button>}
      />
      <Panel flush>
        <div className="toolbar">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              reset();
            }}
            placeholder="Search procedures"
          />
          <span className="spacer" />
          <Segmented
            label="Filter by status"
            value={filter}
            onChange={(f) => {
              setFilter(f);
              reset();
            }}
            options={FILTERS}
          />
        </div>
        {rows.length === 0 ? (
          <Empty title="No procedures match">Try another filter or search term.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Procedure</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Languages</th>
                  <th>For</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {page.map((v) => (
                  <tr key={v.id} className="clickable" onClick={() => navigate(`/knowledge/${v.id}`)}>
                    <td className="title-cell">
                      <Link to={`/knowledge/${v.id}`} onClick={(e) => e.stopPropagation()}>
                        <strong>{v.title}</strong>
                      </Link>
                      <span className="muted small">
                        Version {v.version}
                        {v.distributionClass === "restricted" ? " · restricted" : ""}
                        {v.uncertainBlocks > 0 ? ` · ${v.uncertainBlocks} line${v.uncertainBlocks === 1 ? "" : "s"} to review` : ""}
                      </span>
                    </td>
                    <td>
                      <StatusPill state={v.state} />
                    </td>
                    <td>{v.state === "draft" || v.state === "in_review" ? <span className="muted">—</span> : <RiskPill risk={v.riskClass} />}</td>
                    <td>
                      <Coverage v={v} />
                    </td>
                    <td className="small">{v.applicability.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ") || "—"}</td>
                    <td className="small muted nowrap">{timeAgo(v.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pager}
      </Panel>
    </div>
  );
}
