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

/**
 * Limita una consulta a la vista activa: lo personal del usuario (sin hogar)
 * o todo lo de un hogar.
 */
export function scoped<
  T extends { eq: (column: string, value: string) => T; is: (column: string, value: null) => T },
>(query: T, scope: string, userId: string): T {
  return scope === 'personal' ? query.eq('user_id', userId).is('household_id', null) : query.eq('household_id', scope)
}
