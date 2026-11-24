import { useState } from "react";
import { downloadStored } from "../../app/files";
import { store, useEngine, usePrincipal } from "../../app/engine";
import { userName } from "../../app/selectors";
import { useAction } from "../../app/useAction";
import { CLIENTS, DELIVERY_LABEL, getClient } from "../../domain/clients";
import { exportPackage, packageFilename } from "../../domain/packaging";
import { LANGUAGE_NAMES, isLanguage, type KnowledgePackageRecord } from "../../domain/types";
import { Icon } from "../../ui/icons";
import { Button, ClientSelect, Empty, ErrorNotice, Notice, PageHeader, Panel, Pill, formatDate, useToast } from "../../ui/kit";

function PackageRow({ p, latest }: { p: KnowledgePackageRecord; latest: boolean }) {
  const { state } = useEngine();
  const [open, setOpen] = useState(latest);
  const m = p.manifest;
  return (
    <Panel
      title={
        <span className="row">
          {getClient(p.clientId)?.short ?? p.clientId} · package {p.packageVersion}
          {latest && <Pill tone="green">Latest</Pill>}
        </span>
      }
      actions={
        <div className="row">
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
            {open ? "Hide details" : "Details"}
          </Button>
          <Button variant="secondary" size="sm" icon="download" onClick={() => downloadStored(p.fileKey, packageFilename(p), "application/zip")}>
            Download
          </Button>
        </div>
      }
    >
      <p className="muted">
        Programme {m.programme_code} · {m.object_count} guides in {m.languages.length} languages · {m.withdrawn.length} to remove · exported {formatDate(p.generatedAt)} by {userName(state, p.generatedBy)}
      </p>
      {open && (
        <div className="grid-2" style={{ marginTop: 16 }}>
          <div>
            <h3 style={{ marginBottom: 8 }}>Included</h3>
            <ul className="rules">
              {m.objects.map((o) => (
                <li key={o.object_id}>
                  <Icon name="check" size={16} />
                  <span>
                    {state.objects.find((x) => x.id === o.object_id)?.title ?? o.object_key} v{o.version}
                    <span className="muted small" style={{ display: "block" }}>
                      {o.languages.map((l) => (isLanguage(l) ? LANGUAGE_NAMES[l].english : l)).join(", ")} · {o.media.length} media
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ marginBottom: 8 }}>Host app must remove</h3>
            {m.withdrawn.length === 0 ? (
              <p className="muted small">Nothing.</p>
            ) : (
              <ul className="rules">
                {m.withdrawn.map((w) => (
                  <li key={w.object_id}>
                    <Icon name="x" size={16} />
                    <span>
                      {state.objects.find((x) => x.id === w.object_id)?.title ?? w.object_key}
                      <span className="muted small" style={{ display: "block" }}>
                        {w.status}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="small muted" style={{ marginTop: 12 }}>
              Needs at runtime: no AI, no network connection, no tracking.
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
}

export default function Packages() {
  const { state, can } = useEngine();
  const principal = usePrincipal();
  const toast = useToast();
  const action = useAction<KnowledgePackageRecord>();
  const [client, setClient] = useState("");
  const [target, setTarget] = useState(CLIENTS[0]?.id ?? "");
  if (!can("package.export")) return <div className="page"><Notice tone="warn">Your role cannot export packages.</Notice></div>;
  const packages = state.packages.filter((p) => !client || p.clientId === client).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  const latestIds = new Set(CLIENTS.map((c) => state.packages.filter((p) => p.clientId === c.id).sort((a, b) => b.packageVersion - a.packageVersion)[0]?.id));
  const targetClient = getClient(target);
  return (
    <div className="page">
      <PageHeader
        title="Packages"
        subtitle="Each client gets a versioned bundle of its own approved guides, ready to install next to its e-learning modules. It works offline and needs no AI."
      />
      <div className="stack">
        <Panel title="Export a package">
          <div className="export-row">
            <label className="field" style={{ margin: 0 }}>
              <span className="label">Client</span>
              <select value={target} onChange={(e) => setTarget(e.target.value)}>
                {CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {targetClient && (
              <p className="muted small" style={{ flex: 1, margin: 0 }}>
                {DELIVERY_LABEL[targetClient.deliveryModel]}. {targetClient.delivery}
              </p>
            )}
            <Button
              icon="package"
              busy={action.busy}
              onClick={() => void action.run(() => exportPackage(store, principal, target), (p) => toast(`${getClient(p.clientId)?.short ?? ""} package ${p.packageVersion} exported`))}
            >
              Export package
            </Button>
          </div>
          <ErrorNotice error={action.error} />
        </Panel>
        <Notice>Only general guides are included. Restricted guides stay behind the client's own sign-in, and no client's content ever goes into another client's package. A shipped package cannot be recalled, so each new one lists what the client's app must remove.</Notice>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Exported packages</h2>
          <ClientSelect value={client} onChange={setClient} />
        </div>
        {packages.length === 0 ? (
          <Panel>
            <Empty title="No packages yet">Choose a client above and export its first package.</Empty>
          </Panel>
        ) : (
          packages.map((p) => <PackageRow key={p.id} p={p} latest={latestIds.has(p.id)} />)
        )}
      </div>
    </div>
  );
}
