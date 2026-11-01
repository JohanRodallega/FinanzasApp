import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase')
}

// La sesión se guarda en cookies para que proxy.ts pueda protegerla en el servidor.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
