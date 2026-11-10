# Kaizen UI Design Direction

## Concept: quiet energy

Kaizen should feel focused and encouraging, with a subtle sci-fi edge. Use deep graphite surfaces, warm off-white text, a restrained lime action color, and cyan/violet only for secondary chart series. Avoid neon glow on text, noisy grids, decorative scanlines, and motion that competes with workout data. Strong hierarchy and spacing should do most of the visual work.

## Navigation and screen hierarchy

- **Today** is the home screen: next session, one prominent start/continue action, a short plan preview, and a small progress snapshot.
- **Plans** contains searchable plans and the exercise picker/editor.
- **Progress** contains separate total-reps and weight charts, with exercise selection and precise values available in a list.
- **Settings** contains rest default, backup/restore, privacy explanation, and app information.
- During a workout, hide bottom navigation and use a dedicated screen with a clear back/continue path. Keep the workout one tap away when the user leaves it.

## Active workout interaction

The [mobile prototype](../design/mobile-prototype.html) demonstrates the primary screen. Each set row places last session on the left and today's values on the right. Reps and total kg are independently adjustable with large controls; the set-complete action stays visually dominant. Keep exercise identity and machine settings above the rows, with plan progress and elapsed time visible at the top. The optional rest action remains secondary and never appears as a required next step.

At the start of each session, today's reps and load copy the corresponding last-session values; users can change them before or after recording. Values are not marked complete until the user records the set. Additions beyond last session show as new sets. Completed rows should visibly change state and offer a short-lived Undo action.

## Visual system

- Background: `#0D1014`; primary surface: `#151A20`; raised surface: `#1B222A`.
- Primary text: `#F2F5F5`; secondary text: `#94A1AA`.
- Primary action/success: `#C4F36A`; secondary chart colors: `#74D9DB` and `#B6A1FF`.
- Use a system sans-serif, tabular numerals for reps, kg, duration, and chart values; use rounded panels sparingly.
- Keep touch targets at least 44 CSS px, maintain visible focus, respect safe areas, and support reduced motion and zoom.

## Prototype scope

`design/mobile-prototype.html` is a standalone interaction concept for Today, Plans, Progress, Settings, and an active workout. It uses sample data and client-side demo interactions only. It does not save workouts, install as a PWA, or represent the production data model. Use it to review visual direction and primary flow before implementation; update it as decisions are made.
