'use client'

import { useState } from 'react'
import { Sidebar, SunIcon, MoonIcon, SignOutIcon } from '@/components/Sidebar'
import { useTheme } from '@/components/ThemeProvider'
import { signOut } from 'next-auth/react'

/**
 * Layout shared across all authenticated hotel-app pages.
 * Manages sidebar open/close state for mobile drawer behaviour.
 */
export default function HotelLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggle } = useTheme()

  return (
    <div className="app-shell">
      {/* Mobile top bar — only visible on small screens */}
      <header className="mobile-topbar">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="mobile-topbar-title">SyncZen</span>
        
        {/* Mobile quick actions: Theme & Logout */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={toggle}
            className="icon-btn"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
            style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="icon-btn icon-btn-danger"
            title="Sign out"
            aria-label="Sign out"
            style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}
          >
            <SignOutIcon />
          </button>
        </div>
      </header>

      {/* Sidebar — drawer on mobile, fixed panel on desktop */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop — tapping it closes the drawer */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
