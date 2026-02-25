"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/lib/supabase";

/** Main task manager page with task list, creation form, and completion stats */
export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Cargar tareas al montar el componente
  useEffect(() => {
    fetchTasks();
  }, []);

  /** Fetches all tasks from the API and updates local state */
  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Error al cargar tareas");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  /** Handles new task form submission, creates task via API and prepends it to the list */
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle }),
      });

      if (!response.ok) throw new Error("Error al crear tarea");

      const newTask = await response.json();
      setTasks((prev) => [newTask, ...prev]);
      setNewTaskTitle("");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear la tarea");
    } finally {
      setSubmitting(false);
    }
  };

  /** Toggles task completion with optimistic UI update and server rollback on failure */
  const handleToggleComplete = async (task: Task) => {
    // Guardar estado original para rollback
    const previousTasks = tasks;

    // Optimistic UI update: actualizar inmediatamente
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, completed: !t.completed } : t,
      ),
    );

    // Luego sincronizar con el servidor
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, completed: !task.completed }),
      });

      if (!response.ok) throw new Error("Error al actualizar tarea");
    } catch (error) {
      console.error("Error:", error);

      // Rollback: restaurar estado original si falla
      setTasks(previousTasks);
      alert("Error al actualizar la tarea. Se revirtió el cambio.");
    }
  };

  /** Deletes a task with optimistic removal and server rollback on failure */
  const handleDeleteTask = async (task: Task) => {
    // Guardar estado original para rollback
    const previousTasks = tasks;

    // Optimistic UI update: remover inmediatamente
    setTasks((prev) => prev.filter((t) => t.id !== task.id));

    // Luego sincronizar con el servidor
    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id }),
      });

      if (!response.ok) throw new Error("Error al eliminar tarea");
    } catch (error) {
      console.error("Error:", error);

      // Rollback: restaurar estado original si falla
      setTasks(previousTasks);
      alert("Error al eliminar la tarea. Se revirtió el cambio.");
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4'>
      <div className='max-w-2xl mx-auto'>
        <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2'>
              Gestor de Tareas
            </h1>
            <p className='text-gray-600 dark:text-gray-300'>
              Organiza tu dia de forma simple y efectiva
            </p>
          </div>

          {/* Formulario para agregar nueva tarea */}
          <form onSubmit={handleAddTask} className='mb-6'>
            <div className='flex gap-2'>
              <input
                type='text'
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder='¿Qué necesitas hacer?'
                data-testid='task-input'
                className='flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                disabled={submitting}
              />
              <button
                type='submit'
                data-testid='add-task-button'
                disabled={submitting || !newTaskTitle.trim()}
                className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium'
              >
                {submitting ? "..." : "Agregar Tarea"}
              </button>
            </div>
          </form>

          {/* Lista de tareas */}
          {loading ? (
            <div className='text-center py-12'>
              <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent'></div>
              <p className='mt-4 text-gray-600 dark:text-gray-400'>
                Cargando tareas...
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-gray-600 dark:text-gray-400 text-lg'>
                No hay tareas. Agrega una para comenzar.
              </p>
            </div>
          ) : (
            <div className='space-y-2'>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  data-testid={`task-item`}
                  data-taskid={task.id}
                  className={`flex items-center gap-3 p-4 rounded-lg transition-colors group ${
                    task.completed
                      ? "bg-gray-100 dark:bg-gray-700/50 opacity-60"
                      : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                >
                  <input
                    type='checkbox'
                    data-testid='task-checkbox'
                    checked={task.completed}
                    onChange={() => handleToggleComplete(task)}
                    className='w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer'
                  />
                  <span
                    className={`flex-1 ${
                      task.completed
                        ? "line-through text-gray-400 dark:text-gray-500"
                        : "text-gray-800 dark:text-white"
                    }`}
                  >
                    {task.title}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(task)}
                    data-testid='task-delete'
                    className='text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1'
                    aria-label='Eliminar tarea'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-5 w-5'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer con estadisticas */}
          {tasks.length > 0 && (
            <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
              <div className='flex justify-between text-sm text-gray-600 dark:text-gray-400'>
                <span data-testid='stats-total'>
                  Total:{" "}
                  <strong className='text-gray-800 dark:text-white'>
                    {tasks.length}
                  </strong>
                </span>
                <span data-testid='stats-completed'>
                  Completadas:{" "}
                  <strong className='text-green-600 dark:text-green-400'>
                    {tasks.filter((t) => t.completed).length}
                  </strong>
                </span>
                <span data-testid='stats-pending'>
                  Pendientes:{" "}
                  <strong className='text-blue-600 dark:text-blue-400'>
                    {tasks.filter((t) => !t.completed).length}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
