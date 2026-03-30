-- ============================================================
-- Custom fields per category
-- ============================================================

-- Schema for custom fields on categories
-- Example: [{"name": "Size", "type": "select", "options": ["3", "4", "5"]}]
-- Supported types: "text", "number", "select"
alter table equipment_categories add column custom_fields jsonb not null default '[]'::jsonb;

-- Storage for custom field values on items
-- Example: {"Size": "5"}
alter table equipment_items add column custom_attributes jsonb not null default '{}'::jsonb;
