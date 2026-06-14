'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/components/ThemeProvider'

function LoginForm() {
  const router = useRouter()
  const params  = useSearchParams()
  const hint    = params.get('hint')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { theme, toggle } = useTheme()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError('Invalid email or password')
      return
    }

    // Redirect based on role — handled by middleware after sign-in
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
          <div className="auth-title">Welcome back</div>
          <div className="auth-subtitle">Sign in to SyncZen</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {hint && (
            <div style={{
              background: 'var(--green-dim)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 'var(--r-md)',
              padding: '10px 14px',
              fontSize: 'var(--fs-sm)',
              color: 'var(--green)',
              marginBottom: 'var(--sp-sm)',
            }}>
              ✓ {hint}
            </div>
          )}
          {error && (
            <div style={{
              background: 'var(--red-dim)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--r-md)',
              padding: '10px 14px',
              fontSize: 'var(--fs-sm)',
              color: 'var(--red)',
            }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email or Username</label>
            <input
              id="email"
              type="text"
              className="input"
              placeholder="you@example.com or your_username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--sp-lg)' }}>
          <div className="auth-divider">Don&apos;t have an account?</div>
          <div style={{ marginTop: 'var(--sp-md)' }}>
            <Link href="/register" className="btn btn-ghost w-full" style={{ justifyContent: 'center' }}>
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="glass-card auth-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <span className="spinner" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
