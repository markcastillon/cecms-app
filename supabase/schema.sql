-- CECMS database for Supabase.
-- Run this whole file once in Supabase > SQL Editor, then run seed.sql for sample data.
--
-- Security model (Row Level Security):
--   * Public visitors (anon): read centers, active announcements and policies,
--     read numbers-only totals through get_public_status(), and submit a volunteer sign-up.
--   * Staff: any signed-in user whose row in public.staff has approved = true.
--     New accounts start unapproved, so registering alone never exposes evacuee data.
--     Approve someone in Table Editor > staff by setting approved to true.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.centers (
  id text primary key,
  name text not null,
  location text not null default '',
  capacity integer not null default 0 check (capacity >= 0),
  status_override text not null default '' check (status_override in ('', 'Open', 'Nearly Full', 'Full', 'Closed')),
  contact_person text not null default '',
  contact_number text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  head_of_family text not null,
  purok text not null default '',
  contact_number text not null default '',
  center_id text not null references public.centers(id),
  house_damage text not null default 'None',
  status text not null default 'Sheltered' check (status in ('Sheltered', 'Returned home')),
  registered_at timestamptz not null default now()
);

create table if not exists public.evacuees (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  full_name text not null,
  age integer not null check (age between 0 and 120),
  sex text not null check (sex in ('M', 'F')),
  relationship text not null default '',
  vulnerable_group text not null default '',
  center_id text not null references public.centers(id),
  status text not null default 'Sheltered' check (status in ('Sheltered', 'Returned home')),
  arrived_at timestamptz not null default now()
);
create index if not exists evacuees_center_status on public.evacuees (center_id, status);
create index if not exists evacuees_family on public.evacuees (family_id);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null default '',
  priority text not null default 'info' check (priority in ('urgent', 'warning', 'info')),
  active boolean not null default true,
  posted_at timestamptz not null default now()
);

create table if not exists public.supplies (
  id text primary key default ('S-' || substr(gen_random_uuid()::text, 1, 8)),
  center_id text not null references public.centers(id),
  item text not null,
  unit text not null default '',
  quantity_received integer not null default 0 check (quantity_received >= 0),
  quantity_released integer not null default 0 check (quantity_released >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 80),
  contact_number text not null check (contact_number ~ '^(09|\+639)\d{9}$'),
  email text not null default '' check (char_length(email) <= 120),
  availability text not null check (availability in ('Weekdays', 'Weekends', 'Anytime during emergencies', 'On call only')),
  skills text not null default '' check (char_length(skills) <= 300),
  preferred_center text not null default '' check (char_length(preferred_center) <= 120),
  status text not null default 'Pending review',
  submitted_at timestamptz not null default now()
);

create table if not exists public.policies (
  id text primary key,
  type text not null default 'Policy',
  title text not null,
  summary text not null default '',
  legal_basis text not null default '',
  status text not null default ''
);

create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Staff accounts
-- ---------------------------------------------------------------------------

-- Every new sign-up gets an unapproved staff row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.staff (user_id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.email, ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and approved);
$$;

-- ---------------------------------------------------------------------------
-- Public, numbers-only status (no names or personal details)
-- ---------------------------------------------------------------------------

create or replace function public.get_public_status()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'occupancy', coalesce((
      select json_object_agg(center_id, n)
      from (select center_id, count(*) as n from evacuees where status = 'Sheltered' group by center_id) o
    ), '{}'::json),
    'vulnerable', coalesce((
      select json_agg(json_build_object('group', vulnerable_group, 'count', n) order by vulnerable_group)
      from (select vulnerable_group, count(*) as n from evacuees
            where status = 'Sheltered' and vulnerable_group <> '' group by vulnerable_group) v
    ), '[]'::json)
  );
$$;

grant execute on function public.get_public_status() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.centers enable row level security;
alter table public.families enable row level security;
alter table public.evacuees enable row level security;
alter table public.announcements enable row level security;
alter table public.supplies enable row level security;
alter table public.volunteers enable row level security;
alter table public.policies enable row level security;
alter table public.staff enable row level security;

drop policy if exists "public read centers" on public.centers;
create policy "public read centers" on public.centers for select using (true);
drop policy if exists "staff write centers" on public.centers;
create policy "staff write centers" on public.centers for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "public read active announcements" on public.announcements;
create policy "public read active announcements" on public.announcements for select using (active or public.is_staff());
drop policy if exists "staff write announcements" on public.announcements;
create policy "staff write announcements" on public.announcements for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "public read policies" on public.policies;
create policy "public read policies" on public.policies for select using (true);
drop policy if exists "staff write policies" on public.policies;
create policy "staff write policies" on public.policies for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff only families" on public.families;
create policy "staff only families" on public.families for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff only evacuees" on public.evacuees;
create policy "staff only evacuees" on public.evacuees for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff only supplies" on public.supplies;
create policy "staff only supplies" on public.supplies for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "anyone can sign up to volunteer" on public.volunteers;
create policy "anyone can sign up to volunteer" on public.volunteers for insert to anon, authenticated
  with check (status = 'Pending review');
drop policy if exists "staff read volunteers" on public.volunteers;
create policy "staff read volunteers" on public.volunteers for select to authenticated using (public.is_staff());
drop policy if exists "staff update volunteers" on public.volunteers;
create policy "staff update volunteers" on public.volunteers for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "read own staff row" on public.staff;
create policy "read own staff row" on public.staff for select to authenticated using (user_id = auth.uid() or public.is_staff());

-- ---------------------------------------------------------------------------
-- Realtime: the app refreshes when these tables change
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['centers', 'families', 'evacuees', 'announcements', 'supplies', 'volunteers'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
