# GodsBooklet — Frontend

React + Vite + Tailwind + Axios + Zustand.

## Setup
Required local environment:
- Node.js 22.12.0
- npm 10 or newer

Setup:
1. Install and select the project Node version:
```bash
nvm install 22.12.0
nvm use
```
2. `.env` -> `VITE_API_BASE=http://localhost:3000`
3. Install dependencies from the lockfile:
```bash
npm ci
```
4. Run the dev server:
```bash
npm run dev
```

Production build:
```bash
nvm use
npm run build
```

Verification:
```bash
nvm use
node -v
npm ci
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
