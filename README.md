# DZ Ad Creatives

Personal web tool that generates **tall, single-image e-commerce ad creatives** in the style of Algerian dropshipping ads — Arabic/Darija copy, full RTL layout, product photos, benefit icons, and a green "Cash on Delivery" badge. Products are stored in Supabase and rendered through one of **four 800px-wide landing-page templates** (up to 7000px tall — every section collapses when its data is empty, so pages shorten automatically), then exported client-side as a downloadable WebP/JPG at 2× resolution. Single-user app: one hardcoded Supabase Auth account, no sign-up flow.

## Tech stack

Verified against `package.json`:

| Package | Version | Role |
|---|---|---|
| `react` / `react-dom` | ^19.2.7 | UI (uses React 19 ref-as-prop, no forwardRef) |
| `vite` | ^8.1.5 | Build tool (Rolldown-based) |
| `@vitejs/plugin-react` | ^6.0.3 | JSX transform |
| `tailwindcss` + `@tailwindcss/vite` | ^4.3.3 | Styling — v4, theme tokens in `src/index.css`, no `tailwind.config.js` |
| `react-router-dom` | ^7.18.1 | Routing |
| `@supabase/supabase-js` | ^2.110.7 | Postgres + Auth + Storage client |
| `html-to-image` | ^1.11.13 | DOM → image export |
| `lucide-react` | ^1.25.0 | Icons (feature picker + UI) |

Font: **Cairo** via Google Fonts `<link>` in `index.html` (not bundled). No test runner, linter, or formatter is configured.

## Prerequisites

