import { Navigate, useNavigate } from "react-router-dom";
import { useEngine } from "../app/engine";
import { personDoes, personName, personRole, workspaceOf } from "../app/people";
import { CLIENTS, clientForRole } from "../domain/clients";
import type { User } from "../domain/types";
import { BrandGlyph } from "../ui/Brand";
import { initials } from "../ui/kit";

const FLOW = [
  "Swift receives the client's SOPs with the course brief. Drafts quote them word for word.",
  "A named expert reviews, classifies the risk and publishes. Nobody approves their own work.",
  "Each language is approved separately, with an independent safety check.",
  "The approved guides ship with the e-learning modules and open on the job.",
  "Each client sees what learners asked for at work, and where guidance is missing.",
];

function PersonaButton({ user, onPick }: { user: User; onPick: (u: User) => void }) {
  return (
    <button type="button" className="persona" onClick={() => onPick(user)}>
      <span className="avatar">{initials(user.displayName)}</span>
      <span>
        <strong>{personName(user)}</strong>
        <span className="role">{personRole(user)}</span>
        <span className="does">{personDoes(user)}</span>
      </span>
    </button>
  );
}

export function SignInPage() {
  const { state, user, signIn } = useEngine();
  const navigate = useNavigate();
  if (user) return <Navigate to={workspaceOf(user) === "field" ? "/field" : "/"} replace />;
  const pick = (u: User) => {
    signIn(u.id);
    navigate(workspaceOf(u) === "field" ? "/field" : "/");
  };
  const field = state.users.filter((u) => workspaceOf(u) === "field");
  const team = state.users.filter((u) => workspaceOf(u) === "console");

  return (
    <div className="signin">
      <section className="signin-intro">
        <span className="brand-mark">
          <BrandGlyph size={22} />
        </span>
        <h1>The course ends. The job doesn't.</h1>
        <p>
          Swift Solutions builds e-learning programmes for organisations. Swift Knowledge adds what learners need afterwards: the client's approved procedures, on the
          job, in their own language, with practice and evidence for the client.
        </p>
        <ol>
          {FLOW.map((text, i) => (
            <li key={text}>
              <b>{i + 1}</b>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <p className="foot">Demo with four fictional clients, synthetic content and 90 days of sample usage. Everything runs in your browser.</p>
      </section>
      <main className="signin-main">
        <h2>Choose who you are</h2>
        <div className="persona-group">
          <h3>Swift Solutions team</h3>
          <p>Opens Knowledge Studio: client SOPs, review and approval, languages, media, packages and insights.</p>
          <div className="personas">
            {team.map((u) => (
              <PersonaButton key={u.id} user={u} onPick={pick} />
            ))}
          </div>
        </div>
        <div className="persona-group">
          <h3>Client learners at work</h3>
          <p>Opens the worker app their employer received with its course: approved guides, their course modules and practice.</p>
          {CLIENTS.map((c) => {
            const people = field.filter((u) => clientForRole(u.workRole)?.id === c.id);
            if (!people.length) return null;
            return (
              <div key={c.id} className="client-group">
                <h4>
                  <span className="client-dot" style={{ background: c.colour }} />
                  {c.name} <span className="muted">· {c.industry}</span>
                </h4>
                <div className="personas">
                  {people.map((u) => (
                    <PersonaButton key={u.id} user={u} onPick={pick} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
