import { Suspense, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEngine } from "../app/engine";
import { personName, personRole } from "../app/people";
import { inboxFor } from "../app/selectors";
import { useAction } from "../app/useAction";
import type { Capability } from "../domain/core";
import { BrandGlyph } from "../ui/Brand";
import { Icon, type IconName } from "../ui/icons";
import { Button, ErrorNotice, Modal, initials, useToast } from "../ui/kit";

const NAV: { to: string; label: string; icon: IconName; anyOf?: Capability[] }[] = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/knowledge", label: "Knowledge", icon: "book", anyOf: ["knowledge.read"] },
  { to: "/sources", label: "Sources", icon: "upload", anyOf: ["source.upload", "draft.edit"] },
  { to: "/insights", label: "Insights", icon: "chart", anyOf: ["analytics.view"] },
  { to: "/packages", label: "Packages", icon: "package", anyOf: ["package.export"] },
  { to: "/activity", label: "Activity", icon: "history", anyOf: ["audit.view"] },
];

export function PageLoading() {
  return (
    <div className="page" role="status">
      <p className="muted">Loading…</p>
    </div>
  );
}

function ResetDemo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { reset } = useEngine();
  const navigate = useNavigate();
  const toast = useToast();
  const action = useAction<void>();
  return (
    <Modal
      open={open}
      title="Reset demo data?"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            busy={action.busy}
            onClick={() =>
              void action.run(reset, () => {
                onClose();
                navigate("/");
                toast("Demo data reset");
              })
            }
          >
            Reset demo data
          </Button>
        </>
      }
    >
      <p>Every change made in this browser is discarded and the original sample content and 90 days of usage are restored.</p>
      <ErrorNotice error={action.error} />
    </Modal>
  );
}

export function ConsoleLayout() {
  const { state, user, principal, can, signOut } = useEngine();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const location = useLocation();
  const waiting = principal ? inboxFor(state, principal).length : 0;
  const visible = NAV.filter((n) => !n.anyOf || n.anyOf.some((c) => can(c)));

  return (
    <div className="console">
      <aside className={`sidebar${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(false)}>
        <div className="brand">
          <span className="brand-mark">
            <BrandGlyph />
          </span>
          <div>
            <strong>Swift Knowledge</strong>
            <span>Knowledge team console</span>
          </div>
        </div>
        <nav className="nav" aria-label="Main">
          {visible.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
              <Icon name={n.icon} />
              {n.label}
              {n.to === "/" && waiting > 0 && <span className="badge num">{waiting}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="demo-chip">
            <Icon name="info" size={14} />
            Demo · sample data only
          </span>
          {user && (
            <div className="me">
              <span className="avatar">{initials(user.displayName)}</span>
              <div>
                <strong>{personName(user)}</strong>
                <span>{personRole(user)}</span>
              </div>
            </div>
          )}
          <button type="button" className="side-action" onClick={signOut}>
            <Icon name="switch" size={16} />
            Switch user
          </button>
          <button type="button" className="side-action" onClick={() => setResetOpen(true)}>
            <Icon name="reset" size={16} />
            Reset demo data
          </button>
        </div>
      </aside>
      <div className="main">
        <div className="mobile-bar">
          <button type="button" className="icon-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Icon name="menu" />
          </button>
          <strong>Swift Knowledge</strong>
        </div>
        <Suspense fallback={<PageLoading />}>
          <Outlet key={location.pathname} />
        </Suspense>
      </div>
      <ResetDemo open={resetOpen} onClose={() => setResetOpen(false)} />
    </div>
  );
}
