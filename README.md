# Rework — Eat. Train. Rework.

A fitness & nutrition tracking app: onboarding with BMR/TDEE-based targets, food
logging with a local + live food search, workout routines and session tracking,
progress charts, and a light/dark theme.

This is a **standalone React app** (built with Vite), separate from the version
that ran inside the claude.ai chat artifact. The two differences that matter:

- **Storage**: data is saved to your own browser's `localStorage` (see
  `src/lib/storage.js`) instead of claude.ai's sandbox-only storage API. Once
  deployed, your data lives entirely in your browser, on your device — nobody
  else can see it, and it's never sent to any server, because there is no server.
- **Live food search**: Open Food Facts is called directly from the browser,
  and USDA FoodData Central now goes through a small serverless proxy
  (`api/usda-search.js`). The proxy exists because USDA's API doesn't send the
  CORS header a direct browser fetch requires, so calling it straight from the
  browser fails cross-origin — the proxy forwards the request server-side and
  fixes that. Both sources are free. (If you deploy as a static-only site with
  no serverless functions, the app falls back to a direct USDA call using a
  client-exposed `VITE_USDA_API_KEY`, which may still be CORS-blocked — the
  proxy is the reliable path.)
- **Food scanning** ("Scan Food" on Home, or "Scan" in the Nutrition tab) has
  two free modes:
  - **Barcode scan** (no API key, no setup): point your camera at a product
    barcode and Rework decodes it in the browser, then looks it up in Open
    Food Facts for the exact label nutrition. This is the most accurate option
    for packaged foods and works entirely client-side.
  - **Photo estimate**: take or upload a photo, and a backend function
    (`api/analyze-food.js`) sends it to **Google Gemini** to estimate the
    food, calories, and macros, which you can edit before logging. Gemini has
    a genuinely **free tier** (no credit card needed), so this costs nothing
    for personal use — see section 4. The Gemini key must never be exposed to
    the browser, so it lives in the backend function (server-side env var),
    not a `VITE_`-prefixed variable.

## 1. Local setup

```bash
npm install
cp .env.example .env
```

Open `.env` and add your free USDA FoodData Central key (get one in ~2 minutes
at https://fdc.nal.usda.gov/api-key-signup.html):

```
VITE_USDA_API_KEY=your_key_here
```

You can skip this — the app works fully without it, USDA results are just
skipped (Open Food Facts and your local food library still work). Note that
in a real deployment USDA search runs through the `api/usda-search.js` proxy
(to avoid a CORS block), which reads `USDA_API_KEY` or `VITE_USDA_API_KEY`
from your host's environment — see section 3.

**A note on `npm install`:** this is a standard combination of packages
(React 18 + Vite + Tailwind + recharts + lucide-react, plus `@zxing/browser`
for barcode scanning). If `npm install` or `npm run dev` throws an error,
paste it back and I'll fix it.

```bash
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`).

## 2. Production build

```bash
npm run build
```

Outputs a static site to `dist/`. Preview it locally with:

```bash
npm run preview
```

## 3. Deploy it

Any static host works for the core app and barcode scanning, but **photo
scanning and reliable USDA search need a host that runs serverless functions**
(the `api/` folder) — Vercel and Netlify both do this natively.

### Vercel (recommended, simplest)
1. Push this folder to a GitHub repo (private is fine)
2. Go to https://vercel.com → "Add New Project" → import the repo
3. Vercel auto-detects Vite — just click Deploy
4. Add environment variables under Project Settings → Environment Variables,
   then redeploy (env vars from your local `.env` do NOT travel with the
   deployment automatically):
   - `USDA_API_KEY` — your free USDA key. Preferred: this name keeps it
     server-side (used by the `api/usda-search.js` proxy, which fixes the CORS
     issue). `VITE_USDA_API_KEY` also works but is client-exposed.
   - `GEMINI_API_KEY` — your free Google Gemini key, for photo scanning (**do
     NOT prefix this with VITE_** — it must stay server-side only). Not needed
     for barcode scanning.

### Netlify
1. Push to GitHub, same as above
2. https://app.netlify.com → "Add new site" → import the repo
3. Build command: `npm run build` · Publish directory: `dist`
4. Add the same two environment variables (`VITE_USDA_API_KEY`,
   `GEMINI_API_KEY`) under Site settings → Environment
   variables. Note: Netlify's serverless functions live in a different folder
   convention (`netlify/functions/`) than Vercel's (`api/`) — if you deploy to
   Netlify instead of Vercel, tell me and I'll adapt `api/analyze-food.js`
   accordingly; as written now it targets Vercel's convention.

### No GitHub? Drag-and-drop
Run `npm run build` locally, then drag the resulting `dist/` folder onto
https://app.netlify.com/drop. Works for the core app **including barcode
scanning** (it's fully client-side), but **photo scanning won't work this
way** — serverless functions need a real project connection, not just a
static folder drop.

## 4. Setting up food scanning

**Barcode scanning needs zero setup.** It runs entirely in the browser and
looks products up in the free Open Food Facts database. It only requires the
site to be served over HTTPS (any real deployment is) so the browser will
grant camera access — that's it. If a scanned product isn't in Open Food
Facts, fall back to a photo estimate or a custom food.

**Photo scanning** (optional) uses Google Gemini's free tier:

1. Get a **free** Gemini API key at https://aistudio.google.com/apikey
   (no credit card required). The free tier is rate-limited per project but
   costs nothing — plenty for personal food logging.
2. **Do not** put this key in your local `.env` for `npm run dev`, and do not
   prefix it with `VITE_` — that would bundle it into the public JavaScript
   anyone can read. It only goes into your hosting platform's server-side
   environment variables as `GEMINI_API_KEY` (see step 4 in each deploy
   section above).
3. **Testing locally**: plain `npm run dev` does NOT run the `/api` function
   — that's Vercel-specific serverless infrastructure. To test photo scanning
   before deploying, either (a) deploy to Vercel and test there, or (b)
   install the Vercel CLI and run `vercel dev` instead of `npm run dev`,
   which emulates the serverless functions locally (only then does putting
   `GEMINI_API_KEY` in a local `.env` make sense).
4. Once deployed with `GEMINI_API_KEY` set, tap "Scan Food" (Home) or
   "Scan" (Nutrition tab) → "Photo" to try it.

## Data & privacy

- All data (profile, food log, routines, workout history, weigh-ins) is
  stored in your browser's `localStorage` — nothing leaves your device except
  food search requests to USDA/Open Food Facts (only your search text),
  barcode lookups to Open Food Facts (only the scanned product code), and,
  if you use photo scanning, photos sent to Google Gemini for analysis via
  your own backend function. Photos aren't stored anywhere by this app —
  they're sent, analyzed, and discarded per request.
- Different browser or device = different, separate data. There's no account
  system or sync — this app doesn't have a backend beyond the one small
  function for photo analysis.
- Profile → Data → "Export my data" downloads everything as a JSON file.
- Clearing your browser's site data for this app will erase everything with
  no way to recover it — export first if that matters to you.

## Known gaps (same as the claude.ai version)

- No multi-ingredient recipe builder (custom single-food entries work fine)
- No manual macro-target override UI (targets always recalc from your stats)
- No unified cross-app search bar (search lives inside Nutrition and Workouts separately)
- Exercise/food seed data is curated, not sourced from a licensed database —
  it's clearly labeled "Reference"/"Estimated" throughout
