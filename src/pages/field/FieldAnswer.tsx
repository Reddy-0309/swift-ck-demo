import { downloadStored, useStoredFileUrl } from "../../app/files";
import type { C2KnowledgeResponse, MediaRef } from "../../domain/contracts";
import { ANSWER_TEXT, FIELD_LABELS, WORKER_TEXT } from "../../domain/labels";
import { LANGUAGE_NAMES, type DemoState, type Language, type MediaAsset } from "../../domain/types";
import { Icon } from "../../ui/icons";
import { Procedure } from "../../ui/Procedure";
import { RiskPill, formatDate } from "../../ui/kit";

type MediaEvent = (ref: MediaRef, event: "media.opened" | "media.played") => void;

function FieldMedia({ asset, refInfo, language, onMedia }: { asset: MediaAsset; refInfo: MediaRef; language: Language; onMedia: MediaEvent }) {
  const t = WORKER_TEXT[language];
  const url = useStoredFileUrl(asset.type === "slide" ? null : asset.fileKey, asset.mimeType);
  return (
    <figure>
      <figcaption>{t.media[asset.type]}</figcaption>
      {asset.type === "slide" && (
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => {
            onMedia(refInfo, "media.opened");
            downloadStored(asset.fileKey, `${asset.title}.pptx`, asset.mimeType);
          }}
        >
          <Icon name="download" size={16} />
          {t.downloadSlide}
        </button>
      )}
      {(asset.type === "source_figure" || asset.type === "annotated_diagram") && url && (
        <a href={url} target="_blank" rel="noreferrer" onClick={() => onMedia(refInfo, "media.opened")}>
          <img src={url} alt={asset.title} />
        </a>
      )}
      {asset.type === "narration" && url && <audio controls src={url} onPlay={() => onMedia(refInfo, "media.played")} style={{ width: "100%" }} />}
    </figure>
  );
}

/** The worker's answer: approved text verbatim with its provenance — or a clear non-answer. */
export function FieldAnswer({
  response,
  language,
  state,
  onMedia,
  alternatives = [],
  onLanguage,
}: {
  response: C2KnowledgeResponse;
  language: Language;
  state: DemoState;
  onMedia: MediaEvent;
  alternatives?: Language[];
  onLanguage?: (l: Language) => void;
}) {
  const a = ANSWER_TEXT[language];
  const t = WORKER_TEXT[language];
  if (response.outcome !== "answer") {
    const heading = response.outcome === "need_context" ? a.needContext : response.outcome === "not_permitted" ? a.notPermitted : a.noAnswer;
    return (
      <section className={`no-answer${response.outcome === "not_permitted" ? " refused" : ""}`} aria-live="polite">
        <h2>{heading}</h2>
        <p>{a.reasons[response.reason ?? ""] ?? a.reasons.no_applicable_object}</p>
        {response.required_context && (
          <p style={{ marginTop: 8 }}>
            {a.pleaseProvide}: <strong>{response.required_context.map((f) => FIELD_LABELS[language][f] ?? f).join(", ")}</strong>
          </p>
        )}
        {alternatives.length > 0 && onLanguage && (
          <div className="alt-langs">
            <p>{t.showIn}:</p>
            <div className="chips">
              {alternatives.map((l) => (
                <button key={l} type="button" className="chip" lang={l} onClick={() => onLanguage(l)}>
                  {LANGUAGE_NAMES[l].native}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }
  const citation = response.source_citation;
  const media = (response.media_refs ?? [])
    .map((ref) => ({ ref, asset: state.media.find((m) => m.id === ref.media_id) }))
    .filter((x): x is { ref: MediaRef; asset: MediaAsset } => !!x.asset);
  return (
    <section className="answer-card" aria-live="polite">
      <div className="answer-head">
        <h2>{response.title}</h2>
        {response.risk_class === "HIGH" && <RiskPill risk="HIGH" />}
      </div>
      <p className="approved-note">
        <Icon name="shield" size={16} />
        {a.approvedNote}
      </p>
      <Procedure blocks={response.content ?? []} lang={language} large />
      {response.escalation_route && (
        <div className="escalate">
          <Icon name="alert" />
          <span>
            <strong>{a.escalationRoute}:</strong> {response.escalation_route}
          </span>
        </div>
      )}
      {media.length > 0 && (
        <div className="field-media">
          {media.map(({ ref, asset }) => (
            <FieldMedia key={ref.media_id} asset={asset} refInfo={ref} language={language} onMedia={onMedia} />
          ))}
        </div>
      )}
      <p className="provenance">
        {a.version} {response.object_version} · {a.effective} {formatDate(response.effective_from, false)}
        {citation && ` · ${a.source}: ${citation.document_key.toUpperCase()} r${citation.revision}`}
      </p>
    </section>
  );
}
