import { useState } from "react";
import { downloadStored } from "../../app/files";
import { store, useEngine, usePrincipal } from "../../app/engine";
import { userName } from "../../app/selectors";
import { useAction } from "../../app/useAction";
import { exportPackage } from "../../domain/packaging";
import { LANGUAGE_NAMES, isLanguage, type KnowledgePackageRecord } from "../../domain/types";
import { Icon } from "../../ui/icons";
import { Button, Empty, ErrorNotice, Notice, PageHeader, Panel, Pill, formatDate, useToast } from "../../ui/kit";

function PackageRow({ p, latest }: { p: KnowledgePackageRecord; latest: boolean }) {
  const { state } = useEngine();
  const [open, setOpen] = useState(latest);
  const m = p.manifest;
  return (
    <Panel
      title={
        <span className="row">
          Package {p.packageVersion}
          {latest && <Pill tone="green">Latest</Pill>}
        </span>
      }
      actions={
        <div className="row">
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
            {open ? "Hide details" : "Details"}
          </Button>
          <Button variant="secondary" size="sm" icon="download" onClick={() => downloadStored(p.fileKey, `swift-knowledge-package-v${p.packageVersion}.zip`, "application/zip")}>
            Download
          </Button>
        </div>
      }
    >
      <p className="muted">
        {m.object_count} procedures in {m.languages.length} languages · {m.withdrawn.length} to remove · exported {formatDate(p.generatedAt)} by {userName(state, p.generatedBy)}
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
  if (!can("package.export")) return <div className="page"><Notice tone="warn">Your role cannot export packages.</Notice></div>;
  const packages = [...state.packages].sort((a, b) => b.packageVersion - a.packageVersion);
  return (
    <div className="page">
      <PageHeader
        title="Packages"
        subtitle="A versioned bundle of approved, general procedures that another app can build in and use offline."
        actions={
          <Button icon="package" busy={action.busy} onClick={() => void action.run(() => exportPackage(store, principal), (p) => toast(`Package ${p.packageVersion} exported`))}>
            Export package
          </Button>
        }
      />
      <div className="stack">
        <Notice>Restricted procedures are never included. A package already shipped cannot be recalled, so each new package lists what the host app must remove.</Notice>
        <ErrorNotice error={action.error} />
        {packages.length === 0 ? (
          <Panel>
            <Empty title="No packages yet">Export one to hand approved knowledge to a host app.</Empty>
          </Panel>
        ) : (
          packages.map((p, i) => <PackageRow key={p.id} p={p} latest={i === 0} />)
        )}
      </div>
    </div>
  );
}
