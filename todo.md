# NoteAssemble TODO

## Phase 1 — Schema & Setup
- [x] Update app title/name to "NoteAssemble" everywhere
- [x] Define sessions table in drizzle/schema.ts
- [x] Generate and apply DB migration
- [x] Add session query helpers in server/db.ts
- [x] Add session tRPC procedures (CRUD + analyze) in server/routers.ts
- [x] Request OpenAI API key secret

## Phase 2 — Theme & Shell
- [x] Dark theme (#0e0e0e bg, #c9952a amber) in index.css
- [x] Serif typography (Google Fonts: Playfair Display + Inter)
- [x] PWA manifest.json with NoteAssemble branding
- [x] Service worker registration for offline/installable
- [x] Bottom tab navigation component (Home, New Session, History)
- [x] App shell layout wrapping all pages

## Phase 3 — Auth & Core Pages
- [x] Login page (email/password)
- [x] Signup page (email/password)
- [x] Auth tRPC procedures (register, login, logout)
- [x] Dashboard page — session list sorted by date
- [x] Session card component (name, date, preview)
- [x] Search bar filtering sessions by keyword
- [x] New Session page — name, transcript, personal notes fields

## Phase 4 — AI Analysis
- [x] GPT-4o analysis tRPC procedure with structured JSON schema
- [x] Analysis result display component (Summary, Action Items, Insights, Watch Items)
- [x] Priority badges (high/medium/low) for action items
- [x] Loading state during analysis
- [x] Save AI output to session in DB

## Phase 5 — Export & Session Detail
- [x] Session detail page showing full analysis
- [x] Copy to clipboard (full summary text)
- [x] PDF export of session summary
- [x] Vitest unit tests for analysis procedure and auth

## Phase 6 — Polish & Deploy
- [x] Mobile responsiveness audit
- [x] Empty states and error states
- [x] Final checkpoint and publish

## Rename Task
- [x] Update VITE_APP_TITLE secret to "NoteAssemble" (requires manual update in Settings → General)
- [x] Confirm index.html title is "NoteAssemble"
- [x] Confirm manifest.json name is "NoteAssemble"
- [x] Confirm Login page branding shows "NoteAssemble"
