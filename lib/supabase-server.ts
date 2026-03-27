// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Explicit <any> generic prevents Supabase from resolving table row types to
// `never` when no generated Database schema is present.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any> | null = null

/**
 * Retorna el cliente Supabase con service_role key (bypasea RLS).
 * Se inicializa de forma diferida para evitar errores en tiempo de compilación.
 * SOLO usar en código server-side (API routes, auth-utils).
 * NUNCA importar en componentes cliente ni variables NEXT_PUBLIC_.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseAdmin(): SupabaseClient<any> {
  if (!_client) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _client = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
  }
  return _client
}
