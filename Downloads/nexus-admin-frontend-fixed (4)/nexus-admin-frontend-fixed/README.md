# NexusAdmin — Frontend

React 18 (Create React App) admin dashboard.
This folder is **self-contained**: `package.json` is at the top level, so it
deploys with **no Root Directory setting**.

## Deploy to Vercel

1. Push this folder to its own GitHub repo (so `package.json` is at the repo root).
2. Vercel → **Add New → Project** → import the repo.

| Setting | Value |
|---|---|
| Root Directory | *(leave blank)* |
| Framework Preset | Create React App |
| Build Command | `npm run build` (default) |
| Output Directory | `build` (default) |

3. Add environment variables — point them at your Render backend URL.
   **These are baked in at build time**, so set them *before* deploying:

```
REACT_APP_API_URL=https://<your-backend>.onrender.com/api
REACT_APP_SOCKET_URL=https://<your-backend>.onrender.com
REACT_APP_NAME=NexusAdmin
```

4. Deploy. You'll get a URL like `https://your-app.vercel.app`.
5. **Go back to Render** and set `FRONTEND_URL` to that Vercel URL (for CORS),
   then let the backend redeploy.

> `vercel.json` provides SPA routing so refreshing on a route like `/products`
> doesn't 404. `Dockerfile` / `nginx.conf` are only for self-hosted Docker and
> are ignored by Vercel.

## Important: env vars are build-time

If you later change the backend URL, update the variable in Vercel **and
redeploy** — editing it without a rebuild has no effect, because the value is
compiled into the static bundle.

## Run locally

```bash
cp .env.example .env     # REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start                # CRA dev server on :3000
```
