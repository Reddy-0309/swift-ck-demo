// Shared interface components: buttons, status pills, panels, dialogs, toasts, tables.

import { CLIENTS } from "../domain/clients";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { errorMessage } from "../app/useAction";
import { LANGUAGE_NAMES, isLanguage, type Language, type RiskClass } from "../domain/types";
import { Icon, type IconName } from "./icons";

// ---------------------------------------------------------------- buttons

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  size,
  busy = false,
  icon,
  children,
  disabled,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "lg"; busy?: boolean; icon?: IconName }) {
  const classes = ["btn", variant !== "primary" && `btn-${variant}`, size && `btn-${size}`, className].filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} disabled={disabled || busy} aria-busy={busy} {...rest}>
      {icon && <Icon name={icon} size={16} />}
      {busy ? "Working…" : children}
    </button>
  );
}

// ---------------------------------------------------------------- pills

type Tone = "green" | "amber" | "red" | "blue" | "violet" | "gray";

export function Pill({ tone = "gray", children, plain }: { tone?: Tone; children: ReactNode; plain?: boolean }) {
  return <span className={`pill${tone === "gray" ? "" : ` pill-${tone}`}${plain ? " plain" : ""}`}>{children}</span>;
}

const STATUS: Record<string, [string, Tone]> = {
  draft: ["Draft", "gray"],
  in_review: ["In review", "amber"],
  published: ["Live", "green"],
  superseded: ["Replaced", "gray"],
  withdrawn: ["Withdrawn", "red"],
  suspended: ["Suspended", "red"],
  approved: ["Approved", "green"],
  rejected: ["Rejected", "red"],
  active: ["Current", "green"],
};

export function StatusPill({ state }: { state: string }) {
  const [label, tone] = STATUS[state] ?? [state.replace(/_/g, " "), "gray"];
  return <Pill tone={tone}>{label}</Pill>;
}

const RISK: Record<RiskClass, [string, Tone]> = {
  LOW: ["Low risk", "blue"],
  MEDIUM: ["Medium risk", "amber"],
  HIGH: ["Safety-critical", "red"],
};

export function RiskPill({ risk }: { risk: RiskClass | null }) {
  const [label, tone] = risk ? RISK[risk] : (["Unclassified (treated as safety-critical)", "red"] as [string, Tone]);
  return (
    <Pill tone={tone} plain>
      {label}
    </Pill>
  );
}

// ---------------------------------------------------------------- page structure

export function PageHeader({ title, subtitle, actions, crumbs }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; crumbs?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="titles">
        {crumbs && <nav className="crumbs">{crumbs}</nav>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="row wrap">{actions}</div>}
    </header>
  );
}

export function Panel({ title, actions, children, flush }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; flush?: boolean }) {
  return (
    <section className="panel">
      {(title || actions) && (
        <div className="panel-head">
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      <div className={`panel-body${flush ? " flush" : ""}`}>{children}</div>
    </section>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "ok"; children: ReactNode }) {
  const icon: IconName = tone === "ok" ? "check" : tone === "info" ? "info" : "alert";
  return (
    <div className={`notice${tone === "info" ? "" : ` notice-${tone}`}`} role={tone === "error" ? "alert" : undefined}>
      <Icon name={icon} size={16} />
      <div>{children}</div>
    </div>
  );
}

export function ErrorNotice({ error }: { error: unknown }) {
  if (!error) return null;
  return <Notice tone="error">{errorMessage(error)}</Notice>;
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <span>{children}</span>}
      {action}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Stat({ value, label, sub }: { value: ReactNode; label: string; sub?: ReactNode }) {
  return (
    <div className="stat">
      <span className="value">{value}</span>
      <span className="label">{label}</span>
      {sub && <span className="sub">{sub}</span>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" className="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; label: string }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="search-input">
      <Icon name="search" size={16} />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

// ---------------------------------------------------------------- pagination

export function usePaged<T>(items: T[], pageSize = 25) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages - 1);
  return {
    rows: items.slice(current * pageSize, (current + 1) * pageSize),
    pager: <Pager page={current} pages={pages} total={items.length} pageSize={pageSize} onPage={setPage} />,
    reset: () => setPage(0),
  };
}

function Pager({ page, pages, total, pageSize, onPage }: { page: number; pages: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  if (total <= pageSize) return null;
  return (
    <div className="pagination">
      <span className="num">
        {page * pageSize + 1}–{Math.min(total, (page + 1) * pageSize)} of {total.toLocaleString()}
      </span>
      <div className="row">
        <Button variant="secondary" size="sm" icon="chevronLeft" disabled={page === 0} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- dialog

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} className={`modal${wide ? " wide" : ""}`} onClose={onClose} onCancel={onClose}>
      {open && (
        <>
          <div className="modal-head">
            <h2>{title}</h2>
            <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
              <Icon name="x" />
            </button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-foot">{footer}</div>}
        </>
      )}
    </dialog>
  );
}

// ---------------------------------------------------------------- toasts

interface ToastItem {
  id: number;
  text: string;
}
const ToastContext = createContext<(text: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(0);
  const show = useCallback((text: string) => {
    const id = (next.current += 1);
    setItems((all) => [...all.slice(-2), { id, text }]);
    setTimeout(() => setItems((all) => all.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="toast">
            <Icon name="check" size={16} />
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (text: string) => void {
  return useContext(ToastContext);
}

// ---------------------------------------------------------------- formatting

export function formatDate(value: string | null | undefined, withTime = true): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return "—";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value, false);
}

export function languageLabel(code: string): string {
  if (!isLanguage(code)) return code;
  const { english, native } = LANGUAGE_NAMES[code];
  return english === native ? english : `${english} (${native})`;
}

export function initials(name: string): string {
  return name
    .replace(/\(.*\)/, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function LanguageSelect({ value, onChange, languages, label = "Language" }: { value: Language; onChange: (l: Language) => void; languages: readonly Language[]; label?: string }) {
  const options = useMemo(() => languages.map((l) => ({ l, label: languageLabel(l) })), [languages]);
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => isLanguage(e.target.value) && onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.l} value={o.l}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Client filter: every client, or one. */
export function ClientSelect({ value, onChange, allLabel = "All clients" }: { value: string; onChange: (id: string) => void; allLabel?: string }) {
  return (
    <label className="select-inline">
      <span className="sr-only">Client</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Client">
        <option value="">{allLabel}</option>
        {CLIENTS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
