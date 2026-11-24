import { Link } from "react-router-dom";
import { useEngine } from "../app/engine";
import { userName, versionSummaries } from "../app/selectors";
import { Card, Empty, NotAvailable, PageHeader, StateBadge, Tag, formatDate } from "../components/ui";
import type { Capability } from "../domain/core";
import { hazardCheckRequired } from "../domain/governance";
import { approvalCapability } from "../domain/media";

const REVIEW_CAPABILITIES: Capability[] = ["version.review", "language.approve", "hazard.check", "media.approve"];

export function ReviewPage() {
  const { state, can } = useEngine();
  if (!REVIEW_CAPABILITIES.some((c) => can(c))) return <NotAvailable />;
  const inReview = versionSummaries(state, ["in_review"]);
  const pendingLanguages = state.variants
    .filter((v) => !v.isSource && v.state === "draft" && state.versions.find((x) => x.id === v.versionId)?.state === "published")
    .map((v) => ({
      variant: v,
      title: state.variants.find((x) => x.versionId === v.versionId && x.isSource)?.title ?? v.title,
      waiting: [!v.reviewerId && "bilingual review", hazardCheckRequired(state, v) && !v.hazardCheckerId && "hazard check"].filter(Boolean).join(" + "),
    }));
  const pendingMedia = state.media.filter((m) => m.state === "draft" && !m.stale && can(approvalCapability(state, m)));

  return (
    <>
      <PageHeader title="Review queue" subtitle="Named approval is required for every object, every language and every media item." />
      <div className="grid-2">
        <Card title="Knowledge awaiting SME approval" tone="knowledge">
          {inReview.length === 0 && <Empty>Nothing awaiting review.</Empty>}
          <ul className="list">
            {inReview.map((v) => (
              <li key={v.id}>
                <Link to={`/versions/${v.id}`}>
                  {v.title} <span className="muted">v{v.version}</span>
                </Link>
                <span className="muted small">by {v.author}</span>
                {v.uncertainBlocks > 0 && <span className="flag">{v.uncertainBlocks} flagged</span>}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Translations awaiting bilingual review or hazard check" tone="context">
          {pendingLanguages.length === 0 && <Empty>No translations awaiting review.</Empty>}
          <ul className="list">
            {pendingLanguages.map(({ variant, title, waiting }) => (
              <li key={variant.id}>
                <Link to={`/versions/${variant.versionId}`}>{title}</Link>
                <Tag>{variant.language}</Tag>
                <span className="muted small">waiting for {waiting}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      {(can("media.approve") || can("language.approve")) && (
        <Card title="Media awaiting your approval" tone="media">
          {pendingMedia.length === 0 && <Empty>No media awaiting approval.</Empty>}
          <ul className="list">
            {pendingMedia.map((m) => (
              <li key={m.id}>
                <Link to={`/versions/${m.versionId}`}>{m.title}</Link>
                <StateBadge state={m.state} />
                <span className="muted small">
                  {userName(state, m.createdBy)} · {formatDate(m.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
