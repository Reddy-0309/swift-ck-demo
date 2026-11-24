import { useParams } from "react-router-dom";
import { useEngine } from "../app/engine";
import { userName } from "../app/selectors";
import { Card, Empty, NotAvailable, PageHeader, StateBadge, formatDate } from "../components/ui";

export function SourceDetailPage() {
  const { id = "" } = useParams();
  const { state, can } = useEngine();
  if (!can("knowledge.read")) return <NotAvailable />;
  const s = state.sources.find((x) => x.id === id);
  if (!s) return <Empty>Source not found.</Empty>;
  return (
    <>
      <PageHeader
        title={s.title}
        subtitle={`${s.documentKey} · revision ${s.revision} · ${s.language} · uploaded ${formatDate(s.uploadedAt)} by ${userName(state, s.uploadedBy)}`}
        actions={<StateBadge state={s.status} />}
      />
      <div className="grid-2">
        <Card title="Provenance" tone="knowledge">
          <dl className="kv">
            <dt>File</dt>
            <dd>{s.filename}</dd>
            <dt>SHA-256</dt>
            <dd className="mono wrap">{s.sha256}</dd>
            <dt>Rights</dt>
            <dd>Cleared — {s.rightsNote || "no note"}</dd>
            <dt>Synthetic</dt>
            <dd>{s.synthetic ? "Yes" : "No"}</dd>
            {Object.entries(s.metadata).map(([k, v]) => (
              <div key={k} className="kv-row">
                <dt>{k}</dt>
                <dd>{Array.isArray(v) ? v.join(", ") : v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card title={`Sections (${s.sections.length})`}>
          <ol className="list">
            {s.sections.map((sec) => (
              <li key={sec.id}>
                {sec.heading}{" "}
                <span className="muted small mono">
                  [{sec.start}–{sec.end}]
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
      <Card title="Normalised source text">
        <pre className="source-text" lang={s.language}>
          {s.text}
        </pre>
      </Card>
    </>
  );
}
