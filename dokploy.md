## Deploy to Dokploy

This repo includes a multi-stage `Dockerfile` that runs `expo export --platform web` and serves `dist/` with nginx (SPA routing enabled).

### 1. Push the repo

Dokploy pulls from Git, so push your branch first:

```bash
git push origin master
```

### 2. Create the app in Dokploy

At [dok.devlabtech.com](https://dok.devlabtech.com):

1. **New Project** (or use an existing one)
2. **Add Application** → connect this Git repo
3. **Build** tab:
   - **Build Type:** `Dockerfile`
   - **Dockerfile path:** `Dockerfile`
   - **Docker context:** `.`
4. **General** tab:
   - **Port:** `80`
5. **Domains** tab:
   - Add `crypto.devlabtech.com`
   - Enable HTTPS (Let's Encrypt) if you use it on other sites

### 3. DNS

Point the subdomain at your Dokploy server (same as your other sites):

```
crypto.devlabtech.com  →  A record or CNAME to your server IP/hostname
```

### 4. Deploy

Click **Deploy**. First build takes a few minutes (npm install + expo export). When it’s green, open `https://crypto.devlabtech.com`.

### 5. iPhone home screen

Safari → share → **Add to Home Screen**. Data persists in that browser’s localStorage for `crypto.devlabtech.com`.

**Important:** On iPhone, Safari and the Home Screen shortcut use **separate storage** — they are not the same app bucket. Pick one and stick with it, or use **Settings → Export/Import** to copy your portfolio between them. Redeploying the site does not wipe storage.

### Alternative: Static build type (no Dockerfile)

If you prefer Dokploy’s built-in static nginx image:

1. **Build Type:** `Nixpacks` (or your usual Node builder)
2. **Build command:** `npm ci && npm run build:web`
3. **Publish directory:** `dist`
4. Enable **Static SPA** / SPA routing

The Dockerfile approach is more predictable for Expo exports.
