# Kaizen Product Brief

## Product

Kaizen is a personal, mobile-first workout tracker for people who want to follow repeatable training plans and see their progress without friction. It is an installable Progressive Web App (PWA), designed first for iPhone Safari and usable on desktop browsers. There is no App Store release, account, or server in the MVP.

## Core user need

During a workout, the user needs to see what they did last time, quickly record what they do today, and trust that an interruption will not lose their session. Outside a workout, they need to create plans and understand progress exercise by exercise.

## MVP capabilities

- Create plans from a built-in standard exercise library or custom exercises.
- Configure exercise order, up to two labeled machine settings, working weight, sets, and reps per set.
- Use kilograms throughout. Enter total external load: include the bar, sum paired dumbbells, and use the machine's displayed stack load.
- Run a plan and compare every set with the corresponding set from the previous completed session.
- Start today's reps at the previous completed value for that set; when no previous value exists, use the plan target. Values remain editable and uncompleted until the user records them.
- Keep one exercise working weight by default, with optional per-set overrides.
- Manually start an optional rest countdown; it never starts automatically or blocks logging.
- Resume an interrupted workout in its prior state, retaining inputs and completion status.
- Track workout duration as wall-clock time from start to finish, including rests and time in the background.
- Review sessions and trends: total reps per exercise per session and heaviest completed set weight per exercise per session.
- Persist data locally in the browser, work offline after first load, and support user-controlled backup/restore.

## Product and design direction

Make the common workout action obvious, calm, and fast. Use a minimal cyberpunk visual identity: dark surfaces, a small neon accent palette, clear typography, and restrained motion. Prioritize legibility and touch comfort over decorative effects. The experience must work one-handed between sets, in a gym, and without a network connection.

## Constraints

- Workout data remains in the browser on the user's device. The hosted site serves static application files only.
- Clearing browser data, changing browser/device, or removing the installed web app can make local records unavailable; export/import is the recovery path.
- Progression recommendations are explicitly out of MVP scope.
- English is the launch language.
- Use the free hosting provider's assigned `pages.dev` URL at launch; do not buy or configure a custom domain for the MVP.
- See [work packages](work-packages.md), [technology stack](tech-stack.md), and [starter exercise library](exercise-library.md) for delivery detail.
