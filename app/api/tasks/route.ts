import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: Obtener todas las tareas
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

// POST: Crear una nueva tarea
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

// PATCH: Actualizar una tarea (marcar como completada/no completada)
export async function PATCH(request: Request) {
  try {
    const { id, completed } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'El ID es requerido' },
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
