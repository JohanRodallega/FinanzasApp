-- Ajustes de saldo: diferencia (positiva o negativa) entre el saldo calculado y el saldo real de la cuenta.

create table if not exists public.balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  household_id uuid references public.households (id) on delete cascade,
  amount numeric(14, 2) not null check (amount <> 0),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists balance_adjustments_user_idx
  on public.balance_adjustments (user_id, created_at desc);
create index if not exists balance_adjustments_household_idx
  on public.balance_adjustments (household_id, created_at desc);

alter table public.balance_adjustments enable row level security;

-- Mismo patrón que normal_expenses: personal = solo su dueño; hogar = cualquier miembro.
create policy "acceso por dueño u hogar" on public.balance_adjustments
  for all to authenticated
  using (
    (household_id is null and user_id = (select auth.uid()))
    or (household_id is not null and public.is_household_member(household_id))
  )
  with check (
    user_id = (select auth.uid())
    and (household_id is null or public.is_household_member(household_id))
  );

grant select, insert, update, delete on public.balance_adjustments to authenticated;
