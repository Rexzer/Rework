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
- **Live food search**: USDA FoodData Central and Open Food Facts are called
  directly from the browser. This *should* work here (unlike inside the
  claude.ai artifact, which blocks that entirely) — but I want to be upfront
  that I could not verify this myself before handing it to you: I don't have a
  way to run a live build or open a real browser from where I work, and I
  specifically was not able to confirm USDA's API sends the CORS header
  browsers require for this to work cross-origin. **If USDA results don't show
  up in your search once deployed**, that's the most likely cause, and the fix
  is a small serverless proxy function (say the word and I'll write one) — not
  a caching or code bug beyond that.
- **Photo food scanning** ("Scan Food" on Home, or "Scan" in the Nutrition
  tab): take or upload a photo, and a backend function (`api/analyze-food.js`)
  sends it to Claude's vision API to estimate the food, calories, and macros,
  which you can edit before logging. This needs your own Anthropic API key —
  see section 4 below. **Unlike the USDA key, this one must never be exposed
  to the browser** — it's billed per request, so an exposed key is a real
  financial risk, not just an inconvenience. That's why it lives in a backend
  function instead of a `VITE_`-prefixed variable.

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
skipped (Open Food Facts and your local food library still work).

**A note on the very first `npm install`:** I was not able to run this myself
before giving it to you (my own sandbox's network access to the npm registry
turned out to be blocked, despite documentation suggesting otherwise). This
project is a standard, common combination of packages (React 18 + Vite +
Tailwind + recharts + lucide-react) so I'm fairly confident it'll install
cleanly, but if `npm install` or `npm run dev` throws an error, paste it back
to me and I'll fix it immediately — I just want you to know this step hasn't
been tested end-to-end yet.

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

Any static host works for the app itself, but **photo scanning needs a host
that runs serverless functions** (the `api/` folder) — Vercel and Netlify both
do this natively.

### Vercel (recommended, simplest)
1. Push this folder to a GitHub repo (private is fine)
2. Go to https://vercel.com → "Add New Project" → import the repo
3. Vercel auto-detects Vite — just click Deploy
4. Add environment variables under Project Settings → Environment Variables,
   then redeploy (env vars from your local `.env` do NOT travel with the
   deployment automatically):
   - `VITE_USDA_API_KEY` — your USDA key (safe to be client-exposed, it's free/rate-limited)
   - `ANTHROPIC_API_KEY` — your Anthropic key, for photo scanning (**do NOT
     prefix this with VITE_** — it must stay server-side only)

### Netlify
1. Push to GitHub, same as above
2. https://app.netlify.com → "Add new site" → import the repo
3. Build command: `npm run build` · Publish directory: `dist`
4. Add the same two environment variables under Site settings → Environment
   variables. Note: Netlify's serverless functions live in a different folder
   convention (`netlify/functions/`) than Vercel's (`api/`) — if you deploy to
   Netlify instead of Vercel, tell me and I'll adapt `api/analyze-food.js`
   accordingly; as written now it targets Vercel's convention.

### No GitHub? Drag-and-drop
Run `npm run build` locally, then drag the resulting `dist/` folder onto
https://app.netlify.com/drop. Works for the core app, but **photo scanning
won't work this way** — serverless functions need a real project connection,
not just a static folder drop.

## 4. Setting up photo food scanning

1. Get an Anthropic API key at https://console.anthropic.com (this is a
   **billed** API, unlike the free USDA/Open Food Facts integrations — check
   current pricing at https://www.anthropic.com/pricing before relying on this
   heavily; a single food photo is a small request, but it's not free)
2. **Do not** put this key in your local `.env` file / do not prefix it with
   `VITE_` — that would bundle it into the public JavaScript anyone can read.
   It only goes into your hosting platform's server-side environment
   variables (see step 4 in each deploy section above)
3. **Testing locally**: plain `npm run dev` does NOT run the `/api` function
   — that's Vercel-specific serverless infrastructure. To test photo scanning
   before deploying, either (a) deploy to Vercel and test there, or (b)
   install the Vercel CLI and run `vercel dev` instead of `npm run dev`,
   which emulates the serverless functions locally
4. Once deployed with `ANTHROPIC_API_KEY` set, tap "Scan Food" (Home) or
   "Scan" (Nutrition tab) to try it

## Data & privacy

- All data (profile, food log, routines, workout history, weigh-ins) is
  stored in your browser's `localStorage` — nothing leaves your device except
  food search requests to USDA/Open Food Facts (only your search text) and,
  if you use it, photos sent to Anthropic's API for analysis via your own
  backend function. Photos aren't stored anywhere by this app — they're sent,
  analyzed, and discarded per request.
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
