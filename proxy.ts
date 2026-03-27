import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

/** Middleware de autenticación — protege /dashboard y /api (excepto /api/auth) */
export default auth((req) => {
  // Permitir rutas de NextAuth sin verificación adicional
  if (req.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Rechazar o redirigir si no hay sesión activa
  if (!req.auth) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
