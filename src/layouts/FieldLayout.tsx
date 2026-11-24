import { Suspense, createContext, useCallback, useContext, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useEngine } from "../app/engine";
import { clientOf } from "../app/people";
import { WORKER_TEXT, type WorkerText } from "../domain/labels";
import { LANGUAGES, LANGUAGE_NAMES, isLanguage, type Language } from "../domain/types";
import { BrandGlyph } from "../ui/Brand";
import { Icon } from "../ui/icons";

interface FieldContextValue {
  language: Language;
  setLanguage: (l: Language) => void;
  t: WorkerText;
}

const FieldContext = createContext<FieldContextValue | null>(null);

export function useField(): FieldContextValue {
  const ctx = useContext(FieldContext);
  if (!ctx) throw new Error("useField must be used inside FieldLayout");
  return ctx;
}

function storedLanguage(userId: string): Language {
  try {
    const value = localStorage.getItem(`sck-lang:${userId}`);
    return value && isLanguage(value) ? value : "en";
  } catch {
    return "en";
  }
}

export function FieldLayout() {
  const { user, signOut } = useEngine();
  const userId = user?.id ?? "anonymous";
  const [language, setLanguageState] = useState<Language>(() => storedLanguage(userId));
  const setLanguage = useCallback(
    (l: Language) => {
      setLanguageState(l);
      try {
        localStorage.setItem(`sck-lang:${userId}`, l);
      } catch {
        /* the choice lasts for this visit only */
      }
    },
    [userId],
  );
  const t = WORKER_TEXT[language];
  const path = useLocation().pathname;
  const tab = path.startsWith("/field/practice") ? "practice" : path.startsWith("/field/course") ? "course" : "guide";
  const client = clientOf(user);
  const tabs = [
    { id: "guide", to: "/field", icon: "book", label: t.guidance },
    { id: "course", to: "/field/course", icon: "course", label: t.myCourse },
    { id: "practice", to: "/field/practice", icon: "target", label: t.practice },
  ] as const;

  return (
    <FieldContext.Provider value={{ language, setLanguage, t }}>
      <div className="field-app" lang={language}>
        <header className="field-top">
          <span className="brand-mark">
            <BrandGlyph size={16} />
          </span>
          <span className="title" lang="en">
            <strong>{client?.short ?? "Swift Knowledge"}</strong>
            <span>Guides by Swift Solutions</span>
          </span>
          <label className="sr-only" htmlFor="field-language">
            {t.language}
          </label>
          <select id="field-language" className="lang-select" value={language} onChange={(e) => isLanguage(e.target.value) && setLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {LANGUAGE_NAMES[l].native}
              </option>
            ))}
          </select>
          <button type="button" className="icon-btn" aria-label={t.switchUser} title={t.switchUser} onClick={signOut}>
            <Icon name="switch" />
          </button>
        </header>
        <main className="field-body">
          <Suspense fallback={<p className="muted">…</p>}>
            <Outlet />
          </Suspense>
        </main>
        <nav className="bottom-nav" aria-label="Field app">
          <div className="inner">
            {tabs.map((x) => (
              <Link key={x.id} to={x.to} className={tab === x.id ? "active" : ""} aria-current={tab === x.id ? "page" : undefined}>
                <Icon name={x.icon} size={22} />
                {x.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </FieldContext.Provider>
  );
}
