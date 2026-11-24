import { useState } from "react";
import { store, useEngine, usePrincipal } from "../../app/engine";
import { userName } from "../../app/selectors";
import { errorCode, errorDetails, useAction } from "../../app/useAction";
import { Button, Card, ErrorBanner, Field, Notice, StateBadge, Tag, formatDate, languageName } from "../../components/ui";
import { BLOCK_LABELS } from "../../domain/labels";
import { bilingualApprove, hazardCheck, hazardCheckRequired, sourceVariantOf, upsertTranslation, variantIn, withdrawVariant } from "../../domain/governance";
import { LANGUAGES, LANGUAGE_NAMES, type Language, type LanguageVariant, type ObjectVersion } from "../../domain/types";

function Editor({ version, source, language, variant }: { version: ObjectVersion; source: LanguageVariant; language: Language; variant?: LanguageVariant }) {
  const { state, can } = useEngine();
  const principal = usePrincipal();
  const [title, setTitle] = useState(variant?.title ?? "");
  const [texts, setTexts] = useState<Record<string, string>>(() => Object.fromEntries((variant?.blocks ?? []).map((b) => [b.id, b.text])));
  const [note, setNote] = useState("");
  const action = useAction<LanguageVariant>();
  const editable = can("language.draft") && (!variant || variant.state === "draft");
  const protectedProblems = errorCode(action.error) === "protected_terms" ? (errorDetails(action.error).blocks as Record<string, string[]> | undefined) : undefined;
  const sourceLabels = BLOCK_LABELS[source.language];
  const run = (fn: () => LanguageVariant) => void action.run(fn, () => setNote(""));
  const hazardNeeded = variant ? hazardCheckRequired(state, variant) : false;
  const blocks = [...source.blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="stack">
      <Card title={`Side-by-side translation · ${languageName(language)}`}>
        <Field label={`Title (${LANGUAGE_NAMES[language].english})`}>
          <input value={title} disabled={!editable} onChange={(e) => setTitle(e.target.value)} lang={language} />
        </Field>
        <div className="translate-grid">
          <div className="th">Approved source ({LANGUAGE_NAMES[source.language].english})</div>
          <div className="th">Translation ({LANGUAGE_NAMES[language].english})</div>
          {blocks.map((b) => (
            <div key={b.id} className="translate-row">
              <div className={`block block-${b.type}`} lang={source.language}>
                <span className="block-label">{sourceLabels[b.type]}</span>
                <span className="block-text">{b.text}</span>
              </div>
              <div>
                <textarea
                  rows={3}
                  lang={language}
                  value={texts[b.id] ?? ""}
                  disabled={!editable}
                  onChange={(e) => setTexts((t) => ({ ...t, [b.id]: e.target.value }))}
                  aria-label={`Translation of block ${b.id}`}
                />
                {protectedProblems?.[b.id] && <span className="flag">Altered protected terms: {protectedProblems[b.id]?.join(", ")}</span>}
              </div>
            </div>
          ))}
        </div>
        {editable && (
          <Button
            busy={action.busy}
            onClick={() =>
              run(() =>
                store.transact((s) => upsertTranslation(s, principal, version.id, { language, title, blocks: blocks.map((b) => ({ id: b.id, text: texts[b.id] ?? "" })) })),
              )
            }
          >
            Save translation draft
          </Button>
        )}
      </Card>
      {variant && (
        <Card title="Language approval">
          <dl className="kv">
            <dt>Translator</dt>
            <dd>
              {userName(state, variant.draftedBy)} · {formatDate(variant.draftedAt)}
            </dd>
            <dt>Bilingual reviewer</dt>
            <dd>{variant.reviewerId ? `${userName(state, variant.reviewerId)} · ${formatDate(variant.reviewedAt)}` : "Pending"}</dd>
            <dt>Independent hazard check</dt>
            <dd>
              {!hazardNeeded
                ? "Not required for this content"
                : variant.hazardCheckerId
                  ? `${userName(state, variant.hazardCheckerId)} · ${formatDate(variant.hazardCheckedAt)}`
                  : "Pending"}
            </dd>
            <dt>Notes</dt>
            <dd className="pre-line">{variant.reviewNotes || "—"}</dd>
          </dl>
          {variant.state === "withdrawn" && <Notice tone="warn">This language was withdrawn. Start a new version of the object to translate it again.</Notice>}
          {(variant.state === "draft" || (variant.state === "approved" && can("version.review"))) && (
            <Field label={variant.state === "approved" ? "Withdrawal reason" : "Review note"}>
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          )}
          <div className="row">
            {variant.state === "draft" && can("language.approve") && !variant.reviewerId && (
              <Button
                disabled={variant.draftedBy === principal.userId}
                title={variant.draftedBy === principal.userId ? "The translator cannot approve their own translation" : undefined}
                onClick={() => run(() => store.transact((s) => bilingualApprove(s, principal, variant.id, note)))}
              >
                Approve as bilingual reviewer
              </Button>
            )}
            {variant.state === "draft" && can("hazard.check") && hazardNeeded && !variant.hazardCheckerId && (
              <Button onClick={() => run(() => store.transact((s) => hazardCheck(s, principal, variant.id, note)))}>Confirm hazard text</Button>
            )}
            {variant.state === "approved" && can("version.review") && (
              <Button variant="danger" disabled={!note.trim()} onClick={() => run(() => store.transact((s) => withdrawVariant(s, principal, variant.id, note)))}>
                Withdraw this language
              </Button>
            )}
          </div>
        </Card>
      )}
      <ErrorBanner error={action.error} />
    </div>
  );
}

