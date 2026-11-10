# Kaizen Work Packages

P0 defines the first useful release. P1 adds deeper history and data safety. P2 covers later enhancements. Unless stated otherwise, the app is offline-first and workout data stays in the current browser on the user's device.

## WP1 — Product shell and mobile UX (P0)

**As a trainee, I want a calm, legible app that is easy to use between sets.**

- Use four primary destinations: **Today**, **Plans**, **History**, and **Settings**. Keep an active workout visually distinct and one tap away from its main logging screen.
- Design phone-first from 320 px widths upward. At 390 px, the active set, reps input, weight, completion action, and optional rest control fit without horizontal scrolling.
- Use bottom navigation outside a workout; preserve the active workout when navigating away or returning from another app.
- Show a helpful first-run path: create a plan, select exercises, or start from a sample plan. Every empty state has one clear next action.
- Establish reusable color, type, spacing, card, input, button, and status styles. Dark cyberpunk surfaces and neon accents remain restrained; text and controls meet accessible contrast requirements.
- Support Dynamic Type/zoom, VoiceOver names and values, keyboard focus, reduced motion, and clear focus/pressed/disabled/error states. Do not use color alone to communicate completion.

## WP2 — Exercise library and plans (P0)

**As a trainee, I want to create a plan using familiar exercises and my own variations.**

- Seed the picker from [the starter library](exercise-library.md). Search names and aliases; filter by equipment and movement area; show text even if an illustration is missing.
- Put recent and favorite exercises first, with an obvious search field and compact category filters. Adding an exercise gives immediate confirmation and keeps the picker open for adding another.
- Create custom exercises with a name, equipment, optional movement area, and a neutral icon. Built-in exercises remain reusable and cannot be accidentally overwritten by edits to a plan.
- Create, rename, duplicate, reorder, and delete plans and their exercises. Autosave edits or clearly indicate unsaved changes before leaving.
- Configure up to two independently labeled machine settings, working weight, set count, and reps for each set. Support bodyweight/no-weight movements and kg/lb.
- Make the exercise working weight the default for all sets. Let the user override a set without silently changing the exercise default.
- Confirm destructive deletes and provide undo for accidental exercise removal/reordering where practical.
- Editing a plan never changes completed workout history.

## WP3 — Active workout and set logging (P0)

**As a trainee, I want to record a set quickly without losing my place.**

- Starting a plan creates one active session with a start timestamp. Prevent accidental duplicate active sessions; offer **Continue workout** or an explicit choice to finish/discard before starting another.
- Show the current exercise, progress through the plan, machine settings, and each set as a compact, vertically readable list.
- For every set, show last session's actual reps and weight beside today's editable values (example: **Last: 8 reps · Today: 9 reps**). If no prior session exists, use plan targets and label them as targets.
- If today's plan has more sets than last time, label additional sets **New set** and seed from the plan/default; if it has fewer, retain all prior sets in history without crowding today's screen.
- Initialize today's working weight from the last session's exercise default, falling back to the plan. Keep it the same across sets unless the user overrides an individual set. Preserve prior per-set actual weights as reference.
- Make set completion a large, reachable one-tap action. Give immediate visual and tactile feedback where available; provide an easy undo/correction without a modal confirmation.
- Autosave every edit and completion. On reload, app switch, or device lock, restore the exact exercise, values, completion state, and timer. Calculate elapsed time from timestamps so background suspension does not lose time.
- Let the user skip an exercise, add a set, edit a completed set, finish early, or discard with clear consequences. Never delete a workout through a stray tap.
- Show a concise finish summary (duration, exercises, sets, total reps) with **Done** and **Review session** actions.

## WP4 — Optional rest timer (P0)

**As a trainee, I want a break countdown only when I choose to use one.**

