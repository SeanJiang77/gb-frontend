# GodsBooklet — Frontend

React + Vite + Tailwind + Axios + Zustand.

## Setup
1. `.env` -> `VITE_API_BASE=http://localhost:3000`
2. `npm i`
3. `npm run dev`

Production build:
```bash
npm run build
```

## Build Artifacts
`dist` is currently tracked in this repo, including Cloudflare Pages static output files such as `_redirects`, `ads.txt`, and generated Vite assets. If frontend source changes are built locally, keep `dist/index.html` and `dist/assets/*` consistent with the latest `npm run build` output.

## v0.4 Stabilization

### Changed
- Extracted the reusable GM `PlayerCard` shell.
- Updated GMPanel to consume backend-persisted sheriff state from `room.meta`.
- Added frontend API helpers for backend-backed vote resolution and sheriff badge transfer.
- Added sheriff badge transfer and tear-badge controls when backend reports `sheriffTransferRequired`.

### Verification
- `npm run build` should pass before release.
- Backend `npm run test:flow:local` should pass from `gb-backend`.

### Known risks
- Full browser click-path verification is still manual.
- Some GMPanel interaction state remains local and can be further backend-backed later.
