import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEngine } from "../app/engine";
import { useAction } from "../app/useAction";
import { CONTRACT_VERSION } from "../domain/contracts";
import type { Capability } from "../domain/core";
import { heuristicExtractor } from "../domain/extraction";
import { Button, ErrorBanner } from "./ui";

interface NavItem {
  to: string;
  label: string;
  anyOf?: Capability[];
}

const NAV: NavItem[] = [
  { to: "/", label: "Overview" },
  { to: "/ask", label: "Ask (task → answer)", anyOf: ["knowledge.query"] },
  { to: "/practice", label: "Practice", anyOf: ["practice.attempt"] },
  { to: "/studio", label: "Knowledge Studio", anyOf: ["source.upload", "draft.edit"] },
  { to: "/review", label: "Review queue", anyOf: ["version.review", "language.approve", "hazard.check", "media.approve"] },
  { to: "/library", label: "Library", anyOf: ["knowledge.read"] },
  { to: "/insights", label: "Insights", anyOf: ["analytics.view"] },
  { to: "/packages", label: "Packages (Model A)", anyOf: ["package.export"] },
  { to: "/audit", label: "Audit log", anyOf: ["audit.view"] },
];

function ResetDemo() {
  const { reset } = useEngine();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const action = useAction<void>();
  if (!confirming) {
    return (
      <button type="button" className="link small" onClick={() => setConfirming(true)}>
        Reset demo data
      </button>
    );
  }
  return (
    <div className="stack-sm">
      <span className="small">Discard every change and restore the original synthetic data?</span>
      <div className="row">
        <Button
          variant="danger"
          busy={action.busy}
          onClick={() =>
            void action.run(reset, () => {
              setConfirming(false);
              navigate("/");
            })
          }
        >
          Reset
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
      <ErrorBanner error={action.error} />
    </div>
  );
}

export function Layout() {
  const { user, signOut, can } = useEngine();
  const visible = NAV.filter((n) => !n.anyOf || n.anyOf.some((c) => can(c)));
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            SK
          </span>
          <div>
            <strong>Swift Contextual Knowledge</strong>
            <span className="muted small">Stage A/A+ demonstrator</span>
          </div>
        </div>
        <nav aria-label="Main">
          {visible.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className="nav-link">
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="who">
            <strong>{user?.displayName}</strong>
            <span className="muted small">
              {user?.roles.join(", ")}
              {user?.workRole ? ` · ${user.workRole}` : ""}
            </span>
          </div>
          <button type="button" className="link" onClick={signOut}>
            Switch identity
          </button>
          <ResetDemo />
          <p className="muted small">
            Contracts {CONTRACT_VERSION} · extractor {heuristicExtractor.name} · runs entirely in your browser
          </p>
        </div>
      </aside>
      <main className="content">
        <div className="synthetic-bar">Demonstrator · all content, people and events are synthetic · not operational guidance</div>
        <Outlet />
      </main>
    </div>
  );
}
