import { redirect } from 'next/navigation'

/** Redirige la raíz a /dashboard */
export default function Home() {
  redirect('/dashboard')
}
