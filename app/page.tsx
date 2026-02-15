'use client'

import { useState, useEffect } from 'react'
import type { Task } from '@/lib/supabase'

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Cargar tareas al montar el componente
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) throw new Error('Error al cargar tareas')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle }),
      })

      if (!response.ok) throw new Error('Error al crear tarea')

      const newTask = await response.json()
      setTasks([newTask, ...tasks])
      setNewTaskTitle('')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear la tarea')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleComplete = async (task: Task) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, completed: !task.completed }),
      })

      if (!response.ok) throw new Error('Error al actualizar tarea')

      const updatedTask = await response.json()
      setTasks(tasks.map(t => (t.id === task.id ? updatedTask : t)))
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar la tarea')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
              📝 Gestor de Tareas
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Organiza tu día de forma simple y efectiva
            </p>
          </div>

          {/* Formulario para agregar nueva tarea */}
          <form onSubmit={handleAddTask} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="¿Qué necesitas hacer?"
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || !newTaskTitle.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? '...' : 'Agregar'}
              </button>
            </div>
          </form>

          {/* Lista de tareas */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando tareas...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                ¡No hay tareas! Agrega una para comenzar.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleComplete(task)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span
                    className={`flex-1 ${
                      task.completed
                        ? 'line-through text-gray-400 dark:text-gray-500'
                        : 'text-gray-800 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.completed && (
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                      ✓ Completada
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer con estadísticas */}
          {tasks.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Total: <strong className="text-gray-800 dark:text-white">{tasks.length}</strong>
                </span>
                <span>
                  Completadas:{' '}
                  <strong className="text-green-600 dark:text-green-400">
                    {tasks.filter(t => t.completed).length}
                  </strong>
                </span>
                <span>
                  Pendientes:{' '}
                  <strong className="text-blue-600 dark:text-blue-400">
                    {tasks.filter(t => !t.completed).length}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
