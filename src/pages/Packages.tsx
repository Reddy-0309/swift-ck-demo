import { downloadStored } from "../app/files";
import { store, useEngine, usePrincipal } from "../app/engine";
import { userName } from "../app/selectors";
import { useAction } from "../app/useAction";
import { Button, Card, Empty, ErrorBanner, NotAvailable, Notice, PageHeader, Tag, formatDate, shortHash } from "../components/ui";
import { exportPackage } from "../domain/packaging";
import type { KnowledgePackageRecord } from "../domain/types";

function ExportButton() {
  const principal = usePrincipal();
  const action = useAction<KnowledgePackageRecord>();
  return (
    <div className="stack-sm">
      <Button busy={action.busy} onClick={() => void action.run(() => exportPackage(store, principal))}>
        Export new package
      </Button>
      <ErrorBanner error={action.error} />
    </div>
  );
}

export function PackagesPage() {
  const { state, can } = useEngine();
  if (!can("package.export")) return <NotAvailable />;
  const packages = [...state.packages].sort((a, b) => b.packageVersion - a.packageVersion);
  return (
    <>
      <PageHeader
        title="Knowledge packages (Model A)"
        subtitle="Approved, general-distribution knowledge for a host application to build in — no runtime AI at the customer."
        actions={<ExportButton />}
      />
      <Notice tone="warn">
        Visibility is not authorisation: restricted objects are never placed in a package. Deployed packages cannot be revoked remotely — each new
        package lists withdrawn objects so the host can remove them on its next release.
      </Notice>
      {packages.length === 0 && <Empty>No packages exported yet.</Empty>}
      {packages.map((p) => (
        <Card
          key={p.id}
          title={`Package v${p.packageVersion}`}
          tone="knowledge"
          actions={
            <Button variant="secondary" onClick={() => downloadStored(p.fileKey, `knowledge-package-v${p.packageVersion}.zip`, "application/zip")}>
              Download .zip
            </Button>
          }
        >
          <dl className="kv">
            <dt>Generated</dt>
            <dd>
              {formatDate(p.generatedAt)} · {userName(state, p.generatedBy)}
            </dd>
            <dt>SHA-256</dt>
            <dd className="mono">{shortHash(p.sha256)}</dd>
            <dt>Objects</dt>
            <dd>{p.objectCount}</dd>
            <dt>Languages</dt>
            <dd>{p.manifest.languages.join(", ") || "—"}</dd>
            <dt>Roles</dt>
            <dd>{p.manifest.role_scope.join(", ") || "—"}</dd>
            <dt>Runtime needs</dt>
            <dd>
              {Object.entries(p.manifest.runtime_requirements).map(([k, v]) => (
                <Tag key={k}>
                  {k}: {v ? "yes" : "no"}
                </Tag>
              ))}
            </dd>
          </dl>
          <div className="grid-2 tight">
            <div>
              <h3>Included</h3>
              <ul className="list">
                {p.manifest.objects.map((o) => (
                  <li key={o.object_id} className="small">
                    <span className="mono">{o.object_key}</span> v{o.version} · {o.languages.join(", ")} · {o.media.length} media
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Withdrawn / removed</h3>
              {p.manifest.withdrawn.length === 0 ? (
                <p className="muted small">None</p>
              ) : (
                <ul className="list">
                  {p.manifest.withdrawn.map((w) => (
                    <li key={w.object_id} className="small">
                      <span className="mono">{w.object_key}</span> — {w.status}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
