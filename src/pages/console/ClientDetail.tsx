import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { store, useEngine, usePrincipal } from "../../app/engine";
import { personName, personRole } from "../../app/people";
import { clientOverview, type ModuleStatus } from "../../app/selectors";
import { useAction } from "../../app/useAction";
import { dashboard, periodStart, type Dashboard } from "../../domain/analytics";
import { DELIVERY_LABEL, MATURITY_LABEL, MATURITY_TEXT, clientForRole, getClient, type Maturity } from "../../domain/clients";
import { exportPackage } from "../../domain/packaging";
import { LANGUAGE_NAMES, type KnowledgePackageRecord } from "../../domain/types";
import { Icon } from "../../ui/icons";
import { Button, ErrorNotice, PageHeader, Panel, Pill, Stat, StatusPill, formatDate, initials, useToast } from "../../ui/kit";

const STATUS: Record<ModuleStatus, [string, "green" | "amber" | "red"]> = {
  ready: ["Guide live", "green"],
  partial: ["Partly live", "amber"],
  gap: ["No live guide yet", "red"],
};
const STAGES: Maturity[] = ["knowledge", "competency", "dynamic"];

export default function ClientDetail() {
  const { id } = useParams();
  const { state, can, signIn } = useEngine();
  const principal = usePrincipal();
  const navigate = useNavigate();
  const toast = useToast();
  const action = useAction<KnowledgePackageRecord>();
  const client = getClient(id);
  const overview = useMemo(() => (client ? clientOverview(state, client) : null), [state, client]);
  const [board, setBoard] = useState<Dashboard | null>(null);

  useEffect(() => {
    if (!client || !can("analytics.view")) return;
    let cancelled = false;
    dashboard(state, periodStart(30), client.id).then((d) => !cancelled && setBoard(d), () => undefined);
    return () => {
      cancelled = true;
    };
  }, [state, client, can]);

  if (!client || !overview) return <Navigate to="/clients" replace />;
  const outcomes = board?.indicators.find((i) => i.id === "retrieval_outcomes");
  const answered = outcomes?.rows.find((r) => r.keys.outcome === "answer")?.value ?? 0;
  const independent = board?.indicators.find((i) => i.id === "practice_by_mode")?.rows.find((r) => r.keys.mode === "independent");
  const people = state.users.filter((u) => clientForRole(u.workRole)?.id === client.id);
  const stage = STAGES.indexOf(client.maturity);

  return (
    <div className="page">
      <PageHeader
        crumbs={<Link to="/clients">Clients</Link>}
        title={client.name}
        subtitle={`${client.industry} · ${client.location} · sponsor: ${client.sponsor}`}
        actions={
          <>
            {can("analytics.view") && (
              <Button variant="secondary" icon="chart" onClick={() => navigate(`/insights?client=${client.id}`)}>
                Insights
              </Button>
            )}
            {can("package.export") && (
              <Button icon="package" busy={action.busy} onClick={() => void action.run(() => exportPackage(store, principal, client.id), (p) => toast(`${client.short} package ${p.packageVersion} exported`))}>
                Export package
              </Button>
            )}
          </>
        }
      />
      <ErrorNotice error={action.error} />
      <div className="stats">
        <Stat value={`${overview.readyModules}/${client.programme.modules.length}`} label="Course modules with live guides" />
        <Stat value={overview.live.length} label="Live guides" sub={overview.inProgress.length ? `${overview.inProgress.length} in progress` : undefined} />
        <Stat value={outcomes ? outcomes.total.toLocaleString() : "—"} label="On-the-job requests, 30 days" sub={outcomes?.total ? `${Math.round((answered / outcomes.total) * 100)}% answered with approved steps` : undefined} />
        <Stat value={independent?.rate != null ? `${Math.round(independent.rate * 100)}%` : "—"} label="Independent checks passed, 30 days" sub={independent?.denominator != null ? `${independent.denominator} checks` : "No independent checks yet"} />
      </div>

      <div className="stack">
        <Panel
          title={
            <span>
              {client.programme.title} <span className="muted small">· {client.programme.code}</span>
            </span>
          }
          actions={<span className="muted small">{client.programme.lms}</span>}
          flush
        >
          <p className="panel-intro muted">{client.programme.summary} Each module runs in the client's LMS; the guides below open on the job, from the module and from the worker app.</p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>E-learning module</th>
                  <th>On-the-job guides</th>
                  <th>Practice</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overview.modules.map((m, i) => {
                  const [label, tone] = STATUS[m.status];
                  return (
                    <tr key={m.module.id}>
                      <td className="num muted">{i + 1}</td>
                      <td className="title-cell">
                        <strong>{m.module.title.en}</strong>
                        <span className="muted small">
                          {m.module.format} · {m.module.minutes} min
                        </span>
                      </td>
                      <td>
                        {m.guides.length === 0 && <span className="muted small">No SOP received for this task yet</span>}
                        <ul className="guide-list">
                          {m.guides.map((g) => (
                            <li key={g.id}>
                              <Link to={`/knowledge/${g.id}`}>{g.title}</Link>
                              <StatusPill state={g.state} />
                              {g.distributionClass === "restricted" && <Pill tone="violet">Restricted</Pill>}
                              <span className="muted small">
                                {client.languages.filter((l) => g.languages[l] === "approved").length}/{client.languages.length} languages
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="small">{m.scenarios ? `${m.scenarios} scenario` : <span className="muted">—</span>}</td>
                      <td>
                        <Pill tone={tone}>{label}</Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid-2">
          <Panel title="How it reaches learners">
            <p>
              <strong>{DELIVERY_LABEL[client.deliveryModel]}</strong>
            </p>
            <p className="muted">{client.delivery}</p>
            <ol className="stages" aria-label="Adoption stage">
              {STAGES.map((st, i) => (
                <li key={st} className={i < stage ? "done" : i === stage ? "current" : ""}>
                  <span className="dot">{i < stage ? <Icon name="check" size={14} /> : i + 1}</span>
                  <span>
                    <strong>{MATURITY_LABEL[st]}</strong>
                    <span className="muted small">{MATURITY_TEXT[st]}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Languages of this workforce">
            <div className="lang-bars">
              {overview.coverage.map((c) => (
                <div key={c.language} className="bar">
                  <span lang={c.language}>
                    {LANGUAGE_NAMES[c.language].native}
                    {c.language !== "en" && <span className="muted small"> {LANGUAGE_NAMES[c.language].english}</span>}
                  </span>
                  <span className="track">
                    <span className="fill" style={{ width: `${overview.live.length ? Math.max(2, (c.live / overview.live.length) * 100) : 0}%` }} />
                  </span>
                  <span className="val">
                    {c.live}/{overview.live.length}
                  </span>
                </div>
              ))}
            </div>
            <p className="small muted" style={{ marginTop: 12 }}>
              Live guides approved in each language. Each language is approved separately by a language reviewer, with an independent safety check.
            </p>
          </Panel>
        </div>

        <div className="grid-2">
          <Panel title="Try it as one of their learners">
            <ul className="people">
              {people.map((u) => (
                <li key={u.id}>
                  <span className="avatar">{initials(u.displayName)}</span>
                  <span style={{ flex: 1 }}>
                    <strong>{personName(u)}</strong>
                    <span className="muted small" style={{ display: "block" }}>
                      {personRole(u)}
                    </span>
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      signIn(u.id);
                      navigate("/field");
                    }}
                  >
                    Open worker app
                  </Button>
                </li>
              ))}
            </ul>
            <p className="small muted" style={{ marginTop: 8 }}>
              {client.workforce} pseudonymous learners in the sample data. You can switch back from the worker app's top bar.
            </p>
          </Panel>
          <Panel title="Packages delivered">
            {overview.latestPackage ? (
              <p>
                Latest: <strong>package {overview.latestPackage.packageVersion}</strong> with {overview.latestPackage.objectCount} guides, exported {formatDate(overview.latestPackage.generatedAt)}.{" "}
                <Link to="/packages">All packages</Link>
              </p>
            ) : (
              <p className="muted">No package delivered yet. Export one to hand this client its approved guides with the course.</p>
            )}
            {overview.inProgress.length > 0 && (
              <>
                <h3 style={{ margin: "16px 0 8px" }}>In progress</h3>
                <ul className="guide-list">
                  {overview.inProgress.map((g) => (
                    <li key={g.id}>
                      <Link to={`/knowledge/${g.id}`}>{g.title}</Link>
                      <StatusPill state={g.state} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
