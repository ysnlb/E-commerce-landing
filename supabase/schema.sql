-- ============================================================
-- DZ Ad Creatives — Phase 1 schema
-- Run this once in the Supabase SQL editor.
-- ============================================================

-- Products table
create table products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz default now(),
  name text not null,
  price numeric,
  old_price numeric, -- compare-at price (strikethrough in the price pill)
  template_id text not null default 'A', -- 'A' | 'B' | 'C' | 'D'
  theme_id text not null default 'warm', -- see src/lib/themes.js (warm | night | mint | blush | ocean | poster)
  announcement text, -- top ribbon, e.g. "تخفيض 30% وتوصيل مجاني"
  badge text, -- authority line, e.g. "الأكثر مبيعا في الجزائر"
  headline text,
  subheadline text,
  description text, -- paragraphs (blank-line separated) interleave with photos
  features jsonb, -- array of { icon: string, label: string, description: string } (up to 6)
  usage_steps text, -- how-to steps, one per line
  specs jsonb, -- array of { label: string, value: string } (spec table)
  reviews jsonb, -- array of { name: string, text: string } (testimonials)
  closing_line text, -- bold closing headline above the CTA
  image_urls text[], -- array of Supabase Storage public URLs (up to 10)
  updated_at timestamptz default now()
);

-- Per-owner isolation: every account only sees and edits its own rows.
alter table products enable row level security;

create policy "Owner full access"
  on products for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index products_user_id_idx on products (user_id);

-- Keep updated_at fresh automatically on every update.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on products
  for each row
  execute function set_updated_at();

-- ============================================================
-- Storage: public-read bucket for product images.
-- (Dashboard alternative: Storage → New bucket → name it
--  "product-images" → toggle "Public bucket" ON → Save.)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);

-- Public read is handled by the bucket's public flag. These policies give
-- each account access to its own files only (uploads go to {user_id}/...).
create policy "Users upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users read own files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and owner_id = auth.uid()::text);

create policy "Users update own files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and owner_id = auth.uid()::text);

create policy "Users delete own files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and owner_id = auth.uid()::text);
