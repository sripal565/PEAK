# Movement Planner — iPhone MVP specification

Date: October 14, 2026  
Status: Agreed product direction documented; written specification awaiting review.  
Mode: Product, UX, and technical planning. No implementation or platform feasibility claims are implied.

## Purpose and audience

Help people who already want to train turn many movement goals and saved exercise videos into one manageable plan. The initial user is the founder and similar people juggling skill practice, mobility, stability, and an existing gym program.

Core promise: Tell the app everything you want to work on; receive one realistic plan you can follow.

The user's example interests are GOATA training, ankle stability for general training, planche development, posture-related goals, and release work. These are inputs to evaluate, not endorsements or assumed necessities. General training is in scope; diagnosis and injury rehabilitation are out.

Success means less manual planning, more completed useful sessions, and a gradual transition from flexible activity to a sustainable recurring week. Completion alone does not prove physical improvement.

## Agreed scope

- iPhone app with sharing and direct video-upload entry points.
- Natural-language goals; optional explicit priority preferences.
- App-recommended priorities, with visible reasons and user overrides.
- Video interpretation supported by a reviewed exercise catalog.
- Combined scheduling within a user-selected time budget.
- Existing gym commitments recorded so supplemental work is considered alongside them.
- Guided sessions, shorter fallbacks, obstacle logging, and weekly review.
- Flexible onboarding that gradually proposes a mostly fixed schedule.

Excluded: injury rehabilitation, automated diagnosis, full strength or plyometric program generation, skincare, supplement or calorie tracking, social feeds, financial penalties, and buddy messaging. Strength and plyometric sessions can be recorded as existing commitments.

## Onboarding

Collect goals, experience, equipment, weekly availability, existing gym sessions, and relevant restrictions. A user can enter plain-language interests without composing an exercise routine. Ask only for missing information that affects the initial plan.

Separate outcomes, methods, and supporting activities. For example, a planche milestone is an outcome; a branded training approach is a method. Vague goals receive a proposed measurable interpretation for confirmation. Do not promise timelines for physical results.

The initial plan proposal shows active goals, deferred interests, sessions, total time, assumptions, and reasons. The user accepts or edits it before activation. Suggested starting workloads and progression rules must come from reviewed programming guidance; they are not supplied by this specification.

## Video import

1. Receive a shared URL or uploaded video and save an inbox item immediately.
2. Process asynchronously. Display queued, processing, ready, needs clarification, inaccessible, or failed status.
3. Extract identifiable movements, demonstrations and timestamps where supported, stated instructions, equipment, and creator claims. Keep source statements separate from app recommendations and inferred information.
4. Match activities to versioned, reviewed catalog entries. Preserve meaningful variations; do not force uncertain matches.
5. Show a compact interpretation and request clarification only for material ambiguity.
6. Produce a proposed plan change: add, replace, defer, duplicate, or no useful fit. Show time impact and affected goals. Require acceptance before changing the active plan.

An import never automatically creates an obligation. Unrecognized movements remain saved for review and cannot enter scheduled sessions until an appropriate reviewed record exists. Users may correct extraction; corrections do not count as expert review.

Receiving a social URL does not guarantee access to video bytes. If access fails, request a clip upload and retain the original link. Do not claim analysis based only on a caption or thumbnail. Source demonstrations remain accessible when permission and platform capabilities permit; otherwise provide the source link and catalog instructions. Do not promise permanent access to third-party material.

## Catalog and recommendation boundaries

Each reviewed exercise record contains identity, supported variations, instructions, equipment, goal associations, prerequisites, programming bounds, relevant restrictions, demonstration provenance, reviewer identity, and revision. Review provenance must reflect a real review; generated records cannot label themselves reviewed.

Separate exercise identification, suitability, and programming decisions. A movement appearing in a video does not establish its effectiveness or suitability. Goal overlap requires reviewed associations; visual similarity alone is insufficient. Do not claim a combined exercise fully replaces goal-specific practice without support.

Newly reported injury, pain, or a relevant restriction pauses affected recommendations pending appropriate clarification. The app does not generate a rehabilitation substitute. Unaffected planning can continue where the recorded constraints permit.

## Priority and scheduling rules

Hard constraints: user availability, equipment, existing commitments, explicit restrictions, and reviewed programming limits. Preferences influence allocation within those constraints.

The app recommends a small active set and saves other interests for later. When demand exceeds capacity, propose deferral or reduced scope rather than silently exceeding the budget. Explain the tradeoff and allow edits. Never claim mathematical optimality merely because a plan was generated.

Use common activities across goals when supported, while counting their time once and their physical demands across all relevant sessions. Include setup, rest, and transitions in estimated duration. If gym-session detail is insufficient to assess overlap, disclose that uncertainty and request the minimum relevant detail.

The scheduler owns a structured, versioned plan. Model-generated suggestions must pass constraint validation before they can become proposals. Explanations describe actual scheduling reasons, not invented rationales.

## Flexible to fixed progression

Start with a modest, editable plan using flexible windows. Collect completion, actual duration, perceived difficulty, obstacles, and optional preferred timing.

At weekly review, propose recurring slots based on observed completion and user preference. The user confirms new recurring commitments. Calendar placement alone does not establish that a slot works. Do not silently move a confirmed recurring session.

