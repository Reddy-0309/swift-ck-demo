import { approvedLanguageCount, type VersionSummary } from "../app/selectors";
import { LANGUAGES } from "../domain/types";

/** Eight squares, one per language: green approved, amber awaiting approval, grey not started. */
export function Coverage({ v }: { v: VersionSummary }) {
  return (
    <span className="row" title={`${approvedLanguageCount(v)} of ${LANGUAGES.length} languages approved`}>
      <span className="coverage" aria-hidden="true">
        {LANGUAGES.map((l) => (
          <i key={l} className={v.languages[l] === "approved" ? "on" : v.languages[l] === "draft" ? "pending" : ""} />
        ))}
      </span>
      <span className="small muted num">{approvedLanguageCount(v)}/8</span>
    </span>
  );
}
