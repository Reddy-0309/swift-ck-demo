import { useState } from "react";
import type { MouseEvent } from "react";
import { downloadStored, readFile, useStoredFileUrl } from "../../../app/files";
import { store, useEngine, usePrincipal } from "../../../app/engine";
import { userName } from "../../../app/selectors";
import { useAction } from "../../../app/useAction";
import { variantsOf } from "../../../domain/governance";
import { AUDIO_TYPES, IMAGE_TYPES, annotateFigure, approvalCapability, approveMedia, attachNarration, createSlide, importFigure, narrationScript, rejectMedia } from "../../../domain/media";
import { LANGUAGE_NAMES, type Language, type LanguageVariant, type MediaAsset, type ObjectVersion } from "../../../domain/types";
import { Icon } from "../../../ui/icons";
import { Button, Empty, ErrorNotice, Field, LanguageSelect, Modal, Notice, Pill, Segmented, StatusPill, formatDate, useToast } from "../../../ui/kit";

type Kind = "slide" | "narration" | "figure" | "diagram";
const TYPE_LABEL: Record<MediaAsset["type"], string> = { slide: "Slide", narration: "Audio", source_figure: "Source diagram", annotated_diagram: "Labelled diagram" };

function Thumb({ media }: { media: MediaAsset }) {
  const image = media.type === "source_figure" || media.type === "annotated_diagram";
  const url = useStoredFileUrl(image || media.type === "narration" ? media.fileKey : null, media.mimeType);
  if (image && url) return <div className="thumb"><img src={url} alt={media.title} /></div>;
  if (media.type === "narration" && url) return <div className="thumb" style={{ padding: 12 }}><audio controls src={url} style={{ width: "100%" }} /></div>;
  return (
    <div className="thumb">
      <Icon name={media.type === "slide" ? "layers" : "file"} size={28} />
    </div>
  );
}

function MediaCard({ media, language }: { media: MediaAsset; language: Language | null }) {
  const { state, can } = useEngine();
  const principal = usePrincipal();
  const toast = useToast();
  const action = useAction<MediaAsset>();
  const canDecide = media.state === "draft" && !media.stale && can(approvalCapability(state, media));
  const own = media.createdBy === principal.userId;
  return (
    <div className={`media-card${media.stale ? " stale" : ""}`}>
      <Thumb media={media} />
      <div className="row wrap">
        <strong style={{ flex: 1 }}>{TYPE_LABEL[media.type]}</strong>
        {language && <Pill plain>{LANGUAGE_NAMES[language].english}</Pill>}
      </div>
      <div className="row wrap">
        {media.stale ? <Pill tone="red">Out of date</Pill> : <StatusPill state={media.state} />}
        {media.verification.rendered_text_matches === true && <Pill tone="green" plain>Text verified</Pill>}
      </div>
      <span className="small muted">
        Made by {userName(state, media.createdBy)}, {formatDate(media.createdAt, false)}
        {media.approvedBy && `. Approved by ${userName(state, media.approvedBy)}`}
        {media.stale && `. ${media.staleReason}`}
      </span>
      <div className="row wrap">
        {media.type === "slide" && (
          <Button size="sm" variant="secondary" icon="download" onClick={() => downloadStored(media.fileKey, `${media.title}.pptx`, media.mimeType)}>
            Download
          </Button>
        )}
        {canDecide && (
          <>
            <Button
              size="sm"
              disabled={own}
              title={own ? "Someone other than the producer must approve it" : undefined}
              onClick={() => void action.run(() => store.transact((s) => approveMedia(s, principal, media.id)), () => toast("Media approved"))}
            >
              Approve
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void action.run(() => store.transact((s) => rejectMedia(s, principal, media.id, "Rejected in review")), () => toast("Media rejected"))}>
              Reject
            </Button>
          </>
        )}
      </div>
      <ErrorNotice error={action.error} />
    </div>
  );
}

interface Point {
  x: number;
  y: number;
  label: string;
  sourceLabel: string;
}

