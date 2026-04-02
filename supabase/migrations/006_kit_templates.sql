-- ============================================================
-- Kit List Templates
-- Reusable templates defining what categories/quantities a kit needs
-- ============================================================

create table kit_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table kit_template_lines (
  id            uuid primary key default gen_random_uuid(),
  template_id   uuid not null references kit_templates(id) on delete cascade,
  category_id   uuid not null references equipment_categories(id),
  quantity      integer not null default 1 check (quantity > 0),
  notes         text,
  constraint unique_template_category unique (template_id, category_id)
);

create index on kit_template_lines(template_id);

-- RLS
alter table kit_templates enable row level security;
alter table kit_template_lines enable row level security;

create policy "Authenticated users can view templates"
  on kit_templates for select to authenticated using (true);
create policy "Authenticated users can view template lines"
  on kit_template_lines for select to authenticated using (true);

create policy "Admins can insert templates"
  on kit_templates for insert to authenticated with check (is_admin());
create policy "Admins can update templates"
  on kit_templates for update to authenticated using (is_admin());
create policy "Admins can delete templates"
  on kit_templates for delete to authenticated using (is_admin());

create policy "Admins can insert template lines"
  on kit_template_lines for insert to authenticated with check (is_admin());
create policy "Admins can update template lines"
  on kit_template_lines for update to authenticated using (is_admin());
create policy "Admins can delete template lines"
  on kit_template_lines for delete to authenticated using (is_admin());
