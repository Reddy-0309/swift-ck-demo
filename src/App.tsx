import { lazy } from "react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useEngine } from "./app/engine";
import { workspaceOf, type Workspace } from "./app/people";
import { ConsoleLayout } from "./layouts/ConsoleLayout";
import { FieldLayout } from "./layouts/FieldLayout";
import { SignInPage } from "./pages/SignIn";

const FieldHome = lazy(() => import("./pages/field/FieldHome"));
const FieldGuide = lazy(() => import("./pages/field/FieldGuide"));
const FieldPractice = lazy(() => import("./pages/field/FieldPractice"));
const Home = lazy(() => import("./pages/console/Home"));
const KnowledgeList = lazy(() => import("./pages/console/KnowledgeList"));
const KnowledgeDetail = lazy(() => import("./pages/console/knowledge/KnowledgeDetail"));
const Sources = lazy(() => import("./pages/console/Sources"));
const SourceDetail = lazy(() => import("./pages/console/SourceDetail"));
const Insights = lazy(() => import("./pages/console/Insights"));
const Packages = lazy(() => import("./pages/console/Packages"));
const Activity = lazy(() => import("./pages/console/Activity"));

/** Frontline workers use the field app; everyone else uses the console. */
function Workspace({ is, children }: { is: Workspace; children: ReactNode }) {
  const { user } = useEngine();
  if (!user) return <Navigate to="/signin" replace />;
  if (workspaceOf(user) !== is) return <Navigate to={is === "field" ? "/" : "/field"} replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route
        path="/field"
        element={
          <Workspace is="field">
            <FieldLayout />
          </Workspace>
        }
      >
        <Route index element={<FieldHome />} />
        <Route path="guide" element={<FieldGuide />} />
        <Route path="practice" element={<FieldPractice />} />
      </Route>
      <Route
        element={
          <Workspace is="console">
            <ConsoleLayout />
          </Workspace>
        }
      >
        <Route index element={<Home />} />
        <Route path="knowledge" element={<KnowledgeList />} />
        <Route path="knowledge/:id" element={<KnowledgeDetail />} />
        <Route path="sources" element={<Sources />} />
        <Route path="sources/:id" element={<SourceDetail />} />
        <Route path="insights" element={<Insights />} />
        <Route path="packages" element={<Packages />} />
        <Route path="activity" element={<Activity />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
