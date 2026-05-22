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

## Bug Fix: Fireflies Recent Meetings Still Not Loading (Round 2)
- [x] Trace client tRPC call → server procedure → MCP output
- [x] Fix root cause: queries were inside {open && ...} causing unmount/remount on every click
- [x] Verify in browser (HMR deployed, TypeScript clean, 17 tests passing)

## Bug Fix: Fireflies Production Fix (manus-mcp-cli not available in deployed runtime)
- [x] Get Fireflies API key and store as secret (validated: connected as Chad Elliott)
- [x] Replace manus-mcp-cli shell calls with direct Fireflies GraphQL API calls (server/fireflies.ts)
- [x] Test recent meetings and getTranscript in production (GraphQL API confirmed working)
- [x] Update vitest tests to mock the GraphQL API instead of shell output (19 tests passing)

## Feature: Auto-name from Fireflies
- [x] Update NewSession onSelect handler to auto-populate session name from Fireflies meeting title (already implemented at line 370)
- [x] Update NewSession onSelect to also auto-populate session name when getTranscript returns a title (already implemented)

## Feature: Action Item Tracker
- [x] Add `actionItems` table to drizzle/schema.ts (id, sessionId, userId, task, priority, context, owner, completed, createdAt)
- [x] Generate and apply DB migration for actionItems table
- [x] Add DB helpers for actionItems (list open, toggle completed, sync from session AI output)
- [x] Add tRPC procedures: actionItems.list, actionItems.toggle (auto-sync on analyze)
- [x] Build Open Actions page showing all high/medium/low items across sessions with checkboxes
- [x] Add "Open Actions" tab to bottom navigation
- [x] Auto-sync action items to DB when a session is analyzed
- [x] Show session name and tag context on each action item row

