-- Gastos normales: transferencias, pagos en tiendas y otros gastos sin fecha límite.

create table if not exists public.normal_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  household_id uuid references public.households (id) on delete cascade,
  title text not null check (char_length(btrim(title)) > 0),
  amount numeric(14, 2) not null check (amount > 0),
  category text not null default 'Otros',
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists normal_expenses_user_date_idx
  on public.normal_expenses (user_id, expense_date desc);
create index if not exists normal_expenses_household_date_idx
  on public.normal_expenses (household_id, expense_date desc);

alter table public.normal_expenses enable row level security;

-- Mismo patrón que debts: personal = solo su dueño; hogar = cualquier miembro.
create policy "acceso por dueño u hogar" on public.normal_expenses
  for all to authenticated
  using (
    (household_id is null and user_id = (select auth.uid()))
    or (household_id is not null and public.is_household_member(household_id))
  )
  with check (
    user_id = (select auth.uid())
    and (household_id is null or public.is_household_member(household_id))
  );

-- Solo usuarios con sesión; sin acceso anónimo.
grant select, insert, update, delete on public.normal_expenses to authenticated;
