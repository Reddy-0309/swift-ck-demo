import type { C2KnowledgeResponse, MediaRef } from "../domain/contracts";
import { ANSWER_TEXT, FIELD_LABELS } from "../domain/labels";
import { isLanguage, type DemoState } from "../domain/types";
import { MediaPreview } from "./MediaPreview";
import { BlockView, RiskBadge, formatDate } from "./ui";

interface Props {
  response: C2KnowledgeResponse;
  language: string;
  state: DemoState;
  onMedia?: (ref: MediaRef, event: "media.opened" | "media.played") => void;
}

/** The worker-facing answer, fully localized: approved text verbatim, or a clear non-answer. */
export function AnswerCard({ response, language, state, onMedia }: Props) {
  const lang = isLanguage(language) ? language : "en";
  const t = ANSWER_TEXT[lang];
  if (response.outcome !== "answer") {
    const tone = response.outcome === "not_permitted" ? "refused" : "abstain";
    const heading = response.outcome === "need_context" ? t.needContext : response.outcome === "not_permitted" ? t.notPermitted : t.noAnswer;
    return (
      <section className={`answer answer-${tone}`} aria-live="polite" lang={lang}>
        <h2>{heading}</h2>
        <p>{t.reasons[response.reason ?? ""] ?? t.reasons.no_applicable_object}</p>
        {response.required_context && (
          <p>
            {t.pleaseProvide}: <strong>{response.required_context.map((f) => FIELD_LABELS[lang][f] ?? f).join(", ")}</strong>
          </p>
        )}
        <p className="muted small" lang="en">
          The system abstains rather than guess. Outcome <code>{response.outcome}</code>
          {response.reason && (
            <>
              {" "}
              · reason <code>{response.reason}</code>
            </>
          )}
        </p>
      </section>
    );
  }

  const citation = response.source_citation;
  const media = (response.media_refs ?? [])
    .map((ref) => ({ ref, asset: state.media.find((m) => m.id === ref.media_id) }))
    .filter((x): x is { ref: MediaRef; asset: NonNullable<typeof x.asset> } => !!x.asset);
  return (
    <section className="answer answer-ok" aria-live="polite">
      <header className="answer-head">
        <h2 lang={lang}>{response.title}</h2>
        <RiskBadge risk={response.risk_class} />
      </header>
      <p className="verbatim-note" lang={lang}>
        {t.approvedNote}
      </p>
      <BlockView blocks={response.content ?? []} lang={lang} />
      {response.escalation_route && (
        <p className="escalation">
          <strong lang={lang}>{t.escalationRoute}:</strong> {response.escalation_route}
        </p>
      )}
      <footer className="citation">
        <span>
          <span lang={lang}>{t.version}</span> <strong>v{response.object_version}</strong>
        </span>
        <span>
          <span lang={lang}>{t.effective}</span> {formatDate(response.effective_from)}
        </span>
        {citation && (
          <span>
            <span lang={lang}>{t.source}</span>: {citation.title} ({citation.document_key} r{citation.revision})
            {citation.section ? ` · “${citation.section}”` : ""}
          </span>
        )}
      </footer>
      {media.length > 0 && (
        <div className="media-grid">
          {media.map(({ ref, asset }) => (
            <MediaPreview
              key={ref.media_id}
              media={asset}
              language={lang}
              onOpened={() => onMedia?.(ref, "media.opened")}
              onPlayed={() => onMedia?.(ref, "media.played")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
