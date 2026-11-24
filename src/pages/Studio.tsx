import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { downloadBytes, downloadStored, readFile } from "../app/files";
import { store, useEngine, usePrincipal } from "../app/engine";
import { userName, versionSummaries } from "../app/selectors";
import { useAction } from "../app/useAction";
import { Button, Card, Empty, ErrorBanner, Field, LanguageSelect, NotAvailable, Notice, PageHeader, StateBadge, formatDate, shortHash } from "../components/ui";
import { heuristicExtractor } from "../domain/extraction";
import { extractDrafts, type ExtractionReport } from "../domain/governance";
import { SUPPORTED_TYPES } from "../domain/ingestion";
import { uploadSource } from "../domain/intake";
import { LANGUAGES, type Language, type SourceDocument } from "../domain/types";
import {
  CONVEYOR_FIGURE_FILENAME,
  CONVEYOR_FIGURE_SVG,
  CONVEYOR_SOP,
  CONVEYOR_SOP_FILENAME,
  PICKUP_SOP,
  PICKUP_SOP_FILENAME,
  PICKUP_SOP_R2,
  PICKUP_SOP_R2_FILENAME,
  buildDocx,
} from "../seed/fixtures";

const text = (value: string) => new TextEncoder().encode(value);

function SampleFiles() {
  const action = useAction<void>();
  return (
    <div className="stack-sm">
      <p className="small">Synthetic sample files to try the workflow:</p>
      <div className="row wrap">
        <Button variant="ghost" onClick={() => downloadBytes(text(PICKUP_SOP), PICKUP_SOP_FILENAME, "text/markdown")}>
          Pickup SOP r1 (.md)
        </Button>
        <Button variant="ghost" onClick={() => downloadBytes(text(PICKUP_SOP_R2), PICKUP_SOP_R2_FILENAME, "text/markdown")}>
          Pickup SOP r2 — 12 kg limit (.md)
        </Button>
        <Button
          variant="ghost"
          busy={action.busy}
          onClick={() =>
            void action.run(async () =>
              downloadBytes(await buildDocx(CONVEYOR_SOP), CONVEYOR_SOP_FILENAME, SUPPORTED_TYPES[".docx"] as string),
            )
          }
        >
          Conveyor SOP (.docx)
        </Button>
        <Button variant="ghost" onClick={() => downloadBytes(text(CONVEYOR_FIGURE_SVG), CONVEYOR_FIGURE_FILENAME, "image/svg+xml")}>
          Conveyor figure (.svg)
        </Button>
      </div>
      <p className="muted small">Uploading r2 registers a new revision of SOP-DL-014 and suspends the knowledge that cites r1.</p>
      <ErrorBanner error={action.error} />
    </div>
  );
}

function UploadForm() {
  const principal = usePrincipal();
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [rights, setRights] = useState(false);
  const [note, setNote] = useState("Synthetic content written for the demonstrator");
  const [synthetic, setSynthetic] = useState(true);
  const [key, setKey] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const action = useAction<SourceDocument>();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    void action.run(
      async () =>
        uploadSource(store, principal, file.name, await readFile(file), {
          rightsCleared: rights,
          rightsNote: note,
          synthetic,
          documentKey: key.trim() || undefined,
          language,
        }),
      () => {
        setFile(null);
        setKey("");
        setInputKey((k) => k + 1);
      },
    );
  }

  return (
    <form onSubmit={submit} className="stack">
      <Field label="Source document" hint="Markdown, plain text, DOCX, or a PDF with a text layer. OCR of scans is part of the production backend.">
        <input key={inputKey} type="file" accept={Object.keys(SUPPORTED_TYPES).join(",")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
      </Field>
      <Field label="Document key (optional)" hint="Otherwise read from the file's 'Document ID:' line. An existing key registers a new revision.">
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. sop-dl-014" />
      </Field>
      <LanguageSelect label="Source language (if the file does not say)" value={language} onChange={setLanguage} languages={LANGUAGES} />
      <Field label="Rights note">
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <label className="check">
        <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} />I confirm this material is synthetic or rights-cleared for this use
      </label>
      <label className="check">
        <input type="checkbox" checked={synthetic} onChange={(e) => setSynthetic(e.target.checked)} />
        Synthetic content
      </label>
      <ErrorBanner error={action.error} />
      {action.result && (
        <Notice tone="ok">
          Uploaded {action.result.title} (revision {action.result.revision}).
        </Notice>
      )}
      <div>
        <button type="submit" className="btn btn-primary" disabled={!file || !rights || action.busy}>
          {action.busy ? "Uploading…" : "Upload source"}
        </button>
      </div>
    </form>
  );
}

