import NextAuth, { type DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

// Extiende los tipos de sesión para incluir user.id
declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}


/** Configuración central de NextAuth.js v5 — providers, callbacks y páginas personalizadas */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Proveedor OAuth de Google (lee AUTH_GOOGLE_ID y AUTH_GOOGLE_SECRET automáticamente)
    Google,

    // Proveedor de credenciales email/contraseña
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        // Validación básica de formato
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null
        }

        const email = credentials.email.trim().toLowerCase()
        const password = credentials.password

        if (!email || !password || password.length < 8) {
          return null
        }

        // La validación contra la BD se completa en Fase 2
        // cuando la tabla users esté creada en Supabase
        const { validateCredentials } = await import("@/lib/auth-utils")
        return validateCredentials(email, password)
      },
    }),
  ],

  // JWT es obligatorio cuando se usa Credentials provider
  session: { strategy: "jwt" },

  callbacks: {
    /** Agrega user.id al token JWT en el primer inicio de sesión */
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id
      }
      return token
    },

    /** Expone user.id desde el token a la sesión del cliente */
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
})
