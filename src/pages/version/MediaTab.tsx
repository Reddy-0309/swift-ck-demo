import { useState } from "react";
import type { MouseEvent } from "react";
import { readFile, useStoredFileUrl } from "../../app/files";
import { store, useEngine, usePrincipal } from "../../app/engine";
import { userName } from "../../app/selectors";
import { useAction } from "../../app/useAction";
import { MediaPreview } from "../../components/MediaPreview";
import { Button, Card, Empty, ErrorBanner, Field, LanguageSelect, Notice, StateBadge, Tag, formatDate, shortHash } from "../../components/ui";
import { variantsOf } from "../../domain/governance";
import { AUDIO_TYPES, IMAGE_TYPES, annotateFigure, approvalCapability, approveMedia, attachNarration, createSlide, importFigure, narrationScript, rejectMedia } from "../../domain/media";
import type { Language, LanguageVariant, MediaAsset, ObjectVersion } from "../../domain/types";

interface Point {
  x: number;
  y: number;
  label: string;
  sourceLabel: string;
}

function Annotator({ version, figures, approved }: { version: ObjectVersion; figures: MediaAsset[]; approved: LanguageVariant[] }) {
  const principal = usePrincipal();
  const [figureId, setFigureId] = useState(figures[0]?.id ?? "");
  const [language, setLanguage] = useState<Language>(approved[0]?.language ?? "en");
  const [points, setPoints] = useState<Point[]>([]);
  const figure = figures.find((f) => f.id === figureId) ?? figures[0];
  const url = useStoredFileUrl(figure?.fileKey ?? null, figure?.mimeType ?? "image/png");
  const action = useAction<MediaAsset>();
  const variant = approved.find((v) => v.language === language);
  const isSourceLanguage = !!variant?.isSource;

  function place(event: MouseEvent<HTMLImageElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10;
    setPoints((p) => [...p, { x, y, label: "", sourceLabel: "" }]);
  }

  if (!figure) return <Empty>Import an approved source figure first.</Empty>;
  return (
    <div className="stack">
      <div className="row wrap">
        <Field label="Source figure">
          <select value={figure.id} onChange={(e) => setFigureId(e.target.value)}>
            {figures.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
        </Field>
        <LanguageSelect label="Label language" value={language} onChange={setLanguage} languages={approved.map((v) => v.language)} />
      </div>
      <p className="muted small">Click on the image to place a numbered label. The source image is never altered; labels are a separate layer.</p>
      <div className="annotator">
        {url && <img src={url} alt="Source figure" onClick={place} />}
        {points.map((p, i) => (
          <span key={`${p.x}-${p.y}-${i}`} className="pin" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            {i + 1}
          </span>
        ))}
      </div>
      {points.map((p, i) => (
        <div key={`${p.x}-${p.y}-${i}`} className="stack-sm">
          <div className="row">
            <span className="pin-inline">{i + 1}</span>
            <input
              value={p.label}
              placeholder="Approved label text (keep codes exact)"
              lang={language}
              aria-label={`Label ${i + 1}`}
              onChange={(e) => setPoints((all) => all.map((q, j) => (j === i ? { ...q, label: e.target.value } : q)))}
            />
            <button type="button" className="icon danger" aria-label="Remove label" onClick={() => setPoints((all) => all.filter((_, j) => j !== i))}>
              ×
            </button>
          </div>
          {!isSourceLanguage && (
            <input
              value={p.sourceLabel}
              placeholder="Source-language label it translates (codes and units are checked)"
              aria-label={`Source label ${i + 1}`}
              onChange={(e) => setPoints((all) => all.map((q, j) => (j === i ? { ...q, sourceLabel: e.target.value } : q)))}
            />
          )}
        </div>
      ))}
      <ErrorBanner error={action.error} />
      <Button
        busy={action.busy}
        disabled={!variant || !points.length || points.some((p) => !p.label.trim() || (!isSourceLanguage && !p.sourceLabel.trim()))}
        onClick={() =>
          variant &&
          void action.run(
            () => annotateFigure(store, principal, { versionId: version.id, variantId: variant.id, figureId: figure.id, annotations: points }),
            () => setPoints([]),
          )
        }
      >
        Create annotated diagram
      </Button>
    </div>
  );
}

function Producer({ version, approved, figures }: { version: ObjectVersion; approved: LanguageVariant[]; figures: MediaAsset[] }) {
  const principal = usePrincipal();
  const [slideLang, setSlideLang] = useState<Language>(approved[0]?.language ?? "en");
  const [narrationLang, setNarrationLang] = useState<Language>(approved[0]?.language ?? "en");
  const [audio, setAudio] = useState<File | null>(null);
  const [figure, setFigure] = useState<File | null>(null);
  const [inputs, setInputs] = useState(0);
  const [rights, setRights] = useState("");
  const [license, setLicense] = useState("");
  const action = useAction<MediaAsset>();
  const narrationVariant = approved.find((v) => v.language === narrationLang);
  const slideVariant = approved.find((v) => v.language === slideLang);
  const clear = () => {
    setAudio(null);
    setFigure(null);
    setInputs((n) => n + 1);
  };

  return (
    <div className="grid-2">
      <Card title="Produce from approved text" tone="media">
        <div className="stack">
          <ErrorBanner error={action.error} />
          {action.result && <Notice tone="ok">Created “{action.result.title}”. It needs approval by another reviewer before it is served.</Notice>}
          <div className="row wrap">
            <LanguageSelect label="Slide language" value={slideLang} onChange={setSlideLang} languages={approved.map((v) => v.language)} />
            <Button busy={action.busy} disabled={!slideVariant} onClick={() => slideVariant && void action.run(() => createSlide(store, principal, version.id, slideVariant.id))}>
              Generate slide
            </Button>
          </div>
          <hr />
          <Field label="Rights / licence id" hint="Required for recordings and images">
            <input value={rights} onChange={(e) => setRights(e.target.value)} />
          </Field>
          <Field label="Licence note">
            <input value={license} onChange={(e) => setLicense(e.target.value)} />
          </Field>
          <LanguageSelect label="Narration language" value={narrationLang} onChange={setNarrationLang} languages={approved.map((v) => v.language)} />
          {narrationVariant && (
            <Field label="Approved narration script — record exactly this">
              <pre className="script" lang={narrationLang}>
                {narrationScript(narrationVariant)}
              </pre>
            </Field>
          )}
          <Field label="Human narration recording">
            <input key={`a${inputs}`} type="file" accept={Object.keys(AUDIO_TYPES).join(",")} onChange={(e) => setAudio(e.target.files?.[0] ?? null)} />
          </Field>
          <Button
            disabled={!audio || !rights.trim() || !narrationVariant}
            busy={action.busy}
            onClick={() =>
              audio &&
              narrationVariant &&
              void action.run(
                async () =>
                  attachNarration(store, principal, {
                    versionId: version.id,
                    variantId: narrationVariant.id,
                    filename: audio.name,
                    bytes: await readFile(audio),
                    rightsId: rights,
                    licenseNote: license,
                  }),
                clear,
              )
            }
          >
            Attach narration
          </Button>
          <hr />
          <Field label="Approved source figure (PNG, JPG or SVG)">
            <input key={`f${inputs}`} type="file" accept={Object.keys(IMAGE_TYPES).join(",")} onChange={(e) => setFigure(e.target.files?.[0] ?? null)} />
          </Field>
          <Button
            disabled={!figure || !rights.trim()}
            busy={action.busy}
            onClick={() =>
              figure &&
              void action.run(
                async () =>
                  importFigure(store, principal, { versionId: version.id, filename: figure.name, bytes: await readFile(figure), rightsId: rights, licenseNote: license }),
                clear,
              )
            }
          >
            Import figure unchanged
          </Button>
        </div>
      </Card>
      <Card title="Annotate a source figure" tone="media">
        <Annotator version={version} figures={figures} approved={approved} />
      </Card>
    </div>
  );
}

export function MediaTab({ version }: { version: ObjectVersion }) {
  const { state, can } = useEngine();
  const principal = usePrincipal();
  const review = useAction<MediaAsset>();
  const media = state.media.filter((m) => m.versionId === version.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const variants = variantsOf(state, version.id);
  const approved = variants.filter((v) => v.state === "approved").sort((a, b) => Number(b.isSource) - Number(a.isSource) || a.language.localeCompare(b.language));
  const figures = media.filter((m) => m.type === "source_figure" && !m.stale && m.state !== "rejected");
  const languageOf = (m: MediaAsset) => variants.find((v) => v.id === m.languageVariantId)?.language ?? null;

  return (
    <div className="stack">
      <Notice>
        Media is generated only from approved fields, bound to the object-version hash and becomes stale when the version is superseded, withdrawn or
        its source is revised. No diagram, procedure or engineering video is generated by a model.
      </Notice>
      <Card title={`Media for this version (${media.length})`} tone="media">
        <ErrorBanner error={review.error} />
        {media.length === 0 && <Empty>No media yet.</Empty>}
        <div className="media-grid">
          {media.map((m) => {
            const lang = languageOf(m);
            return (
              <div key={m.id} className={`media-card${m.stale ? " stale" : ""}`}>
                <div className="row wrap">
                  <StateBadge state={m.state} />
                  {lang && <Tag>{lang}</Tag>}
                  {m.stale && <span className="badge state-withdrawn">Stale: {m.staleReason}</span>}
                </div>
                <MediaPreview media={m} language={lang ?? "en"} />
                <dl className="kv small">
                  <dt>Version hash</dt>
                  <dd className="mono">{shortHash(m.objectVersionHash)}</dd>
                  <dt>Rights</dt>
                  <dd>{m.rightsId}</dd>
                  <dt>Produced</dt>
                  <dd>
                    {userName(state, m.createdBy)} · {formatDate(m.createdAt)}
                  </dd>
                  {m.approvedBy && (
                    <>
                      <dt>Approved</dt>
                      <dd>{userName(state, m.approvedBy)}</dd>
                    </>
                  )}
                  {"rendered_text_matches" in m.verification && (
                    <>
                      <dt>Text check</dt>
                      <dd>{m.verification.rendered_text_matches ? "Matches approved text" : "Mismatch"}</dd>
                    </>
                  )}
                </dl>
                {m.state === "draft" && !m.stale && can(approvalCapability(state, m)) && (
                  <div className="row">
                    <Button
                      disabled={m.createdBy === principal.userId}
                      title={m.createdBy === principal.userId ? "Another reviewer must approve your media" : undefined}
                      onClick={() => void review.run(() => store.transact((s) => approveMedia(s, principal, m.id)))}
                    >
                      Approve
                    </Button>
                    <Button variant="ghost" onClick={() => void review.run(() => store.transact((s) => rejectMedia(s, principal, m.id, "Rejected in review")))}>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      {can("media.produce") && version.state === "published" && <Producer version={version} approved={approved} figures={figures} />}
    </div>
  );
}
