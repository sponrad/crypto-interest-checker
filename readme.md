# Crypto Checker with Interest

React web app. Portfolio tracker with interest earnings and dream-mode price multipliers.

## Prerequisites

- Node.js **≥ 20**

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview   # optional: serve dist/ locally
```

Output goes to `dist/`.

## Deploy (Docker)

```bash
docker build -t crypto-checker-web .
docker run --rm -p 8080:80 crypto-checker-web
```

See `dokploy.md` for Dokploy setup.

## iPhone home screen

Safari → share → **Add to Home Screen**. Data persists in that browser’s localStorage for your domain.

**Important:** Safari and the Home Screen shortcut use **separate storage**. Use **Settings → Export/Import** to copy your portfolio between them.

## Native app (archived)

The Expo / React Native version lives on a separate git branch if you need App Store builds again.