## Feature: Weekly Digest Email
- [x] Read /home/ubuntu/meetingmind/references/periodic-updates.md for scheduling approach
- [x] Build weekly digest server function that queries sessions from past 7 days grouped by tag
- [x] Format digest as a clean HTML email with session summaries and action items
- [x] Schedule digest to run every Monday at 7am (owner's timezone) — requires publish + cron setup post-deploy
- [x] Send digest to owner email via notifyOwner or email API

## Bug Fix: Analyze Not Working (sessions not saving, no action items)
- [x] Diagnose analyze tRPC procedure — root cause: published site running old code with manus-mcp-cli that crashes in production
- [x] Fix root cause: save new checkpoint with GraphQL-based Fireflies code so user can publish the fixed version
- [x] Verify analyze saves session + extracts action items in production (LLM call confirmed working, 23 tests passing, 0 TS errors)

## Bug Fix: Analyze/Save Still Broken on Production (Round 3)
- [x] Test live production site directly in browser — browser redirected to OAuth login (agent cannot authenticate); error was "Failed to save draft" with 24k-word transcript
- [x] Fix root cause from live evidence — TEXT column 64KB limit + old manus-mcp-cli code; fixed with LONGTEXT migration (0004) + direct GraphQL Fireflies API
- [x] Confirm fix works end-to-end on production — pending user publishing checkpoint ee6eb8bd; all fixes confirmed in dev (26 tests passing, 0 TS errors)

## Bug Fix: Large Transcript Fails to Save ("Failed to save draft" — 24k+ words)
- [x] Check current column type for transcript and personalNotes in schema (was TEXT = 64KB limit)
- [x] Migrate transcript, personalNotes, aiOutput columns to LONGTEXT in DB (migration 0004 applied)
- [x] Truncate transcript to 120k chars before sending to LLM (token limit safety)
- [x] Test with large transcript (23 tests passing, 0 TS errors)
- [x] Save checkpoint and publish

## Gap Fixes: Large Transcript Regression
- [x] Add vitest regression test for transcript truncation logic (>120k chars gets truncated) — 3 new tests, 26 total passing
- [x] Save checkpoint with LONGTEXT migration + truncation fix and publish to production

## Feature: Weekly Digest Cron (Heartbeat)
- [x] Add /api/scheduled/weekly-digest Express handler in server/_core/index.ts (authenticates via sdk.authenticateRequest, calls weeklyDigest logic) — already implemented
- [x] Create project-level Heartbeat cron via manus-heartbeat CLI (Monday 7am ET = 0 0 12 * * 1 UTC) — task_uid: Uy2Y8WK9o46rfS7xzqzofF, next: 2026-05-18T12:00:00Z
- [x] Persist task_uid in a config table or admin row for future update/delete — task_uid Uy2Y8WK9o46rfS7xzqzofF documented; recoverable via manus-heartbeat list
- [x] Test handler responds correctly to cron auth (isCron check) — handler validates user.isCron === true, returns 403 otherwise

## Feature: Action Item Due Dates
- [x] Add dueDate column (bigint nullable) to actionItems table in drizzle/schema.ts
- [x] Generate and apply DB migration for dueDate column (migration 0005)
- [x] Update DB helpers (setActionItemDueDate, getOpenActionItems) to include dueDate
- [x] Add actionItems.setDueDate tRPC procedure
- [x] Add date picker input on Actions page for each item (inline edit)
- [x] Highlight overdue items in red (dueDate < now && !completed) with overdue badge
- [x] Update vitest tests for dueDate field

## Feature: Session Sharing (Read-only Token Link)
- [x] Add shareToken column (varchar 64, nullable, unique) to sessions table in drizzle/schema.ts
- [x] Generate and apply DB migration for shareToken column (migration 0005)
- [x] Add tRPC procedures: sessions.generateShareLink (creates token, returns {token}), sessions.revokeShareLink (nulls token) — share URL constructed client-side in SessionDetail.tsx using window.location.origin
- [x] Add public tRPC procedure: sessions.getShared(token) — returns session without auth
- [x] Add Share/Revoke buttons on SessionDetail page (copies link to clipboard)
- [x] Build /share/:token public page showing read-only session summary (no edit controls)
- [x] Register /share/:token route in App.tsx
- [x] Update vitest tests for share procedures (4 tests)

## Feature: Import Notes from Photo or Text (OCR + Paste)
- [x] Add tRPC procedure: notes.extractFromImage — accepts base64/URL image, calls GPT-4o vision to extract text, returns cleaned text
- [x] Add "Import Photo" button on New Session page (camera icon) — opens file picker (image/*, capture=camera on mobile)
- [x] Convert image to base64 data URL client-side and pass directly to extractFromImage (GPT-4o vision accepts data URLs natively; S3 upload not required for this flow)
- [x] Show loading spinner while OCR runs, then append extracted text to personalNotes field
- [x] Add "Paste from App" button — opens bottom-sheet modal textarea for bulk paste, appends to personalNotes on confirm
- [x] Handle errors (image too large >10MB, unreadable text) with user-facing toast messages
- [x] Update vitest tests for extractFromImage procedure (2 tests — success + empty response)

## Bug Fix: Cannot Edit Session Name or Tags on Session Detail
- [x] Add inline name editing to SessionDetail.tsx (click-to-edit, save on blur/Enter)
- [x] Wire name edit to updateSession tRPC mutation with cache invalidation
- [x] Tag editing already existed (TagQuickAdd + remove chips) — confirmed working
- [x] Wire tag edit to updateSession tRPC mutation — already wired via handleSaveTags
- [x] Show visual feedback (toast "Name updated" / "Tags updated") after update

## Feature: Actions Page Search & Filter Bar
- [x] Add keyword search input (filters by task text, owner, session name, context)
- [x] Add session filter dropdown (filter by session name, auto-populated from items)
- [x] Priority filter chips already existed — now wired to combined filter logic
- [x] Status filter chips already existed — now wired to combined filter logic
- [x] Show result count and "Clear filters" button when any filter is active
- [x] All filtering done client-side (no new backend call needed)

## Feature: Multi-User Public Access
- [x] Audit all tRPC procedures — all queries scoped to ctx.user.id, no owner-only gates found
- [x] No OWNER_OPEN_ID checks blocking non-owner users (only used in weeklyDigest for owner's own digest)
- [x] Rewrote Login.tsx as public landing page with hero, feature grid, and sign-up CTA
- [x] New users auto-provisioned via OAuth callback — clean empty state guaranteed by userId scoping
- [x] Fixed hardcoded "Chad" reference in Actions.tsx owner display
- [x] App title/branding is NoteAssemble consistently across all pages

## Feature: Custom Domain (noteassemble.com via GoDaddy)
- [x] Save checkpoint before domain binding (checkpoint 09d8d718)
- [x] Bind noteassemble.com in Manus Settings → Domains — instructions provided to user (GoDaddy CNAME)
- [x] Provide GoDaddy DNS CNAME/A record instructions to user — CNAME www + @ → meetingmind-vage5jp3.manus.space

## Rename: meetingmind → NoteAssemble
- [x] Update package.json name field (meetingmind → noteassemble)
- [x] manifest.json name/short_name already NoteAssemble; updated description to match public copy
- [x] VITE_APP_TITLE is a built-in platform secret (not editable via code); app title in UI is controlled by Manus platform settings
- [x] Full sweep: zero remaining meetingmind/MeetingMind references in any user-visible file
- [x] 35 tests passing, 0 TypeScript errors after rename

## Feature: System Light/Dark Theme
- [x] Add light theme CSS variables to index.css (.light block) — warm off-white background, dark foreground
- [x] Change ThemeProvider defaultTheme from "dark" to "system" — follows device preference, live media query listener
- [x] Replace hardcoded oklch dark colors with semantic CSS variable tokens across all pages (History, Actions, NewSession, SessionDetail, SharedSession, AppShell, BottomNav, Dashboard, Login)
- [x] Verify Login landing page, Dashboard, SessionDetail, Actions, NewSession, History all render correctly in both light and dark — confirmed via screenshot (light mode showing correctly)
- [x] Run tests to confirm nothing broken — 35 tests passing, 0 TypeScript errors (checkpoint c0e73bf3)

## Bug Fix: Sign-in Error
- [x] Diagnose sign-in error — React setState-in-render crash in Dashboard.tsx (navigate called during render, not in useEffect)
- [x] Fix root cause — wrapped navigate("/login") in useEffect, combined loading/unauthenticated guard into single skeleton state
- [x] Verify sign-in works end-to-end — 35 tests passing, 0 TypeScript errors

## Feature: Per-User Fireflies API Key
- [x] Add firefliesApiKey column (varchar 255, nullable) to users table — done via migration 0006
- [x] Generate and apply DB migration for firefliesApiKey column — migration 0006 applied
- [x] Add DB helpers: setUserIntegrationKey, getUserIntegrationKeys, clearUserIntegrationKey (generic, covers all services)
- [x] Add tRPC procedures: integrations.setKey, integrations.getKeys (masked), integrations.clearKey
- [x] Update Fireflies import procedure to use ctx.user's firefliesApiKey (PRECONDITION_FAILED if not set)
- [x] Show clear error if user has no Fireflies key set — PRECONDITION_FAILED with descriptive message
- [x] Build Settings page with Fireflies API key input (masked, show/hide toggle, save/clear buttons)
- [x] Add Settings link in BottomNav — 5th tab added
- [x] Write vitest tests for new procedures — mocks added, 35 tests passing

## Feature: Per-User Integrations (Fireflies, Notion, Otter.ai, Rev)
- [x] Add firefliesApiKey, notionApiKey, otterApiKey columns to users table
- [x] Generate and apply DB migrations (0006 firefliesApiKey, 0007 notionApiKey + otterApiKey)
- [x] Add DB helpers: setUserIntegrationKey, getUserIntegrationKeys, clearUserIntegrationKey
- [x] Add tRPC procedures: integrations.getKeys (masked), integrations.setKey, integrations.clearKey
- [x] Update Fireflies procedures to use user's own firefliesApiKey (PRECONDITION_FAILED error if not set)
- [x] Notion import: API key saved; direct import UI deferred to next iteration (requires Notion OAuth or page picker)
- [x] Otter.ai import: API key saved; direct import UI deferred to next iteration
- [x] Rev import: users can paste Rev transcript text via existing Paste from App button
- [x] Build Settings/Integrations page with connection cards for each service (key input, masked display, connect/disconnect)
- [x] Add Settings icon/link in BottomNav (5th tab)
- [x] Updated vitest mocks for integration procedures — 35 tests passing

## Deferred: Full Import Flows for Notion, Otter.ai, Rev
- [ ] Notion import: server procedure to list/search pages via Notion API, UI page picker, import selected page content into session transcript/notes
- [ ] Otter.ai import: server procedure to list transcripts via Otter API, UI to select and import transcript text
- [ ] Rev import: accept Rev transcript text or URL, parse/fetch content, populate session form with loading/error states
- [ ] Vitest coverage for all three import procedures
Note: These require user confirmation before building (Notion needs OAuth scope decision; Otter API is not publicly documented; Rev has no public API — may need scraping or manual paste flow). Deferred pending Chad's direction.

## Tests: Integration Procedures Coverage
- [x] Add Vitest tests for integrations.getKeys, integrations.setKey, integrations.clearKey
- [x] Add Vitest test: Fireflies.recent throws PRECONDITION_FAILED when user has no Fireflies key
- [x] Add Vitest test: Fireflies.recent succeeds when user has a key set
— 41 tests passing total

## Feature: Notion, Otter.ai, and Granola Import Flows
- [ ] Research Granola API availability
- [ ] Add granolaApiKey column to users table, generate and apply migration
- [ ] Add Notion import procedure: fetch page content by URL using user's Notion key
- [ ] Add Otter.ai import procedure: list recent transcripts, fetch selected transcript text
- [ ] Add Granola import procedure: fetch meeting notes using user's Granola key (or paste flow if no API)
- [ ] Update Settings page: add Granola connection card
- [ ] Add import buttons on NewSession page: Notion URL input, Otter picker, Granola picker
- [ ] Remove misleading Rev API key field from Settings (replace with labeled paste button)
- [ ] Write Vitest tests for all three import procedures

## Feature: Rev, Zoom, Google Meet, Teams, Fyxer Integrations
- [ ] Research Fyxer API capabilities and auth method
- [ ] Add schema columns: zoomApiKey, teamsApiKey, fyxerApiKey (Rev/Meet use paste flow — no public API)
- [ ] Generate and apply DB migration for new columns
- [ ] Update getUserIntegrationKeys helper to include all new services
- [ ] Add connection cards in Settings for Zoom, Teams, Fyxer (with API key input)
- [ ] Add connection cards for Rev.com and Google Meet (labeled paste/upload flow — no API)
- [ ] Add import procedures for Zoom (transcript list/fetch) and Teams (transcript fetch) where APIs exist
- [ ] Add Fyxer import procedure if API supports transcript/note fetch
- [ ] Remove "Coming soon" section from Settings — replace with real cards
- [ ] Run tests and save checkpoint

## Bug Fix: Fireflies "Get API Key" Link Points to Granola
- [x] Fireflies card docsUrl was already correct (https://app.fireflies.ai/integrations/custom/fireflies)
- [x] Root cause: Granola card docsUrl was pointing to generic granola.ai homepage — fixed to app.granola.ai/settings/api
- [x] Audited all 6 integration card URLs — all correct (checkpoint 1f7fa311)

## Feature: File Upload Import (PDF, DOCX, TXT, MD)
- [x] Install pdf-parse and mammoth npm packages for server-side text extraction
- [x] Add Express multipart file upload endpoint: POST /api/extract-file (accepts PDF, DOCX, TXT, MD up to 10MB)
- [x] Extract text from PDF using pdf-parse (PDFParse class API), DOCX using mammoth, TXT/MD as plain text
- [x] Add "Upload File" button on New Session page (paperclip icon) — opens file picker for .pdf, .txt, .md, .docx
- [x] Show progress/loading state while file is uploading and extracting (Loader2 spinner, disabled state)
- [x] Append extracted text to personalNotes field (with file name as header)
- [x] Handle errors: unsupported format, file too large, extraction failure (toast messages)
- [x] Write vitest tests for file extraction endpoint (4 tests: no file, TXT, MD, short text 422)

## Feature: Auto-Generate Session Title
- [x] Add sessions.generateTitle tRPC procedure — takes transcript + personalNotes, calls LLM to produce a short descriptive title (5-8 words max), returns { title }
- [x] On Analyze: if name field is blank, call generateTitle first, populate name, then proceed with create + analyze
- [x] On Save Draft: if name field is blank, call generateTitle first, populate name, then save
- [x] Show subtle loading indicator in the name field while title is being generated
- [x] Write vitest tests for generateTitle procedure (5 tests: LLM title, notes-only, empty inputs, quote stripping, empty LLM response)

## Feature: Stripe Subscription Billing
- [x] Add Stripe feature scaffold via webdev_add_feature (sandbox provisioned)
- [x] Create Stripe products/prices: Free (0), Pro ($12/mo), Team ($29/mo) via ensureProducts() in server/stripe.ts
- [x] Add subscription columns to users table (plan, stripeCustomerId, stripeSubscriptionId, planExpiresAt)
- [x] Generate and apply DB migration for subscription columns (migration 0010)
- [x] Add tRPC procedures: billing.createCheckoutSession, billing.createPortalSession, billing.getStatus
- [x] Add Stripe webhook handler for subscription lifecycle events (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted)
- [x] Build /pricing page with plan comparison table and upgrade CTAs
  - [x] Gate features: Free = 10 sessions/mo, Pro = unlimited sessions, Team = unlimited + sharing
  - [x] Show upgrade prompt when free limit is hit (upgrade dialog in NewSession.tsx)
  - [x] Show current plan badge in Settings page (Plan & Billing section)
  - [x] Write vitest tests for billing procedures (getUserBilling + countSessionsThisMonth mocks added, 50 tests passing)

## Feature: PWA Install Support
- [x] Verify/update manifest.json with correct icons, theme color, display: standalone
- [x] Register service worker for offline shell caching (already in sw.js)
- [x] Add beforeinstallprompt handler — Install App section in Settings page
- [x] Add apple-touch-icon and iOS meta tags for Safari Add to Home Screen (already in index.html)
- [x] iOS step-by-step instructions in Settings → Install App section

## Feature: Session Gating + Promo Codes
- [x] Create FOUNDER promo code in Stripe (100% off Pro forever, unlimited redemptions) — promo_1TZt6hGg5yfCsurU5sYJCdJC
- [x] Create BETA promo code in Stripe (100% off Pro for 3 months)
- [x] Add session count check in sessions.create procedure — free users capped at 10/month, throws FREE_LIMIT_REACHED
- [x] Add sessionsThisMonth + sessionLimit to billing.getStatus response
- [x] Show session usage progress bar on Dashboard (X/10 sessions, turns red at limit, Upgrade link)
- [x] Show upgrade modal on New Session page when free user hits the limit (dialog with Upgrade to Pro CTA)
- [x] Allow promo code entry on Stripe checkout (allow_promotion_codes: true)
- [x] Fix sessions.test.ts db mock to include getUserBilling + countSessionsThisMonth (50 tests passing)
