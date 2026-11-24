import { Link, useParams } from "react-router-dom";
import { downloadStored } from "../../app/files";
import { useEngine } from "../../app/engine";
import { summarize, userName } from "../../app/selectors";
import { Icon } from "../../ui/icons";
import { Button, Empty, Notice, PageHeader, Panel, StatusPill, formatDate } from "../../ui/kit";
import { ExtractButton } from "./Sources";

export default function SourceDetail() {
  const { id = "" } = useParams();
  const { state, can } = useEngine();
  const s = state.sources.find((x) => x.id === id);
  if (!can("knowledge.read")) return <div className="page"><Notice tone="warn">Your role cannot open sources.</Notice></div>;
  if (!s) return <div className="page"><Empty title="Source not found" action={<Link to="/sources">Back to sources</Link>} /></div>;
  const derived = state.versions.filter((v) => v.sourceDocumentId === s.id).map((v) => summarize(state, v));
  const newer = s.supersededById ? state.sources.find((x) => x.id === s.supersededById) : null;

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <Link to="/sources">Sources</Link>
            <Icon name="chevronRight" size={14} />
            <span>Revision {s.revision}</span>
          </>
        }
        title={s.title}
        subtitle={
          <span className="row wrap">
            <StatusPill state={s.status === "active" ? "active" : "superseded"} />
            <span>
              {s.documentKey.toUpperCase()} · uploaded {formatDate(s.uploadedAt)} by {userName(state, s.uploadedBy)}
            </span>
          </span>
        }
        actions={
          <>
            <Button variant="secondary" icon="download" onClick={() => downloadStored(s.fileKey, s.filename, s.mediaType)}>
              Original file
            </Button>
            {s.status === "active" && can("draft.edit") && <ExtractButton source={s} />}
          </>
        }
      />
      {newer && (
        <div style={{ marginBottom: 16 }}>
          <Notice tone="warn">
            Replaced by <Link to={`/sources/${newer.id}`}>revision {newer.revision}</Link>. Procedures that cited this revision were suspended.
          </Notice>
        </div>
      )}
      <div className="split">
        <Panel title="Document text">
          <pre className="source-text" lang={s.language}>
            {s.text}
          </pre>
        </Panel>
        <div className="stack">
          <Panel title="Procedures from this document" flush>
            {derived.length === 0 ? (
              <Empty title="No drafts yet">Use “Create drafts” to extract them.</Empty>
            ) : (
              <ul className="inbox">
                {derived.map((v) => (
                  <li key={v.id}>
                    <Link to={`/knowledge/${v.id}`}>
                      <span className="what">
                        <strong>{v.title}</strong>
                        <span>Version {v.version}</span>
                      </span>
                      <StatusPill state={v.state} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Details">
            <dl className="kv">
              <dt>File</dt>
              <dd>{s.filename}</dd>
              <dt>Language</dt>
              <dd>{s.language}</dd>
              <dt>Rights</dt>
              <dd>{s.rightsNote || "Cleared"}</dd>
              <dt>Fingerprint</dt>
              <dd className="mono">{s.sha256.slice(0, 16)}…</dd>
              <dt>Sections</dt>
              <dd>{s.sections.map((x) => x.heading).join(", ")}</dd>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
