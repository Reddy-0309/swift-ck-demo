import { useState } from "react";
import { store, useEngine, usePrincipal } from "../../../app/engine";
import { userName } from "../../../app/selectors";
import { errorCode, errorDetails, useAction } from "../../../app/useAction";
import { bilingualApprove, hazardCheck, hazardCheckRequired, sourceVariantOf, upsertTranslation, variantIn, withdrawVariant } from "../../../domain/governance";
import { BLOCK_LABELS } from "../../../domain/labels";
import { LANGUAGES, LANGUAGE_NAMES, isLanguage, type Language, type LanguageVariant, type ObjectVersion } from "../../../domain/types";
import { Icon } from "../../../ui/icons";
import { Button, ErrorNotice, Field, Modal, Notice, Panel, Pill, formatDate, useToast } from "../../../ui/kit";
import { Procedure } from "../../../ui/Procedure";

function Checklist({ variant, hazardNeeded }: { variant: LanguageVariant; hazardNeeded: boolean }) {
  const { state } = useEngine();
  const steps: [string, string | null, boolean][] = [
    ["Translated", `${userName(state, variant.draftedBy)}, ${formatDate(variant.draftedAt)}`, true],
    ["Language review", variant.reviewerId ? `${userName(state, variant.reviewerId)}, ${formatDate(variant.reviewedAt)}` : null, !!variant.reviewerId],
  ];
  if (hazardNeeded) {
    steps.push(["Independent safety check", variant.hazardCheckerId ? `${userName(state, variant.hazardCheckerId)}, ${formatDate(variant.hazardCheckedAt)}` : null, !!variant.hazardCheckerId]);
  }
  return (
    <ul className="steps-check">
      {steps.map(([label, who, done]) => (
        <li key={label} className={done ? "done" : ""}>
          <span className="dot">{done && <Icon name="check" size={13} />}</span>
          <span>
            <strong>{label}</strong>
            <span className="muted" style={{ display: "block" }}>
              {who ?? "Waiting"}
            </span>
          </span>
        </li>
      ))}
      {!hazardNeeded && (
        <li className="skip">
          <span className="dot" />
          <span className="muted">No safety check needed: no warnings, prohibitions or escalations, and not safety-critical.</span>
        </li>
      )}
    </ul>
  );
}

