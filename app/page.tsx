import { redirect } from 'next/navigation'

/** Root route — redirect to dashboard (middleware will redirect to /login if not authed) */
export default function HomePage() {
  redirect('/dashboard')
}
