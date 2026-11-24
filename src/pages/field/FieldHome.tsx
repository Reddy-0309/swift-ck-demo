import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEngine } from "../../app/engine";
import { clientOf, personName } from "../../app/people";
import { tasksForRole } from "../../app/selectors";
import { CONTEXT_LABELS } from "../../domain/labels";
import { useField } from "../../layouts/FieldLayout";
import { Icon, type IconName } from "../../ui/icons";

export default function FieldHome() {
  const { state, user } = useEngine();
  const { t, language } = useField();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const client = clientOf(user);
  const icons = new Map((client?.tasks ?? []).map((x) => [x.code, x.icon as IconName]));
  const order = (client?.tasks ?? []).map((x) => x.code);
  const tasks = tasksForRole(state, user?.workRole ?? null).sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));

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
              <Icon name={icons.get(task.code) ?? "book"} size={22} />
            </span>
            <strong>{CONTEXT_LABELS[language][task.code] ?? task.code}</strong>
            <Icon name="chevronRight" />
          </Link>
        ))}
      </div>
    </>
  );
}
