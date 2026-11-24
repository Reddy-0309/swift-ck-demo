// Renders procedure content with safety-sign markers (ISO 7010 colours and shapes):
// a blue disc for mandatory steps, a yellow triangle for warnings, a red slashed circle for
// prohibitions, a green square for conditions, and a violet square for escalation.

import { BLOCK_LABELS } from "../domain/labels";
import { isLanguage, type Block, type BlockType } from "../domain/types";

type BlockLike = Pick<Block, "id" | "type" | "order" | "text"> & Partial<Pick<Block, "uncertain" | "uncertaintyNote">>;

function Sign({ type, step }: { type: BlockType; step: number }) {
  switch (type) {
    case "step":
      return (
        <svg className="sign" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="17" fill="var(--blue)" />
          <text x="18" y="23.5" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" fontFamily="inherit">
            {step}
          </text>
        </svg>
      );
    case "warning":
      return (
        <svg className="sign" viewBox="0 0 36 36" aria-hidden="true">
          <path d="M18 3 34 32H2z" fill="var(--amber)" stroke="#17202b" strokeWidth="2" strokeLinejoin="round" />
          <path d="M18 13v9" stroke="#17202b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="18" cy="27" r="1.8" fill="#17202b" />
        </svg>
      );
    case "prohibition":
      return (
        <svg className="sign" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="15" fill="#fff" stroke="var(--red)" strokeWidth="4.5" />
          <path d="M8 8 28 28" stroke="var(--red)" strokeWidth="4.5" />
        </svg>
      );
    case "condition":
      return (
        <svg className="sign" viewBox="0 0 36 36" aria-hidden="true">
          <rect x="2" y="2" width="32" height="32" rx="4" fill="var(--green)" />
          <path d="M10 18.5l5.5 5.5L26 13" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "escalation":
      return (
        <svg className="sign" viewBox="0 0 36 36" aria-hidden="true">
          <rect x="2" y="2" width="32" height="32" rx="4" fill="var(--violet)" />
          <path d="M18 27V10M11 16l7-7 7 7" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "exception":
      return (
        <svg className="sign" viewBox="0 0 36 36" aria-hidden="true">
          <path d="M18 2 34 18 18 34 2 18z" fill="#3f4a59" />
          <text x="18" y="23.5" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" fontFamily="inherit">
            ?
          </text>
        </svg>
      );
    default:
      return (
        <svg className="sign" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="17" fill="#e1e5eb" />
          <text x="18" y="24" textAnchor="middle" fontSize="16" fontWeight="700" fill="#3f4a59" fontFamily="inherit">
            i
          </text>
        </svg>
      );
  }
}

export function Procedure({
  blocks,
  lang = "en",
  large = false,
  showFlags = false,
  selectedId,
  onSelect,
}: {
  blocks: BlockLike[];
  lang?: string;
  large?: boolean;
  showFlags?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const labels = BLOCK_LABELS[isLanguage(lang) ? lang : "en"];
  let step = 0;
  return (
    <ol className={`procedure${large ? " large" : ""}`} lang={lang}>
      {[...blocks]
        .sort((a, b) => a.order - b.order)
        .map((b) => {
          if (b.type === "step") step += 1;
          return (
            <li
              key={b.id}
              className={`block-${b.type}${onSelect ? " clickable" : ""}${selectedId === b.id ? " selected" : ""}`}
              onClick={onSelect ? () => onSelect(b.id) : undefined}
            >
              <Sign type={b.type} step={step} />
              <div>
                <span className="label">{b.type === "step" ? `${labels.step} ${step}` : labels[b.type]}</span>
                <span className="text">{b.text}</span>
                {showFlags && b.uncertain && <span className="flag">Needs review: {b.uncertaintyNote || "unclear wording"}</span>}
              </div>
            </li>
          );
        })}
    </ol>
  );
}
