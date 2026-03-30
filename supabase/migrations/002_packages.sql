-- ============================================================
-- Equipment Packages
-- Reusable groupings of equipment assigned to a coach for a season
-- ============================================================

create table equipment_packages (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,         -- e.g. "TRY-U10s"
  description     text,
  season          text,                         -- e.g. "Spring 2026"
  assigned_to     text,                         -- coach name
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Join table: which items belong to which package
-- unique on item_id ensures an item can only be in one package
create table package_items (
  id          uuid primary key default gen_random_uuid(),
  package_id  uuid not null references equipment_packages(id) on delete cascade,
  item_id     uuid not null references equipment_items(id) on delete cascade,
  added_at    timestamptz not null default now(),
  constraint one_package_per_item unique (item_id)
);

create index on package_items(package_id);

-- RLS
alter table equipment_packages enable row level security;
alter table package_items enable row level security;

-- All authenticated users can view
create policy "Authenticated users can view packages"
  on equipment_packages for select
  to authenticated using (true);

create policy "Authenticated users can view package items"
  on package_items for select
  to authenticated using (true);

-- Only admins can modify
create policy "Admins can insert packages"
  on equipment_packages for insert
  to authenticated with check (is_admin());

create policy "Admins can update packages"
  on equipment_packages for update
  to authenticated using (is_admin());

create policy "Admins can delete packages"
  on equipment_packages for delete
  to authenticated using (is_admin());

create policy "Admins can insert package items"
  on package_items for insert
  to authenticated with check (is_admin());

create policy "Admins can delete package items"
  on package_items for delete
  to authenticated using (is_admin());
