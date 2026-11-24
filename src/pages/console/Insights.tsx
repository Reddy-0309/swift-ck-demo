import { useEffect, useMemo, useState } from "react";
import { useEngine } from "../../app/engine";
import { ROLE_LABELS } from "../../app/people";
import { ACTION_LABELS } from "../../app/selectors";
import { dashboard, periodStart, reviewEffort, type Dashboard, type IndicatorResult } from "../../domain/analytics";
import { CONTEXT_LABELS } from "../../domain/labels";
import { LANGUAGE_NAMES, isLanguage } from "../../domain/types";
import { ErrorNotice, Notice, PageHeader, Panel, Pill, Segmented, Stat, Tabs, formatDate } from "../../ui/kit";

type Period = "7" | "30" | "90";

const OUTCOME: Record<string, string> = {
  answer: "Got approved steps",
  abstain: "No approved answer",
  need_context: "Asked for more detail",
  not_permitted: "Not allowed for their role",
};
const MEDIA: Record<string, string> = { slide: "Slides", annotated_diagram: "Labelled diagrams", source_figure: "Source diagrams", narration: "Audio" };
const REASONS: Record<string, string> = {
  situation_not_covered: "Situation not covered yet",
  no_applicable_object: "No procedure for this task",
  language_not_approved: "Not approved in their language",
  missing_context: "Equipment not given",
  missing_task: "No task chosen",
  no_confident_match: "Search found no confident match",
  ambiguous_match: "Search matched several procedures",
  several_objects_apply: "Several procedures apply",
};

function label(key: string, value: string): string {
  if (key === "outcome") return OUTCOME[value] ?? value;
  if (key === "language") return isLanguage(value) ? LANGUAGE_NAMES[value].english : value;
  if (key === "task") return CONTEXT_LABELS.en[value] ?? value;
  if (key === "reason") return REASONS[value] ?? value;
  if (key === "media") return MEDIA[value] ?? value;
  if (key === "event") return value === "media.played" ? "played" : "opened";
  if (key === "action") return ACTION_LABELS[value] ?? value;
  if (key === "mode") return value === "assisted" ? "Guided practice" : "Independent check";
  if (key === "version") return `v${value}`;
  if (key === "role") return ROLE_LABELS[value] ?? value;
  return value;
}

function Calc({ indicator }: { indicator: IndicatorResult }) {
  return (
    <details className="calc">
      <summary>How is this calculated?</summary>
      <p className="muted" style={{ marginTop: 6 }}>
        {indicator.description} Groups smaller than {indicator.minCellSize} are hidden to protect individuals.
      </p>
      <pre>{indicator.sql}</pre>
    </details>
  );
}

