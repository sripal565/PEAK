# Movement Planner — private pilot design

Date: October 14, 2026
Status: Written design approved by the founder on October 14, 2026; implementation planning authorized.
Modes: product, UX, and technical planning.

## Purpose and authority

Help the founder turn movement interests, saved videos, and existing training commitments into a manageable week with less manual planning. The first audience is the founder alone, distributed through TestFlight. This design supplements `movement-planner-mvp-spec.md`; the explicit pilot changes below supersede conflicting requirements in that document. Other requirements remain in effect.

Success means usable imports, realistic sessions, reduced planning effort, and useful weekly adjustments. Session completion does not establish physical improvement. The two-week pilot measures usability and adherence, not long-term effectiveness.

## Approved pilot changes

- Use a source-backed catalog curated with the founder and explicitly approved by the founder for private-pilot use. Label entries **curated**, not expert-reviewed. Preserve sources, limitations, approval identity, and revision. Founder approval is not professional review. Revisit the catalog validation standard before wider distribution.
- A therapist assessment is not an onboarding requirement. Support general movement goals and recorded discomfort or instability without claiming diagnosis, treatment, injury rehabilitation, or guaranteed safety. Exclude movements reported to provoke discomfort and regenerate affected proposals; do not generate rehabilitation substitutes. Relevant restrictions remain hard constraints.
- Prioritize GOATA and ankle stability, then posture, release work, and planche. GOATA is a preferred method, not itself a measurable outcome. Initial catalog coverage focuses on the first three; retain planche as a deferred interest unless appropriate catalog coverage and capacity exist.
- Start with four flexible sessions of at most ten minutes each per week. Available capacity is ten ten-minute windows: morning and evening on five days, totaling 100 minutes. The initial planned ceiling is 40 minutes; these ceilings do not prescribe exercise dosage. Catalog programming bounds and other commitments can produce a smaller plan.
- Keep scheduling inside the app with optional local reminders. Calendar integration is outside pilot scope.
- Delete uploaded media after successful processing. Retain the source link and extracted interpretation until import deletion. Deleting an import also deletes derived source content.

## Technology direction

| Layer | Selected technology | Ownership |
|---|---|---|
| Mobile | React Native, Expo, TypeScript | Capture, UI, guided execution, local continuity |
| Navigation | Expo Router | Onboarding, tabs, sessions, deep links |
| UI | React Native components and shared tokens | Consistent typography, spacing, color, accessibility |
| Server state | TanStack Query | API fetching, caching, mutations |
| Local persistence | expo-sqlite | Saved plan instructions, session state, completion-log outbox |
| API | Node.js, Fastify, Zod | Authentication checks, domain operations, validation |
| Database/auth/files | Supabase Postgres, Auth, Storage | Private records, public catalog, authentication, temporary media |
| Background processing | Supabase Queues and container worker | Durable processing and retries |
| Worker hosting | Google Cloud Run Jobs | Containerized media processing |
| Video interpretation | Gemini API initially | Evidence-linked extraction evaluated on founder videos |
| Distribution | EAS Build and TestFlight | iPhone development and private beta |

These are selected technologies, not verified platform feasibility claims. Verify current primary documentation before specifying integrations. Expo sharing may require native iOS code and development builds; determine the supported implementation during feasibility work. Verify queue-to-worker dispatch and job lifecycle rather than assuming a worker can run indefinitely.

## Boundaries and data flow

The client captures goals, availability, restrictions, gym/sports commitments, and imports. It renders accepted plan snapshots and saves session progress locally. TanStack Query caching does not replace durable offline session storage.

The API is the authority for private-domain operations, catalog approval, proposal generation, plan acceptance, and deletion. Validate authentication and ownership on every operation. Keep database access policies consistent with these boundaries; client storage uploads must use constrained authorization.

The import pipeline saves an inbox record before starting work, receives authorized media, and dispatches retryable processing. Gemini extracts identifiable movements, instructions, timestamps where supported, equipment, and creator claims. Store source statements separately from inference and app recommendations. Match against catalog revisions, retaining uncertainty and meaningful variations.

