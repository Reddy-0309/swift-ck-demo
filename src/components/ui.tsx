import type { ButtonHTMLAttributes, ReactNode } from "react";
import { errorMessage } from "../app/useAction";
import { BLOCK_LABELS } from "../domain/labels";
import { LANGUAGE_NAMES, isLanguage, type Block, type Language, type RiskClass, type VersionState } from "../domain/types";

export function Button({
  variant = "primary",
  busy = false,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost"; busy?: boolean }) {
  return (
    <button type="button" className={`btn btn-${variant}`} disabled={disabled || busy} aria-busy={busy} {...rest}>
      {busy ? "Working…" : children}
    </button>
  );
}

export function Card({
  title,
  actions,
  children,
  tone,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  tone?: "knowledge" | "context" | "analytics" | "media";
}) {
  return (
    <section className={`card${tone ? ` tone-${tone}` : ""}`}>
      {(title || actions) && (
        <header className="card-head">
          {title && <h2>{title}</h2>}
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <div className="banner banner-error" role="alert">
      {errorMessage(error)}
    </div>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "ok" }) {
  return <div className={`banner banner-${tone}`}>{children}</div>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loading" role="status">
      {label}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

const STATE_LABEL: Record<VersionState, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  superseded: "Superseded",
  withdrawn: "Withdrawn",
  suspended: "Suspended",
};

export function StateBadge({ state }: { state: string }) {
  const label = STATE_LABEL[state as VersionState] ?? state.replace(/_/g, " ");
  return <span className={`badge state-${state}`}>{label}</span>;
}

export function RiskBadge({ risk }: { risk: RiskClass | null }) {
  if (!risk) return <span className="badge risk-HIGH">Unclassified → HIGH</span>;
  return <span className={`badge risk-${risk}`}>{risk}</span>;
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>;
}

export function languageName(code: string): string {
  if (!isLanguage(code)) return code;
  const { english, native } = LANGUAGE_NAMES[code];
  return english === native ? english : `${english} · ${native}`;
}

/** Content blocks with labels in the content's own language. */
export function BlockView({
  blocks,
  showFlags = false,
  lang = "en",
}: {
  blocks: (Pick<Block, "id" | "type" | "order" | "text"> & Partial<Pick<Block, "uncertain" | "uncertaintyNote">>)[];
  showFlags?: boolean;
  lang?: string;
}) {
  const labels = BLOCK_LABELS[isLanguage(lang) ? lang : "en"];
  let step = 0;
  return (
    <ol className="blocks" lang={lang}>
      {[...blocks]
        .sort((a, b) => a.order - b.order)
        .map((b) => {
          if (b.type === "step") step += 1;
          return (
            <li key={b.id} className={`block block-${b.type}`}>
              <span className="block-label">{b.type === "step" ? `${labels.step} ${step}` : labels[b.type]}</span>
              <span className="block-text">{b.text}</span>
              {showFlags && b.uncertain && (
                <span className="flag" title={b.uncertaintyNote}>
                  Flagged: {b.uncertaintyNote || "needs review"}
                </span>
              )}
            </li>
          );
        })}
    </ol>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function LanguageSelect({
  value,
  onChange,
  languages,
  label = "Language",
}: {
  value: string;
  onChange: (language: Language) => void;
  languages: readonly Language[];
  label?: string;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => isLanguage(e.target.value) && onChange(e.target.value)}>
        {languages.map((l) => (
          <option key={l} value={l}>
            {languageName(l)}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function shortHash(value: string | null | undefined): string {
  return value ? `${value.slice(0, 10)}…` : "—";
}

export function SyntheticLabel() {
  return <span className="synthetic">Synthetic demonstration data</span>;
}

/** A guard for screens a role may not open (navigation already hides them). */
export function NotAvailable() {
  return <Notice tone="warn">This screen is not available to your role. Switch identity to a role that has it.</Notice>;
}
