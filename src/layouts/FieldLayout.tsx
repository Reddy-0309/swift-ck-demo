import { Suspense, createContext, useCallback, useContext, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useEngine } from "../app/engine";
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
  const inPractice = useLocation().pathname.startsWith("/field/practice");

  return (
    <FieldContext.Provider value={{ language, setLanguage, t }}>
      <div className="field-app" lang={language}>
        <header className="field-top">
          <span className="brand-mark">
            <BrandGlyph size={16} />
          </span>
          <span className="title" lang="en">
            Swift Knowledge
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
            <Link to="/field" className={inPractice ? "" : "active"} aria-current={inPractice ? undefined : "page"}>
              <Icon name="book" size={22} />
              {t.guidance}
            </Link>
            <Link to="/field/practice" className={inPractice ? "active" : ""} aria-current={inPractice ? "page" : undefined}>
              <Icon name="target" size={22} />
              {t.practice}
            </Link>
          </div>
        </nav>
      </div>
    </FieldContext.Provider>
  );
}
