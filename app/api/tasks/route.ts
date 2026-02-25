import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/** GET /api/tasks - Returns all tasks ordered by creation date descending */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
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

/** POST /api/tasks - Creates a new task with the provided title */
export async function POST(request: Request) {
  try {
    const { title } = await request.json()

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title: title.trim() }])
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

/** PUT /api/tasks - Updates the completion status of a task by ID */
export async function PUT(request: Request) {
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

    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', id)
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

/** DELETE /api/tasks - Deletes a task by ID */
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'El ID es requerido' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

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
