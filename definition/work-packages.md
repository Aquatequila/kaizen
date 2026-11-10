# Kaizen Work Packages

Stories are grouped in delivery order. P0 is required for a useful first release; P1 adds trends and data safety; P2 is for later enhancements. Acceptance criteria are written as observable behavior. Unless stated otherwise, all data remains on this iPhone and works offline.

## WP1 — App Foundation (P0)

**As a trainee, I want a clear, fast workout app so I can use it between sets.**

- The app opens to a home screen with plans and recent sessions.
- A minimal cyberpunk visual system uses dark surfaces, restrained neon accents, high-contrast text, and accessible controls.
- Core flows work on narrow iPhone screens, with large touch targets, VoiceOver labels, reduced motion, and no color-only status indicators.
- Empty states explain how to create a first plan. Destructive actions require confirmation.

## WP2 — Training Plans (P0)

**As a trainee, I want to create and maintain reusable plans.**

- Create, rename, reorder, duplicate, and delete plans.
- Browse a built-in standard exercise library and create custom exercises; both can be added, removed, and reordered in a plan.
- Search and filter the built-in library by name, alias, equipment, and movement area; exercise names remain visible with or without art.
- Each exercise has a name and optional illustration. Use the bundled licensed illustration when a match exists; otherwise use a neutral symbol. Custom exercises can use a simple user-selected symbol.
- Configure zero, one, or two machine-setting values, plus a starting weight, set count, and reps for each set.
- Set a working weight for the exercise; individual sets may override it. Keep the same working weight across sets by default.
- Support bodyweight/no-weight exercises and editable units (kg or lb).
- Editing a plan does not rewrite completed session history.

## WP3 — Guided Workout Session (P0)

**As a trainee, I want to run a plan and record what I actually did.**

- Start from a plan and record its start date and time. After closing the app, locking the phone, or backgrounding the app, resume the same in-progress session and screen state without losing logged values. Elapsed session time continues during interruption.
- Show the complete previous-session values set by set beside today's editable values (for example, “Last time: 8 reps” and “Today: 9 reps” for set 1). If there is no previous session, initialize today's values from the plan.
- Initialize today's sets with the previous session's working weight; keep it consistent across sets by default, while allowing an individual set to override it.
- Edit reps separately for each set and override weight for this session without changing the plan.
- Mark sets complete and move between exercises; finish or discard a session with clear confirmation.
- Save completed work locally, including exercise order, set values, and elapsed duration.

## WP4 — Rest Timer (P0)

**As a trainee, I want a quick rest countdown between sets.**

- Rest is optional and manually started from a break control; completing a set never starts or requires a rest.
- Start, pause, resume, add time, and stop a configurable countdown.
- Keep an accurate in-app countdown while active. When the app resumes, calculate remaining time from the saved end timestamp; use a notification or haptic only where the browser supports it and the user has enabled it.
- A timer never blocks logging or navigating the workout.

## WP5 — Progression Targets (P2)

**As a trainee, I want a sensible next-session target. (Later release; excluded from the initial MVP.)**

- Show a proposed increase in reps or weight using a simple, explainable rule based on the last completed performance.
- Let the trainee accept, edit, or ignore the target; do not silently change a plan or logged result.
- Keep targets exercise-specific and show the previous value alongside the suggestion.

## WP6 — History and Trends (P1)

**As a trainee, I want to see how each exercise changes over time.**

- Browse completed sessions by date and view their duration and recorded sets.
- View a total-reps chart with one line per exercise; each point is the sum of repetitions across that exercise's sets in one session.
- View a separate weight-progress chart with one line per exercise and clearly labeled units; each session's point is the heaviest completed set for that exercise.
- Filter or change the visible date range; label units and dates clearly.
- Handle missing values and sparse history without misleading chart lines.

## WP7 — Local Data Safety (P1)

**As a trainee, I want my training history to survive app updates and be recoverable.**

- Store plans and sessions persistently on device with versioned schema migrations.
- Provide a user-initiated export and import of a documented portable format, with validation and a confirmation before replacing or merging data.
- Explain that uninstalling the app may remove local data and that no account or cloud sync is included.

## WP8 — Offline Web App and Live Deployment (P0)

**As a trainee, I want to install Kaizen on my iPhone and trust that my workout data stays available.**

- Install the PWA from iPhone Safari using Add to Home Screen; no App Store listing or native build is required.
- Cache the app shell and selected exercise illustrations so plans, workouts, timer, and history continue offline after first load.
- Save plans and sessions in browser IndexedDB on the device; clearly explain that data is local to this browser/device and provide export/import backup.
- Verify plan editing, per-set logging, timer behavior, persistence after relaunch, offline startup, and trend calculations with automated tests where practical.
- Connect the GitHub repository to Cloudflare Pages; production deploys automatically from the main branch and other branches can produce previews.
- Keep all workout data out of deployment services; only the static app files are published.

## Suggested MVP Sequence

Deliver WP1–WP4 and the PWA/deployment path in WP8 first. Add WP6 after real session data can be recorded. WP5 progression suggestions are deferred until after the MVP. WP7 export/import is strongly recommended before relying on browser-local history.

## Product Decisions to Confirm

- Which two machine-setting labels/units to support (for example, seat height and pin position).
- Whether kg/lb can vary by exercise or is one app-wide preference.
