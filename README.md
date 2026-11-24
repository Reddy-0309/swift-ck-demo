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

## Two workspaces

Sign in by choosing a person. Frontline workers land in the **Field app**, and the
knowledge team lands in the **Console**.

- **Field app** (phone-first, fully translated). Pick a task, answer one question about the situation if asked, and get the approved steps as safety signs, with slides, diagrams and audio. A **Practice** tab offers guided runs with hints and independent checks without them. If nothing approved fits, the app says so plainly and tells the worker who to ask.
- **Console** (desktop). **Home** shows a "Waiting for you" inbox for the signed-in person. **Knowledge** has each procedure's content, languages, media and history. **Sources** handles SOP uploads. **Insights** shows usage over 7, 30 or 90 days, reconciled against the raw events. **Packages** exports content, and **Activity** is the audit log.

The demo data covers 90 days of synthetic activity from 124 pseudonymous workers, about
8,700 requests.

## Try it

| Person | What to try |
|---|---|
| **Arjun** (delivery) | Parcel pickup in any of the 8 languages; *Leaking contents* (no approved answer); search in native script; Practice. |
| **Lakshmi** (maintenance) | Conveyor check: it asks which line, then shows the safety-critical steps with diagrams. |
| **Asha** (author) | Sources: upload the sample *pickup SOP revision 2*. Live pickup guidance is suspended until the new version is approved. Create drafts, translate (codes, units and numbers are protected), and make slides. |
| **Vikram / Meera** (subject experts) | Review and publish. You cannot approve your own work. |
| **Kavya** (language reviewer) | Approve translations and translated media from the inbox. |
| **Ravi** (safety checker) | Confirm safety text independently. |
| **Nisha** (analyst) | Insights, with "How is this calculated?" on every figure. |
| **Admin** | Export a package; read the activity log; reset demo data. |

## Structure

```
src/domain/   engine: governance, ingestion, extraction, delivery (C1→C2), retrieval,
              media, practice, analytics, packaging, contracts (zod), labels (8 languages)
src/seed/     synthetic fixtures, 8-language translations and scenario, seeding via the workflow
src/app/      React ↔ engine bridge (boot, identity, actions, files)
src/layouts/  Field app and Console shells;  src/pages/  screens;  src/ui/  design system
src/test/     vitest suites;  e2e/  browser end-to-end check
```

The domain layer keeps the production data shapes and contracts (C1–C5 v0.1-demo). The
full-stack version (FastAPI + PostgreSQL) can take over behind the same screens once the
demo is approved.