The rules-led planner receives structured inputs and approved catalog revisions. It selects a manageable active set, allocates sessions within availability and programming constraints, and returns a version-bound proposal with reasons and time impact. Model output cannot directly activate a plan. Constraint failures preserve the current plan and identify the input requiring correction.

Acceptance atomically checks the proposal's base plan version and constraints. Reject stale acceptance and regenerate against current inputs. Imports never automatically create obligations. Repeated processing and repeated client requests must not duplicate imports, logs, or scheduled work.

Core records remain those in the original spec, with catalog curation/approval provenance and processing/deletion status added. Completion logs record actual work separately from planned sessions. Pin scheduled exercises to catalog revisions. A deleted private source cannot remain in extraction text, private media, or evidence attachments; retain only independent public catalog information and source-free session history where applicable.

## Catalog and planning

Each usable catalog revision needs identity, supported variations, instructions, equipment, goal associations, prerequisites, programming bounds, restrictions, demonstration provenance, sources, limitations, curation approval, and revision. Missing bounds or unresolved suitability prevents scheduling; founder approval must not manufacture evidence.

Research candidate sources together and document supported associations. Do not assume that GOATA improves ankle stability, sports performance, or posture solely because the founder prefers it or a creator claims it. Separate identification, suitability, and programming. Keep uncertain or unsupported imports saved outside the active plan.

Include setup, rest, and transitions in the ten-minute duration. Count shared activity time once, but account for physical demand across relevant commitments. Ask for minimum relevant gym/sports details when overlap is uncertain. If requirements exceed capacity, explain deferral or reduced scope; never silently exceed the budget.

Collect actual duration, perceived difficulty, optional obstacles, and preferred timing. Weekly review may propose simplification, different timing, recurring slots, or workload changes. All changes require acceptance; workload increases also require catalog bounds. Missed sessions create no debt. Shorter fallbacks need their own approved programming and remain distinct in reports.

## Experience and states

Use a calm planner with restrained colors, readable cards, generous spacing, and minimal progress decoration. Today emphasizes one next action. Do not use guilt, streak loss, or fabricated progress scores.

| Surface | Main behavior |
|---|---|
| Onboarding | Gather goals, equipment, experience, restrictions, availability, commitments, and start cues; ask only material missing questions |
| Today | Next session, purpose, estimated duration, start action, and available fallback |
| Inbox | Sources, processing states, interpretation, uncertainty, and proposed changes |
| Plan | Weekly commitments, active/deferred goals, reasons, and edits |
| Review | Planned/completed/fallback work, obstacles, supported progress measures, and proposals |
| Guided session | Instructions, accessible demonstrations, timers/logging, pause/modify/stop/complete; preserve partial work |

- Happy: show the accepted plan and actionable next session; distinguish a proposal from active work.
- Empty: invite goals or an import without fabricating personalization.
- Pending: expose queued/processing/proposal progress; safe to leave and return.
- Failed: preserve source/current plan; offer retry, upload recovery, or a focused constraint correction.
- Edge: show insufficient capacity, uncertain matches, source-access failure, and stale proposals explicitly.
- Offline: expose locally saved instructions and session state, mark unavailable media, and queue logs for sync. Server-authoritative proposal acceptance requires connectivity.

Support scalable text, VoiceOver labels, statuses independent of color, and alternatives to gesture-only controls. Timer completion is not exercise completion. Notifications are optional and support explicit commitments; repeated misses do not automatically escalate reminders.

## Media and privacy

Private content is private by default. Do not collect third-party social credentials. A shared URL is not evidence that video bytes are accessible; retain the link and request upload when necessary. Do not claim video analysis from a caption or thumbnail.

Successful processing means the interpretation and its permitted extracted evidence are durably stored. Then delete the uploaded video and any temporary processing copies, tracking cleanup failures for retry. The pilot provides no replay guarantee for deleted uploads; source links and independently available catalog demonstrations are the viewing path.

The implementation plan must specify bounded retention for pending/failed uploads, provider-side handling, backup deletion behavior, and media limits before upload capability is enabled. Privacy copy must accurately describe those choices. Deletion must cancel or invalidate in-flight work so it cannot recreate deleted content.

