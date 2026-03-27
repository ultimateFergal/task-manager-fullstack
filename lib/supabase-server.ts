import { createClient } from "@supabase/supabase-js"

type SupabaseAdminClient = ReturnType<typeof createClient>

let _client: SupabaseAdminClient | null = null

function getClient(): SupabaseAdminClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
  }
  return _client
}

/**
 * Cliente de Supabase con service_role key — bypasea RLS.
 * SOLO usar en código server-side (API routes, Server Components, auth-utils).
 * NUNCA importar en componentes cliente ni variables NEXT_PUBLIC_.
 * El cliente se inicializa de forma diferida para evitar errores en tiempo de compilación.
 */
export const supabaseAdmin = new Proxy({} as SupabaseAdminClient, {
  get(_, prop) {
    return getClient()[prop as keyof SupabaseAdminClient]
  },
})
