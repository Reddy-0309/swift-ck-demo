import { Link } from "react-router-dom";
import { useEngine } from "../../app/engine";
import { clientOf } from "../../app/people";
import { moduleTitle } from "../../domain/clients";
import { sourceVariantOf, variantIn } from "../../domain/governance";
import type { DemoState, Language } from "../../domain/types";
import { useField } from "../../layouts/FieldLayout";
import { Icon } from "../../ui/icons";

interface Guide {
  key: string;
  title: string;
  href: string | null;
}

/** The approved guide for an object key, as this worker would open it, or null if none is live. */
function guideFor(s: DemoState, key: string, role: string | null, language: Language): Guide | null | "not-for-role" {
  const object = s.objects.find((o) => o.objectKey === key);
  const live = object && s.versions.find((v) => v.objectId === object.id && v.state === "published");
  if (!object || !live) return { key, title: object?.title ?? key, href: null };
  if (!role || !live.applicability.roles.includes(role)) return "not-for-role";
  const variant = variantIn(s, live.id, language);
  const title = variant?.state === "approved" ? variant.title : (sourceVariantOf(s, live.id)?.title ?? object.title);
  const a = live.applicability;
  const params = new URLSearchParams({ task: a.taskIds[0] ?? "" });
  if (a.situationCodes[0]) params.set("situation", a.situationCodes[0]);
  return { key, title, href: `/field/guide?${params.toString()}` };
}

/** The worker's e-learning course, with the approved guides and practice linked from each module. */
export default function FieldCourse() {
  const { state, user } = useEngine();
  const { t, language } = useField();
  const client = clientOf(user);
  if (!client) return <p className="muted">{t.noTasks}</p>;
  const role = user?.workRole ?? null;
  const modules = client.programme.modules
    .map((m) => ({ module: m, guides: m.objectKeys.map((k) => guideFor(state, k, role, language)) }))
    .filter(({ module, guides }) => !module.objectKeys.length || guides.some((g) => g !== "not-for-role"));

  return (
    <>
      <h1>{t.myCourse}</h1>
      <p className="course-title">{client.programme.title}</p>
      <p className="muted" style={{ margin: "2px 0 20px" }}>
        {t.courseIntro}
      </p>
      <ol className="modules">
        {modules.map(({ module, guides }, i) => {
          const visible = guides.filter((g): g is Guide | null => g !== "not-for-role").filter((g): g is Guide => g !== null);
          const scenarios = module.scenarioKeys.map((k) => state.scenarios.find((x) => x.scenarioKey === k && x.active)).filter((x) => !!x);
          return (
            <li key={module.id} className="module-card">
              <div className="module-meta">
                <span className="module-n">{i + 1}</span>
                <span>
                  {t.module} {i + 1} · {module.minutes} {t.min}
                </span>
              </div>
              <h2>{moduleTitle(module, language)}</h2>
              <p className="module-lms">
                <Icon name="course" size={16} />
                {t.inLms}
              </p>
              <div className="module-links">
                {visible.map((g) =>
                  g.href ? (
                    <Link key={g.key} className="module-link" to={g.href}>
                      <Icon name="book" size={18} />
                      <span>{g.title}</span>
                      <Icon name="chevronRight" size={16} />
                    </Link>
                  ) : (
                    <span key={g.key} className="module-link pending">
                      <Icon name="history" size={18} />
                      <span>{t.guideComing}</span>
                    </span>
                  ),
                )}
                {!module.objectKeys.length && (
                  <span className="module-link pending">
                    <Icon name="history" size={18} />
                    <span>{t.guideComing}</span>
                  </span>
                )}
                {scenarios.map((x) => (
                  <Link key={x.id} className="module-link practice" to={`/field/practice?scenario=${x.id}&mode=guided`}>
                    <Icon name="target" size={18} />
                    <span>{t.practice}</span>
                    <Icon name="chevronRight" size={16} />
                  </Link>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
