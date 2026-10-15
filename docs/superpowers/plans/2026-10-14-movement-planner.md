# Movement Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Execution method and this written plan require user review before implementation.

**Goal:** Deliver a private iPhone pilot that converts the founder's movement goals and videos into accepted, constrained plans and supports four ten-minute sessions per week.

**Architecture:** An Expo client captures inputs and runs sessions offline; a Fastify API owns private operations and versioned plan acceptance. Shared TypeScript domain code performs deterministic planning; Supabase stores records and durable work messages, and a bounded Cloud Run Jobs worker performs Gemini extraction. Every active-plan change is a user-accepted proposal.

**Tech Stack:** React Native, Expo, TypeScript, Expo Router, React Native components/design tokens, TanStack Query, expo-sqlite, Node.js, Fastify, Zod, Supabase Postgres/Auth/Storage/Queues, Cloud Run Jobs, Gemini, EAS Build/TestFlight.

**Spec:** `docs/superpowers/specs/2026-10-14-movement-planner-design.md`, supplemented by `movement-planner-mvp-spec.md` where not superseded.

## Global constraints

- Founder-only TestFlight pilot; no public launch or calendar integration.
- Priority order: GOATA/ankle stability, posture, release, planche; initial catalog focuses on the first three.
- Four flexible sessions of at most ten minutes each per week; ten available ten-minute windows over five days; 40 planned minutes within 100 available minutes.
- Duration includes setup, rest, and transitions; time ceilings do not establish exercise dosage.
- Catalog entries are source-backed, founder-approved, revisioned, and labeled curated. Approval is not expert review or evidence of effectiveness.
- Rules enforce restrictions, equipment, commitments, catalog bounds, and capacity. Gemini cannot activate a plan or invent programming bounds.
- No diagnosis, rehabilitation routines, automatic form assessment, or guaranteed physical outcomes. Exclude reported discomfort-provoking movements from new proposals.
- No obligation from an import; accept every plan change, workload increase, and recurring slot explicitly.
- Preserve interrupted work; no missed-session debt, automatic doubling, or escalating reminders.
- Delete successful uploads and temporary media; import deletion removes derived source content and prevents recreation by pending work.
- Accessibility includes scalable text, VoiceOver, non-color statuses, and controls independent of gestures.
- No cloud creation, account registration, deployment, paid media processing, or distribution happens during this planning task.

## Review focus

1. A proposal becomes invalid after an equipment/restriction change even when the active plan has not changed: acceptance checks input revision as well as plan version (Task 4).
2. A session spans midnight, daylight-saving changes, or an app restart: preserve work and use elapsed durations without duplicating sessions (Tasks 5–6).
3. A shared URL redirects to a private host or contains login material: do not expose credentials or fetch private networks (Tasks 7–8).
4. A worker crashes after committing extraction but before acknowledgment, or deletion races with extraction: retries must not duplicate or resurrect content (Tasks 8–9).
5. Account switch/sign-out leaves an offline cache or pending logs: never render or send one account's private records under another account (Tasks 1 and 6).

## Context, requirements, and planning assumptions

Inspected the original product spec, approved pilot design, and workspace. There is no application code, package manifest, Git repository, or existing CI. Paths below are proposed paths, not existing modules.

Critical requirements are the spec's 13 acceptance criteria: constrained proposals, catalog provenance, traceable imports, explicit acceptance, offline continuity, recovery/idempotency, adjustments, deletion, and accessibility. Reliability, ownership isolation, cost visibility, and truthful progress reporting are non-functional requirements. Rich analytics, Android, calendar support, catalog administration UI, uploaded-media replay, and public onboarding are deferred.

**Two questions have been sent to the founder:** API hosting (proposed Cloud Run service) and sign-in (proposed email one-time code). Until answered these remain provisional choices, not approvals. Any answer overrides the defaults below.

Proposed implementation defaults for plan review:

| Decision | Proposed default / execution gate |
|---|---|
| Workspace/tooling | npm workspaces; pin a supported Node LTS and stable Expo-compatible versions when execution starts; commit lockfile |
| API hosting | Cloud Run service; container listens on supplied PORT; confirm founder preference |
| Auth | Supabase email OTP; pre-create founder account, disable public signup; confirm preference and email delivery |
| Queue dispatch | API triggers a finite worker run after enqueue; scheduled reconciler launches runs for eligible queued/retry/cleanup work; confirm Cloud Scheduler as an additional integration |
| Capture | Supported native iOS share extension with App Group pending-capture storage; assess Expo's experimental implementation but avoid assuming unsupported foreground-opening behavior is durable |
| Initial media limits | One video per import; MP4/MOV, at most 5 minutes and 100 MiB; verify bytes/duration server-side; validate against founder samples before fixing limits |
| Retention | Delete successful media immediately; failed/incomplete media expires after 24 hours; cleanup sweeps every 15 minutes; never delete live worker input without cancellation/lease checks |
| Gemini | Billing-enabled API project for private content; provider file deletion in cleanup; select stable video-capable model after comparison, not from example model names |
| Cost controls | One concurrent extraction per founder; three transient processing attempts; record tokens/estimated charges and cap estimated AI spend at proposed US$10/month with explicit recovery; obtain budget agreement before paid processing |
| Sync | Local append-only log events with UUID IDs and increasing per-session sequence; server-authoritative plans; reject stale proposal/input versions |
| Observability | Structured operation IDs, status/latency/retry/cost events; no source text, media URLs, tokens, or private goal text in logs |