function CreateDialog({ kind, version, approved, figures, onClose }: { kind: Kind; version: ObjectVersion; approved: LanguageVariant[]; figures: MediaAsset[]; onClose: () => void }) {
  const principal = usePrincipal();
  const toast = useToast();
  const [language, setLanguage] = useState<Language>(approved[0]?.language ?? "en");
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState("");
  const [license, setLicense] = useState("");
  const [figureId, setFigureId] = useState(figures[0]?.id ?? "");
  const [points, setPoints] = useState<Point[]>([]);
  const action = useAction<MediaAsset>();
  const variant = approved.find((v) => v.language === language);
  const figure = figures.find((f) => f.id === figureId);
  const figureUrl = useStoredFileUrl(kind === "diagram" ? figure?.fileKey ?? null : null, figure?.mimeType ?? "image/svg+xml");
  const translating = !!variant && !variant.isSource;

  const titles: Record<Kind, string> = { slide: "Create a slide", narration: "Add recorded audio", figure: "Add a source diagram", diagram: "Create a labelled diagram" };
  const ready =
    kind === "slide"
      ? !!variant
      : kind === "narration"
        ? !!variant && !!file && !!rights.trim()
        : kind === "figure"
          ? !!file && !!rights.trim()
          : !!variant && !!figure && points.length > 0 && points.every((p) => p.label.trim() && (!translating || p.sourceLabel.trim()));

  function create() {
    void action.run(
      async () => {
        if (kind === "slide") return createSlide(store, principal, version.id, (variant as LanguageVariant).id);
        if (kind === "narration") {
          return attachNarration(store, principal, { versionId: version.id, variantId: (variant as LanguageVariant).id, filename: (file as File).name, bytes: await readFile(file as File), rightsId: rights, licenseNote: license });
        }
        if (kind === "figure") return importFigure(store, principal, { versionId: version.id, filename: (file as File).name, bytes: await readFile(file as File), rightsId: rights, licenseNote: license });
        return annotateFigure(store, principal, { versionId: version.id, variantId: (variant as LanguageVariant).id, figureId: (figure as MediaAsset).id, annotations: points });
      },
      () => {
        toast("Created. It is shown to workers once someone else approves it.");
        onClose();
      },
    );
  }

  function place(event: MouseEvent<HTMLImageElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10;
    setPoints((p) => [...p, { x, y, label: "", sourceLabel: "" }]);
  }

  return (
    <Modal
      open
      wide={kind === "diagram"}
      title={titles[kind]}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button busy={action.busy} disabled={!ready} onClick={create}>
            Create
          </Button>
        </>
      }
    >
      {kind !== "figure" && <LanguageSelect value={language} onChange={setLanguage} languages={approved.map((v) => v.language)} />}
      {kind === "slide" && <p className="muted">The slide is built from the approved text in this language and checked to make sure every line appears unchanged.</p>}
      {kind === "narration" && variant && (
        <Field label="Script to record, word for word">
          <pre className="source-text" style={{ maxHeight: 220 }} lang={language}>
            {narrationScript(variant)}
          </pre>
        </Field>
      )}
      {(kind === "narration" || kind === "figure") && (
        <>
          <Field label={kind === "narration" ? "Recording" : "Diagram file (PNG, JPG or SVG)"}>
            <input type="file" accept={Object.keys(kind === "narration" ? AUDIO_TYPES : IMAGE_TYPES).join(",")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Field>
          <div className="grid-2">
            <Field label="Rights or licence ID">
              <input value={rights} onChange={(e) => setRights(e.target.value)} />
            </Field>
            <Field label="Licence note (optional)">
              <input value={license} onChange={(e) => setLicense(e.target.value)} />
            </Field>
          </div>
        </>
      )}
      {kind === "diagram" &&
        (figures.length === 0 ? (
          <Notice tone="warn">Add a source diagram first. Labels are drawn over it; the original is never changed.</Notice>
        ) : (
          <>
            {figures.length > 1 && (
              <Field label="Source diagram">
                <select value={figureId} onChange={(e) => setFigureId(e.target.value)}>
                  {figures.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <p className="small muted">Click the diagram to place a numbered label.</p>
            <div className="annotator">
              {figureUrl && <img src={figureUrl} alt="Source diagram" onClick={place} />}
              {points.map((p, i) => (
                <span key={`${p.x}-${p.y}`} className="pin" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                  {i + 1}
                </span>
              ))}
            </div>
            {points.map((p, i) => (
              <div key={`${p.x}-${p.y}`} className="row">
                <span className="pin" style={{ position: "static", transform: "none" }}>
                  {i + 1}
                </span>
                {translating && <input placeholder="Label in the source language" aria-label={`Label ${i + 1} source`} value={p.sourceLabel} onChange={(e) => setPoints((all) => all.map((q, j) => (j === i ? { ...q, sourceLabel: e.target.value } : q)))} />}
                <input placeholder={`Label in ${LANGUAGE_NAMES[language].english}`} aria-label={`Label ${i + 1}`} lang={language} value={p.label} onChange={(e) => setPoints((all) => all.map((q, j) => (j === i ? { ...q, label: e.target.value } : q)))} />
                <button type="button" className="icon-btn" aria-label="Remove label" onClick={() => setPoints((all) => all.filter((_, j) => j !== i))}>
                  <Icon name="x" />
                </button>
              </div>
            ))}
          </>
        ))}
      <ErrorNotice error={action.error} />
    </Modal>
  );
}

export function MediaTab({ version }: { version: ObjectVersion }) {
  const { state, can } = useEngine();
  const [creating, setCreating] = useState<Kind | null>(null);
  const [filter, setFilter] = useState<"all" | MediaAsset["type"]>("all");
  const variants = variantsOf(state, version.id);
  const languageOf = (m: MediaAsset) => variants.find((v) => v.id === m.languageVariantId)?.language ?? null;
  const all = state.media.filter((m) => m.versionId === version.id).sort((a, b) => (languageOf(a) ?? "").localeCompare(languageOf(b) ?? "") || a.createdAt.localeCompare(b.createdAt));
  const media = all.filter((m) => filter === "all" || m.type === filter);
  const approved = variants.filter((v) => v.state === "approved").sort((a, b) => Number(b.isSource) - Number(a.isSource) || a.language.localeCompare(b.language));
  const figures = all.filter((m) => m.type === "source_figure" && m.state === "approved" && !m.stale);
  const canProduce = can("media.produce") && version.state === "published";

  return (
    <div className="stack">
      <div className="row wrap">
        <Segmented
          label="Filter media"
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: `All (${all.length})` },
            { id: "slide", label: "Slides" },
            { id: "annotated_diagram", label: "Diagrams" },
            { id: "narration", label: "Audio" },
            { id: "source_figure", label: "Sources" },
          ]}
        />
        <span className="spacer" />
        {canProduce && (
          <>
            <Button variant="secondary" icon="plus" onClick={() => setCreating("slide")}>
              Slide
            </Button>
            <Button variant="secondary" icon="plus" onClick={() => setCreating("diagram")}>
              Labelled diagram
            </Button>
            <Button variant="secondary" icon="plus" onClick={() => setCreating("narration")}>
              Audio
            </Button>
            <Button variant="secondary" icon="plus" onClick={() => setCreating("figure")}>
              Source diagram
            </Button>
          </>
        )}
      </div>
      <p className="small muted">Media is made only from approved text, is tied to this exact version, and goes out of date automatically when the procedure changes. Nothing is generated by AI.</p>
      {media.length === 0 ? (
        <Empty title="No media yet">{canProduce ? "Create a slide or a labelled diagram from the approved text." : "Media appears here once a content author creates it."}</Empty>
      ) : (
        <div className="media-grid">
          {media.map((m) => (
            <MediaCard key={m.id} media={m} language={languageOf(m)} />
          ))}
        </div>
      )}
      {creating && <CreateDialog kind={creating} version={version} approved={approved} figures={figures} onClose={() => setCreating(null)} />}
    </div>
  );
}
