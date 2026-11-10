# Starter Exercise Library

This is Kaizen's built-in starter menu. It is intentionally focused on common strength-training movements, not every variation in a large exercise database. Users can create custom exercises when a preferred movement, machine, or gym-specific name is missing. Search should match names and aliases; the picker should filter by equipment and movement area.

## Barbell

- Back squat
- Front squat
- Bench press
- Incline bench press
- Overhead press
- Deadlift
- Romanian deadlift
- Barbell row
- Hip thrust
- Barbell lunge
- Calf raise
- Barbell curl
- Skull crusher

## Dumbbell

- Goblet squat
- Dumbbell split squat
- Dumbbell lunge
- Dumbbell bench press
- Incline dumbbell press
- Dumbbell shoulder press
- Dumbbell row
- Chest-supported dumbbell row
- Romanian deadlift
- Dumbbell fly
- Lateral raise
- Rear-delt fly
- Biceps curl
- Hammer curl
- Overhead triceps extension
- Triceps kickback
- Pullover
- Calf raise

## Machines and cables

- Leg press
- Leg extension
- Seated leg curl
- Lying leg curl
- Hip abduction
- Hip adduction
- Calf-raise machine
- Chest-press machine
- Pec deck
- Shoulder-press machine
- Lat pulldown
- Seated cable row
- Cable face pull
- Cable chest fly
- Cable triceps pushdown
- Cable overhead triceps extension
- Cable biceps curl
- Cable lateral raise
- Cable crunch
- Back extension

## Kettlebell

- Kettlebell deadlift
- Kettlebell swing
- Kettlebell goblet squat
- Kettlebell Romanian deadlift
- Kettlebell clean
- Kettlebell press
- Kettlebell row

## Bodyweight and assisted

- Push-up
- Incline push-up
- Pull-up
- Assisted pull-up
- Chin-up
- Assisted dip
- Dip
- Inverted row
- Bodyweight squat
- Reverse lunge
- Step-up
- Glute bridge
- Single-leg glute bridge
- Bicycle crunch
- Lying leg raise
- Crunch
- Hanging knee raise
- Calf raise

## Bands

- Band pull-apart
- Band row
- Band chest press
- Band lateral walk
- Band biceps curl
- Band triceps pressdown

## Illustration and data rules

- Use the [RepDB free-tier exercise dataset](https://github.com/RepDB/exercise-dataset) to match standard entries to flat start/peak illustrations. Bundle selected image files in the app so the library works offline; do not make the app depend on image URLs at runtime.
- The [RepDB data license](https://github.com/RepDB/exercise-dataset/blob/main/LICENSE-DATA.md) allows personal and commercial in-app use with attribution, and prohibits republishing the dataset as a dataset. Add `Exercise data by RepDB (repdb.co)` as a visible link in the app's About screen and retain the license with the project.
- Use both poses when available, with a short reduced-motion crossfade or a user-controlled state toggle. Never animate continuously in the picker or workout logger.
- If a matching image is unavailable or uncertain, show the exercise name and a neutral equipment/movement symbol. Do not assign an illustration for a different exercise merely to fill the space.
- Keep user-created exercises independent from the built-in catalogue. Let users assign a simple icon, and retain their chosen name and icon when the built-in catalogue changes.

## Exercise record fields

Each built-in record should have a stable ID, display name, searchable aliases, equipment category, primary movement area, optional machine-setting labels, and optional illustration asset paths. User plans reference the stable ID but store a snapshot of the display name and settings in completed sessions, so catalogue updates cannot rewrite history. Weight is an exercise-level working default; each set may override it.

For MVP consistency, the catalogue focuses on repetition-counted strength exercises. Each record must declare whether it uses external load or no load. Do not show a misleading weight trend for bodyweight movements; assisted movements need a distinct assistance/load definition before being added to weight charts. Timed holds and distance-based cardio are outside the initial tracking model.