function ExtractButton({ source }: { source: SourceDocument }) {
  const principal = usePrincipal();
  const action = useAction<ExtractionReport>();
  const report = action.result;
  return (
    <div className="stack-sm">
      <Button variant="secondary" busy={action.busy} onClick={() => void action.run(() => store.transact((s) => extractDrafts(s, principal, source.id, heuristicExtractor)))}>
        Extract drafts
      </Button>
      <ErrorBanner error={action.error} />
      {report && (
        <Notice tone={report.createdVersionIds.length ? "ok" : "warn"}>
          {report.createdVersionIds.length} draft(s) created with {report.method}.
          {report.rejected.length > 0 && ` ${report.rejected.length} item(s) rejected (${[...new Set(report.rejected.map((r) => r.reason))].join(", ")}).`}{" "}
          Drafts are never published automatically.
        </Notice>
      )}
    </div>
  );
}

export function StudioPage() {
  const { state, can } = useEngine();
  if (!can("source.upload") && !can("draft.edit")) return <NotAvailable />;
  const drafts = versionSummaries(state, ["draft", "in_review"]);
  const sources = [...state.sources].sort((a, b) => a.documentKey.localeCompare(b.documentKey) || b.revision - a.revision);

  return (
    <>
      <PageHeader title="Knowledge Studio" subtitle="Source intake → AI-assisted drafts → SME review. Extracted output is always a draft." />
      <div className="grid-2">
        {can("source.upload") && (
          <Card title="Upload a source" tone="knowledge">
            <UploadForm />
            <hr />
            <SampleFiles />
          </Card>
        )}
        <Card title="Open drafts" tone="knowledge">
          {drafts.length === 0 && <Empty>No open drafts.</Empty>}
          <ul className="list">
            {drafts.map((v) => (
              <li key={v.id}>
                <Link to={`/versions/${v.id}`}>
                  {v.title} <span className="muted">v{v.version}</span>
                </Link>
                <StateBadge state={v.state} />
                {v.uncertainBlocks > 0 && <span className="flag">{v.uncertainBlocks} flagged</span>}
              </li>
            ))}
          </ul>
          <p className="muted small">
            The demo drafts with a deterministic rule-based extractor ({heuristicExtractor.name}); the production backend adds a local model
            behind the same interface. Either way, every block quotes the source verbatim.
          </p>
        </Card>
      </div>
      <Card title="Sources">
        {sources.length === 0 && <Empty>No sources yet.</Empty>}
        {sources.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Revision</th>
                  <th>Status</th>
                  <th>SHA-256</th>
                  <th>Uploaded</th>
                  <th>Extraction</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/sources/${s.id}`}>{s.title}</Link>
                      <div className="muted small">
                        {s.documentKey} · {s.filename} · {s.language}
                        {s.synthetic ? " · synthetic" : ""}
                      </div>
                    </td>
                    <td>r{s.revision}</td>
                    <td>
                      <StateBadge state={s.status} />
                    </td>
                    <td className="mono">{shortHash(s.sha256)}</td>
                    <td>
                      {formatDate(s.uploadedAt)}
                      <div className="muted small">{userName(state, s.uploadedBy)}</div>
                    </td>
                    <td>
                      {can("draft.edit") && s.status === "active" ? <ExtractButton source={s} /> : <span className="muted small">—</span>}
                      <button type="button" className="link small" onClick={() => downloadStored(s.fileKey, s.filename, s.mediaType)}>
                        Download original
                      </button>
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
