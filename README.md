# DZ Ad Creatives

Personal web tool that generates **tall, single-image e-commerce ad creatives** in the style of Algerian dropshipping ads — Arabic/Darija copy, full RTL layout, product photos, benefit icons, and a green "Cash on Delivery" badge. Products are stored in Supabase and rendered through one of three fixed 1080px-wide templates, then exported client-side as a downloadable WebP/JPG at 2× resolution. Single-user app: one hardcoded Supabase Auth account, no sign-up flow.

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
  template_id text not null default 'A', -- 'A' | 'B' | 'C'
  headline text,
  subheadline text,
  description text,
  features jsonb, -- array of { icon: string, label: string, description: string }
  closing_line text, -- short supporting line in the closing section
  image_urls text[], -- array of Supabase Storage public URLs
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

## Feature status

### Implemented (code-complete)

- **`/login`** (`src/pages/Login.jsx`) — email + password via `supabase.auth.signInWithPassword`, inline error, redirect on success. Session state lives in `src/hooks/useSession.js` (initial `getSession` + `onAuthStateChange`); `/`, `/new`, `/edit/:id`, `/preview/:id` redirect to `/login` without a session.
- **`/` dashboard** (`src/pages/Dashboard.jsx`) — fetches `id, name, price, template_id, image_urls, created_at` ordered newest-first; cards with first-image thumbnail, name, price (`ar-DZ` locale), created date, template badge; **edit** link; **two-step inline delete** (row first, then best-effort storage cleanup via `src/lib/storage.js`); empty state linking to `/new`.
- **`/new` and `/edit/:productId`** (`src/pages/ProductForm.jsx`, one shared component) — fields: name*, price, template dropdown (A/B/C), headline*, subheadline, description, 3 feature rows (icon from the fixed 12-icon map in `src/lib/icons.js` + label + description), closing line; `ImageUploader` (1–4 images, local previews, native HTML5 drag reorder, first image = main, ≥1 required); inline validation, no alerts. Create: client-generated uuid → uploads to `product-images/{id}/{timestamp}-{n}.{ext}` → insert. Edit: prefills from the row, mixed existing-URL/new-File images, uploads only new files, removes dropped images from storage after a successful update. Failed saves clean up newly uploaded files.
- **`/preview/:productId`** (`src/pages/Preview.jsx`) — fetches the row, renders `TemplateCanvas` (fixed 1080px RTL canvas, switches A/B/C by `template_id`, unknown values fall back to A) inside `ScaledPreview` (fit-to-width scaling, full-res DOM preserved). Export toolbar: WebP/JPG toggle → `html-to-image` `toCanvas` at `pixelRatio: 2` → `canvas.toBlob` → download named `{slug}-ad.{ext}` (slug keeps Arabic letters, falls back to short id). Loading + inline error states.
- **Templates** (`src/components/templates/`) — A (container/home: card photo, 3 icon feature rows + side close-up), B (wearable: full-width lifestyle photo, compact fit/details rows), C (gadget: clean hero card, dense spec-callout grid); shared closing (circular COD stamp, «اطلب الآن!», closing line, optional photo grid). Graceful fallbacks throughout: empty descriptions render nothing, missing images collapse their slots, empty features hide the section.

### Usage conventions (data-driven behavior)

- **Strikethrough sub-word:** wrap a word in tildes in the headline — `وداعاً للفوضى ~وللغلاء~` — to get the strikethrough "before" effect. No tildes = plain headline.
- **Image order matters:** image 1 = hero/lifestyle, image 2 = side close-up (A) / first variant (B/C), images 3–4 = closing-section grids. Reorder by dragging in the form.

### Placeholders / stubs (NOT functional)

- **`src/lib/aiHooks.js`** — all three functions throw immediately (`… not configured yet — add API key in aiHooks.js`):
  - `generateCopy(productInfo)` → will draft Darija ad copy; documented to resolve `{ headline, subheadline, description, features[], closing_line }`
  - `enhanceImage(imageFile)` → will clean up product photos; documented to resolve a Blob/File
  - `selectTemplate(productInfo)` → will pick `'A' | 'B' | 'C'`; until then template choice is the manual dropdown
  - The form buttons (اقتراح النصوص, per-thumbnail ✨ enhance, اختيار تلقائي) call these, show a toast on the throw, and **already apply the documented return shapes** — so implementing a hook in `aiHooks.js` is a one-file change.

### Stored but never rendered

