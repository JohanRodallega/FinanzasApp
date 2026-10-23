import { supabase } from '@/lib/supabase'

/**
 * Datos de "dueño" que se agregan a cada registro nuevo.
 * - user_id: quién lo creó
 * - household_id: el hogar al que pertenece (null = personal)
 * - profile: valor heredado de la versión anterior, se mantiene por compatibilidad
 */
export async function ownerFields(householdId: string | null) {
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return null

  return {
    user_id: user.id,
    household_id: householdId,
    profile: householdId ? 'shared' : 'me',
  }
}
