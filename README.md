# Swift Contextual Knowledge — Stage A/A+ demonstrator (browser edition)

A single-page app that runs the whole demonstrator in the browser, so it can be hosted on
Vercel as static files. It has **no server, no database and no OCR**. Every Stage A/A+
feature works, and the knowledge content is approved in all eight languages: English,
Kannada, Tamil, Telugu, Hindi, Malayalam, Marathi and Bengali.

> All content, organisations, people and events are **synthetic**. The Indic text is a
> demonstration draft. A qualified native-speaker domain reviewer must check it before any
> real use.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 32 unit/integration tests (vitest)
npm run build      # type-check + production build into dist/
```

To run the end-to-end check, start the built site with `npx vite preview --port 4173`, then run `npm run e2e`. It needs Python Playwright and Chrome.

## Deploy to Vercel

1. Push this folder to a Git repository and import it in Vercel. Vercel detects Vite. `vercel.json` already sets the build command, the output folder, SPA rewrites and security headers.
2. No environment variables are needed.

Alternatively, run `npx vercel --prod` from this folder.

## How the browser edition works

| Production design | This demo |
|---|---|
| PostgreSQL | Data is kept in memory and saved to the browser's IndexedDB. Each change is applied as a transaction, and an immutability guard blocks edits to published content and to the audit log. |
| Object storage | File bytes are stored in IndexedDB and addressed by their SHA-256 hash. |
| Sign-in + server-side authorization | You pick a demo identity on the sign-in screen. Role capabilities are enforced by the same domain code, but in the browser, so this is for demonstration only. |
| OCR for scanned pages | Not included. A PDF with no text layer is rejected with a clear message. Markdown, TXT, DOCX and text-layer PDF are parsed in the browser. |
| Local-model extraction adapter | Uses the deterministic rule-based extractor (`heuristic-v1`) behind the same interface. Every block quotes the source verbatim. |
| SQL analytics on PostgreSQL | Runs the same documented SQL on SQLite compiled to WebAssembly (sql.js). |

**Reset demo data** in the sidebar restores the original seeded state. Data is stored per browser, so each visitor gets their own copy.

## Demo walkthrough (switch identity from the sidebar)

| Identity | Try |
|---|---|
| **Arjun** (delivery associate) | **Ask:** task *Parcel pickup* in any of the 8 languages; situation *Leaking contents* (abstains); task *COD review* (refused); free-text questions in native script. **Practice:** guided vs independent, in any language. |
| **Lakshmi** (maintenance technician) | **Ask:** *Conveyor daily inspection* with no asset (asks for it); with CV-1000 (HIGH-risk answer with slide, source diagram and localized annotated diagram). |
| **Asha** (author) | **Studio:** download the sample *Pickup SOP r2* and upload it. Revision 2 suspends the published pickup knowledge and marks its media stale. Extract drafts; translate (codes, units and numbers are enforced); generate slides; attach narration; annotate the figure. |
| **Vikram / Meera** (SMEs) | **Review:** resolve flags, classify risk, publish, withdraw, or start a new version. Self-approval is blocked. |
| **Kavya** (bilingual reviewer) | Approve translations and localized media. |
| **Ravi** (hazard checker) | Independent hazard check of warning, prohibition and escalation text. |
| **Nisha** (analyst) | **Insights:** reconciled indicators with denominators, small-cell suppression and the documented SQL, plus review effort (AP-07). |
| **Admin** | **Packages:** Model A export (general content only, with the withdrawn list and a schema-validated manifest); **Audit log**. |

## Structure

```
src/domain/   engine: governance, ingestion, extraction, delivery (C1→C2), retrieval,
              media, practice, analytics, packaging, contracts (zod), labels (8 languages)
src/seed/     synthetic fixtures, 8-language translations and scenario, seeding via the workflow
src/app/      React ↔ engine bridge (boot, identity, actions, files)
src/pages/    screens;  src/components/  shared UI
src/test/     vitest suites;  e2e/  browser end-to-end check
```

The domain layer keeps the production data shapes and contracts (C1–C5 v0.1-demo). The
full-stack version (FastAPI + PostgreSQL) can take over behind the same screens once the
demo is approved.
