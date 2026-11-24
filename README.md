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
npm test           # 35 unit/integration tests (vitest)
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

## What it shows

Swift Solutions builds e-learning programmes for client organisations. Swift Knowledge adds what learners need after the course: the client's approved procedures on the job, in their own language, with practice, and with evidence for the client. The demo has four fictional clients:

| Client | Programme | Delivery | Languages |
|---|---|---|---|
| Synthetic Logistics Co. | Last-mile delivery essentials | Model A package | all 8 |
| Ironleaf Components (manufacturing) | Plant safety and equipment care | Model B governed service | all 8 for the conveyor; Tamil, Kannada and Hindi for the others |
| Tamarind Co-operative Bank | Branch operations onboarding | Model A, restricted guide behind the bank's backend | English, Kannada, Hindi |
| Corner Basket Stores (retail) | Store safety for new joiners | Model A package | English, Hindi, Marathi (Bengali waiting for approval) |

There are 11 live guides and 2 waiting for an expert, plus 4 practice scenarios. The sample data holds 90 days of synthetic activity from 234 pseudonymous workers, about 18,000 events.

**Knowledge Studio** (for the Swift team) has these pages:

- **Home:** what is waiting for you, and how ready each client programme is.
- **Clients:** each e-learning module with its on-the-job guides, practice, delivery model, adoption stage, language coverage and packages.
- **Knowledge:** every guide, filterable by client.
- **Sources:** SOP uploads.
- **Insights:** usage per client and period, every figure reconciled with documented SQL.
- **Packages:** one versioned package per client.
- **Activity:** the audit log.
- **Acceptance checklist:** the D07 Appendix A checks, run live against a copy of the data.

**Worker app** (for client learners, phone-first, in 8 languages) has three tabs:

- **Guidance:** the client's tasks, giving the exact approved steps or a clear "no approved answer". If a guide is not yet approved in the worker's language, the app offers the languages it is approved in.
- **My course:** the e-learning modules, each with its guides and practice.
- **Practice:** guided runs and independent checks.

## Try it

| Person | What to try |
|---|---|
| **Arjun** (Synthetic Logistics) | Parcel pickup in any of the 8 languages; *Leaking contents* (no approved answer); My course; Practice. |
| **Lakshmi / Karthik** (Ironleaf) | Conveyor check with diagrams; lockout–tagout; forklift check (asks which forklift). |
| **Farhan** (Tamarind Bank) | Cash counter, identity check, and the restricted suspicious-deposit guide in Kannada. |
| **Priya** (Corner Basket) | Spill clean-up in Marathi; switch to Bengali to see the "not approved yet" fallback. |
| **Asha** (instructional designer) | Sources: upload the sample *pickup SOP revision 2*. Live pickup guidance is suspended until the new version is approved. Translate (codes, units and numbers are protected) and make slides. |
| **Vikram / Meera** (subject experts) | Review and publish. You cannot approve your own work. |
| **Kavya / Ravi** (language reviewer / safety checker) | Approve translations; independent safety check. |
| **Nisha** (learning analyst) | Insights per client, with "How is this calculated?" on every figure. |
| **Admin** (delivery manager) | Clients, then Export package; Acceptance checklist; reset demo data. |

## Acceptance checklist

The checklist page runs the D07 Appendix A items against a copy of the current data. Results:

- **Verified live (12 items):** serving gate, negative tests, withdrawal, general-only packages, protected terms and safety checks, stale media after a source change, practice separation, analytics reconciliation, standalone UI, package fields, and C1–C5 contracts.
- **Partly in this demo (1 item):** the hand-over records.
- **Production build (2 items):** benchmark B1 (AI authoring productivity) and benchmarks B1–B4. These need real models and thresholds, so they are never shown as passed.

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
