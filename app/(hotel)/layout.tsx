import { Sidebar } from '@/components/Sidebar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Hotel App' }

/**
 * Layout shared across all authenticated hotel-app pages.
 * Renders the sidebar + main content area.
 */
export default function HotelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
