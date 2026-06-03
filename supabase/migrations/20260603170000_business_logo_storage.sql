-- =============================================================================
-- Supabase Storage: per-tenant business logos (public read, owner write)
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-logos',
  'business-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read (anon + authenticated) for public booking pages.
drop policy if exists business_logos_public_read on storage.objects;
create policy business_logos_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'business-logos');

-- Business owners may upload/update/delete only within their business folder.
drop policy if exists business_logos_owner_insert on storage.objects;
create policy business_logos_owner_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] is not null
    and (
      app.is_member_of((storage.foldername(name))[1]::uuid, array['business_owner']::public.member_role[])
      or app.is_platform_admin()
    )
  );

drop policy if exists business_logos_owner_update on storage.objects;
create policy business_logos_owner_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] is not null
    and (
      app.is_member_of((storage.foldername(name))[1]::uuid, array['business_owner']::public.member_role[])
      or app.is_platform_admin()
    )
  )
  with check (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] is not null
    and (
      app.is_member_of((storage.foldername(name))[1]::uuid, array['business_owner']::public.member_role[])
      or app.is_platform_admin()
    )
  );

drop policy if exists business_logos_owner_delete on storage.objects;
create policy business_logos_owner_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] is not null
    and (
      app.is_member_of((storage.foldername(name))[1]::uuid, array['business_owner']::public.member_role[])
      or app.is_platform_admin()
    )
  );
