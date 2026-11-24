import { Link } from "react-router-dom";
import { useEngine } from "../app/engine";
import type { Capability } from "../domain/core";
import { LANGUAGES } from "../domain/types";
import { Card, PageHeader, languageName } from "../components/ui";

const STEPS: { n: number; text: string; to: string; cap: Capability }[] = [
  { n: 1, text: "Upload a synthetic SOP with an exception, a warning and a diagram", to: "/studio", cap: "source.upload" },
  { n: 2, text: "Extract draft knowledge objects with source spans and uncertainty flags", to: "/studio", cap: "draft.edit" },
  { n: 3, text: "Review, correct, classify risk and publish one object", to: "/review", cap: "version.review" },
  { n: 4, text: "Retrieve the current object for a role and task, verbatim with citation, in any of 8 languages", to: "/ask", cap: "knowledge.query" },
  { n: 5, text: "Render a localized slide and narration from approved text", to: "/library", cap: "media.produce" },
  { n: 6, text: "Run a guided scenario and a separate unseen assessment", to: "/practice", cap: "practice.attempt" },
  { n: 7, text: "Show reconciled knowledge and learner metrics on a synthetic dashboard", to: "/insights", cap: "analytics.view" },
  { n: 8, text: "Amend or withdraw the SOP and see old answers and media blocked", to: "/library", cap: "version.review" },
  { n: 9, text: "Prove map independence: every screen here works with no map connector", to: "/ask", cap: "knowledge.query" },
];

export function HomePage() {
  const { user, can } = useEngine();
  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.displayName ?? ""}`}
        subtitle="AI proposes. Experts approve. The system publishes — and delivers approved knowledge verbatim."
      />
      <div className="grid-3">
        <Card title="Knowledge Studio" tone="knowledge">
          <p>Ingest rights-cleared sources, extract draft objects, review, approve per language, version and withdraw.</p>
        </Card>
        <Card title="Context & Experience Engine" tone="context">
          <p>Answer a role-and-task context with the exact approved procedure — or abstain. Practise decisions safely.</p>
        </Card>
        <Card title="Analytics & Insight" tone="analytics">
          <p>Every number comes from stored events and documented SQL, with denominators and small-cell suppression.</p>
        </Card>
      </div>
      <Card title="The nine-step demonstrator">
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="step-n">{s.n}</span>
              <span>{s.text}</span>
              {can(s.cap) ? <Link to={s.to}>Open</Link> : <span className="muted small">needs another role</span>}
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Languages">
        <p className="small">Approved content, slides, diagrams, practice and the worker answer screen are available in:</p>
        <p className="lang-list">
          {LANGUAGES.map((l) => (
            <span key={l} className="tag" lang={l}>
              {languageName(l)}
            </span>
          ))}
        </p>
        <p className="muted small">Indic text is a demonstration draft and needs review by qualified native-speaker domain reviewers before real use.</p>
      </Card>
    </>
  );
}
