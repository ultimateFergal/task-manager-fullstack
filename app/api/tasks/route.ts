import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'

/** GET /api/tasks - Retorna todas las tareas del usuario autenticado ordenadas por fecha descendente */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Error al obtener las tareas' },
      { status: 500 }
    )
  }
}

/** POST /api/tasks - Crea una nueva tarea asociada al usuario autenticado */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { title } = await request.json()

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([{ title: title.trim(), user_id: session.user.id }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Error al crear la tarea' },
      { status: 500 }
    )
  }
}

/** PUT /api/tasks - Actualiza el estado de completado de una tarea del usuario autenticado */
export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id, completed } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'El ID es requerido' },
        { status: 400 }
      )
    }

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'El campo completed es requerido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ completed })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la tarea' },
      { status: 500 }
    )
  }
}

/** DELETE /api/tasks - Elimina una tarea del usuario autenticado */
export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'El ID es requerido' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la tarea' },
      { status: 500 }
    )
  }
}