Budget limits are estimates and application controls, not a guarantee of provider billing. Provider safety logs and database backups may have separate retention; document verified limits before promising deletion. Exact cloud region, account identifiers, bundle identifiers, and store metadata are execution configuration, not guessed in this plan.

## Verified platform facts and implications

Checked official documentation on October 14, 2026. Reverify compatibility at implementation time.

- [Expo sharing](https://docs.expo.dev/versions/latest/sdk/sharing/): incoming sharing is experimental and its iOS main-app launch is described as unsupported by Apple. Gate shipping on the chosen supported extension design and device evidence.
- [Expo app extensions](https://docs.expo.dev/build-reference/app-extensions/): custom targets/config plugins and extension credentials need explicit build configuration. Use development builds and TestFlight, not Expo Go as sharing proof.
- [Apple Share extensions](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/Share.html): extensions must finish requests and prepare for termination. Keep capture short and persist first; extraction belongs on the server.
- [Supabase Queues](https://supabase.com/docs/guides/queues/quickstart) and [API](https://supabase.com/docs/guides/queues/api): the queue is pull-based; use a logged queue, visibility-based read and acknowledgment after durable work. Do not use destructive pop before processing or expose queue functions to mobile clients.
- [Cloud Run Jobs](https://docs.cloud.google.com/run/docs/execute/jobs): executions run tasks to completion rather than serve HTTP. Run bounded batches; persist retry/cleanup state outside the container. [Scheduled service invocation](https://docs.cloud.google.com/run/docs/triggering/using-scheduler) supports authenticated scheduled reconciliation.
- [Gemini Files](https://ai.google.dev/gemini-api/docs/files) and [delete API](https://ai.google.dev/api/files): delete provider uploads explicitly rather than relying on expiration. [Gemini terms](https://ai.google.dev/gemini-api/terms) distinguish paid/unpaid data use; use a billing-enabled project for private content and disclose limited provider safety retention.
- [Supabase OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless): OTP can avoid sign-in deep-link handling; configure code email templates and prevent automatic signup.
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/): exclusive async transactions offer explicit transaction scope; serialize local writes and test interruption recovery on device.

## File and responsibility map

```text
apps/mobile/app/                 Expo Router entry points and screens
apps/mobile/src/features/       auth, onboarding, plan, session, inbox, review
apps/mobile/src/local/          SQLite migrations, plan snapshots, outbox
apps/mobile/src/ui/             tokens and shared accessible controls
apps/mobile/modules/capture/    native iOS extension/App Group adapter
apps/api/src/features/          private-domain routes and services
apps/api/src/auth/              verified Supabase identity and ownership
apps/api/src/jobs/              enqueue/dispatch/reconciliation adapters
apps/worker/src/                media access, extraction, matching, cleanup
packages/contracts/src/         Zod wire schemas and inferred TS types
packages/domain/src/            planner, validation, provenance, review rules
packages/test-fixtures/         synthetic catalog/profile/media descriptors
supabase/migrations/            schema, RLS, transaction functions, queues
catalog/                       candidate sources and approved versioned entries
infra/                         API/worker containers and deployment definitions
tests/e2e/                     real-device scripts and acceptance evidence
docs/feasibility/               integration decisions and measured results
docs/pilot/                     protocol, baseline, scorecard, release checklist
```

No monolithic manager layer. Feature route/service/repository files remain together; planner is pure domain code and knows neither HTTP nor Gemini. Store credentials outside source control. Synthetic test records must never be loaded as an approved production catalog.

## Iterations and dependencies

| Iteration | Tasks | Reviewable result | Deferred |
|---|---|---|---|
| 1 — prove planning | 0–4 | Real founder sign-in, goals, curated coverage, accepted plan, Today/Plan | Guided execution, imports, adaptation |
| 2 — execute reliably | 5–6 | Four sessions can be followed offline and logged/synced | Video import and adaptation |
| 3 — import safely | 7–9 | Share/upload → traceable interpretation → accepted change; deletion works | Weekly adaptation |
| 4 — evaluate | 10–11 | Weekly review and a measurable two-week TestFlight pilot | Public launch and broader catalog |

Dependency chain: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11. Catalog research can progress during foundation work but actual personalized planning depends on approved coverage. Feasibility evidence can narrow or invalidate later integrations; do not silently substitute a different stack or omit required sharing.

## Shared contracts

Task 1 defines exported Zod schemas/types in `packages/contracts/src/{profile,catalog,plan,session,import,review}.ts`. IDs are UUID strings, durations are integer seconds, instants are ISO UTC strings, and availability uses local weekday/windows plus an IANA timezone.

- `ProfileInput`: goals, ordered priorities, equipment, restrictions, availability, commitments, timezone; saved with `inputRevision`.
- `CatalogRevision`: revision ID, goal associations, instructions, equipment/prerequisites, program bounds, restriction tags, duration components, sources/limitations, approval status. Define the programming-bound units from actual catalog requirements in Task 2; schema fixtures use explicit synthetic bounds.
- `PlannerInput`: profile, catalog revisions, active plan version, starting session cap, import/review intent if present.
- `PlanDraft`: sessions with pinned exercise revisions and duration components, active/deferred goals, reasons and constraint results.
- `Proposal`: ID, base plan version, input revision, catalog-set revision, proposed draft, change outcomes, time impact, status.
- `AcceptanceResult`: accepted with new plan version, or stale/invalid with focused reasons; never partial activation.
- `LogEvent`: event ID, account/session/plan IDs, per-session sequence, type, client timestamp, actual work/duration/difficulty/optional obstacle. Server deduplicates events; rejects conflicting ID reuse.
- `ImportRecord`: ID, source reference, source type, six-state processing status, attempt/cancellation generation, cleanup state.
- `Extraction`: statements/inferences/creator claims kept separate, movement/timestamp evidence, tentative catalog matches and unresolved questions.
- `ReviewSummary`: planned/completed/partial/fallback work, measures or unmeasured label, obstacles; `ReviewIntent` requests a proposed adjustment rather than mutating active work.
- `PlanVersion`: ID/version, accepted draft, acceptance instant, and pinned input/catalog revisions. `ConstraintViolation`: constraint code, affected IDs, and recovery input. `ProgressMeasure`: catalog-backed definition, founder confirmation, unit, and separately timestamped observations.
- `SessionSnapshot`: account/session/plan IDs, pinned guidance, step index, explicit execution state, elapsed seconds, recorded work and last saved instant. `LogAck`: event ID and stored/duplicate/rejected status with rejection reason.
- `CaptureInput`: tagged URL or private video descriptor; `AuthorizedMedia`: validated import ID, worker-readable temporary path, MIME type and measured duration/bytes. `MatchResult`: extracted activity/evidence IDs, candidate revision IDs and matched/ambiguous/unknown status. `ProcessingOutcome`: ready/needs-clarification/inaccessible/failed with durable result ID or reason. `CleanupResult`: pending/complete with per-copy receipts. `ProposalIntent`: initial, edit, import (import ID), or review (ReviewIntent), always associated with current input revision.

Task 1 must define every exported field consumed below. Task 2 finalizes catalog-specific units before planner work; update related schemas/tests together. API Zod validation and domain validation are separate checks, not alternatives.

## Verification convention

Each code task follows failing meaningful test → confirm expected failure → minimal implementation → passing targeted tests/typecheck → focused review and local commit. Commands below are scripts to create in Task 1, not commands claimed to have run. Vitest covers domain/API/worker integration with a local test database; mobile tests use Jest plus React Native Testing Library, with real-device checks for SQLite, native capture, reminders, and accessibility. Never infer native reliability from mocked tests.

`npm run test:domain -- <file>`, `npm run test:api -- <file>`, `npm run test:worker -- <file>`, and `npm run test:mobile -- <file>` forward arguments to their workspace runners. `npm run typecheck` covers all TS workspaces; `npm run check` runs lint, typecheck, and automated tests. Database integration checks require local Supabase and explicitly fail if unavailable. Git initialization/commits occur only during separately authorized execution; the workspace currently has no Git repository.

### Task 0: Resolve feasibility and execution inputs

**Value/dependencies:** Prevent investing in an import path or job design that cannot ship. Requires founder source URLs/clips, iPhone access, and selected account configuration; no production catalog needed.
**Files:** `docs/feasibility/{capture,video-extraction,queue-jobs,privacy-cost}.md`; isolated disposable probe under `probes/` only after execution authorization.
**Interfaces:** Consume official docs and representative samples; produce supported capture strategy, model/config selection, media limits, dispatch/lease design, retention/cost decisions, and pass/fail evidence.

- [ ] Record answers to hosting/auth questions and obtain agreement on proposed extra integration, retention, media, and cost defaults before creating resources.
- [ ] Assemble ten representative clips/links spanning supported movement, variation ambiguity, multiple movements, narration mismatch, and inaccessible/private sources; document expected identifiable content with founder input. Do not imply these annotations are exercise review.
- [ ] Prove capture in foreground/background/cold start, extension termination, and offline using a development build; persist captures before completion and upload on app resume. Verify the selected native design against current Apple APIs as well as its archived guide.
- [ ] Compare stable Gemini candidates for schema-valid extraction, traceability, correction effort, latency, and cost. Proposed gate: at least 8/10 expected cases handled correctly, including all inaccessible cases; zero caption-only analysis claims. Founder confirms threshold before evaluation.
- [ ] Prove enqueue → bounded worker claim → durable result → acknowledgment, crash recovery, and provider/storage cleanup; document supported video access paths and unsupported links requiring upload.
- [ ] Review evidence and update dependent task contracts if necessary. No prototype proves physical suitability. Keep unsuccessful probes clearly disposable.

**Gate:** Founder-approved execution settings and measured feasibility report; if sharing/extraction fails, return a concrete narrowed proposal for decision before dependent work.

### Task 1: Sign in and save the founder's profile end to end

**Files:** root workspace/config/lockfile; `apps/mobile/app/{_layout,sign-in,onboarding}.tsx`; `apps/mobile/src/features/auth/session.ts`; `apps/mobile/src/ui/tokens.ts`; `apps/api/src/{app,auth/identity,features/profile/routes}.ts`; contracts files above; `supabase/migrations/001_profile.sql`; `infra/api/Dockerfile`; `.github/workflows/check.yml`.
**Tests:** `apps/api/test/profile.test.ts`, `apps/mobile/test/auth.test.tsx`, `supabase/tests/profile_isolation.sql`.
**Interfaces:** `saveProfile(userId: string, input: ProfileInput, expectedRevision: number): Promise<{inputRevision: number}>`; authenticated `GET/PUT /v1/profile`; initialize shared contract exports.

- [ ] Write tests asserting unauthenticated save returns 401, another account cannot read/write founder data, invalid availability returns 422, stale profile edit returns 409, sign-out clears rendered private state, and successful save increments input revision.
- [ ] Create runnable workspace, runners and CI; run targeted profile/auth tests to confirm those behavioral failures, rather than counting missing dependencies as useful failure evidence.
- [ ] Implement verified identity, owner-scoped persistence and chosen sign-in, tokens in secure device storage, basic calm UI, profile validation and contract exports. Keep privileged DB/provider credentials server-only.
- [ ] Run targeted API/mobile/isolation checks and typecheck; demonstrate sign-in → persisted profile → app restart. Only during authorized execution, verify a staging API container and development build using actual chosen host.
- [ ] Review privacy/session teardown and commit the slice locally.

**Safety/gate:** No public signup; invalid edits preserve prior profile. Establish empty onboarding and permission-denied recovery before planning.

### Task 2: Publish a small, auditable catalog for the pilot

**Files:** `catalog/{sources.md,candidates.json,approved.json}`; `packages/contracts/src/catalog.ts`; `packages/domain/src/catalog/eligibility.ts`; `apps/api/src/features/catalog/{repository,routes}.ts`; `supabase/migrations/002_catalog.sql`.
**Tests:** `packages/domain/test/catalog.test.ts`, `apps/api/test/catalog.test.ts`.
**Interfaces:** `isSchedulable(revision: CatalogRevision): boolean`; `listApprovedCatalog(): Promise<CatalogRevision[]>`; `GET /v1/catalog`; explicit local approval/import command, no admin UI.

- [ ] Research candidate sources with provenance, supported variations/associations, limitations, programming units and rights to instructions/demonstrations. Ask founder to approve actual entries; do not guess exercises or dosage from this plan.
- [ ] Write eligibility tests: unapproved revision, missing bounds, unsupported goal association and fabricated review status are ineligible; approved revision stays immutable after publication.
- [ ] Run domain/API catalog tests to observe expected failures; finalize actual bound units in the schema and synthetic fixtures.
- [ ] Implement versioned catalog ingestion/eligibility and founder-readable sources/limitations. Obtain enough accepted coverage to construct the initial four sessions; if unavailable, show reduced coverage and defer unsupported goals.
- [ ] Run tests/typecheck, inspect loaded records against source material and founder approvals, and commit without private videos or synthetic production content.

**Safety/gate:** Removing approval blocks new proposals; existing revision history remains auditable. No personalized planner until usable catalog exists.

### Task 3: Generate constrained, explainable plan drafts

**Files:** `packages/domain/src/planner/{buildPlan,validatePlan,explain}.ts`; `packages/test-fixtures/{catalog,profiles}.ts`; `packages/domain/test/planner.test.ts`.
**Interfaces:** `buildPlan(input: PlannerInput): PlanDraft`; `validatePlan(input: PlannerInput, draft: PlanDraft): ConstraintViolation[]`; deterministic typed reasons for exclusion/deferral/allocation.

- [ ] Write tests asserting at most four starting sessions, each at most 600 seconds, total at most 2400 seconds, no unavailable/equipment-restricted movement, no unapproved revision, setup/rest included, shared time counted once, and physical-load bounds respected across existing commitments.
- [ ] Add tests for zero availability, insufficient capacity, unknown commitment overlap, missing prerequisites, explicit priority overrides, supported goal overlap only, and lower plan size when catalog coverage is insufficient. Run to expected failures.
- [ ] Implement deterministic priority allocation and constraint validation using catalog units from Task 2; prefer simple bounded search/greedy allocation with stable tie-breaking, no claim of optimality. Reasons come from recorded decision events.
- [ ] Run domain tests/typecheck and demonstrate founder profile → draft with deferred interests and honest uncertainty. Property tests verify hard constraints across varied budgets and restrictions, not generated explanation wording.
- [ ] Review programming assumptions, constraint coverage and time accounting; commit the domain slice.

**Safety/gate:** Failure yields unmet constraints and no activation. No AI-created instructions/bounds. Weekly increases are not unlocked by spare time alone.

### Task 4: Accept proposals and view the active plan

**Files:** `apps/api/src/features/plan/{service,routes}.ts`; `apps/api/src/jobs/planning.ts`; `supabase/migrations/003_plans.sql`; `apps/mobile/app/(tabs)/{_layout,today,plan}.tsx`; `apps/mobile/src/features/plan/api.ts`.
**Tests:** `apps/api/test/plan-acceptance.test.ts`, `apps/mobile/test/plan.test.tsx`.
**Interfaces:** `requestProposal(userId: string, intent: ProposalIntent): Promise<{proposalId: string}>`; `acceptProposal(userId: string, proposalId: string): Promise<AcceptanceResult>`; `POST /v1/proposals`, `GET /v1/proposals/:id`, `POST /v1/proposals/:id/accept`, `GET /v1/plan`. Define `ProposalIntent` as initial/edit/import/review discriminated union in contracts; later tasks supply their intent payloads.

- [ ] Write integration tests: rejected stale plan/input/catalog revisions, atomic acceptance under concurrent requests, retrying accepted proposal returns same result, async failure preserves current plan, and unaccepted proposal never appears as active work.
- [ ] Run failing API tests; mobile tests assert explicit Accept action, visible assumptions/time impact, editable priority/deferred goals, pending/empty/failure states, and regeneration after 409.
- [ ] Implement durable asynchronous proposal requests using queue/dispatch seam from Task 0, planner adapter, atomic database acceptance and UI. Check freshness and constraints inside the acceptance transaction with locked version rows.
- [ ] Run API/mobile/typecheck and demonstrate profile → proposal → acceptance → Today/Plan, including an input change between creation and acceptance.
- [ ] Review transaction/idempotency semantics and commit the vertical slice.

**Safety/gate:** Old plan remains usable while proposals run; do not activate offline. Plan withdrawals and restrictions prevent affected starts pending replacement; user reports can stop a session immediately without waiting for a new plan.

### Task 5: Follow a session and preserve interrupted work

**Files:** `apps/mobile/app/session/[id].tsx`; `apps/mobile/src/features/session/{controller,view}.tsx`; `apps/mobile/src/local/{database,migrations,sessionStore}.ts`; `apps/api/src/features/session/routes.ts`.
**Tests:** `apps/mobile/test/session.test.tsx`; `tests/e2e/session-device.md`.
**Interfaces:** `saveSessionProgress(snapshot: SessionSnapshot): Promise<void>`; `restoreSession(sessionId: string): Promise<SessionSnapshot | null>`; `appendLocalLog(event: LogEvent): Promise<void>`; snapshot schema pinned to session/plan/catalog revision.

- [ ] Write tests: timer finish does not complete exercise, stopping preserves partial work, discomfort excludes affected movement from continued guidance and sends a restriction update when online, fallback remains distinct, and missing media still shows saved text.
- [ ] Run to expected failures; add assertions for restart/midnight continuity and actual-versus-planned duration separation.
- [ ] Implement explicit start/pause/modify/stop/complete controls, guidance, approved fallback selection and durable snapshots/events in a single local transaction. Use monotonic elapsed time while running and durable timestamps for interrupted recovery; never count background wall time as performed work automatically.
- [ ] Run mobile/typecheck and a real-iPhone offline/force-quit/resume test. Verify VoiceOver, large text, reachable controls and clear instruction sources.
- [ ] Review continuity and truthful logging; commit.

**Safety/gate:** Saved instructions are independent of deleted private videos. Unsupported modification offers stop/skip or a separately validated proposal, not invented exercises.

### Task 6: Sync completed work without duplicates and send optional reminders

**Files:** `apps/mobile/src/local/{outbox,planCache}.ts`; `apps/mobile/src/features/session/sync.ts`; `apps/mobile/src/features/plan/reminders.ts`; `apps/api/src/features/logs/{routes,service}.ts`; `supabase/migrations/004_logs.sql`.
**Tests:** `apps/api/test/logs.test.ts`, `apps/mobile/test/{sync,reminders}.test.ts`; `tests/e2e/offline-sync.md`.
**Interfaces:** `pushLogEvents(userId: string, events: LogEvent[]): Promise<LogAck[]>`; `syncOutbox(accountId: string): Promise<void>`; `POST /v1/logs/batch`; ack only durably stored IDs. Snapshot refresh never erases unsynced events.

- [ ] Write tests for network failure after server commit, replayed event IDs, conflicting reused IDs, out-of-order session sequences, expired auth, wrong-account outbox, and sign-out cleanup. Assert one logical completion and preserved unsent work.
- [ ] Run expected failures; reminder tests verify permission denial recovery, no reminders for unaccepted recurring slots, no duplicate notification on retry, and local wall-clock behavior across timezone/DST changes.
- [ ] Implement serialized SQLite outbox writes, immutable event ingestion/deduplication, ordered materialization, account isolation and foreground/resume sync. Do not promise OS-guaranteed background sync. Reconcile local reminders after accepted plan changes and permission changes.
- [ ] Run automated checks and real-device airplane-mode → completion → force-quit → reconnect → retry → single server log demo. Validate notification times in timezone change tests.
- [ ] Review data loss/cross-account risks and commit.

**Safety/gate:** Sign-out asks about unsynced work and blocks destructive local purge until the user chooses sync or discard; account deletion overrides this with explicit deletion semantics.

### Task 7: Save shared URLs and uploaded clips into an inbox

**Files:** `apps/mobile/modules/capture/{ios/ShareViewController.swift,ios/CaptureStore.swift,index.ts,app.plugin.js}`; `apps/mobile/app/{+native-intent,handle-share}.tsx`; `apps/mobile/app/(tabs)/inbox.tsx`; `apps/mobile/src/features/inbox/capture.ts`; `apps/api/src/features/imports/{routes,upload}.ts`; `supabase/migrations/005_imports.sql`.
**Tests:** `apps/api/test/import-capture.test.ts`, `apps/mobile/test/inbox.test.tsx`; `tests/e2e/share-device.md`.
**Interfaces:** `captureImport(input: CaptureInput, idempotencyKey: string): Promise<ImportRecord>`; `POST /v1/imports`, `POST /v1/imports/:id/upload`, `POST /v1/imports/:id/confirm-upload`, `GET /v1/imports`; `CaptureInput` is URL or video descriptor with private source ownership.

- [ ] Write tests: immediate saved record, repeated transport request returns same record, duplicate source offers existing item rather than new obligations, wrong-owner upload is rejected, unsupported/oversized clip is rejected, and failed upload keeps its source and allows retry.
- [ ] Run to failures; test malformed shared text, URL query credentials, offline capture, canceled extension and missing login without losing pending input. Preserve raw private source where needed but redact credentials from display/logs and never fetch URLs with embedded credentials.
- [ ] Implement Task 0's supported native capture strategy, App Group pending items and main-app import queue, direct picker, constrained upload authorization and six-state inbox UI. File upload completion enqueues processing atomically with record state.
- [ ] Run checks plus real-device cold/background/offline share tests for actual source apps and a MOV/MP4 clip. Document unsupported source behavior as upload recovery.
- [ ] Review extension termination/data lifetime and commit.

**Safety/gate:** No social credentials or unrestricted scraping. A URL capture may be inaccessible; it still remains an inbox item.

### Task 8: Process media into evidence-linked interpretations

**Files:** `apps/worker/src/{main,claim,mediaAccess,gemini,extract,match}.ts`; `apps/api/src/jobs/{dispatch,reconcile}.ts`; `infra/{worker/Dockerfile,cloud-run.yaml}`; `supabase/migrations/006_processing.sql`.
**Tests:** `apps/worker/test/{processing,media-access,matching}.test.ts`; `docs/feasibility/video-extraction.md` updated with measured evidence.
**Interfaces:** `processImport(importId: string, generation: number): Promise<ProcessingOutcome>`; `extractVideo(media: AuthorizedMedia): Promise<Extraction>`; `matchExtraction(extraction: Extraction, catalog: CatalogRevision[]): MatchResult[]`; provider and fetch adapters injected for tests. Queue messages contain IDs/generation, never source text/media.

- [ ] Write tests for valid evidence timestamps, separately labeled claims/inferences, ambiguous variants, unknown movement, inaccessible media, invalid model JSON, forged prompt instructions in video, transient retry, expired lease, and crash after durable result before acknowledgment.
- [ ] Run to expected failures; test SSRF protection at DNS resolution and every redirect, allowed HTTPS targets only, bounded downloads, private/loopback/metadata blocks, unsupported platform access, and real-byte/duration validation.
- [ ] Implement finite worker batches using visibility reads and renewable processing leases, durable retry generation, validated Gemini output and catalog matching. Unknown/ambiguous output becomes needs clarification, not trusted programming. Retry transient failures at most three attempts; permanent errors have explicit recovery. Keep cloud retries and queue attempts coordinated.
- [ ] Run worker/API/typecheck, Task 0 sample evaluation and bounded crash-recovery demo. Match proposals never schedule unapproved revisions; lease expiry does not authorize a stale worker to commit.
- [ ] Review source/provenance boundaries, actual cost metrics and dispatch reconciliation; commit.

**Safety/gate:** Persist extraction before acknowledgment, and check import/account tombstones and generation inside the commit transaction. No model instructions can override system constraints or call arbitrary tools.

### Task 9: Accept useful import changes and enforce deletion

**Files:** `apps/api/src/features/imports/{interpretation,proposal,deletion}.ts`; `apps/worker/src/cleanup.ts`; `apps/mobile/src/features/inbox/{interpretation,proposal}.tsx`; `apps/api/src/features/account/deletion.ts`; `supabase/migrations/007_deletion.sql`.
**Tests:** `apps/api/test/{import-proposals,deletion}.test.ts`, `apps/worker/test/cleanup.test.ts`.
**Interfaces:** `requestImportProposal(userId: string, importId: string): Promise<{proposalId: string}>` via Task 4; `deleteImport(userId: string, importId: string): Promise<{deletionId: string}>`; `deleteAccount(userId: string): Promise<{deletionId: string}>`; `cleanupMedia(importId: string): Promise<CleanupResult>`; `DELETE /v1/imports/:id`, `DELETE /v1/account`.

- [ ] Write tests for add/replace/defer/duplicate/no-fit, correction without implied approval, visible time impact, stale acceptance, deletion during processing, result-before-cleanup crash, provider-delete failure, and deleted source text leaking into proposals/history.
- [ ] Run to failures; assert successful interpretation can be ready while cleanup remains pending internally, cleanup retries eventually remove all copies, and pending upload TTL does not race a live lease.
- [ ] Implement user correction/clarification and Task 4 proposal intent, atomic tombstone/cancel invalidation, cleanup receipts for Storage/provider/local temporary copies, and derived-content removal. Clear app caches and capture buffers on import/account deletion; regenerate pending proposals stripped of deleted evidence.
- [ ] Run integration and device checks: import → interpretation → proposed change → accept; then delete and confirm no private source content is reachable or recreated. Document backup/provider retention separately from immediate active-data removal.
- [ ] Review deletion completeness, unlink semantics for independent public catalog data, and commit.

**Safety/gate:** Import deletion preserves source-free completed work and catalog instructions where independent; account deletion removes private work as well. No uploaded-video replay UI after successful processing.

### Task 10: Review the week and propose adjustments

**Files:** `packages/domain/src/review/{summarize,suggest}.ts`; `apps/api/src/features/review/{routes,service}.ts`; `apps/mobile/app/(tabs)/review.tsx`; `supabase/migrations/008_review.sql`.
**Tests:** `packages/domain/test/review.test.ts`, `apps/api/test/review.test.ts`, `apps/mobile/test/review.test.tsx`.
**Interfaces:** `summarizeWeek(plan: PlanVersion, logs: LogEvent[], measures: ProgressMeasure[]): ReviewSummary`; `suggestAdjustment(summary: ReviewSummary, input: PlannerInput): ReviewIntent`; `GET /v1/review?week=...`, `POST /v1/review/proposals`, using Task 4 acceptance.

- [ ] Write tests that partial/fallback/full work remain distinct, timer-only events do not count as completion, absent measures show unmeasured, optional feedback never blocks use, and completion is not reported as physical progress.
- [ ] Run expected failures; add cases for repeated time/difficulty/forgot/discomfort obstacles, sparse observations, preferred time versus observed completion, and no automatic recurring commitment or workload increase.
- [ ] Implement summaries and deterministic obstacle-linked suggestions: simplify/reduce/re-time within bounds; propose recurring slots only with actual observations and preference confirmation; never move a confirmed slot silently. Add user-confirmed catalog-supported progress measures where available.
- [ ] Run domain/API/mobile checks; demonstrate missed session → optional reason → review → editable proposal → explicit acceptance with full-week revalidation.
- [ ] Review explanation evidence and humane copy; commit.

**Safety/gate:** No fixed-schedule countdown or mandatory feedback. Lower adherence does not automatically increase reminders or intensity.

### Task 11: Verify the complete private pilot and distribute after authorization

**Files:** `apps/mobile/{app.config.ts,eas.json}`; `tests/e2e/pilot.md`; `docs/pilot/{protocol,baseline,scorecard,release-checklist}.md`; `infra/README.md`.
**Interfaces:** Consume all prior slices; produce TestFlight candidate, recorded acceptance evidence, pilot protocol and founder-visible scorecard. This task does not imply that a two-week experiment can finish in a coding session.

- [ ] Agree numerical pilot thresholds before collecting pilot results. Proposed: at least 6 of 8 planned sessions completed in full or as explicitly recorded fallback, median manual planning/correction at most 10 minutes/week, at least 80% of attempted sessions within 2 minutes of estimates, and week-two overwhelm no worse than baseline on a 1–5 scale. Record fallback/full separately; founder confirms targets and defines baseline first.
- [ ] Run `npm run check` and a clean local database migration/reset test. Repeat only on new changes or failures. Check CI, secret exclusion, database ownership tests and deployment rollback instructions.
- [ ] Execute real-iPhone acceptance script spanning goals/plan, sharing/upload, async recovery, force-quit/offline logging, stale proposal, discomfort exclusion, deletion, timezone/reminders, VoiceOver and largest supported text. Include at least one denied permission and network-loss case per integration.
- [ ] Review all 13 design acceptance criteria with concrete evidence; unresolved data loss, constraint violation or deletion failure blocks distribution. Pin native/runtime compatibility and build metadata.
- [ ] Once immediate distribution is explicitly authorized, create staging/production configuration as appropriate, build with EAS and submit to TestFlight; confirm account/bundle/signing settings and preserve previous deployable versions. Do not claim deployment from a plan or a simulator run.
- [ ] Run the two-week founder pilot, collect metrics without private raw content in analytics, and decide retain/simplify/expand from results. Broader launch requires new catalog-validation and multi-user planning decisions.

## Coverage and review ledger

| Design acceptance criterion | Owning tasks |
|---|---|
| 1: goals and constrained editable proposal | 1, 3, 4 |
| 2: approved source-backed revision, uncertain unscheduled | 2, 3, 8 |
| 3: rules and actual explanations | 3, 4, 10 |
| 4: traceable extraction and inaccessible recovery | 0, 7, 8 |
| 5: import outcomes and explicit acceptance | 4, 9 |
| 6: stale/retry protection | 4, 6, 8, 9 |
| 7: offline partial work and sync | 5, 6 |
| 8: no debt/unaccepted increases | 3, 5, 10 |
| 9: acceptance for recurrence/adjustments | 4, 6, 10 |
| 10: discomfort exclusion and non-rehabilitation scope | 1, 3, 5, 10 |
| 11: successful media cleanup/retry | 8, 9 |
| 12: deletion/in-flight protection | 7, 9 |
| 13: accessibility | 1, 4, 5, 7, 10, 11 |

Review each slice before dependent work; broader review at iteration boundaries examines integrated effects. Roll back code/container versions without reversing destructive deletion or dropping logged work. Use additive database migrations and compatible clients until the private pilot can safely upgrade; do not treat destructive database resets as production rollback.

## Risks and blocking inputs

- Share-extension/device access, EAS signing and Apple distribution access can block Task 0/11. No request for credentials in chat; use provider authentication flows during authorized execution.
- Social URLs may not permit bytes access. Upload recovery is mandatory; do not promise support for an unverified platform.
- Real catalog provenance/bounds and founder approval block personalized scheduling, even if all software tests pass.
- Queue leases, dual cloud retries and scheduled dispatch require measured recovery behavior; bounded jobs cannot substitute for an assumed persistent consumer.
- AI extraction errors are expected. Schema validation does not establish semantic accuracy; confidence/clarification and sample evaluation are required.
- Deletion spans app caches, provider files, storage, workers, derived records and backups. Record real capabilities and avoid promises beyond verified control.
- Budget/retention/media thresholds and pilot targets above are proposals to confirm, not prior founder decisions. Hosting/auth answers must be incorporated before executing their slices.

## Handoff and next event

Planning deliverable only; no application implementation has begun. The approved design is the authority, with explicit proposed defaults in this plan awaiting review. Next: founder reviews this plan and confirms the remaining defaults and execution approach. Recommend native execution initially because the tasks depend strongly on shared contracts and one continuous founder pilot; reserve independent review for meaningful gates. Subagent execution is available if explicitly chosen, but no delegation occurred during planning.

After review, use `superpowers:executing-plans` for native execution or `superpowers:subagent-driven-development` for the chosen delegated workflow; project implementation must start with Task 0 and appropriate context/verification skills. Final completion/distribution requires evidence and explicit immediate delivery authorization.
