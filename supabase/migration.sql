-- ============================================================
-- DZ Ad Creatives — cumulative migration for EXISTING databases.
-- Fresh installs should run schema.sql instead.
-- Fully idempotent: safe to run more than once.
-- ============================================================

-- 1) Columns added after the initial schema
alter table products add column if not exists theme_id text not null default 'warm';
alter table products add column if not exists old_price numeric;
alter table products add column if not exists announcement text;
alter table products add column if not exists badge text;
alter table products add column if not exists usage_steps text;
alter table products add column if not exists specs jsonb;
alter table products add column if not exists reviews jsonb;
alter table products add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- 2) Multi-account ownership (existing rows go to the oldest account)
update products
set user_id = (select id from auth.users order by created_at asc limit 1)
where user_id is null;

alter table products alter column user_id set not null;
alter table products alter column user_id set default auth.uid();
create index if not exists products_user_id_idx on products (user_id);

-- 3) Per-owner row policy (replaces the shared authenticated policy)
drop policy if exists "Authenticated full access" on products;
drop policy if exists "Owner full access" on products;
create policy "Owner full access"
  on products for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 4) Per-owner storage policies. New uploads live under {user_id}/{product_id}/;
--    the "or owner" clause keeps pre-migration files (at {product_id}/...)
--    manageable by their original uploader.
drop policy if exists "Authenticated read product-images" on storage.objects;
drop policy if exists "Authenticated upload product-images" on storage.objects;
drop policy if exists "Authenticated update product-images" on storage.objects;
drop policy if exists "Authenticated delete product-images" on storage.objects;
drop policy if exists "Users upload to own folder" on storage.objects;
drop policy if exists "Users read own files" on storage.objects;
drop policy if exists "Users update own files" on storage.objects;
drop policy if exists "Users delete own files" on storage.objects;

create policy "Users upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users read own files"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (owner_id = auth.uid()::text or owner = auth.uid()));

create policy "Users update own files"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (owner_id = auth.uid()::text or owner = auth.uid()));

create policy "Users delete own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (owner_id = auth.uid()::text or owner = auth.uid()));
