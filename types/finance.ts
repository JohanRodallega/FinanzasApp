export type ProfileOwner = 'me' | 'partner' | 'shared'

export interface Household {
  id: string
  name: string
  invite_code: string
  created_at?: string
}

export interface Profile {
  id: string
  name: string
  email: string
  avatar_url?: string
  created_at?: string
}

export interface Income {
  id: string
  user_id?: string | null
  household_id?: string | null
  profile_id?: string
  profile?: ProfileOwner | null
  title: string
  amount: number
  frequency: 'mensual' | 'quincenal' | 'unico'
  date: string
  created_at?: string
}

export interface BasicExpense {
  id: string
  user_id?: string | null
  household_id?: string | null
  profile_id?: string
  profile?: ProfileOwner | null
  title: string
  amount: number
  due_date: number
  is_shared: boolean
  status: 'pendiente' | 'pagado'
  category?: string
  created_at?: string
}

/** Estado de un gasto fijo en un mes concreto (monto de ese mes y si ya se pagó). */
export interface ExpenseMonth {
  id: string
  expense_id: string
  month: string
  amount: number
  paid: boolean
  paid_at?: string | null
  user_id?: string | null
  household_id?: string | null
  created_at?: string
}

export interface CreditCard {
  id: string
  user_id?: string | null
  household_id?: string | null
  profile_id?: string
  profile?: ProfileOwner | null
  name?: string | null
  bank_name?: string | null
  card_alias?: string | null
  total_limit: number
  current_balance: number
  cutoff_day?: number | null
  payment_due_day?: number | null
  closing_day?: number | null
  due_day?: number | null
  created_at?: string
}

export interface CardTransaction {
  id: string
  card_id: string
  user_id?: string | null
  household_id?: string | null
  profile?: ProfileOwner | null
  description: string
  amount: number
  installments: number
  created_at: string
}

export interface Debt {
  id: string
  user_id?: string | null
  household_id?: string | null
  profile?: ProfileOwner | null
  title: string
  total_amount: number
  paid_amount: number
  creditor?: string
  due_date?: string
  created_at?: string
}

/** Movimiento de ahorro: positivo = ahorro, negativo = retiro. */
export interface SavingsEntry {
  id: string
  user_id?: string
  entry_date: string
  amount: number
  note?: string | null
  created_at?: string
}
