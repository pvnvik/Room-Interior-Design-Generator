# AI Interior Design Studio

AI Interior Design Studio is a client-side web app that transforms room photos into curated interior design styles using a hosted image-generation pipeline (fal.ai). The project is intended as a lightweight, responsive prototype for exploring AI-assisted room redesigns and UX patterns for visual design editing.

The app accepts a user photo of a room, sends the image with a textual style prompt to a queued AI model, polls for progress, and displays the completed styled image for comparison, saving, downloading, or sharing. It is built as a single-page application with an emphasis on quick iteration, small bundle size, and minimal backend surface — all AI calls are made directly from the browser to a model queue endpoint.

Use cases:
- Explore multiple interior design concepts on the same source photo.
- Rapidly generate visual variations and save favorites.
- Prototype client-driven AI integrations for design workflows.

## Frameworks & libraries

- React 18 — component model and UI state management.
- Vite — fast development server and build tool.
- Tailwind CSS — utility-first styling (configured via PostCSS).
- PostCSS + Autoprefixer — CSS processing.
- lucide-react — lightweight icon set.
- Browser APIs — FileReader, localStorage, navigator.share (where available).

Dev dependencies in package.json:
- vite, @vitejs/plugin-react, tailwindcss, postcss, autoprefixer

## Architecture & files of interest

- src/App.jsx — main component: UI, image upload, style presets, API integration, polling logic, persistence.
- src/index.jsx — React mount point and global providers.
- src/index.css — Tailwind setup and global styles.
- package.json — scripts and dependency manifest.
- vite.config.js — Vite configuration (if present).

Client behavior:
- Stores API key and saved designs in localStorage.
- Posts jobs to a fal.ai queue endpoint and polls status_url until completion.
- Supports basic error handling, retry timeout, and file-size limits (10MB).

## Quick start

1. Install:
   ```
   npm install
   ```
2. Start dev server:
   ```
   npm run dev
   ```
3. Open http://localhost:5173

Build for production:
```
npm run build
npm run preview
```

## API & environment

- The app expects a fal.ai API key (saved under localStorage key `falai-api-key`).
- Replace or configure the queue endpoint in src/App.jsx if using a different model or host.
- Storing API keys in localStorage is convenient for prototyping but not secure for production. For production, proxy requests through a server or use a short-lived token mechanism.

## Limitations & considerations

- Client-side API calls reveal the key to the browser environment; avoid exposing privileged keys in public deployments.
- Image size is restricted client-side to ~10MB to prevent performance issues.
- Polling frequency and timeout are conservative; adjust for different model latencies.

## Troubleshooting

- Check browser console for API responses and polling logs.
- Confirm API key validity and model availability.
- Reduce image size or resolution if uploads fail.

## Contributing

- Open issues for bugs or feature requests.
- Create PRs for improvements; keep changes scoped and add brief tests where applicable.

## License

- MIT (or change to preferred license).  
- Third-party libraries are used under their respective licenses listed in package.json.

