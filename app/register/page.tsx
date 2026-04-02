"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/** Página de registro — crea una cuenta nueva con email y contraseña */
export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** Valida el formulario en el cliente antes de enviarlo al servidor */
  const validate = (): string => {
    if (!name.trim()) return "El nombre es requerido.";
    if (!email.trim()) return "El email es requerido.";
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (password !== confirmPassword) return "Las contraseñas no coinciden.";
    return "";
  };

  /** Envía los datos al endpoint de registro y redirige al login si tiene éxito */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Error al crear la cuenta.");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Error al crear la cuenta. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4'>
      <div className='w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold text-gray-800 dark:text-white mb-2'>
            Crear cuenta
          </h1>
          <p className='text-gray-600 dark:text-gray-300'>
            Regístrate para empezar a gestionar tus tareas
          </p>
        </div>

        {/* Formulario de registro */}
        <form onSubmit={handleRegister} className='space-y-4'>
          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
            >
              Nombre
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Tu nombre completo'
              required
              data-testid='name-input'
              className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            />
          </div>

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='tu@email.com'
              required
              data-testid='email-input'
              className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            />
          </div>

          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
            >
              Contraseña
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Mínimo 8 caracteres'
              required
              data-testid='password-input'
              className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            />
          </div>

          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
            >
              Confirmar contraseña
            </label>
            <input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder='Repite tu contraseña'
              required
              data-testid='confirm-password-input'
              className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <p data-testid='error-message' className='text-sm text-red-600 dark:text-red-400'>
              {error}
            </p>
          )}

          <button
            type='submit'
            disabled={loading}
            data-testid='register-button'
            className='w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium'
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className='mt-6 text-center text-sm text-gray-600 dark:text-gray-400'>
          ¿Ya tienes cuenta?{" "}
          <Link
            href='/login'
            className='text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium'
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
