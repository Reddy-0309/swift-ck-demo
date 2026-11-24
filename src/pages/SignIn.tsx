import { Navigate, useNavigate } from "react-router-dom";
import { useEngine } from "../app/engine";
import { personDoes, personName, personRole, workspaceOf } from "../app/people";
import type { User } from "../domain/types";
import { BrandGlyph } from "../ui/Brand";
import { initials } from "../ui/kit";

const FLOW = [
  "Upload an SOP. Drafts are created that quote it word for word.",
  "An expert reviews, classifies the risk and publishes.",
  "Each of 8 languages is translated and signed off separately.",
  "Workers get the exact approved steps for their task.",
  "The team sees what workers ask for, and what is missing.",
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
        <h1>Approved procedures, in every worker's language.</h1>
        <p>Swift Knowledge turns SOPs into verified, step-by-step guidance. Nothing reaches a worker until a named expert has approved it.</p>
        <ol>
          {FLOW.map((text, i) => (
            <li key={text}>
              <b>{i + 1}</b>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <p className="foot">Demo with sample content and 90 days of sample usage. Everything runs in your browser.</p>
      </section>
      <main className="signin-main">
        <h2>Choose who you are</h2>
        <div className="persona-group">
          <h3>Frontline workers</h3>
          <p>Opens the field app: pick a task, get the approved steps, practise decisions.</p>
          <div className="personas">
            {field.map((u) => (
              <PersonaButton key={u.id} user={u} onPick={pick} />
            ))}
          </div>
        </div>
        <div className="persona-group">
          <h3>Knowledge team</h3>
          <p>Opens the console: sources, review and approval, languages, media, insights.</p>
          <div className="personas">
            {team.map((u) => (
              <PersonaButton key={u.id} user={u} onPick={pick} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
