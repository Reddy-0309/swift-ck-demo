import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useEngine } from "../../app/engine";
import { userName } from "../../app/selectors";
import { Card, Empty, NotAvailable, Notice, PageHeader, RiskBadge, StateBadge, Tag, formatDate, shortHash } from "../../components/ui";
import { getObject, sourceVariantOf, versionsOfObject } from "../../domain/governance";
import { ContentTab } from "./ContentTab";
import { MediaTab } from "./MediaTab";
import { TranslationTab } from "./TranslationTab";

type Tab = "content" | "translations" | "media" | "audit";

function AuditTab({ versionId }: { versionId: string }) {
  const { state } = useEngine();
  const related = new Set([versionId, ...state.variants.filter((v) => v.versionId === versionId).map((v) => v.id), ...state.media.filter((m) => m.versionId === versionId).map((m) => m.id)]);
  const entries = state.audit.filter((a) => related.has(a.entityId));
  return (
    <Card title="Audit trail (append-only)">
      {entries.length === 0 && <Empty>No entries.</Empty>}
      <ol className="timeline">
        {entries.map((a) => (
          <li key={a.id}>
            <span className="mono small">{formatDate(a.at)}</span>
            <strong>{a.action}</strong>
            <span>{a.actorName}</span>
            <code className="small">{JSON.stringify(a.details)}</code>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function VersionPage() {
  const { id = "" } = useParams();
  const { state, can } = useEngine();
  const [tab, setTab] = useState<Tab>("content");
  if (!can("knowledge.read")) return <NotAvailable />;
  const v = state.versions.find((x) => x.id === id);
  if (!v) return <Empty>This version does not exist (a discarded draft, or reset demo data).</Empty>;
  const obj = getObject(state, v.objectId);
  const source = sourceVariantOf(state, v.id);
  const siblings = versionsOfObject(state, v.objectId).sort((a, b) => a.version - b.version);
  // Remount the content editor whenever this version's recorded history changes.
  const revision = state.audit.filter((a) => a.entityId === v.id).length;
  const tabs: [Tab, string, boolean][] = [
    ["content", "Content & review", true],
    ["translations", "Languages", true],
    ["media", "Controlled media", true],
    ["audit", "Audit", can("audit.view")],
  ];

  return (
    <>
      <PageHeader
        title={source?.title ?? obj.title}
        subtitle={
          <>
            <span className="mono">{obj.objectKey}</span> · version {v.version} · method {v.extractionMethod}
          </>
        }
        actions={
          <div className="row">
            <StateBadge state={v.state} />
            {v.state !== "draft" && v.state !== "in_review" && <RiskBadge risk={v.riskClass} />}
            {v.distributionClass && <Tag>{v.distributionClass}</Tag>}
          </div>
        }
      />
      {v.stateReason && <Notice tone={v.state === "published" ? "info" : "warn"}>{v.stateReason}</Notice>}
      <div className="meta-strip">
        <span>Author: {userName(state, v.authorId)}</span>
        <span>Approver: {userName(state, v.approverId)}</span>
        <span>
          Effective: {formatDate(v.effectiveFrom)}
          {v.effectiveTo ? ` → ${formatDate(v.effectiveTo)}` : ""}
        </span>
        <span>
          Hash: <span className="mono">{shortHash(v.contentHash)}</span>
        </span>
        <span>
          Versions:{" "}
          {siblings.map((x) => (
            <Link key={x.id} to={`/versions/${x.id}`} className={x.id === v.id ? "current" : ""}>
              v{x.version} ({x.state})
            </Link>
          ))}
        </span>
      </div>
      <div className="tabs" role="tablist">
        {tabs
          .filter(([, , show]) => show)
          .map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "tab active" : "tab"} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
      </div>
      {tab === "content" && <ContentTab key={`${v.id}:${revision}`} version={v} />}
      {tab === "translations" && <TranslationTab key={v.id} version={v} />}
      {tab === "media" && <MediaTab key={v.id} version={v} />}
      {tab === "audit" && <AuditTab versionId={v.id} />}
    </>
  );
}
