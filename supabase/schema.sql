begin;

create table if not exists public.portfolio (
  id boolean primary key default true check (id),
  site jsonb not null check (jsonb_typeof(site) = 'object'),
  projects jsonb not null check (jsonb_typeof(projects) = 'array'),
  revision bigint not null default 1
);
alter table public.portfolio enable row level security;
revoke all on public.portfolio from public, anon, authenticated;
grant select on public.portfolio to authenticated;
grant update (site, projects, revision) on public.portfolio to authenticated;

create schema if not exists portfolio_private;
revoke all on schema portfolio_private from public;
create table if not exists portfolio_private.owner (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null references auth.users(id) on delete cascade
);

create or replace function public.portfolio_is_owner()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from portfolio_private.owner where user_id = (select auth.uid()))
$$;
revoke all on function public.portfolio_is_owner() from public, anon, authenticated;
grant execute on function public.portfolio_is_owner() to authenticated;

drop policy if exists portfolio_owner on public.portfolio;
create policy portfolio_owner on public.portfolio for all to authenticated
using ((select public.portfolio_is_owner())) with check ((select public.portfolio_is_owner()));

create or replace function public.portfolio_published()
returns jsonb language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'site', p.site,
    'projects', coalesce((
      select jsonb_agg(entry.value order by entry.position)
      from jsonb_array_elements(p.projects) with ordinality as entry(value, position)
      where entry.value->'published' = 'true'::jsonb
    ), '[]'::jsonb)
  )
  from public.portfolio p where p.id
$$;
revoke all on function public.portfolio_published() from public;
grant execute on function public.portfolio_published() to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-media', 'portfolio-media', false, 10485760,
        array['image/png','image/jpeg','image/webp','image/gif','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.portfolio_media_published(object_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.portfolio p where p.id and (
      p.site->>'photo' = 'upload:' || object_name
      or p.site->>'resume' = 'upload:' || object_name
      or exists (
        select 1 from jsonb_array_elements(p.projects) entry
        where entry->'published' = 'true'::jsonb and entry->>'image' = 'upload:' || object_name
      )
    )
  )
$$;
revoke all on function public.portfolio_media_published(text) from public;
grant execute on function public.portfolio_media_published(text) to anon, authenticated;

drop policy if exists portfolio_media_owner on storage.objects;
create policy portfolio_media_owner on storage.objects for all to authenticated
using (bucket_id = 'portfolio-media' and (select public.portfolio_is_owner()))
with check (bucket_id = 'portfolio-media' and (select public.portfolio_is_owner()));

drop policy if exists portfolio_media_read on storage.objects;
create policy portfolio_media_read on storage.objects for select to anon, authenticated
using (bucket_id = 'portfolio-media' and public.portfolio_media_published(name));

commit;

