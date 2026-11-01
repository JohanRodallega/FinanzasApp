# Finanzas

App de finanzas personales y compartidas (hogares): ingresos, gastos fijos, tarjetas de crédito con compras a cuotas, deudas, ahorros y resumen mensual.

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Supabase (auth + base de datos).

## Empezar

```bash
cp .env.example .env.local   # completa las claves de Supabase
npm install
npm run dev                  # http://localhost:3000
```

## Scripts

| Comando         | Qué hace                         |
| --------------- | -------------------------------- |
| `npm run dev`   | Servidor de desarrollo           |
| `npm run build` | Build de producción              |
| `npm run lint`  | ESLint                           |
| `npm test`      | Tests de la lógica (`lib/*.test.ts`) |

## Estructura

- `app/`: rutas (`/` inicio, `/resumen`, `/ahorros`, `/login`), `error.tsx`, `not-found.tsx`, `loading.tsx`, `manifest.ts`.
- `proxy.ts`: protege las rutas en el servidor; sin sesión redirige a `/login`.
- `components/`: un directorio por módulo (`gastos`, `ingresos`, `tarjetas`, `deudas`, `ahorros`) y `shared/` (shell, navegación, avisos).
- `lib/`: cálculos (`finance-calc`), fechas, formato, acceso a Supabase (`supabase`, `scope`) y avisos (`toast`).

## Autenticación

La sesión de Supabase se guarda en cookies (`@supabase/ssr`) para que `proxy.ts` la valide en el servidor. Los datos se protegen además con las políticas RLS de Supabase, que deben estar activas en todas las tablas (`incomes`, `basic_expenses`, `expense_months`, `credit_cards`, `card_transactions`, `debts`, `savings_entries`, `households`).
