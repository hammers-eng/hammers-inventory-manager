-- ============================================================
-- Lost / Damaged status for equipment items
-- Distinct from 'retired' to track how items left service
-- ============================================================

alter type item_status add value 'lost';
alter type item_status add value 'damaged';

-- Record why/how an item was removed from service
alter table equipment_items add column removal_reason text;