function Editor({ version, source, language, variant }: { version: ObjectVersion; source: LanguageVariant; language: Language; variant?: LanguageVariant }) {
  const { state, can } = useEngine();
  const principal = usePrincipal();
  const toast = useToast();
  const [title, setTitle] = useState(variant?.title ?? "");
  const [texts, setTexts] = useState<Record<string, string>>(() => Object.fromEntries((variant?.blocks ?? []).map((b) => [b.id, b.text])));
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [reason, setReason] = useState("");
  const action = useAction<LanguageVariant>();
  const blocks = [...source.blocks].sort((a, b) => a.order - b.order);
  const editable = version.state === "published" && can("language.draft") && (!variant || variant.state === "draft");
  const problems = errorCode(action.error) === "protected_terms" ? (errorDetails(action.error).blocks as Record<string, string[]> | undefined) : undefined;
  const hazardNeeded = variant ? hazardCheckRequired(state, variant) : false;
  const name = LANGUAGE_NAMES[language].english;
  const run = (fn: () => LanguageVariant, message: string) => void action.run(fn, () => toast(message));

  if (variant?.state === "approved" || variant?.state === "withdrawn") {
    return (
      <div className="split">
        <Panel title={variant.title}>
          <Procedure blocks={variant.blocks} lang={language} />
        </Panel>
        <div className="stack">
          <Panel title="Approval">
            {variant.state === "withdrawn" ? <Notice tone="warn">Withdrawn. Start a new version of the procedure to translate it again.</Notice> : <Checklist variant={variant} hazardNeeded={hazardNeeded} />}
            {variant.reviewNotes && <p className="small muted" style={{ marginTop: 12, whiteSpace: "pre-line" }}>{variant.reviewNotes}</p>}
          </Panel>
          {variant.state === "approved" && can("version.review") && (
            <Button variant="secondary" onClick={() => setWithdrawOpen(true)}>
              Withdraw {name}
            </Button>
          )}
          <ErrorNotice error={action.error} />
        </div>
        <Modal
          open={withdrawOpen}
          title={`Withdraw the ${name} version`}
          onClose={() => setWithdrawOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setWithdrawOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={!reason.trim()} onClick={() => run(() => store.transact((s) => withdrawVariant(s, principal, variant.id, reason)), `${name} withdrawn`)}>
                Withdraw
              </Button>
            </>
          }
        >
          <p className="muted">Workers using {name} get a clear "not approved in this language" message instead. Its slides and diagrams go out of date.</p>
          <Field label="Reason">
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </Modal>
      </div>
    );
  }

  return (
    <div className="stack">
      {!editable && !variant && <Notice>Translations are made from published content by a content author.</Notice>}
      <Panel title={variant ? `${name} translation, waiting for approval` : `Translate into ${name}`}>
        <div className="stack">
          <Field label={`Title in ${name}`}>
            <input value={title} disabled={!editable} lang={language} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="translate">
            <span className="head">Approved {LANGUAGE_NAMES[source.language].english}</span>
            <span className="head">{name}</span>
            {blocks.map((b) => (
              <div key={b.id} style={{ display: "contents" }}>
                <div className="src">
                  <b>{BLOCK_LABELS.en[b.type]}</b>
                  {b.text}
                </div>
                <div>
                  <textarea
                    rows={3}
                    lang={language}
                    value={texts[b.id] ?? ""}
                    disabled={!editable}
                    aria-label={`${name} for: ${b.text}`}
                    onChange={(e) => setTexts((t) => ({ ...t, [b.id]: e.target.value }))}
                  />
                  {problems?.[b.id] && <span className="err">Codes, units or numbers changed: {problems[b.id]?.join(", ")}</span>}
                </div>
              </div>
            ))}
          </div>
          {editable && (
            <div className="row">
              <span className="small muted spacer">Codes, units and numbers (like EST-1 or 15 kg) must stay exactly as in the source.</span>
              <Button
                busy={action.busy}
                onClick={() =>
                  run(
                    () => store.transact((s) => upsertTranslation(s, principal, version.id, { language, title, blocks: blocks.map((b) => ({ id: b.id, text: texts[b.id] ?? "" })) })),
                    "Translation saved. It now needs approval.",
                  )
                }
              >
                Save translation
              </Button>
            </div>
          )}
        </div>
      </Panel>
      {variant && (
        <Panel title="Approval">
          <div className="stack">
            <Checklist variant={variant} hazardNeeded={hazardNeeded} />
            <div className="row wrap">
              {can("language.approve") && !variant.reviewerId && (
                <Button
                  disabled={variant.draftedBy === principal.userId}
                  title={variant.draftedBy === principal.userId ? "A translator cannot approve their own translation" : undefined}
                  onClick={() => run(() => store.transact((s) => bilingualApprove(s, principal, variant.id, "")), "Language review recorded")}
                >
                  Approve language
                </Button>
              )}
              {can("hazard.check") && hazardNeeded && !variant.hazardCheckerId && (
                <Button onClick={() => run(() => store.transact((s) => hazardCheck(s, principal, variant.id, "")), "Safety check recorded")}>Confirm safety text</Button>
              )}
              {!can("language.approve") && !can("hazard.check") && <span className="muted small">A language reviewer and, where needed, a safety checker approve it.</span>}
            </div>
          </div>
        </Panel>
      )}
      <ErrorNotice error={action.error} />
    </div>
  );
}

export function LanguagesTab({ version, initialLanguage }: { version: ObjectVersion; initialLanguage: string | null }) {
  const { state } = useEngine();
  const source = sourceVariantOf(state, version.id);
  const others = LANGUAGES.filter((l) => l !== source?.language);
  const [language, setLanguage] = useState<Language>(initialLanguage && isLanguage(initialLanguage) && initialLanguage !== source?.language ? initialLanguage : others[0] ?? "hi");
  if (!source) return null;
  const variant = variantIn(state, version.id, language);

  return (
    <div className="stack">
      <div className="lang-grid" role="tablist" aria-label="Languages">
        {LANGUAGES.map((l) => {
          const v = variantIn(state, version.id, l);
          const status = v?.isSource ? (
            <Pill tone="blue">Original</Pill>
          ) : v?.state === "approved" ? (
            <Pill tone="green">Approved</Pill>
          ) : v?.state === "draft" ? (
            <Pill tone="amber">Waiting</Pill>
          ) : v?.state === "withdrawn" ? (
            <Pill tone="red">Withdrawn</Pill>
          ) : (
            <Pill>Not started</Pill>
          );
          return (
            <button key={l} type="button" role="tab" className="lang-cell" aria-selected={l === language} disabled={l === source.language} onClick={() => setLanguage(l)}>
              <strong lang={l}>{LANGUAGE_NAMES[l].native}</strong>
              <span className="small">{LANGUAGE_NAMES[l].english}</span>
              {status}
            </button>
          );
        })}
      </div>
      <Editor key={`${language}:${variant?.id ?? "new"}:${variant?.state ?? ""}:${variant?.reviewerId ?? ""}:${variant?.hazardCheckerId ?? ""}`} version={version} source={source} language={language} variant={variant} />
    </div>
  );
}
