export type ProfileOwner = 'me' | 'partner' | 'shared'

export interface Profile {
  id: string
  name: string
  email: string
  avatar_url?: string
}

export interface CardTransaction {
  id: string
  card_id: string
  description: string
  amount: number
  installments: number
  created_at: string
}

export interface Debt {
  id: string
  title: string
  total_amount: number
  paid_amount: number
  creditor?: string
  due_date?: string
  profile: 'me' | 'partner' | 'shared'
  created_at?: string
}

export interface Income {
  id: string
  profile_id: string
  title: string
  amount: number
  frequency: 'mensual' | 'quincenal' | 'unico'
  date: string
}

export interface CreditCard {
  id: string
  profile_id: string
  bank_name: string
  card_alias: string
  total_limit: number
  cutoff_day: number
  payment_due_day: number
}

export interface BasicExpense {
  id: string
  profile_id: string
  title: string
  amount: number
  due_date: number
  is_shared: boolean
  status: 'pendiente' | 'pagado'
}

export interface Debt {
  id: string
  profile_id: string
  creditor_name: string
  initial_amount: number
  current_balance: number
  monthly_payment: number
  interest_rate: number
}
