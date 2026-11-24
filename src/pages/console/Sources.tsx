import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { downloadBytes, readFile } from "../../app/files";
import { store, useEngine, usePrincipal } from "../../app/engine";
import { userName } from "../../app/selectors";
import { useAction } from "../../app/useAction";
import { heuristicExtractor } from "../../domain/extraction";
import { extractDrafts, type ExtractionReport } from "../../domain/governance";
import { SUPPORTED_TYPES } from "../../domain/ingestion";
import { uploadSource } from "../../domain/intake";
import { LANGUAGES, type Language, type SourceDocument } from "../../domain/types";
import {
  CONVEYOR_FIGURE_FILENAME,
  CONVEYOR_FIGURE_SVG,
  CONVEYOR_SOP,
  CONVEYOR_SOP_FILENAME,
  PICKUP_SOP_R2,
  PICKUP_SOP_R2_FILENAME,
  buildDocx,
} from "../../seed/fixtures";
import { Icon } from "../../ui/icons";
import { Button, Empty, ErrorNotice, Field, LanguageSelect, Notice, PageHeader, Panel, StatusPill, timeAgo, useToast } from "../../ui/kit";

const encode = (text: string) => new TextEncoder().encode(text);

function Upload() {
  const principal = usePrincipal();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [key, setKey] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [note, setNote] = useState("Synthetic content written for the demo");
  const [cleared, setCleared] = useState(false);
  const action = useAction<SourceDocument>();

  function drop(event: DragEvent) {
    event.preventDefault();
    setOver(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  function upload() {
    if (!file) return;
    void action.run(
      async () => uploadSource(store, principal, file.name, await readFile(file), { rightsCleared: cleared, rightsNote: note, synthetic: true, documentKey: key.trim() || undefined, language }),
      (src) => {
        toast(`Uploaded ${src.title} (revision ${src.revision})`);
        setFile(null);
        setKey("");
        setCleared(false);
        if (input.current) input.current.value = "";
      },
    );
  }

  return (
    <div className="stack">
      <div
        className={`dropzone${over ? " over" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
      >
        <Icon name="upload" size={26} />
        <strong>{file ? file.name : "Drop an SOP here, or click to choose"}</strong>
        <span className="small">Word (.docx), PDF with selectable text, Markdown or plain text, up to 20 MB</span>
        <input ref={input} type="file" hidden accept={Object.keys(SUPPORTED_TYPES).join(",")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="SOP file" />
      </div>
      {file && (
        <>
          <div className="grid-2">
            <Field label="Document ID (optional)" hint="Read from the file when it has one. Re-using an ID adds a new revision.">
              <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. SOP-DL-014" />
            </Field>
            <LanguageSelect label="Written in" value={language} onChange={setLanguage} languages={LANGUAGES} />
          </div>
          <Field label="Rights note">
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <label className="check">
            <input type="checkbox" checked={cleared} onChange={(e) => setCleared(e.target.checked)} />I confirm this document is synthetic or cleared for this use.
          </label>
          <ErrorNotice error={action.error} />
          <div className="row">
            <span className="spacer" />
            <Button variant="secondary" onClick={() => setFile(null)}>
              Cancel
            </Button>
            <Button busy={action.busy} disabled={!cleared} onClick={upload}>
              Upload
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function SampleFiles() {
  const action = useAction<void>();
  return (
    <div className="stack-sm">
      <p className="small muted">Sample files to try it out:</p>
      <Button variant="secondary" size="sm" icon="download" onClick={() => downloadBytes(encode(PICKUP_SOP_R2), PICKUP_SOP_R2_FILENAME, "text/markdown")}>
        Parcel pickup SOP, revision 2 (.md)
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon="download"
        busy={action.busy}
        onClick={() => void action.run(async () => downloadBytes(await buildDocx(CONVEYOR_SOP), CONVEYOR_SOP_FILENAME, SUPPORTED_TYPES[".docx"] as string))}
      >
        Conveyor inspection SOP (.docx)
      </Button>
      <Button variant="secondary" size="sm" icon="download" onClick={() => downloadBytes(encode(CONVEYOR_FIGURE_SVG), CONVEYOR_FIGURE_FILENAME, "image/svg+xml")}>
        Conveyor diagram (.svg)
      </Button>
      <p className="small muted">Revision 2 changes the weight limit from 15 kg to 12 kg. Uploading it suspends the live pickup procedure until an expert re-approves it.</p>
    </div>
  );
}

export function ExtractButton({ source }: { source: SourceDocument }) {
  const principal = usePrincipal();
  const toast = useToast();
  const navigate = useNavigate();
  const action = useAction<ExtractionReport>();
  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        busy={action.busy}
        onClick={() =>
          void action.run(
            () => store.transact((s) => extractDrafts(s, principal, source.id, heuristicExtractor)),
            (report) => {
              const skipped = report.rejected.filter((r) => r.reason === "open_draft_exists").length;
              toast(`${report.createdVersionIds.length} draft${report.createdVersionIds.length === 1 ? "" : "s"} created${skipped ? `, ${skipped} skipped (a draft already exists)` : ""}`);
              if (report.createdVersionIds.length === 1) navigate(`/knowledge/${report.createdVersionIds[0]}`);
            },
          )
        }
      >
        Create drafts
      </Button>
      {action.error !== null && <ErrorNotice error={action.error} />}
    </>
  );
}

export default function Sources() {
  const { state, can } = useEngine();
  const navigate = useNavigate();
  if (!can("source.upload") && !can("draft.edit")) return <div className="page"><Notice tone="warn">Your role cannot manage sources.</Notice></div>;
  const sources = [...state.sources].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return (
    <div className="page">
      <PageHeader title="Sources" subtitle="The SOP documents knowledge is drafted from. Every draft line links back to the exact words here." />
      <div className={can("source.upload") ? "split" : undefined}>
        <Panel title="All sources" flush>
          {sources.length === 0 ? (
            <Empty title="No sources yet">Upload an SOP to start.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Status</th>
                    <th>Uploaded</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sources.map((s) => (
                    <tr key={s.id} className="clickable" onClick={() => navigate(`/sources/${s.id}`)}>
                      <td className="title-cell">
                        <Link to={`/sources/${s.id}`} onClick={(e) => e.stopPropagation()}>
                          <strong>{s.title}</strong>
                        </Link>
                        <span className="muted small">
                          {s.documentKey.toUpperCase()} · revision {s.revision} · {s.filename}
                        </span>
                      </td>
                      <td>
                        <StatusPill state={s.status === "active" ? "active" : "superseded"} />
                      </td>
                      <td className="small muted nowrap">
                        {timeAgo(s.uploadedAt)}
                        <span style={{ display: "block" }}>{userName(state, s.uploadedBy)}</span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>{s.status === "active" && can("draft.edit") && <ExtractButton source={s} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        {can("source.upload") && (
          <div className="stack">
            <Panel title="Upload an SOP">
              <Upload />
            </Panel>
            <Panel title="Try it">
              <SampleFiles />
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
