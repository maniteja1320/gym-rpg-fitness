# Gym RPG Fitness

React + Vite + Tailwind gamified workout tracker (XP, levels, quests, PRs, PWA).

## Deploy (HTTPS for “Install app” on your phone)

Your phone needs an **https://** URL (not `http://192.168…`) for the best install experience.

### Option A — Netlify

1. Push this folder to GitHub/GitLab/Bitbucket (or drag-and-drop the **`dist`** folder in the Netlify UI after `npm run build`).
2. In [Netlify](https://www.netlify.com/) → **Add new site** → **Import an existing project**.
3. Build settings (also in `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Deploy, then open the **https://** site on your phone.

**Install on phone:** Chrome menu → **Install app** / **Add to Home screen**.

### Option B — Vercel

1. Push the repo to GitHub.
2. In [Vercel](https://vercel.com/) → **Add New Project** → import the repo.
3. Framework: **Vite** (or leave auto-detect). Build: `npm run build`, output: `dist` (see `vercel.json`).
4. Deploy and open the **https://** URL on your phone.

**Install on phone:** same as above (browser “Add to Home screen” / “Install”).

### After deploy

- Open the live URL once, then use the browser install prompt or **Add to Home Screen**.
- Data stays in **localStorage** on that device/browser.

## Local development

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```
