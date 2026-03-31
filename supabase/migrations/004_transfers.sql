-- ============================================================
-- Equipment Transfers
-- Coach-to-coach transfer with acknowledgement workflow
-- ============================================================

create type transfer_status as enum ('pending', 'accepted', 'rejected');

create table equipment_transfers (
  id                uuid primary key default gen_random_uuid(),
  loan_id           uuid not null references equipment_loans(id),
  item_id           uuid not null references equipment_items(id),
  from_profile_id   uuid not null references profiles(id),
  to_profile_id     uuid not null references profiles(id),
  status            transfer_status not null default 'pending',
  notes             text,
  initiated_at      timestamptz not null default now(),
  responded_at      timestamptz,
  created_at        timestamptz not null default now()
);

create index on equipment_transfers(to_profile_id) where status = 'pending';
create index on equipment_transfers(from_profile_id);
create index on equipment_transfers(loan_id);

-- RLS
alter table equipment_transfers enable row level security;

create policy "Authenticated users can view transfers"
  on equipment_transfers for select to authenticated using (true);

create policy "Authenticated users can initiate transfers"
  on equipment_transfers for insert to authenticated with check (true);

create policy "Target coach or admin can update transfers"
  on equipment_transfers for update to authenticated
  using (to_profile_id = auth.uid() or is_admin());

-- RPC to complete a transfer atomically (security definer bypasses RLS on loans)
create or replace function complete_transfer(p_transfer_id uuid)
returns void language plpgsql security definer as $$
declare
  v_transfer record;
  v_to_profile record;
begin
  select * into v_transfer from equipment_transfers where id = p_transfer_id;
  if not found then raise exception 'Transfer not found'; end if;
  if v_transfer.status != 'pending' then raise exception 'Transfer is not pending'; end if;
  if v_transfer.to_profile_id != auth.uid() and not is_admin() then
    raise exception 'Not authorized';
  end if;

  select full_name into v_to_profile from profiles where id = v_transfer.to_profile_id;

  -- Update the loan to the new holder
  update equipment_loans
    set recipient_name = v_to_profile.full_name,
        checked_out_by = v_transfer.to_profile_id
    where id = v_transfer.loan_id
      and checked_in_at is null;

  -- Mark transfer as accepted
  update equipment_transfers
    set status = 'accepted', responded_at = now()
    where id = p_transfer_id;
end;
$$;
