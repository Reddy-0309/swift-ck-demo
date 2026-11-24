import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { store, useEngine, usePrincipal } from "../../../app/engine";
import { summarize } from "../../../app/selectors";
import { useAction } from "../../../app/useAction";
import { approveAndPublish, deleteDraft, newVersionFrom, returnToDraft, sourceVariantOf, submitForReview, versionsOfObject, withdrawVersion } from "../../../domain/governance";
import type { Distribution, ObjectVersion, RiskClass } from "../../../domain/types";
import { Coverage } from "../../../ui/Coverage";
import { Icon } from "../../../ui/icons";
import { Button, Empty, ErrorNotice, Field, Modal, Notice, PageHeader, Pill, RiskPill, StatusPill, Tabs, useToast } from "../../../ui/kit";
import { ContentTab } from "./ContentTab";
import { HistoryTab } from "./HistoryTab";
import { LanguagesTab } from "./LanguagesTab";
import { MediaTab } from "./MediaTab";

type Tab = "content" | "languages" | "media" | "history";
type Dialog = "publish" | "return" | "withdraw" | "discard" | null;

function PublishDialog({ version, onClose }: { version: ObjectVersion; onClose: () => void }) {
  const principal = usePrincipal();
  const toast = useToast();
  const [risk, setRisk] = useState<RiskClass | "">(version.riskClass ?? "");
  const [distribution, setDistribution] = useState<Distribution | "">(version.distributionClass ?? "");
  const [until, setUntil] = useState("");
  const action = useAction<ObjectVersion>();
  return (
    <Modal
      open
      title="Publish this procedure"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            busy={action.busy}
            disabled={!distribution}
            onClick={() =>
              void action.run(
                () =>
                  store.transact((s) =>
                    approveAndPublish(s, principal, version.id, {
                      riskClass: risk || null,
                      distributionClass: distribution as Distribution,
                      effectiveTo: until ? new Date(until).toISOString() : null,
                    }),
                  ),
                () => {
                  onClose();
                  toast("Published. Workers now get this version.");
                },
              )
            }
          >
            Publish
          </Button>
        </>
      }
    >
      <p className="muted">Workers receive this exact text from now on. Any earlier version is replaced and its media goes out of date.</p>
      <Field label="Risk" hint="Leaving it unclassified treats it as safety-critical.">
        <select value={risk} onChange={(e) => setRisk(e.target.value as RiskClass | "")}>
          <option value="">Unclassified</option>
          <option value="LOW">Low: information only</option>
          <option value="MEDIUM">Medium: affects service or compliance</option>
          <option value="HIGH">Safety-critical</option>
        </select>
      </Field>
      <Field label="Who may receive it" hint="Only general procedures can be included in packages for other apps.">
        <select value={distribution} onChange={(e) => setDistribution(e.target.value as Distribution | "")}>
          <option value="">Choose…</option>
          <option value="general">General: anyone in the listed roles</option>
          <option value="restricted">Restricted: served only after a role check, never packaged</option>
        </select>
      </Field>
      <Field label="Expires (optional)">
        <input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
      </Field>
      <ErrorNotice error={action.error} />
    </Modal>
  );
}

function ReasonDialog({
  title,
  intro,
  confirm,
  danger,
  run,
  done,
  onClose,
}: {
  title: string;
  intro: string;
  confirm: string;
  danger?: boolean;
  run: (reason: string) => unknown;
  done: () => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const action = useAction<unknown>();
  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} busy={action.busy} disabled={!reason.trim()} onClick={() => void action.run(() => run(reason), done)}>
            {confirm}
          </Button>
        </>
      }
    >
      <p className="muted">{intro}</p>
      <Field label="Reason">
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <ErrorNotice error={action.error} />
    </Modal>
  );
}

