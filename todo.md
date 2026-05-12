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

## Feature: Fireflies MCP Integration
- [x] Explore Fireflies MCP tools (list, search transcripts)
- [x] Add server-side tRPC procedure to search and fetch Fireflies transcripts via MCP
- [x] Add "Pull from Fireflies" button on New Session page with meeting name search
- [x] Auto-populate transcript field from selected Fireflies meeting
- [x] Handle errors and empty states for Fireflies fetch

## Feature: Session Tagging + Filtering
- [x] Add tags column (JSON array) to sessions table in schema
- [x] Generate and apply DB migration for tags column
- [x] Update createSession and updateSession DB helpers to handle tags
- [x] Update tRPC procedures to accept and return tags
- [x] Add tag input (chip-style) on New Session and Session Detail pages
- [x] Add filter chips on Dashboard and History pages (Church, Real Estate, Consulting + custom)
- [x] Filter sessions by selected tag client-side

## Gap Fixes (post-feature review)
- [x] Refactor Fireflies MCP calls to use temp-file arg passing (safe from shell injection)
- [x] Normalize sessions.list and sessions.get to return parsedTags as string[] alongside raw tags
- [x] Add TagQuickAdd component to SessionDetail with preset + custom tag support
- [x] Tag chips on SessionDetail with inline remove and auto-save via updateSession mutation

## Bug Fix: Fireflies Meetings Not Loading
- [x] Diagnose Fireflies MCP call failure (test MCP directly, check server procedure)
- [x] Fix root cause in server/routers.ts Fireflies procedures
- [x] Verify fix in browser and update tests

## Bug Fix Follow-up
- [x] Add Vitest regression tests for Fireflies MCP stdout parser (JSON array parsing and sentence extraction)
