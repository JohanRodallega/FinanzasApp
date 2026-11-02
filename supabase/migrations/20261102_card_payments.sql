-- Pagos a tarjetas de crédito: pago normal o adelanto (abono extra a la deuda).

create table if not exists public.card_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  household_id uuid references public.households (id) on delete cascade,
  card_id uuid not null references public.credit_cards (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  kind text not null default 'pago' check (kind in ('pago', 'adelanto')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists card_payments_user_idx on public.card_payments (user_id, created_at desc);
create index if not exists card_payments_household_idx on public.card_payments (household_id, created_at desc);
create index if not exists card_payments_card_idx on public.card_payments (card_id);

alter table public.card_payments enable row level security;

create policy "acceso por dueño u hogar" on public.card_payments
  for all to authenticated
  using (
    (household_id is null and user_id = (select auth.uid()))
    or (household_id is not null and public.is_household_member(household_id))
  )
  with check (
    user_id = (select auth.uid())
    and (household_id is null or public.is_household_member(household_id))
  );

grant select, insert, update, delete on public.card_payments to authenticated;
