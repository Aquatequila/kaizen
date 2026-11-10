# Kaizen

Kaizen is an English, mobile-first workout tracker built as an installable Progressive Web App. It runs in iPhone Safari and desktop browsers, saves workout data in the browser on the current device, and works offline after the first visit. There are no accounts or workout-data servers.

## Run locally

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Create the production bundle with `npm run build`; preview it locally with `npm run preview`.

## Use on iPhone

Open the deployed HTTPS site in Safari, tap **Share**, then **Add to Home Screen**. Launch Kaizen from its home-screen icon. Data belongs to that browser installation and site address. Export a JSON backup in **Settings** before clearing website data, changing devices, or moving to another site URL.

## Deploy

In Cloudflare Pages, connect the `Aquatequila/kaizen` GitHub repository, set the production branch to `main`, build command to `npm run build`, and output directory to `dist`. Git pushes then publish production and branch preview builds. Cloudflare assigns the free `*.pages.dev` address; use that same address consistently so browser-local data remains available.

## Product and data

The source brief and delivery decisions are in [`definition/`](definition/). The shipped app includes plan editing, a standard and custom exercise library, set-by-set logging, active-workout recovery, optional manual rest timer, progress charts, and backup/restore. Weight is kilograms and means total external load, including both dumbbells when paired.

Standard exercise illustrations and movement data are provided by [RepDB](https://repdb.co). The app displays the required credit in Settings; see [`REPDB-LICENSE.md`](REPDB-LICENSE.md). The app bundles selected images for offline use and does not request exercise data from RepDB at runtime.
