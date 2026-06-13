'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * /join — Existing user enters a hotel invite key to join a hotel.
 * Requires the user to be logged in (middleware redirects if not).
 */
export default function JoinPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [key, setKey]       = useState('')
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteKey: key.trim().toUpperCase() }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Failed to join hotel')
      return
    }

    setSuccess(`Joined ${data.hotelName}! Redirecting…`)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 1500)
  }

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">🔑</div>
          <div className="auth-title">Join a hotel</div>
          <div className="auth-subtitle">Enter the invite key your manager gave you</div>
        </div>

        {!session?.user ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-mute)', marginBottom: 'var(--sp-md)', fontSize: 'var(--fs-sm)' }}>
              You need to be logged in to join a hotel.
            </p>
            <Link href="/register" className="btn btn-primary">Create account first</Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 'var(--fs-sm)', color: 'var(--red)' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 'var(--fs-sm)', color: 'var(--green)' }}>
                {success}
              </div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="invite-key">Invite key</label>
              <input
                id="invite-key"
                type="text"
                className="input"
                placeholder="XXXX-XXXX"
                value={key}
                onChange={e => setKey(e.target.value.toUpperCase())}
                style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xl)', letterSpacing: 4, textAlign: 'center' }}
                maxLength={9}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading || key.length < 9}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Joining…' : 'Join Hotel'}
            </button>
          </form>
        )}

        <div style={{ marginTop: 'var(--sp-lg)', textAlign: 'center' }}>
          <Link href="/login" className="auth-link" style={{ fontSize: 'var(--fs-xs)' }}>
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
