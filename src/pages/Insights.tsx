import { useEffect, useMemo, useState } from "react";
import { useEngine } from "../app/engine";
import { Card, ErrorBanner, Loading, NotAvailable, Notice, PageHeader } from "../components/ui";
import { dashboard, reviewEffort, type Dashboard, type IndicatorResult } from "../domain/analytics";

const GAP_DIAGNOSIS = ["Content gap", "Poor app usability", "Ambiguous procedure", "Exceptional situation", "Verified competency gap"];
const ORDER = [
  "retrieval_outcomes",
  "object_views",
  "requests_by_task",
  "requests_by_language",
  "unresolved_gaps",
  "practice_by_mode",
  "rule_accuracy_independent",
  "media_consumption",
  "governance_events",
];

function Bars({ indicator }: { indicator: IndicatorResult }) {
  const max = Math.max(1, ...indicator.rows.filter((r) => !r.suppressed).map((r) => r.value ?? 0));
  return (
    <div className="bars">
      {indicator.rows.map((row) => {
        const label = Object.values(row.keys).join(" · ");
        if (row.suppressed) {
          return (
            <div key={label} className="bar-row suppressed">
              <span className="bar-label">{label}</span>
              <span className="muted small">suppressed (&lt; {indicator.minCellSize})</span>
            </div>
          );
        }
        const value = row.value ?? 0;
        const share = row.rate !== null ? row.rate : value / max;
        return (
          <div key={label} className="bar-row">
            <span className="bar-label">{label}</span>
            <span className="bar-track" aria-hidden>
              <span className="bar-fill" style={{ width: `${Math.max(2, share * 100)}%` }} />
            </span>
            <span className="bar-value">{row.rate !== null ? `${Math.round(row.rate * 100)}% (${value}/${row.denominator})` : value}</span>
          </div>
        );
      })}
    </div>
  );
}

function IndicatorCard({ indicator }: { indicator: IndicatorResult }) {
  const hasRates = indicator.rows.some((r) => r.denominator !== null);
  return (
    <Card title={indicator.title} tone="analytics">
      <p className="muted small">{indicator.description}</p>
      <p className="small">
        {hasRates ? (
          <>
            <strong>{indicator.total}</strong> met / <strong>{indicator.denominatorTotal}</strong> {indicator.denominatorLabel}
          </>
        ) : (
          <>
            Total: <strong>{indicator.total}</strong> {indicator.denominatorLabel}
          </>
        )}
        {indicator.suppressedCells > 0 && ` · ${indicator.suppressedCells} small cell(s) suppressed`}
      </p>
      {indicator.rows.length === 0 ? <p className="muted">No events yet.</p> : <Bars indicator={indicator} />}
      <details>
        <summary className="small">Documented SQL</summary>
        <pre className="json">{indicator.sql}</pre>
      </details>
    </Card>
  );
}

function ReviewEffortCard() {
  const { state } = useEngine();
  const { summary, rows, note } = useMemo(() => reviewEffort(state), [state]);
  return (
    <Card title="Review effort per object and language (AP-07)" tone="knowledge">
      <div className="meta-strip">
        <span>Objects reviewed: {summary.objectsReviewed}</span>
        <span>Median SME minutes: {summary.medianSmeMinutes ?? "—"}</span>
        <span>Translations reviewed: {summary.translationsReviewed}</span>
        <span>Median bilingual minutes: {summary.medianBilingualMinutes ?? "—"}</span>
        <span>Corrections per object: {summary.correctionsPerObject ?? "—"}</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Object</th>
              <th>Lang</th>
              <th>Review</th>
              <th>Method</th>
              <th>Blocks</th>
              <th>Review min</th>
              <th>Hazard check min</th>
              <th>Corrections (added / removed / changed)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.objectKey}-${r.version}-${r.language}`}>
                <td className="mono small">
                  {r.objectKey} v{r.version}
                </td>
                <td>{r.language}</td>
                <td className="small">{r.kind}</td>
                <td className="small">{r.method}</td>
                <td>{r.blocks}</td>
                <td>{r.reviewMinutes ?? "—"}</td>
                <td>{r.hazardMinutes ?? "—"}</td>
                <td>{r.corrections ? `${r.corrections.added} / ${r.corrections.removed} / ${r.corrections.changed}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">{note}</p>
    </Card>
  );
}

export function InsightsPage() {
  const { state, can } = useEngine();
  const [board, setBoard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    let cancelled = false;
    dashboard(state)
      .then((d) => !cancelled && setBoard(d))
      .catch((e) => !cancelled && setError(e));
    return () => {
      cancelled = true;
    };
  }, [state]);
  if (!can("analytics.view")) return <NotAvailable />;
  if (error) return <ErrorBanner error={error} />;
  if (!board) return <Loading label="Running the documented SQL…" />;
  const byId = Object.fromEntries(board.indicators.map((i) => [i.id, i]));

  return (
    <>
      <PageHeader
        title="Knowledge & learning insight"
        subtitle="Computed from versioned events with documented SQL (SQLite in your browser) — never generated by a model."
        actions={<span className="synthetic">{board.dataLabel}</span>}
      />
      <Notice tone={board.reconciliation.allMatch ? "ok" : "warn"}>
        Reconciliation:{" "}
        {board.reconciliation.allMatch ? "every dashboard total equals the raw stored event count." : "mismatch detected — do not use these figures externally."}{" "}
        {board.reconciliation.checks.map((c) => `${c.indicator} ${c.dashboardTotal}/${c.rawCount}`).join(" · ")}
      </Notice>
      <div className="grid-2">
        {ORDER.map((id) => byId[id])
          .filter((i): i is IndicatorResult => !!i)
          .map((indicator) => (
            <IndicatorCard key={indicator.id} indicator={indicator} />
          ))}
        <Card title="From evidence to intervention">
          <p className="small">Knowledge-use evidence → diagnose before recommending training:</p>
          <ul className="list">
            {GAP_DIAGNOSIS.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          <p className="muted small">Appropriate intervention — not always a course.</p>
        </Card>
      </div>
      <ReviewEffortCard />
      <Card title="Caveats">
        <ul className="list">
          {board.caveats.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Card>
    </>
  );
}
