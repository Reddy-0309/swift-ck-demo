import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { runChecklist, type CheckResult, type CheckStatus } from "../../app/checklist";
import { useEngine } from "../../app/engine";
import { Icon, type IconName } from "../../ui/icons";
import { Button, ErrorNotice, PageHeader, Panel, Pill, formatDate } from "../../ui/kit";

const STATUS: Record<CheckStatus, [string, "green" | "red" | "amber" | "gray", IconName]> = {
  pass: ["Verified now", "green", "check"],
  fail: ["Failed", "red", "x"],
  partial: ["Partly in demo", "amber", "info"],
  outside: ["Production build", "gray", "history"],
};

export default function Checklist() {
  const { state } = useEngine();
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [ranAt, setRanAt] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(() => {
    setBusy(true);
    setError(null);
    // Let the page paint first; the checks run a few hundred requests and the SQL dashboards.
    setTimeout(() => {
      runChecklist(state).then(
        (r) => {
          setResults(r);
          setRanAt(new Date().toISOString());
          setBusy(false);
        },
        (e) => {
          setError(e);
          setBusy(false);
        },
      );
    }, 30);
  }, [state]);

  useEffect(() => {
    run();
    // Run once on open; afterwards on demand, so the list does not jump while someone reads it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = (s: CheckStatus) => results?.filter((r) => r.status === s).length ?? 0;

  return (
    <div className="page">
      <PageHeader
        title="Acceptance checklist"
        subtitle="D07 Appendix A, the Stage A/A+ evidence checklist. Each check runs now against a copy of this demo's data; nothing is changed."
        actions={
          <Button variant="secondary" icon="reset" busy={busy} onClick={run}>
            Run again
          </Button>
        }
      />
      <ErrorNotice error={error} />
      {results && (
        <div className="check-summary">
          <div>
            <strong className="num">{count("pass")}</strong>
            <span>verified in this demo</span>
          </div>
          {count("fail") > 0 && (
            <div className="bad">
              <strong className="num">{count("fail")}</strong>
              <span>failed</span>
            </div>
          )}
          <div className="partial">
            <strong className="num">{count("partial")}</strong>
            <span>partly in this demo</span>
          </div>
          <div className="outside">
            <strong className="num">{count("outside")}</strong>
            <span>need the production build</span>
          </div>
          <p className="muted small">
            Last run {ranAt ? formatDate(ranAt) : ""}. Passing shows the governed workflow works on synthetic data; it does not show production accuracy or readiness.
          </p>
        </div>
      )}
      {!results && !error && <p className="muted">Running checks…</p>}
      {results && (
        <Panel flush>
          <ol className="checks">
            {results.map((r, i) => {
              const [label, tone, icon] = STATUS[r.status];
              return (
                <li key={r.id} className={`check ${r.status}`}>
                  <span className="check-icon" aria-hidden="true">
                    <Icon name={icon} size={16} />
                  </span>
                  <div className="check-body">
                    <div className="check-head">
                      <span className="muted small num">{i + 1}</span>
                      <strong>{r.title}</strong>
                      <Pill tone={tone}>{label}</Pill>
                    </div>
                    <p>{r.summary}</p>
                    {r.details.length > 0 && (
                      <details>
                        <summary>Details</summary>
                        <ul>
                          {r.details.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {r.where && (
                      <Link className="small" to={r.where.to}>
                        See it: {r.where.label}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>
      )}
    </div>
  );
}