Increasing commitment requires user acceptance and reviewed programming bounds. Repeated difficulty completing the plan prompts simplification or different timing; it does not automatically increase reminders or workload. There is no mandatory countdown to a fixed schedule.

Missed sessions do not accumulate as debt. Offer reschedule, reviewed shorter fallback, or skip, while revalidating the rest of the week. Do not automatically double the next session. Fallbacks are recorded distinctly and do not imply equivalent training benefit.

## Four main screens

| Screen | Main behavior |
|---|---|
| Today | Next session, purpose, estimated duration, start action, and shorter fallback when available. |
| Inbox | Imported sources, processing states, interpretations, and proposed plan changes. |
| Plan | Weekly commitments, active and deferred goals, priority explanations, and edits. |
| Review | Planned versus completed work, obstacles, selected progress measures, and proposed adjustments. |

Guided sessions show instructions and demonstrations, timers or set logging as appropriate, and pause, modify, stop, and completion actions. A timer finishing is not proof an exercise was performed. Preserve partial work when interrupted.

Accessibility requirements: scalable text, VoiceOver labels, non-color status indicators, and alternatives to gesture-only controls.

## Accountability and progress

Users choose a concrete start cue, such as after a gym session. Reminders support an explicit commitment; guided execution and weekly adjustments supply the rest of the loop.

On a missed session, offer one-tap reasons: time, difficulty, discomfort, forgot, or another reason. Feedback is optional and must not block use. The review proposes a response tied to the obstacle rather than using guilt or streak loss.

Track adherence separately from outcomes. Each active goal has a reviewed, user-confirmed progress measure where appropriate. If no meaningful measure is available, label progress as unmeasured rather than manufacturing a score. No automated body-form assessment is included.

## Required states and recovery

- Empty: offer goal entry or video import; show no fabricated personalized plan.
- Pending: imports and plan proposals expose progress and remain safe to leave.
- Failed import: preserve the source and offer retry or upload without duplicate obligations.
- Failed planning: preserve the current plan, state the unmet constraint, and offer a focused correction.
- Insufficient capacity: show deferred goals and tradeoffs instead of an impossible week.
- Offline: allow access to locally saved plan instructions and logs; indicate unavailable media and queue logs for sync.
- Concurrent changes: reject stale plan acceptance, regenerate against the latest plan, and show the revised proposal.

## Technical boundaries and data

The iPhone client owns capture, presentation, guided execution, and local session continuity. An import service owns media processing and source provenance. The reviewed catalog owns approved activity definitions. A planner owns validated proposals and schedule versions. Progress records store user-reported work and outcomes separately from plans.

Core entities: user profile, goal, preference, restriction, availability window, existing commitment, imported source, extracted activity, exercise revision, plan version, session, completion log, and review proposal.

Long-running import and proposal creation are asynchronous and retryable. Repeated processing of one import must not duplicate scheduled work. Keep source evidence attached to extractions and plan changes attached to the version they modify.

User content is private by default. Provide deletion of imported media and account data; derived records must not retain deleted media or source text. Separate public catalog data from private imports. Collect no third-party social-account credentials as an import shortcut.

Specific frameworks, model providers, infrastructure, retention periods, supported media limits, and programming rules require technical planning and source verification before implementation. They are deliberately outside this product-direction approval.

## Alternatives and tradeoffs

Chosen: reviewed catalog plus video interpretation and adaptive planning. This reduces arbitrary generated programming but requires real catalog review and a useful initial coverage set.

Rejected for MVP: unrestricted video-to-program generation, because extracted claims and unclear demonstrations cannot automatically become trusted programming. Manual routine organization is simpler but preserves the user's main source of friction.

## Acceptance criteria

1. A user enters several goals without writing routines and receives a proposal within recorded availability.
2. A supported video yields a traceable interpretation; inaccessible media is labeled accurately and offers upload recovery.
3. Every scheduled exercise resolves to a reviewed revision; uncertain imports remain outside the active plan.
4. A new import can replace or defer work, with visible time impact and no change before acceptance.
5. Priority overrides affect the proposal while hard constraints remain enforced.
6. Existing gym commitments are included in scheduling inputs; missing detail is visible.
7. A missed or partial session can be resolved without debt or an unvalidated increase in workload.
8. Recurring slots and workload increases require explicit acceptance.
9. A weekly review distinguishes completed work, fallback work, and measured outcomes.
10. Failed imports or proposals preserve existing work, and stale proposal acceptance cannot overwrite newer plans.
11. Injury-rehabilitation requests do not produce rehabilitation routines.
12. A user can delete private imports and associated derived source content.

## Initial validation and next step

Use the founder's actual goals, gym commitments, and a small representative set of videos for a two-week pilot once a working prototype exists. Record time spent manually correcting imports or plans, sessions started and completed, estimated versus actual duration, reasons for skipping, and weekly reported overwhelm. Set numerical success thresholds before the pilot, not after seeing results. A two-week pilot tests usability and adherence, not long-term physical effectiveness.

Next step after written-spec review: implementation planning, beginning with a bounded feasibility investigation of iPhone sharing, platform-permitted video access, upload fallback, and extraction quality. Verify current platform documentation before selecting an implementation. Then sequence catalog coverage, constraint validation, guided sessions, and weekly adaptation into testable slices. No product code, deployment, or external project has been created under this specification.
