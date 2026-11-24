import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useEngine } from "../../app/engine";
import { personName, personRole } from "../../app/people";
import { currentVersions, inboxFor, type InboxItem } from "../../app/selectors";
import { LANGUAGES } from "../../domain/types";
import { Icon, type IconName } from "../../ui/icons";
import { Empty, PageHeader, Panel, Pill, Stat, timeAgo } from "../../ui/kit";

const KIND: Record<InboxItem["kind"], [string, IconName, "amber" | "blue" | "violet" | "red" | "gray"]> = {
  review: ["Review", "check", "amber"],
  translation: ["Language", "globe", "blue"],
  hazard: ["Safety check", "alert", "violet"],
  media: ["Media", "image", "blue"],
  draft: ["Draft", "edit", "gray"],
  suspended: ["Suspended", "alert", "red"],
};

const FLOW: { title: string; text: string; to: string }[] = [
  { title: "Upload", text: "Add an SOP. Drafts are extracted that quote it word for word.", to: "/sources" },
  { title: "Approve", text: "An expert corrects, classifies the risk and publishes.", to: "/knowledge" },
  { title: "Translate", text: "Each language is reviewed, and safety text checked, separately.", to: "/knowledge" },
  { title: "Deliver", text: "Workers get the exact steps for their task, or a clear “no answer”.", to: "/knowledge" },
  { title: "Improve", text: "See what workers asked for and where guidance is missing.", to: "/insights" },
];

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const { state, user, principal } = useEngine();
  const inbox = principal ? inboxFor(state, principal) : [];
  const stats = useMemo(() => {
    const versions = currentVersions(state);
    const live = versions.filter((v) => v.state === "published");
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    let requests = 0;
    let answered = 0;
    for (const e of state.events) {
      if (e.occurredAt < since || !e.eventName.startsWith("knowledge.")) continue;
      requests += 1;
      if (e.eventName === "knowledge.viewed") answered += 1;
    }
    const languages = live.reduce((n, v) => n + LANGUAGES.filter((l) => v.languages[l] === "approved").length, 0);
    return { live: live.length, languages, possible: live.length * LANGUAGES.length, requests, answered };
  }, [state]);

  return (
    <div className="page">
      <PageHeader title={`${greeting()}, ${user ? personName(user) : ""}`} subtitle={user ? personRole(user) : undefined} />
      <div className="stats">
        <Stat value={stats.live} label="Live procedures" />
        <Stat value={`${stats.languages}/${stats.possible}`} label="Approved language versions" />
        <Stat value={stats.requests.toLocaleString()} label="Guidance requests, last 30 days" />
        <Stat value={stats.requests ? `${Math.round((stats.answered / stats.requests) * 100)}%` : "—"} label="Answered with approved steps" />
      </div>
      <div className="stack">
        <Panel title="Waiting for you" actions={inbox.length > 0 ? <Pill tone="blue">{inbox.length}</Pill> : undefined} flush>
          {inbox.length === 0 ? (
            <Empty title="You're all caught up">Nothing needs your action right now.</Empty>
          ) : (
            <ul className="inbox">
              {inbox.slice(0, 12).map((item) => {
                const [label, icon, tone] = KIND[item.kind];
                return (
                  <li key={item.id}>
                    <Link to={item.href}>
                      <Icon name={icon} />
                      <span className="what">
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </span>
                      <Pill tone={tone === "gray" ? undefined : tone}>{label}</Pill>
                      <span className="muted small nowrap">{timeAgo(item.at)}</span>
                      <Icon name="chevronRight" size={16} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="How Swift Knowledge works" flush>
          <ol className="flow">
            {FLOW.map((step, i) => (
              <li key={step.title}>
                <span className="n">{i + 1}</span>
                <strong>
                  <Link to={step.to}>{step.title}</Link>
                </strong>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
