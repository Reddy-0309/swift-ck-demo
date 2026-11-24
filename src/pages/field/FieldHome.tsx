import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEngine } from "../../app/engine";
import { personName } from "../../app/people";
import { tasksForRole } from "../../app/selectors";
import { CONTEXT_LABELS } from "../../domain/labels";
import { useField } from "../../layouts/FieldLayout";
import { Icon, type IconName } from "../../ui/icons";

const TASK_ICON: Record<string, IconName> = { "T-PICKUP": "truck", "T-CONV-INSPECT": "cog", "T-COD-REVIEW": "cash", "T-RETURNS": "returns" };

export default function FieldHome() {
  const { state, user } = useEngine();
  const { t, language } = useField();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const tasks = tasksForRole(state, user?.workRole ?? null);

  function search(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) navigate(`/field/guide?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <h1>
        {t.hello}, {user ? personName(user) : ""}
      </h1>
      <form className="field-search" onSubmit={search} role="search">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchPlaceholder} aria-label={t.search} />
        <button type="submit" className="btn" aria-label={t.search}>
          <Icon name="search" />
        </button>
      </form>
      <p className="question">{t.chooseTask}</p>
      {tasks.length === 0 && <p className="muted">{t.noTasks}</p>}
      <div className="tiles">
        {tasks.map((task) => (
          <Link key={task.code} className="tile" to={`/field/guide?task=${encodeURIComponent(task.code)}`}>
            <span className="tile-icon">
              <Icon name={TASK_ICON[task.code] ?? "book"} size={22} />
            </span>
            <strong>{CONTEXT_LABELS[language][task.code] ?? task.code}</strong>
            <Icon name="chevronRight" />
          </Link>
        ))}
      </div>
    </>
  );
}
