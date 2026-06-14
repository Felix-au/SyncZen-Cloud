'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/components/ThemeProvider'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { theme, toggle } = useTheme()

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Failed to register account')
      setLoading(false)
      return
    }

    // Sign in automatically
    const signRes = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (signRes?.error) {
      setError('Registration successful! Please login manually.')
      return
    }

    // New user has no hotel — send to create or join
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className="icon-btn"
          style={{ position: 'absolute', top: 'var(--sp-lg)', right: 'var(--sp-lg)' }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
          type="button"
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <div className="auth-logo">
          <Image src="/logo.png" alt="SyncZen" width={52} height={52} style={{ borderRadius: 12, objectFit: 'contain', marginBottom: 8 }} />
          <div className="auth-title">Create account</div>
          <div className="auth-subtitle">Join SyncZen — register your hotel or join a team</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--r-md)', padding: '10px 14px',
              fontSize: 'var(--fs-sm)', color: 'var(--red)',
            }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="name">Full name</label>
            <input id="name" type="text" className="input" placeholder="Jane Smith"
              value={form.name} onChange={e => update('name', e.target.value)} required />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="username">Username</label>
            <input id="username" type="text" className="input" placeholder="jane_smith"
              value={form.username} onChange={e => update('username', e.target.value)}
              required autoComplete="username"
              pattern="[a-zA-Z0-9_]{3,20}" title="3–20 characters: letters, numbers, underscores" />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" placeholder="you@example.com"
              value={form.email} onChange={e => update('email', e.target.value)} required autoComplete="email" />
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" placeholder="Min 8 chars"
                value={form.password} onChange={e => update('password', e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" className="input" placeholder="Repeat password"
                value={form.confirm} onChange={e => update('confirm', e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--sp-lg)' }}>
          <div className="auth-divider">Already have an account?</div>
          <div style={{ marginTop: 'var(--sp-md)' }}>
            <Link href="/login" className="btn btn-ghost w-full" style={{ justifyContent: 'center' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