## Scope and alternatives

In scope: a single-user pilot with an account/sync foundation, source-backed catalog, rules-led proposals, sharing/upload feasibility, offline execution, reminders, weekly review, and data deletion.

Out of scope: calendar integration, public launch, social features, automated form assessment, unrestricted generated programming, rehabilitation, full strength/plyometric program generation, and automatic plan changes.

Native iOS and Flutter were alternatives; the founder selected Expo/TypeScript. Rules-led planning was preferred to whole-plan AI generation for constraint enforcement and traceable decisions. A curated catalog was preferred to fully dynamic programming. In-app scheduling avoids calendar integration for the pilot. Deleting processed media reduces retained private media but sacrifices uploaded-video replay.

## Delivery sequence and gates

1. **Feasibility:** verify iPhone sharing/capture, permitted URL access and upload fallback, Gemini extraction on representative founder videos, queue dispatch to Cloud Run Jobs, media deletion, and Expo development-build requirements. Produce an evidence-backed decision for each integration before scaffolding dependent functionality.
2. **Catalog and foundation:** research and approve a small useful coverage set; establish domain records, authentication, private storage access, versions, and source provenance. No claim of complete goal coverage.
3. **Planning vertical slice:** onboarding through rules-led proposal acceptance to Today/Plan, including constraint failure and stale acceptance.
4. **Execution:** guided sessions, locally saved instructions, interruption recovery, log outbox, optional reminders, and shorter fallbacks where supported.
5. **Imports:** inbox lifecycle, extraction/matching, clarification, accepted plan changes, retries, duplicate prevention, and cleanup/deletion.
6. **Review:** report work and outcomes separately; propose obstacle-based changes and recurring slots with explicit acceptance.
7. **Private pilot:** TestFlight distribution and a two-week evaluation after end-to-end verification.

## Acceptance criteria

1. Founder enters prioritized goals without composing routines and receives an editable proposal within both recorded availability and the four-session starting ceiling.
2. Each scheduled exercise resolves to a founder-approved, source-backed catalog revision with usable bounds; unsupported imports remain unscheduled.
3. Rules enforce equipment, restrictions, commitments, and programming bounds; explanations reflect actual decisions.
4. Supported video extraction is traceable; inaccessible video offers upload recovery without falsely claiming analysis.
5. Import proposals show add/replace/defer/duplicate/no-fit outcomes, time impact, and affected goals; no active-plan change precedes acceptance.
6. Stale acceptance cannot overwrite newer plans, and retries cannot duplicate scheduled work or logs.
7. Offline sessions preserve partial work and sync logs without loss or duplication when connectivity returns.
8. Misses and fallbacks remain distinct, create no debt, and do not trigger unaccepted workload increases.
9. Recurring slots and weekly adjustments require acceptance.
10. Discomfort reports exclude affected movements from new proposals; the app does not claim diagnosis or rehabilitation.
11. Successful imports delete uploaded and temporary video files; cleanup failures are retried visibly to the system.
12. Import/account deletion removes private media and associated derived source content and prevents in-flight recreation.
13. The four screens and sessions satisfy the stated accessibility requirements.

## Pilot evaluation

Record manual planning/correction time, started/completed sessions, fallback/partial work, estimate-versus-actual duration, optional skip reasons, and weekly overwhelm. Log extraction corrections separately from plan corrections. Select numerical success thresholds with the founder before the pilot begins; do not invent retrospective targets. Technical reliability acceptance is separate from adherence and physical outcomes.

## Next decisions and handoff

Written-design review is next. After approval, create the implementation plan with concrete slices, verification, dependencies, and feasibility checkpoints. Resolve API hosting, authentication method, failed-upload retention, media size/duration limits, AI cost limits, sync conflict semantics, initial source coverage, and numerical pilot targets explicitly before their dependent implementation slices. These are bounded planning decisions, not settled claims in this design.

No product code, infrastructure, deployment, or dependency installation is authorized by this design review. The directory is not currently a Git repository, so this document is saved locally and not committed.