function Bars({ indicator, keys }: { indicator: IndicatorResult; keys?: string[] }) {
  const shown = keys ?? indicator.keys;
  const visible = indicator.rows.filter((r) => !r.suppressed);
  const max = Math.max(1, ...visible.map((r) => r.value ?? 0));
  if (!indicator.rows.length) return <p className="muted">No activity in this period.</p>;
  return (
    <div className="bars">
      {indicator.rows.map((row) => {
        const text = shown.map((k) => label(k, row.keys[k] ?? "")).join(" · ");
        const share = row.rate !== null ? row.rate : (row.value ?? 0) / max;
        return (
          <div key={Object.values(row.keys).join("|")} className={`bar${row.suppressed ? " suppressed" : ""}`}>
            <span>{text}</span>
            <span className="track">{!row.suppressed && <span className="fill" style={{ width: `${Math.max(1.5, share * 100)}%` }} />}</span>
            <span className="val">{row.suppressed ? "hidden" : row.rate !== null ? `${Math.round(row.rate * 100)}%` : (row.value ?? 0).toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

function DayChart({ indicator, since }: { indicator: IndicatorResult; since: string }) {
  const days = useMemo(() => {
    const counts = new Map(indicator.rows.map((r) => [r.keys.day, r.value ?? 0]));
    const out: { day: string; n: number }[] = [];
    const start = new Date(new Date(since).getTime() + 330 * 60000);
    for (let d = new Date(start); d.getTime() <= Date.now() + 330 * 60000; d.setUTCDate(d.getUTCDate() + 1)) {
      const day = d.toISOString().slice(0, 10);
      out.push({ day, n: counts.get(day) ?? 0 });
    }
    return out;
  }, [indicator, since]);
  const max = Math.max(1, ...days.map((d) => d.n));
  return (
    <>
      <div className="chart-days" role="img" aria-label={`Requests per day, peak ${max}`}>
        {days.map((d) => (
          <span key={d.day} style={{ height: `${Math.max(2, (d.n / max) * 100)}%` }} title={`${d.day}: ${d.n} requests`} />
        ))}
      </div>
      <div className="chart-axis">
        <span>{formatDate(days[0]?.day, false)}</span>
        <span>Peak {max} per day</span>
        <span>{formatDate(days.at(-1)?.day, false)}</span>
      </div>
    </>
  );
}

function ReviewEffort() {
  const { state } = useEngine();
  const { rows, summary, note } = useMemo(() => reviewEffort(state), [state]);
  return (
    <div className="stack">
      <div className="stats">
        <Stat value={summary.medianSmeMinutes ?? "—"} label="Median expert review, minutes" />
        <Stat value={summary.medianBilingualMinutes ?? "—"} label="Median language review, minutes" />
        <Stat value={summary.correctionsPerObject ?? "—"} label="Expert corrections per procedure" />
        <Stat value={summary.objectsReviewed + summary.translationsReviewed} label="Reviews completed" />
      </div>
      <Panel title="Review time per procedure and language" flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Procedure</th>
                <th>Language</th>
                <th>Review</th>
                <th>Lines</th>
                <th>Review min</th>
                <th>Safety check min</th>
                <th>Corrections</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.objectKey}-${r.version}-${r.language}`}>
                  <td>
                    {state.objects.find((o) => o.objectKey === r.objectKey)?.title ?? r.objectKey} <span className="muted">v{r.version}</span>
                  </td>
                  <td>{isLanguage(r.language) ? LANGUAGE_NAMES[r.language].english : r.language}</td>
                  <td>{r.kind === "source (SME)" ? "Expert" : "Language"}</td>
                  <td className="num">{r.blocks}</td>
                  <td className="num">{r.reviewMinutes ?? "—"}</td>
                  <td className="num">{r.hazardMinutes ?? "—"}</td>
                  <td className="num">{r.corrections ? r.corrections.total : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <p className="small muted">{note}</p>
    </div>
  );
}

export default function Insights() {
  const { state, can } = useEngine();
  const [period, setPeriod] = useState<Period>("30");
  const [tab, setTab] = useState<"usage" | "effort">("usage");
  const [board, setBoard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<unknown>(null);
  const since = useMemo(() => periodStart(Number(period)), [period]);

  useEffect(() => {
    let cancelled = false;
    dashboard(state, since).then(
      (d) => !cancelled && setBoard(d),
      (e) => !cancelled && setError(e),
    );
    return () => {
      cancelled = true;
    };
  }, [state, since]);

  if (!can("analytics.view")) return <div className="page"><Notice tone="warn">Your role cannot see insights.</Notice></div>;
  const get = (id: string) => board?.indicators.find((i) => i.id === id);
  const outcomes = get("retrieval_outcomes");
  const answered = outcomes?.rows.find((r) => r.keys.outcome === "answer")?.value ?? 0;
  const practice = get("practice_by_mode");
  const independent = practice?.rows.find((r) => r.keys.mode === "independent");
  const ruleText = Object.fromEntries(Object.entries(state.scenarios[0]?.definition.text.en?.rules ?? {}));

  return (
    <div className="page">
      <PageHeader
        title="Insights"
        subtitle="What workers asked for, what they got, and where guidance is missing."
        actions={
          <>
            <Pill tone="amber" plain>
              {board?.dataLabel ?? "Loading"}
            </Pill>
            {tab === "usage" && (
              <Segmented
                label="Period"
                value={period}
                onChange={setPeriod}
                options={[
                  { id: "7", label: "7 days" },
                  { id: "30", label: "30 days" },
                  { id: "90", label: "90 days" },
                ]}
              />
            )}
          </>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "usage", label: "Usage" },
          { id: "effort", label: "Review effort" },
        ]}
      />
      <ErrorNotice error={error} />
      {tab === "effort" && <ReviewEffort />}
      {tab === "usage" && !board && !error && <p className="muted">Calculating…</p>}
      {tab === "usage" && board && (
        <div className="stack">
          <div className="stats">
            <Stat value={(outcomes?.total ?? 0).toLocaleString()} label="Guidance requests" />
            <Stat value={outcomes?.total ? `${Math.round((answered / outcomes.total) * 100)}%` : "—"} label="Answered with approved steps" sub={`${(outcomes?.total ?? 0) - answered} not answered`} />
            <Stat value={(get("active_workers")?.total ?? 0).toLocaleString()} label="Active workers" />
            <Stat value={independent?.rate != null ? `${Math.round(independent.rate * 100)}%` : "—"} label="Independent checks passed" sub={independent?.denominator != null ? `${independent.denominator} checks` : undefined} />
          </div>
          {get("requests_by_day") && (
            <Panel title="Requests per day">
              <DayChart indicator={get("requests_by_day") as IndicatorResult} since={board.since} />
            </Panel>
          )}
          <div className="grid-2">
            {[
              ["retrieval_outcomes", undefined],
              ["requests_by_language", undefined],
              ["object_views", ["procedure", "version"]],
              ["unresolved_gaps", ["task", "reason"]],
              ["practice_by_mode", undefined],
              ["rule_accuracy_independent", undefined],
              ["media_consumption", ["media"]],
              ["governance_events", undefined],
            ].map(([id, keys]) => {
              const indicator = get(id as string);
              if (!indicator) return null;
              const shown = id === "rule_accuracy_independent" ? { ...indicator, rows: indicator.rows.map((r) => ({ ...r, keys: { rule: ruleText[r.keys.rule ?? ""] ?? r.keys.rule ?? "" } })) } : indicator;
              return (
                <Panel key={id as string} title={indicator.title}>
                  <Bars indicator={shown} keys={keys as string[] | undefined} />
                  <Calc indicator={indicator} />
                </Panel>
              );
            })}
          </div>
          <Notice tone={board.reconciliation.allMatch ? "ok" : "warn"}>
            {board.reconciliation.allMatch
              ? "Every figure above is computed with documented SQL and matches the raw event count."
              : "Some figures do not match the raw event count. Do not use them outside this team."}
          </Notice>
          <ul className="small muted" style={{ margin: 0, paddingLeft: 18 }}>
            {board.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
