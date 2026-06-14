'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from '@/components/ThemeProvider'

interface NavItem {
  href: string
  label: string
  icon: string
  roles?: string[]
}

const HOTEL_NAV: NavItem[] = [
  { href: '/dashboard',  label: 'Dashboard',  icon: '⊞' },
  { href: '/rooms',      label: 'Rooms',       icon: '🏠' },
  { href: '/checkin',    label: 'Check-In',    icon: '✚', roles: ['hotel_owner','manager','staff'] },
  { href: '/bookings',   label: 'Bookings',    icon: '📋' },
  { href: '/employees',  label: 'Employees',   icon: '👥', roles: ['hotel_owner','manager'] },
  { href: '/settings',   label: 'Settings',    icon: '⚙️',  roles: ['hotel_owner'] },
]

const SUPER_NAV: NavItem[] = [
  { href: '/super/dashboard', label: 'All Hotels', icon: '🌐' },
]

export function Sidebar() {
  const pathname   = usePathname()
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()
  const role = session?.user?.role as string | undefined

  const isSuper = role === 'super_admin'
  const nav = isSuper ? SUPER_NAV : HOTEL_NAV.filter(item =>
    !item.roles || item.roles.includes(role ?? '')
  )

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <Image src="/logo.png" alt="SyncZen Cloud" width={36} height={36} style={{ borderRadius: 8, objectFit: 'contain' }} />
        <div>
          <div className="sidebar-name">SyncZen Cloud</div>
          <div className="sidebar-tag">{isSuper ? 'Super Admin' : 'Hotel Cloud'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-sec)', fontSize: 11 }}>
            {session?.user?.name}
          </span>
          <span style={{ textTransform: 'capitalize', color: 'var(--accent)', fontSize: 10 }}>
            {role?.replace('_', ' ')}
          </span>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{ fontSize: 16, opacity: 0.7, transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign out"
            style={{ fontSize: 16, opacity: 0.7, transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  )
}
