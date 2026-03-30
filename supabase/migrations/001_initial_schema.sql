-- ============================================================
-- Hammers RUFC Inventory Manager — Initial Schema
-- ============================================================

-- Enums
create type user_role as enum ('admin', 'coach', 'equipment_manager');
create type item_condition as enum ('new', 'good', 'fair', 'poor', 'replace');
create type item_status as enum ('available', 'on_loan', 'retired');

-- ============================================================
-- Profiles
-- Extends auth.users; one row per club staff member
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  role        user_role not null default 'coach',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on first Google login
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- Equipment Categories
-- ============================================================
create table equipment_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- Seed default categories
insert into equipment_categories (name, description) values
  ('Match Balls',       'Balls used in official matches'),
  ('Training Balls',    'Balls used in training sessions'),
  ('Jerseys',           'Match and training jerseys'),
  ('Shorts',            'Match and training shorts'),
  ('Socks',             'Match and training socks'),
  ('Training Gear',     'Bibs, cones, tackle pads, shields'),
  ('Medical Kit',       'First aid and medical supplies'),
  ('Scrum Machine',     'Scrummaging equipment'),
  ('Goal Posts',        'Portable goal post equipment'),
  ('Miscellaneous',     'Other club equipment');

-- ============================================================
-- Locations
-- Where equipment lives when not on loan
-- ============================================================
create table locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- Seed default locations
insert into locations (name, description) values
  ('Equipment Room',  'Main club equipment storage'),
  ('Club Van',        'Equipment stored in the club van'),
  ('Medical Bag',     'Travelling medical bag'),
  ('Away Kit Bag',    'Bag used for away fixtures');

-- ============================================================
-- Equipment Items
-- One row per physical, trackable item
-- ============================================================
create table equipment_items (
  id                    uuid primary key default gen_random_uuid(),
  category_id           uuid not null references equipment_categories(id),
  home_location_id      uuid references locations(id),
  name                  text not null,
  asset_tag             text unique,           -- e.g. "BALL-001", printed on item
  serial_number         text,
  description           text,
  purchase_date         date,
  purchase_cost         numeric(10, 2),
  expected_life_years   integer,               -- used for replacement planning
  status                item_status not null default 'available',
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index on equipment_items(category_id);
create index on equipment_items(status);
create index on equipment_items(asset_tag);

-- ============================================================
-- Players
-- Club members who can be assigned equipment (no login)
-- ============================================================
create table players (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  jersey_number integer,
  position     text,
  email        text,
  phone        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- Equipment Loans
-- Check-out / check-in records
-- ============================================================
create table equipment_loans (
  id                   uuid primary key default gen_random_uuid(),
  item_id              uuid not null references equipment_items(id),
  -- Either a player or a named person (for non-player recipients)
  player_id            uuid references players(id),
  recipient_name       text,                   -- fallback if not a registered player
  checked_out_by       uuid not null references profiles(id),  -- staff member who processed it
  checked_out_at       timestamptz not null default now(),
  expected_return_date date,
  purpose              text,                   -- e.g. "Match vs Denver RFC 2026-04-05"
  location_while_out   text,                   -- where the item is while on loan
  -- Check-in fields (null = still out)
  checked_in_at        timestamptz,
  checked_in_by        uuid references profiles(id),
  return_notes         text,
  created_at           timestamptz not null default now(),
  constraint recipient_required check (player_id is not null or recipient_name is not null)
);

create index on equipment_loans(item_id);
create index on equipment_loans(player_id);
create index on equipment_loans(checked_in_at) where checked_in_at is null;  -- fast "currently out" query

-- Keep item status in sync automatically
create or replace function sync_item_status()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update equipment_items set status = 'on_loan', updated_at = now()
    where id = new.item_id;
  elsif TG_OP = 'UPDATE' and new.checked_in_at is not null and old.checked_in_at is null then
    update equipment_items set status = 'available', updated_at = now()
    where id = new.item_id;
  end if;
  return new;
end;
$$;

create trigger on_loan_change
  after insert or update on equipment_loans
  for each row execute procedure sync_item_status();

-- ============================================================
-- Condition Logs
-- Point-in-time condition assessments (decoupled from loans)
-- ============================================================
create table condition_logs (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references equipment_items(id),
  assessed_by  uuid not null references profiles(id),
  assessed_at  timestamptz not null default now(),
  condition    item_condition not null,
  notes        text,
  photo_url    text                              -- Supabase Storage URL
);

create index on condition_logs(item_id, assessed_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles          enable row level security;
alter table equipment_categories enable row level security;
alter table locations         enable row level security;
alter table equipment_items   enable row level security;
alter table players           enable row level security;
alter table equipment_loans   enable row level security;
alter table condition_logs    enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Profiles: users see their own row; admins see all
create policy "profiles_select" on profiles for select to authenticated
  using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles for update to authenticated
  using (id = auth.uid());
create policy "profiles_admin_all" on profiles for all to authenticated
  using (is_admin());

-- Reference tables: all authenticated users can read
create policy "categories_select" on equipment_categories for select to authenticated using (true);
create policy "locations_select"  on locations           for select to authenticated using (true);

-- Reference tables: only admins can modify
create policy "categories_admin" on equipment_categories for all to authenticated using (is_admin());
create policy "locations_admin"  on locations           for all to authenticated using (is_admin());

-- Equipment items: all authenticated can read; admins can write
create policy "items_select" on equipment_items for select to authenticated using (true);
create policy "items_admin"  on equipment_items for all   to authenticated using (is_admin());

-- Players: all authenticated can read; admins can write
create policy "players_select" on players for select to authenticated using (true);
create policy "players_admin"  on players for all   to authenticated using (is_admin());

-- Loans: all authenticated can read; any staff can create (check out); admins can update (check in)
create policy "loans_select" on equipment_loans for select to authenticated using (true);
create policy "loans_insert" on equipment_loans for insert to authenticated with check (true);
create policy "loans_update" on equipment_loans for update to authenticated using (is_admin());

-- Condition logs: all authenticated can read and insert; admins can update/delete
create policy "conditions_select" on condition_logs for select to authenticated using (true);
create policy "conditions_insert" on condition_logs for insert to authenticated with check (true);
create policy "conditions_admin"  on condition_logs for all   to authenticated using (is_admin());
