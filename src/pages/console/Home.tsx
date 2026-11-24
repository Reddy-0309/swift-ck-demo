import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useEngine } from "../../app/engine";
import { personName, personRole } from "../../app/people";
import { clientOverview, currentVersions, inboxFor, type InboxItem } from "../../app/selectors";
import { CLIENTS } from "../../domain/clients";
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
  { title: "Receive", text: "A client shares its SOPs with the course brief. Drafts quote them word for word.", to: "/sources" },
  { title: "Approve", text: "An expert corrects the draft, classifies the risk and publishes it.", to: "/knowledge" },
  { title: "Localise", text: "Each language is approved separately, with an independent safety check.", to: "/knowledge" },
  { title: "Deliver", text: "Guides ship with the e-learning modules, as a package or a live service.", to: "/packages" },
  { title: "Evidence", text: "Show each client what learners asked for on the job, and what is missing.", to: "/insights" },
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
    const clients = CLIENTS.map((c) => clientOverview(state, c, versions));
    return { live: live.length, languages, possible: live.length * LANGUAGES.length, requests, answered, clients };
  }, [state]);

  return (
    <div className="page">
      <PageHeader title={`${greeting()}, ${user ? personName(user) : ""}`} subtitle={user ? personRole(user) : undefined} />
      <div className="stats">
        <Stat value={CLIENTS.length} label="Client programmes" sub={`${stats.clients.reduce((n, c) => n + c.readyModules, 0)} of ${stats.clients.reduce((n, c) => n + c.client.programme.modules.length, 0)} modules have live guides`} />
        <Stat value={stats.live} label="Live guides" sub={`${stats.languages} approved language versions`} />
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
        <Panel title="Client programmes" actions={<Link to="/clients" className="small">All clients</Link>} flush>
          <ul className="inbox">
            {stats.clients.map((o) => (
              <li key={o.client.id}>
                <Link to={`/clients/${o.client.id}`}>
                  <span className="client-dot" style={{ background: o.client.colour }} />
                  <span className="what">
                    <strong>{o.client.name}</strong>
                    <span>{o.client.programme.title}</span>
                  </span>
                  <span className="ready-bar small-bar" aria-hidden="true">
                    {o.modules.map((m) => (
                      <span key={m.module.id} className={`seg ${m.status}`} />
                    ))}
                  </span>
                  <span className="muted small nowrap">
                    {o.readyModules}/{o.modules.length} modules ready
                  </span>
                  <Icon name="chevronRight" size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="How Swift Knowledge fits the e-learning service" flush>
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
