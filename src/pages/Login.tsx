import { Navigate } from "react-router-dom";
import { useEngine } from "../app/engine";

/** Identity picker. The demo has no passwords: client-side roles are for demonstration only. */
export function LoginPage() {
  const { state, user, signIn } = useEngine();
  if (user) return <Navigate to="/" replace />;
  return (
    <div className="login">
      <div className="login-panel">
        <h1>Swift Contextual Knowledge</h1>
        <p className="muted">
          Governed knowledge within work — Stage A/A+ demonstrator. All content and identities are synthetic. Everything runs in
          your browser; nothing is sent to a server.
        </p>
        <p className="muted small">
          Choose a demo identity. In production, sign-in and every permission check run on the server; here roles are applied in
          the browser for demonstration only.
        </p>
      </div>
      <div className="login-panel">
        <h2>Demo identities</h2>
        <ul className="demo-users">
          {state.users.map((u) => (
            <li key={u.id}>
              <button type="button" className="btn btn-ghost" onClick={() => signIn(u.id)}>
                <strong>{u.displayName}</strong>
                <span className="muted small">
                  {u.username} · {u.roles.join(", ")}
                  {u.workRole ? ` · ${u.workRole}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