export default function KnowledgeDetail() {
  const { id = "" } = useParams();
  const { state, can } = useEngine();
  const principal = usePrincipal();
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [editing, setEditing] = useState(false);
  const action = useAction<unknown>();
  const version = state.versions.find((v) => v.id === id);
  if (!can("knowledge.read")) return <div className="page"><Notice tone="warn">Your role cannot open procedures.</Notice></div>;
  if (!version) {
    return (
      <div className="page">
        <Empty title="This procedure no longer exists" action={<Link to="/knowledge">Back to knowledge</Link>}>
          It may have been a draft that was discarded.
        </Empty>
      </div>
    );
  }
  const summary = summarize(state, version);
  const tab = (params.get("tab") as Tab) ?? "content";
  const setTab = (t: Tab) => setParams(t === "content" ? {} : { tab: t }, { replace: true });
  const siblings = versionsOfObject(state, version.objectId).sort((a, b) => b.version - a.version);
  const mediaCount = state.media.filter((m) => m.versionId === version.id).length;
  const isAuthor = principal.userId === version.authorId || principal.userId === sourceVariantOf(state, version.id)?.draftedBy;
  const flagged = summary.uncertainBlocks;
  const done = (message: string) => () => {
    setDialog(null);
    toast(message);
  };

  const actions = (
    <>
      {version.state === "draft" && can("draft.edit") && !editing && (
        <>
          <Button variant="ghost" icon="trash" onClick={() => setDialog("discard")}>
            Discard
          </Button>
          <Button variant="secondary" icon="edit" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button busy={action.busy} onClick={() => void action.run(() => store.transact((s) => submitForReview(s, principal, version.id)), done("Submitted for review"))}>
            Submit for review
          </Button>
        </>
      )}
      {version.state === "in_review" && can("version.review") && !editing && (
        <>
          <Button variant="ghost" onClick={() => setDialog("return")}>
            Return to draft
          </Button>
          <Button variant="secondary" icon="edit" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button disabled={isAuthor || flagged > 0} title={isAuthor ? "Another expert must approve your own draft" : flagged ? "Resolve the lines that need review first" : undefined} onClick={() => setDialog("publish")}>
            Publish…
          </Button>
        </>
      )}
      {(version.state === "published" || version.state === "suspended") && can("version.review") && (
        <Button variant="secondary" onClick={() => setDialog("withdraw")}>
          Withdraw…
        </Button>
      )}
      {version.state !== "draft" && version.state !== "in_review" && can("draft.edit") && siblings[0]?.id === version.id && (
        <Button
          busy={action.busy}
          icon="plus"
          onClick={() =>
            void action.run(
              () => store.transact((s) => newVersionFrom(s, principal, version.id)),
              (created) => {
                toast("New draft version created");
                navigate(`/knowledge/${(created as ObjectVersion).id}`);
              },
            )
          }
        >
          Start new version
        </Button>
      )}
    </>
  );

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <Link to="/knowledge">Knowledge</Link>
            <Icon name="chevronRight" size={14} />
            <span>Version {version.version}</span>
          </>
        }
        title={summary.title}
        subtitle={
          <span className="row wrap">
            <StatusPill state={version.state} />
            {version.state !== "draft" && version.state !== "in_review" && <RiskPill risk={version.riskClass} />}
            {version.distributionClass === "restricted" && <Pill tone="violet">Restricted</Pill>}
            <Coverage v={summary} />
            {siblings.length > 1 && (
              <select aria-label="Version" value={version.id} onChange={(e) => navigate(`/knowledge/${e.target.value}`)} style={{ width: "auto", minHeight: 28, padding: "2px 8px" }}>
                {siblings.map((x) => (
                  <option key={x.id} value={x.id}>
                    Version {x.version} ({x.state.replace("_", " ")})
                  </option>
                ))}
              </select>
            )}
          </span>
        }
        actions={actions}
      />
      <div className="stack">
        <ErrorNotice error={action.error} />
        {version.state === "suspended" && <Notice tone="warn">Workers no longer receive this procedure because its source SOP changed. Start a new version to review it against the new revision.</Notice>}
        {version.state === "superseded" && <Notice>A newer version has replaced this one. It is kept for the record.</Notice>}
        {version.state === "withdrawn" && <Notice tone="warn">Withdrawn: {version.stateReason || "no reason given"}. Workers no longer receive it.</Notice>}
        {(version.state === "draft" || version.state === "in_review") && version.stateReason && <Notice tone="warn">{version.stateReason}</Notice>}
        {version.state === "in_review" && can("version.review") && isAuthor && <Notice>You wrote this draft, so another expert must publish it.</Notice>}
      </div>
      <div style={{ marginTop: 16 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "content", label: "Content" },
            { id: "languages", label: "Languages", count: Object.values(summary.languages).filter((x) => x === "approved").length },
            { id: "media", label: "Media", count: mediaCount },
            ...(can("audit.view") || can("version.review") ? [{ id: "history" as Tab, label: "History" }] : []),
          ]}
        />
        {tab === "content" && <ContentTab key={`${version.id}-${editing}`} version={version} editing={editing} onDone={() => setEditing(false)} />}
        {tab === "languages" && <LanguagesTab key={version.id} version={version} initialLanguage={params.get("lang")} />}
        {tab === "media" && <MediaTab key={version.id} version={version} />}
        {tab === "history" && <HistoryTab version={version} />}
      </div>

      {dialog === "publish" && <PublishDialog version={version} onClose={() => setDialog(null)} />}
      {dialog === "return" && (
        <ReasonDialog
          title="Return to draft"
          intro="The author sees your reason and can revise the draft."
          confirm="Return to draft"
          run={(reason) => store.transact((s) => returnToDraft(s, principal, version.id, reason))}
          done={done("Returned to draft")}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "withdraw" && (
        <ReasonDialog
          title="Withdraw this procedure"
          intro="Workers stop receiving it immediately, in every language, and its media goes out of date. The next package lists it as withdrawn."
          confirm="Withdraw"
          danger
          run={(reason) => store.transact((s) => withdrawVersion(s, principal, version.id, reason))}
          done={done("Withdrawn")}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "discard" && (
        <Modal
          open
          title="Discard this draft?"
          onClose={() => setDialog(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  void action.run(
                    () => store.transact((s) => deleteDraft(s, principal, version.id)),
                    () => {
                      toast("Draft discarded");
                      navigate("/knowledge");
                    },
                  )
                }
              >
                Discard draft
              </Button>
            </>
          }
        >
          <p>The draft is deleted. Published versions are not affected.</p>
        </Modal>
      )}
    </div>
  );
}