- **`products.description`** — captured and saved by the form, displayed nowhere (no template reads it). Reserved as raw input for `generateCopy`.
- **`products.price`** — saved and shown on dashboard cards only; **not rendered inside any ad template** (the reference designs omit price).

## Known issues / needs testing

Built across separate prompts; the following is an honest audit:

- **End-to-end Supabase flows are untested against a live project.** Login, insert, upload, edit, delete, and RLS behavior are code-reviewed but were never executed with real credentials (none exist in the dev environment). Run through the checklist and watch the browser console on first use.
- **The export capture is unverified in a real browser.** The prerequisites are wired correctly per docs — Google Fonts `<link>` has `crossorigin` so `html-to-image` can embed Cairo, template `<img>`s set `crossOrigin="anonymous"`, Supabase public storage serves `Access-Control-Allow-Origin: *` — but an actual `toCanvas` run with Supabase-hosted images has not been performed. If exported files miss photos or fonts, suspect CORS/caching first.
- **WebP encoding is browser-dependent.** `canvas.toBlob('image/webp')` is supported in Chromium; Safari may return `null` (the UI surfaces this as an inline error). Use JPG there.
- **Templates were visually verified — with mock data.** All three templates were rendered and inspected via a standalone harness (sample Darija copy + inline data-URI images). That pass caught and fixed a real bug: `ScaledPreview` collapsed to ~4px because the flex child stretched to the outer's derived height (ResizeObserver feedback loop). The `items-start` on the outer container is load-bearing — see the comment in `src/components/ScaledPreview.jsx`. Rendering with real Supabase URLs is expected to be identical but wasn't part of that pass.
- **Drag reorder is desktop-only** (native HTML5 drag events; no touch support).
- **Storage cleanup is best-effort.** Delete removes the DB row first, then files — a failed cleanup silently leaves orphan files in the bucket. Same pattern for failed saves.
- **RLS is account-wide, not row-scoped.** Any authenticated user has full access; security rests on keeping Supabase sign-ups disabled.
- **Template C caps at 3 spec callouts** (the design brief mentioned 3–4, but the form has exactly 3 feature rows). Template A's optional closing grid similarly maxes out at 2 photos (brief said 2–3) because of the 4-image cap.
- **`selectTemplate` gets image URLs only in edit mode** — on a fresh `/new`, files aren't uploaded yet, so the stub receives an empty `image_urls` list. Fine for now; worth revisiting when wiring real AI.
- **A production build without env vars "succeeds" silently** — `createClient(undefined)` then throws at runtime (blank page + console error). If a deployed site renders nothing, check the Vercel env vars before anything else.
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
│   └── schema.sql                products table + RLS + updated_at trigger + bucket + storage policies
└── src/
    ├── main.jsx                  entry, mounts <App/>
    ├── App.jsx                   routes + session gate (/login, /, /new, /edit/:id, /preview/:id)
    ├── index.css                 Tailwind v4 import + palette/font theme tokens (cream/charcoal/leather/cod)
    ├── lib/
    │   ├── supabase.js           client from VITE_ env vars (deliberately no top-level guard — see above)
    │   ├── icons.js              fixed 12-icon feature map + Arabic tooltip labels
    │   ├── storage.js            public URL → bucket path helpers, best-effort file removal
    │   └── aiHooks.js            STUBS: generateCopy / enhanceImage / selectTemplate (all throw)
    ├── hooks/
    │   └── useSession.js         Supabase session state + auth listener
    ├── components/
    │   ├── Layout.jsx            app shell: header, «منتج جديد» nav, logout
    │   ├── ImageUploader.jsx     1–4 images, previews, drag reorder, optional AI-enhance button
    │   ├── ScaledPreview.jsx     fit-to-width scaler (items-start is load-bearing — see comment)
    │   └── templates/
    │       ├── TemplateCanvas.jsx  1080px RTL canvas, A/B/C switch, export ref target
    │       ├── TemplateA.jsx       container/home item layout
    │       ├── TemplateB.jsx       wearable/clothing layout
    │       ├── TemplateC.jsx       small gadget/specs layout
    │       └── shared.jsx          Headline (~strike~), IconCircle, CodBadge, ClosingSection
    └── pages/
        ├── Login.jsx             single-account sign-in
        ├── Dashboard.jsx         product cards, edit / two-step delete, empty state
        ├── ProductForm.jsx       create + edit form, uploads, AI stub buttons, toast
        └── Preview.jsx           template preview + WebP/JPG export at 2×
```