- **Node** `^20.19.0 || >=22.12.0` (from Vite 8's `engines` field) + npm
- A **Supabase** account (free tier is enough)
- A Chromium-based browser is recommended — WebP export depends on `canvas.toBlob('image/webp')` encoder support (see Known issues)

## Environment variables

The only env reads in the codebase are in `src/lib/supabase.js` (`import.meta.env.*`; no `process.env` usage anywhere):

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

`.env.example` exists — copy it:

```bash
cp .env.example .env   # then fill in both values
```

The `VITE_` prefix is required (Vite only exposes prefixed vars to client code).

> ⚠️ **Do not add a top-level `throw` keyed on these env values.** They are inlined at build time; a statically always-true throw lets the bundler dead-code-eliminate the entire app (this actually happened during development — env-less builds produced a 330 kB vendor-only bundle and a blank page). `createClient` already fails loudly at runtime if the vars are missing.

## Supabase setup

There is no migrations folder; the full schema lives in [`supabase/schema.sql`](supabase/schema.sql). Run it once in the Supabase **SQL editor**:

```sql
-- Products table
create table products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  price numeric,
  old_price numeric, -- compare-at price (strikethrough in the price pill)
  template_id text not null default 'A', -- 'A' | 'B' | 'C' | 'D'
  theme_id text not null default 'warm', -- see src/lib/themes.js
  announcement text, -- top ribbon, e.g. "تخفيض 30% وتوصيل مجاني"
  badge text, -- authority line, e.g. "الأكثر مبيعا في الجزائر"
  headline text,
  subheadline text,
  description text,
  features jsonb, -- array of { icon, label, description } (up to 6)
  usage_steps text, -- how-to steps, one per line
  specs jsonb, -- array of { label, value } (spec table)
  reviews jsonb, -- array of { name, text } (testimonials)
  closing_line text, -- bold closing headline above the CTA
  image_urls text[], -- array of Supabase Storage public URLs (up to 10)
  updated_at timestamptz default now()
);

-- The anon key ships in the browser bundle — lock the table to signed-in users
alter table products enable row level security;

create policy "Authenticated full access"
  on products for all
  to authenticated
  using (true)
  with check (true);

-- Keep updated_at fresh automatically (the app never sets it client-side)
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- Storage: public-read bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);

create policy "Authenticated read product-images"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images');

create policy "Authenticated upload product-images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

create policy "Authenticated update product-images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images');

create policy "Authenticated delete product-images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');
```

> **Existing database?** Run whichever of these you're missing (all idempotent):
> ```sql
> alter table products add column if not exists theme_id text not null default 'warm';
> alter table products add column if not exists old_price numeric;
> alter table products add column if not exists announcement text;
> alter table products add column if not exists badge text;
> alter table products add column if not exists usage_steps text;
> alter table products add column if not exists specs jsonb;
> alter table products add column if not exists reviews jsonb;
> ```

**Bucket access model:** `product-images` is a **public-read** bucket (anyone with a URL can view images — required because exported ads and the templates load them directly); all writes/deletes require an authenticated session.

**Auth (single account):**
1. Authentication → Sign In / Up → turn **off** "Allow new users to sign up". The RLS policy grants *every* authenticated user full access, so this toggle is the actual security boundary.
2. Authentication → Users → **Add user → Create new user** → your email + password → check **Auto Confirm User**.

## Installation & running locally

Commands verified against `package.json` scripts:

```bash
npm install
npm run dev       # Vite dev server
npm run build     # production build → dist/
npm run preview   # serve the built dist/ locally
```

## AI features (Gemini via Supabase Edge Functions)

The three AI buttons (اقتراح النصوص، تحسين الصورة، اختيار تلقائي) are fully wired end-to-end. The Gemini API key lives **server-side only** — three Edge Functions in [`supabase/functions/`](supabase/functions) verify your Supabase login (the anon key alone is rejected), call Gemini, and return results to `src/lib/aiHooks.js`:

| Function | Does | Model (default) |
|---|---|---|
| `generate-copy` | Full ad copy in **Algerian Darija**: headline/sub/paragraphs, 4–6 features (icons constrained to the app's 12 keys), announcement ribbon, trust badge, usage steps, closing line. Reviews are deliberately NOT AI-generated. | `gemini-2.5-flash` |
| `enhance-image` | Product photo cleanup: clutter removed, clean studio background, better lighting — product itself untouched | `gemini-2.5-flash-image` |
| `select-template` | Picks `template_id` (A/B/C/D) **and** `theme_id`, optionally looking at the first product photo | `gemini-2.5-flash` |

### One-time setup (~5 minutes)

1. Get a Gemini API key at [aistudio.google.com](https://aistudio.google.com) → **Get API key**. Never commit it or paste it into chats — it only goes into step 3.
2. Link the repo to your Supabase project (project ref = the id in your dashboard URL):
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```
3. Store the key as a server-side secret:
   ```bash
   npx supabase secrets set GEMINI_API_KEY=your_key_here
   ```
4. Deploy the three functions:
   ```bash
   npx supabase functions deploy generate-copy enhance-image select-template
   ```
   *No CLI? Dashboard alternative: Edge Functions → Deploy a new function → create each of the three names and paste the code from `supabase/functions/<name>/index.ts` (plus `_shared/mod.ts` alongside), then add `GEMINI_API_KEY` under Edge Functions → Secrets.*
5. Done — press the buttons in the form. Errors (missing key, quota, etc.) surface in the toast's detail line.

**If Google renames models later:** override without code changes via secrets `GEMINI_TEXT_MODEL` / `GEMINI_IMAGE_MODEL`.

## Feature status

### Implemented (code-complete)

- **`/login`** (`src/pages/Login.jsx`) — email + password via `supabase.auth.signInWithPassword`, inline error, redirect on success. Session state lives in `src/hooks/useSession.js` (initial `getSession` + `onAuthStateChange`); `/`, `/new`, `/edit/:id`, `/preview/:id` redirect to `/login` without a session.
- **`/` dashboard** (`src/pages/Dashboard.jsx`) — fetches `id, name, price, template_id, image_urls, created_at` ordered newest-first; cards with first-image thumbnail, name, price (`ar-DZ` locale), created date, template badge; **edit** link; **two-step inline delete** (row first, then best-effort storage cleanup via `src/lib/storage.js`); empty state linking to `/new`.
- **`/new` and `/edit/:productId`** (`src/pages/ProductForm.jsx`, one shared component) — fields: name*, price, template dropdown (A/B/C), headline*, subheadline, description, 3 feature rows (icon from the fixed 12-icon map in `src/lib/icons.js` + label + description), closing line; `ImageUploader` (1–4 images, local previews, native HTML5 drag reorder, first image = main, ≥1 required); inline validation, no alerts. Create: client-generated uuid → uploads to `product-images/{id}/{timestamp}-{n}.{ext}` → insert. Edit: prefills from the row, mixed existing-URL/new-File images, uploads only new files, removes dropped images from storage after a successful update. Failed saves clean up newly uploaded files.
- **`/preview/:productId`** (`src/pages/Preview.jsx`) — fetches the row, renders `TemplateCanvas` (fixed 800px RTL canvas, hard-capped at 7000px, switches A/B/C/D by `template_id`) inside `ScaledPreview`. Toolbar: **template switcher and theme switcher (both persist to the row)**, live height chip (800 × Npx) with an amber warning when content exceeds the 7000px cap, WebP/JPG toggle → `html-to-image` `toCanvas` at `pixelRatio: 2` → download named `{slug}-ad.{ext}`. Loading + inline error states.
- **Templates** (`src/components/templates/`) — four landing-page layouts modeled on real DZ dropshipping references, built from a shared section kit (`shared.jsx`: announcement bar, price pill with strikethrough old price, discount badge, pill/ribbon headings, icon grids and rows, bullet/numbered lists, photo bands/grids/collage with optional check overlays, numbered usage steps, key/value specs table, COD/delivery/warranty/support trust strip, star-rated testimonials, wax-seal + CTA closing block):
  - **A — متجر أنيق**: dark hero, bestseller badge, price pill, bullets beside a photo, ink callout band (refs: smartwatch/ultrasonic ads)
  - **B — قصة إقناع**: pain-question headline, big circle photo, colored answer, outline icon grid, alternating paragraph/photo story (refs: fuel saver/joint cream)
  - **C — كتالوج فاخر**: ribbon headings, photo collage, inline icon row, alternating bands, specs table (refs: makeup bag/projector)
  - **D — عرض ترويجي**: discount badge on the hero, early price + CTA, results grid with check overlays, numbered feature list, steps (refs: window cleaner/ginger spray)

  Every section renders only when its data exists, so sparse products produce short pages. **Six selectable themes** (palette + Arabic font pairing) via `products.theme_id`, injected as CSS variables on the canvas root.

### Usage conventions (data-driven behavior)

- **Strikethrough sub-word:** wrap a word in tildes in the headline — `وداعاً للفوضى ~وللغلاء~` — to get the strikethrough "before" effect. No tildes = plain headline.
- **Image order matters (up to 10):** image 1 is always the hero; the rest flow into each template's photo slots in order (bands, grids, collage). More images = a longer page. Reorder with the arrows (or drag on desktop).
- **Description = paragraphs:** each line is a paragraph, placed between photo sections (story flow). 2–4 short paragraphs work best.
- **`usage_steps`** renders as a numbered how-to list (one step per line); **`specs`** as a bordered key/value table; **`reviews`** as testimonial cards with a star row and initial avatars.
- **`closing_line` renders as the bold closing headline** (e.g. «خزانتك تولي تبرق ومفرزة!»); the CTA pill text is fixed («اطلب الآن»).
- **Themes:** six palette + font presets — `warm`, `night`, `mint`, `blush`, `ocean`, `poster` (defined in `src/lib/themes.js`) — picked in the form or switched live from the preview toolbar (persists to the row). Unknown ids fall back to `warm`.

### AI features (implemented — need the one-time setup above)

- **`src/lib/aiHooks.js`** calls the three Edge Functions via `supabase.functions.invoke` (your login JWT is sent automatically):
  - `generateCopy(productInfo)` → Darija ad copy; the form merges `{ headline, subheadline, description, features[], closing_line }` into the fields
  - `enhanceImage(imageFile)` → accepts a new File or an already-uploaded image URL; resolves a `File` and the thumbnail swaps in place
  - `selectTemplate(productInfo)` → resolves `{ template_id, theme_id }`; the form applies both
  - Until the functions are deployed and `GEMINI_API_KEY` is set, the buttons show a failure toast with the technical detail.

### Field coverage

- Every field now renders somewhere: `description` becomes the story paragraphs, `price`/`old_price` feed the price pill and the derived discount badge, and `announcement`/`badge`/`usage_steps`/`specs`/`reviews` each have dedicated sections that vanish when empty.

## Known issues / needs testing

Built across separate prompts; the following is an honest audit:

- **End-to-end Supabase flows are untested against a live project.** Login, insert, upload, edit, delete, and RLS behavior are code-reviewed but were never executed with real credentials (none exist in the dev environment). Run through the checklist and watch the browser console on first use.
- **The export capture is unverified in a real browser.** The prerequisites are wired correctly per docs — Google Fonts `<link>` has `crossorigin` so `html-to-image` can embed Cairo, template `<img>`s set `crossOrigin="anonymous"`, Supabase public storage serves `Access-Control-Allow-Origin: *` — but an actual `toCanvas` run with Supabase-hosted images has not been performed. If exported files miss photos or fonts, suspect CORS/caching first.
- **WebP encoding is browser-dependent.** `canvas.toBlob('image/webp')` is supported in Chromium; Safari may return `null` (the UI surfaces this as an inline error). Use JPG there.
- **Templates were visually verified — with mock data.** All three templates were rendered and inspected via a standalone harness (sample Darija copy + inline data-URI images). That pass caught and fixed a real bug: `ScaledPreview` collapsed to ~4px because the flex child stretched to the outer's derived height (ResizeObserver feedback loop). The `items-start` on the outer container is load-bearing — see the comment in `src/components/ScaledPreview.jsx`. Rendering with real Supabase URLs is expected to be identical but wasn't part of that pass.
- **Image reordering:** arrow buttons on each thumbnail work everywhere (including touch); drag-and-drop additionally works on desktop only (native HTML5 drag events).
- **Storage cleanup is best-effort.** Delete removes the DB row first, then files — a failed cleanup silently leaves orphan files in the bucket. Same pattern for failed saves.
- **RLS is account-wide, not row-scoped.** Any authenticated user has full access; security rests on keeping Supabase sign-ups disabled.
- **The 7000px cap hard-clips overflowing content** (`overflow: hidden` on the canvas). The preview shows an amber warning with the real content height when this happens — trim images/paragraphs until it clears.
- **The AI path is untested end-to-end until a real `GEMINI_API_KEY` is set** — the Edge Functions and client wiring are code-complete but have never run against live Gemini. First test each button on a saved product and read the toast detail line if something fails. Model names are pinned to `gemini-2.5-flash` / `gemini-2.5-flash-image` defaults and can be overridden via secrets if Google renames them.
- **`selectTemplate` sees image URLs only in edit mode** — on a fresh `/new`, files aren't uploaded yet, so it decides from text alone there. `enhance-image` payloads are limited by function/Gemini request caps (~20 MB); extremely large photos may fail.
- **A production build without env vars "succeeds" silently** — `createClient(undefined)` then throws at runtime (blank page + console error). If a deployed site renders nothing, check the Vercel env vars before anything else.
- **The closing contains a painted, non-interactive CTA pill** («اطلب الآن») — a deliberate deviation from the original "no button" requirement, added to match the reference ad design the templates were rebuilt against. Remove `CtaPill` from `ClosingSection` if unwanted.
- **No automated tests, no linting.**

## Deployment (Vercel)

1. Import the GitHub repo in Vercel — the Vite framework preset is auto-detected (`npm run build` → `dist/`).
2. Add **both** env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. They are baked in at build time — after changing them, **redeploy**.
3. Deploy. `vercel.json` rewrites all routes to `index.html`, so client-side routes (`/preview/...`, `/edit/...`) survive refreshes and deep links.

## Project structure

```
├── index.html                    RTL/ar root, Cairo font links (crossorigin needed for export)
├── vercel.json                   SPA rewrite (all routes → index.html)
├── vite.config.js                React + Tailwind v4 plugins
├── .env.example                  the two required VITE_ vars
├── supabase/
│   ├── schema.sql                products table + RLS + updated_at trigger + bucket + storage policies
│   └── functions/                AI Edge Functions (deploy once, key stays server-side)
│       ├── _shared/mod.ts        CORS/JSON helpers, auth guard, Gemini REST helpers
│       ├── generate-copy/        Darija ad copy (JSON schema, icon enum)
│       ├── enhance-image/        product photo cleanup (base64 or URL in, image out)
│       └── select-template/      picks template A/B/C + theme, sees first photo
└── src/
    ├── main.jsx                  entry, mounts <App/>
    ├── App.jsx                   routes + session gate (/login, /, /new, /edit/:id, /preview/:id)
    ├── index.css                 Tailwind v4 import + palette/font theme tokens (cream/charcoal/leather/cod)
    ├── lib/
    │   ├── supabase.js           client from VITE_ env vars (deliberately no top-level guard — see above)
    │   ├── icons.js              fixed 12-icon feature map + Arabic tooltip labels
    │   ├── themes.js             six theme presets (palette + font pairing) + CSS-var injection
    │   ├── storage.js            public URL → bucket path helpers, best-effort file removal
    │   └── aiHooks.js            AI client: calls the Edge Functions, converts results for the form
    ├── hooks/
    │   └── useSession.js         Supabase session state + auth listener
    ├── components/
    │   ├── Layout.jsx            app shell: header, «منتج جديد» nav, logout
    │   ├── ImageUploader.jsx     1–4 images, previews, drag reorder, optional AI-enhance button
    │   ├── ScaledPreview.jsx     fit-to-width scaler (items-start is load-bearing — see comment)
    │   └── templates/
    │       ├── TemplateCanvas.jsx  800px RTL canvas (7000px cap), A/B/C/D switch, export ref
    │       ├── TemplateA.jsx       متجر أنيق — dark hero + price + bullets + testimonials
    │       ├── TemplateB.jsx       قصة إقناع — pain question + circle photo + icon grid
    │       ├── TemplateC.jsx       كتالوج فاخر — ribbons + collage + specs table
    │       ├── TemplateD.jsx       عرض ترويجي — discount + numbered list + steps
    │       └── shared.jsx          section kit (price pill, grids, steps, specs, trust, reviews…)
    └── pages/
        ├── Login.jsx             single-account sign-in
        ├── Dashboard.jsx         product cards, edit / two-step delete, empty state
        ├── ProductForm.jsx       create + edit form, uploads, AI stub buttons, toast
        └── Preview.jsx           template preview + WebP/JPG export at 2×
```