export function TranslationTab({ version }: { version: ObjectVersion }) {
  const { state } = useEngine();
  const source = sourceVariantOf(state, version.id);
  const targets = LANGUAGES.filter((l) => l !== source?.language);
  const [language, setLanguage] = useState<Language>(targets[0] ?? "kn");
  if (!source) return null;
  if (version.state !== "published") {
    return (
      <div className="stack">
        <Notice>Translations are prepared from published, approved source content only.</Notice>
        <LanguageOverview version={version} />
      </div>
    );
  }
  const variant = variantIn(state, version.id, language);
  return (
    <div className="stack">
      <Notice>
        Each language is approved separately: a qualified bilingual reviewer, plus an independent hazard check whenever the content has warnings,
        prohibitions or escalations, or is HIGH risk. Codes, units and numbers must be unchanged.
      </Notice>
      <LanguageOverview version={version} selected={language} onSelect={setLanguage} />
      <Editor key={`${language}:${variant?.id ?? "new"}:${variant?.draftedAt ?? ""}:${variant?.state ?? ""}`} version={version} source={source} language={language} variant={variant} />
    </div>
  );
}

function LanguageOverview({ version, selected, onSelect }: { version: ObjectVersion; selected?: Language; onSelect?: (l: Language) => void }) {
  const { state } = useEngine();
  return (
    <div className="lang-grid" role={onSelect ? "tablist" : undefined}>
      {LANGUAGES.map((l) => {
        const v = variantIn(state, version.id, l);
        const content = (
          <>
            <span lang={l}>{LANGUAGE_NAMES[l].native}</span>
            <span className="muted small">{LANGUAGE_NAMES[l].english}</span>
            {v ? <StateBadge state={v.state === "approved" ? (v.isSource ? "source" : "approved") : v.state} /> : <Tag>not started</Tag>}
          </>
        );
        return onSelect && !v?.isSource ? (
          <button key={l} type="button" role="tab" aria-selected={selected === l} className={`lang-cell${selected === l ? " active" : ""}`} onClick={() => onSelect(l)}>
            {content}
          </button>
        ) : (
          <div key={l} className="lang-cell">
            {content}
          </div>
        );
      })}
    </div>
  );
}
