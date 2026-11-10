# Kaizen Technology Stack

## Recommendation

Build Kaizen as a **mobile-first Progressive Web App (PWA)** using **TypeScript, React, and Vite**. Host the static production build on **Cloudflare Pages**, connected to GitHub for automatic production deploys from `main` and preview deploys for other branches. The Free plan supports Git-connected builds from public or private repositories; its current documented limit is 500 builds per month. See [Cloudflare Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/) and [current limits](https://developers.cloudflare.com/pages/platform/limits/).

The app has no server-side component in the MVP. The deployed site serves the app files; plans, sessions, settings, and history remain in the user's browser storage. No workout data is uploaded by the app.

## Components

| Area | Choice | Use |
| --- | --- | --- |
| UI | React + TypeScript + Vite | Small, maintainable interactive mobile web app and static build |
| Styling | Semantic HTML + CSS custom properties and responsive CSS | Thumb-friendly layouts, dark cyberpunk palette, safe areas, and accessible focus states |
| Navigation | React Router | Home, plan editor, active workout, history, and settings |
| Local persistence | IndexedDB through Dexie | Durable structured plans, exercise catalogue, sessions, and set records |
| Offline/PWA | Web App Manifest + service worker, managed by `vite-plugin-pwa` | Home Screen install, cached app shell and assets, offline launch, controlled update prompt |
| Charts | Recharts with custom accessible labels | Total reps and heaviest-set weight trends, one series per exercise; pair with a data table |
| Icons | Lucide icons for controls; licensed RepDB images for matching exercises | Consistent controls and offline exercise illustrations |
| Tests | Vitest + Testing Library; Playwright for core browser flows | Domain rules, persistence, responsive behavior, and essential workout journeys |
| Hosting/deploy | Cloudflare Pages Git integration | HTTPS hosting, GitHub-triggered production deploys and branch previews |

## Mobile and Offline Behavior

- Design for a 390 px-wide phone first, then adapt to larger screens. Keep common set logging reachable by thumb, inputs large, and the current set unmistakable.
- From iPhone Safari, users can choose **Share → Add to Home Screen** to launch the PWA in a standalone window. Serve over HTTPS.
- Cache app code and selected illustrations locally; never fetch exercise artwork from a third-party URL during a workout.
- Store workout records in IndexedDB. A service worker does not replace backup: browser storage belongs to the current origin/device and may be lost if site data is cleared or the user switches browser/device. Add user-controlled export/import before long-term use.
- Persist timer end time, not just a ticking counter, so reopening after backgrounding can calculate the correct remaining time. An expired timer should not interrupt workout logging.
- PWA notifications on iPhone have platform conditions and require Home Screen installation and a push service for remote push; do not make the rest timer depend on them. In-app countdown works without notification permission.

## Exercise Library and Artwork

The starter catalogue is [`exercise-library.md`](exercise-library.md). Match its standard entries against RepDB's free-tier records, bundle only the selected illustrations, and retain the visible credit **“Exercise data by RepDB (repdb.co)”** in the app. RepDB allows personal and commercial in-app use with attribution and prohibits redistribution of the dataset as a dataset; see its [dataset](https://github.com/RepDB/exercise-dataset) and [data license](https://github.com/RepDB/exercise-dataset/blob/main/LICENSE-DATA.md). For unmatched custom movements, use the name and a neutral icon rather than a misleading image.

## Suggested Project Layout

```text
src/
  app/                 App shell, routes, theme
  features/
    plans/             Plan list and editor
    workout/           Active session, set logging, manual rest timer
    history/           Session list and exercise trends
    settings/          Units, backup and restore
  data/                IndexedDB schema, repositories, migrations
  domain/              Exercise, plan, session types and calculations
  components/          Shared controls and accessible form elements
  assets/              Bundled exercise illustrations and app icons
public/                Manifest, offline shell assets, static metadata
```

Completed sessions store snapshots of exercise names, machine settings, set values, and units so later plan or catalogue edits cannot rewrite history. Keep the working weight at exercise level and let an individual set override it; chart the heaviest completed set in each session.

## Deployment

1. Push the app source to GitHub.
2. In Cloudflare Pages, create an application using **Connect to Git** and select the repository.
3. Set the production branch to `main`, build command to `npm run build`, and output directory to `dist`.
4. Every push to `main` updates the live site; other branches get preview URLs. Cloudflare supports a default `*.pages.dev` address, with a custom domain optional.

This project is already connected to the `Aquatequila/kaizen` GitHub repository. After the PWA source exists, connect that repository to Cloudflare Pages. GitHub Pages is another option for a public repository; Cloudflare Pages is preferred because its Git integration also supports private repositories on the Free plan.

## Scope Boundaries

Do not add accounts, analytics, server APIs, or cloud sync to the MVP. If device-to-device sync is requested, add a backend deliberately and document its privacy, authentication, and conflict-resolution behavior first.