- A visible but secondary **Start rest** action opens/starts the timer; set completion never starts it automatically.
- Provide sensible default duration, quick add-time controls, pause/resume, and stop. Keep timer controls separate from the set-completion target to prevent accidental taps.
- Persist the timer end timestamp. On return, show remaining time or a quiet **Rest complete** state; do not block logging or demand notification permission.
- Keep the in-app countdown reliable. Notifications and haptics are optional enhancements only where the installed browser supports them and the user enables them.

## WP5 — Progression recommendations (P2, deferred)

Progression is not part of the MVP. Later, propose a small, explainable rep or load goal based on logged sessions; show the prior result, allow edit/skip, and never silently change a plan or session.

## WP6 — Session history and progress (P1)

**As a trainee, I want to understand my training without misleading charts.**

- Show sessions in reverse chronological order with plan, date, duration, and a compact summary. Opening one reveals recorded per-set values.
- Offer two clearly separated charts: **Total reps** and **Weight**. Each chart shows one line per exercise; reps sum all completed sets for that exercise in a session, and weight is the heaviest completed loaded set that session. Exercises without a comparable external load have no weight series.
- Filter by exercise and date range. Display units and dates; make the selected exercise/series obvious and easy to hide/show.
- On a phone, charts have readable axes and touch targets plus a text/table equivalent for precise values and accessibility.
- For sparse history, explain what data is needed. Do not draw a line across missing sessions or compare incompatible units.
- Keep set count and session duration available in session details; defer extra chart types until user evidence supports them.

## WP7 — Local data safety (P1, required before long-term reliance)

**As a trainee, I want to back up and restore my history.**

- Export plans, exercises, settings, and sessions in a documented versioned format through the system share/save sheet.
- Validate imports before changing data; preview record counts and offer merge or replace with a clear explanation and a backup opportunity.
- Handle corrupt, unsupported, or duplicate records without partially damaging existing data.
- Explain plainly that data is local to this browser/origin and can be lost if browser data is cleared or the user changes device/browser.

## WP8 — PWA, offline, and deployment (P0)

**As a trainee, I want to install Kaizen and keep using it when gym connectivity is poor.**

- Serve the PWA over HTTPS with correct app name, icons, theme, and standalone display. Provide concise iPhone instructions: open in Safari, Share, Add to Home Screen.
- After first successful load, cache the app shell and selected exercise artwork. Core plan, workout, timer, and history flows work offline.
- Show a subtle offline indicator and a non-disruptive update prompt; never replace the app mid-workout or clear local data on update.
- Deploy static assets from GitHub to Cloudflare Pages: `main` publishes production, other branches create previews. Deployment contains no workout data or secrets.

## WP9 — Quality and usability checks (P0)

- Test domain calculations, data persistence/migrations, import/export, and session recovery.
- Run core journeys on a real iPhone Safari and the installed PWA, in portrait and at narrow widths: create a plan, log a full workout, use/skip rest, resume after interruption, and inspect history.
- Usability acceptance: a returning trainee can log one set with one hand in at most two deliberate taps after editing is complete; no core workout action requires typing a note or navigating away.
- Check VoiceOver, larger text, reduced motion, contrast, keyboard navigation, offline reload, and update behavior.
- Verify no workout data is sent to hosting, analytics, or third-party image servers.

## MVP order

Deliver WP1–WP4, a basic history list from WP6, PWA/offline/deployment from WP8, and the P0 checks in WP9. Deliver chart views and full backup/restore before inviting anyone to rely on long-term records. Progression suggestions in WP5 remain deferred until the logging experience is proven.

## Decisions still needed

- Which two machine-setting labels should appear by default? Keep them editable per exercise.
- Is kg/lb one app-wide preference or selectable per exercise? Recommended: app-wide display preference with correct conversion and stored canonical values.
- What is the default rest duration? Recommended: a short editable default with one-tap adjustments.
- Which launch language should be supported first? Recommended: German and English strings from the start, with the device language as the default and an explicit override in Settings.
