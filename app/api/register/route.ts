import { NextResponse } from 'next/server'
import { createUser } from '@/lib/auth-utils'

/** POST /api/register - Crea un nuevo usuario con email y contraseña hasheada */
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    const user = await createUser(email.trim().toLowerCase(), password, name.trim())

    if (!user) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 })
  }
}
