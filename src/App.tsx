import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useEngine } from "./app/engine";
import { Layout } from "./components/Layout";
import { AskPage } from "./pages/Ask";
import { AuditPage } from "./pages/Audit";
import { HomePage } from "./pages/Home";
import { InsightsPage } from "./pages/Insights";
import { LibraryPage } from "./pages/Library";
import { LoginPage } from "./pages/Login";
import { PackagesPage } from "./pages/Packages";
import { PracticePage } from "./pages/Practice";
import { ReviewPage } from "./pages/Review";
import { SourceDetailPage } from "./pages/SourceDetail";
import { StudioPage } from "./pages/Studio";
import { VersionPage } from "./pages/version/VersionPage";

function RequireIdentity({ children }: { children: ReactNode }) {
  const { user } = useEngine();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireIdentity>
            <Layout />
          </RequireIdentity>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="ask" element={<AskPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="studio" element={<StudioPage />} />
        <Route path="sources/:id" element={<SourceDetailPage />} />
        <Route path="versions/:id" element={<VersionPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
