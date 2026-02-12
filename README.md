# Daily Accountability App

Simple React + Vite personal checklist app for daily goals.

## Features

- Fixed daily goal list.
- Progress bar and current streak counter.
- Streak increments once per local calendar day when all goals are complete.
- Confetti celebration when all goals are checked (respects reduced-motion preferences).
- Data persisted in `localStorage`.
- Netlify-ready via `netlify.toml` (build + SPA redirects).

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Netlify

This repository includes a `netlify.toml` file, so Netlify can auto-detect settings:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect: `/* -> /index.html`
