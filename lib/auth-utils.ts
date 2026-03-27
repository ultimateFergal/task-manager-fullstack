import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase-server"

interface UserRecord {
  id: string
  email: string
  name: string | null
  password: string | null
}

/**
 * Valida email y contraseña contra la tabla users de Supabase.
 * Retorna el objeto de usuario si las credenciales son correctas, null si no.
 */
export async function validateCredentials(
  email: string,
  password: string
): Promise<{ id: string; email: string; name: string | null } | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, email, name, password")
    .eq("email", email)
    .single<UserRecord>()

  if (error || !data?.password) return null

  const isValid = await bcrypt.compare(password, data.password)
  if (!isValid) return null

  return { id: data.id, email: data.email, name: data.name }
}

/**
 * Inserta o actualiza un usuario OAuth en la tabla users (sin contraseña).
 * Retorna el UUID interno del usuario, creándolo si no existe.
 */
export async function upsertOAuthUser(
  email: string,
  name: string | null
): Promise<{ id: string } | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert({ email, name }, { onConflict: "email" })
    .select("id")
    .single<{ id: string }>()

  if (error) return null
  return data
}

/**
 * Crea un nuevo usuario en la tabla users con la contraseña hasheada.
 * Retorna el usuario creado o null si el email ya existe.
 */
export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<{ id: string; email: string; name: string } | null> {
  const hashedPassword = await bcrypt.hash(password, 12)

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({ email, name, password: hashedPassword })
    .select("id, email, name")
    .single<{ id: string; email: string; name: string }>()

  if (error) return null
  return data
}
