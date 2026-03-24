import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Cliente de Supabase con service_role key — bypasea RLS.
 * SOLO usar en código server-side (API routes, Server Components, auth-utils).
 * NUNCA importar en componentes cliente ni variables NEXT_PUBLIC_.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
