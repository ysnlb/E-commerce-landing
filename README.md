# DZ Ad Creatives

Personal tool that generates tall, single-image e-commerce ad creatives (Arabic/Darija, full RTL) in the style of Algerian dropshipping ads.

**Stack:** React + Vite (JavaScript) · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage) · Vercel · `html-to-image` (added in the export phase)

## Status

- **Phase 1 ✓** — scaffolding, RTL base + Cairo font, Supabase client, single-account auth, routing (`/login`, `/`, `/new`), temporary connection debug panel on the dashboard.
- **Phase 2 ✓** — `/new` product form: base fields + template selector, 3 feature rows with a fixed lucide icon set, multi-image upload (1–4 images, previews, drag reorder) into `product-images/{product_id}/`, inline validation, insert + redirect.
- **Phase 3 ✓** — `/preview/:productId`: TemplateCanvas (1080px fixed-width RTL ad canvas) switching between Template A (container/home), B (wearable), C (gadget), populated from the Supabase row, scaled responsively via ScaledPreview. Headline supports an optional `~word~` strikethrough. Graceful fallbacks for missing images/descriptions.
- **Phase 4 ✓** — export on the preview page: `html-to-image` capture of the full-res canvas at 2× pixel ratio, WebP/JPG toggle, slugged download filename, loading + error states.
- **Phase 5 ✓** — dashboard: product cards (thumbnail, name, price, date, template badge) linking to the preview, edit via the reused form at `/edit/:productId`, two-step inline delete with storage cleanup, empty state. Debug panel removed.
- **Phase 6 ✓** — AI placeholder hooks in `src/lib/aiHooks.js` (`generateCopy` → Darija ad copy, `enhanceImage`, `selectTemplate`), wired to form buttons (suggest copy, per-thumbnail enhance, auto-pick template) with toast feedback. Each hook currently throws; the form already applies their documented return shapes, so wiring a real API later is a **one-file change** in `aiHooks.js`.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL editor** → paste and run `supabase/schema.sql`. It creates the `products` table (with RLS locked to authenticated users), the public `product-images` storage bucket, and the storage policies.
3. **Authentication → Sign In / Up** → turn **off** "Allow new users to sign up" (this is a single-account app).
4. **Authentication → Users → Add user → Create new user** → enter your email + a strong password → check **Auto Confirm User**.

### 2. Local

```bash
npm install
cp .env.example .env   # fill both values from Supabase → Project Settings → API
npm run dev
```

### 3. First run

1. Open the app → `/login` → sign in with the user you created.
2. Add a product from **منتج جديد** (name, headline and at least one image are required).
3. It appears on the dashboard → open its card to preview the template → **تصدير** downloads the ad image (WebP or JPG, 2× resolution).

### 4. Deploy (Vercel)

1. Import this repo in Vercel — the Vite framework preset is auto-detected.
2. Add the env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Deploy. `vercel.json` already rewrites all routes to `index.html` so client-side routes work on refresh.

## Notes

- Env vars use the `VITE_` prefix because Vite only exposes prefixed variables to client code.
- Don't add module-level `throw`s keyed on `import.meta.env` values: they're inlined at build time, and a statically always-true throw lets the bundler dead-code-eliminate everything after it (blank app). `createClient` already fails loudly if the vars are missing.
- The anon key is public by design; the RLS policies in `supabase/schema.sql` are what restrict `products` and storage writes to the authenticated account.
