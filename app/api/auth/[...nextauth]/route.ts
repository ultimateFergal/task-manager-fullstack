import { handlers } from "@/lib/auth"

/** Handlers de NextAuth.js para GET y POST — gestiona OAuth callbacks, sesiones y CSRF */
export const { GET, POST } = handlers
