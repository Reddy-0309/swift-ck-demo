import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useEngine } from "../../app/engine";
import { clientOverview, currentVersions } from "../../app/selectors";
import { CLIENTS, DELIVERY_LABEL, MATURITY_LABEL } from "../../domain/clients";
import { Icon } from "../../ui/icons";
import { PageHeader, Pill, formatDate } from "../../ui/kit";

export default function Clients() {
  const { state } = useEngine();
  const overviews = useMemo(() => {
    const all = currentVersions(state);
    return CLIENTS.map((c) => clientOverview(state, c, all));
  }, [state]);

  return (
    <div className="page">
      <PageHeader
        title="Clients"
        subtitle="Organisations Swift builds e-learning programmes for. Each programme ships with approved on-the-job guides, practice and evidence."
      />
      <div className="client-list">
        {overviews.map((o) => {
          const { client } = o;
          const total = client.programme.modules.length;
          return (
            <Link key={client.id} to={`/clients/${client.id}`} className="client-row" style={{ ["--client" as string]: client.colour }}>
              <div className="client-id">
                <span className="client-mark" aria-hidden="true">
                  {client.short.slice(0, 1)}
                </span>
                <div>
                  <strong>{client.name}</strong>
                  <span>
                    {client.industry} · {client.location}
                  </span>
                </div>
              </div>
              <div className="client-programme">
                <span className="muted small">Programme {client.programme.code}</span>
                <strong>{client.programme.title}</strong>
                <span className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  <Pill tone="blue">{DELIVERY_LABEL[client.deliveryModel]}</Pill>
                  <Pill>{MATURITY_LABEL[client.maturity]}</Pill>
                </span>
              </div>
              <div className="client-ready">
                <div className="ready-bar" aria-label={`${o.readyModules} of ${total} modules have live guides`}>
                  {o.modules.map((m) => (
                    <span key={m.module.id} className={`seg ${m.status}`} title={`${m.module.title.en}: ${m.status === "ready" ? "guide live" : m.status === "partial" ? "partly live" : "no live guide yet"}`} />
                  ))}
                </div>
                <span className="small">
                  <strong>{o.readyModules}</strong> of {total} modules ready
                </span>
                <span className="muted small">
                  {o.live.length} live guides · {o.scenarios} practice scenario{o.scenarios === 1 ? "" : "s"} · {client.languages.length} languages
                </span>
              </div>
              <div className="client-pkg">
                <span className="muted small">Latest package</span>
                <strong>{o.latestPackage ? `v${o.latestPackage.packageVersion}` : "None yet"}</strong>
                <span className="muted small">{o.latestPackage ? formatDate(o.latestPackage.generatedAt, false) : `${client.workforce} learners`}</span>
              </div>
              <Icon name="chevronRight" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
