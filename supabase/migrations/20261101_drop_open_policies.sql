-- Elimina las políticas abiertas (rol public, using true) que dejaban leer y modificar
-- los datos a cualquiera con la clave pública. Quedan las políticas por dueño u hogar.

drop policy if exists "Acceso total gastos" on public.basic_expenses;
drop policy if exists "Enable all access on card_transactions" on public.card_transactions;
drop policy if exists "Acceso total tarjetas" on public.credit_cards;
drop policy if exists "Enable all access on credit_cards" on public.credit_cards;
drop policy if exists "Permitir todo acceso público" on public.debts;
drop policy if exists "Acceso total ingresos" on public.incomes;
drop policy if exists "Acceso total perfiles" on public.profiles;
