'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/Modal'
import { canManageEmployees, canManageManagers } from '@/lib/roles'

interface Employee {
  _id: string
  name: string
  email: string
  username?: string
  role: string
  createdAt: string
}

const ROLE_BADGE: Record<string, string> = {
  hotel_owner: 'badge-amber',
  manager:     'badge-blue',
  staff:       'badge-muted',
}

/** Random 6-char alphanumeric suffix */
function randomSuffix() {
  return Math.random().toString(36).slice(2, 8)
}

function generateUsername() {
  return `staff_${randomSuffix()}`
}

function generateEmail() {
  return `temp_${randomSuffix()}@hotel.local`
}

/* ── Mode toggle ─────────────────────────────────────────────── */
type Mode = 'existing' | 'create'

export default function EmployeesPage() {
  const { data: session } = useSession()
  const role    = session?.user?.role as string
  const canManage = canManageEmployees(role as any)
  const canMgr    = canManageManagers(role as any)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)

  /* ── Modal state ─────────────────────────────────────────────── */
  const [showAdd, setShowAdd] = useState(false)
  const [mode, setMode]       = useState<Mode>('create')

  // Existing-user fields
  const [addEmail,  setAddEmail]  = useState('')
  const [addRole,   setAddRole]   = useState('staff')

  // Create-new fields
  const [newName,     setNewName]     = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newEmail,    setNewEmail]    = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole,     setNewRole]     = useState('staff')
  const [showPass,    setShowPass]    = useState(false)

  const [addError,  setAddError]  = useState('')
  const [saving,    setSaving]    = useState(false)

  /* ── Data ────────────────────────────────────────────────────── */
  async function load() {
    const res  = await fetch('/api/employees')
    const data = await res.json()
    setEmployees(data.employees ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function resetModal() {
    setAddEmail(''); setAddRole('staff')
    setNewName(''); setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewRole('staff')
    setAddError(''); setShowPass(false)
  }

  /* ── Add existing user ───────────────────────────────────────── */
  async function handleAddExisting() {
    setAddError(''); setSaving(true)
    const res  = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: addEmail, role: addRole }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setAddError(data.error ?? 'Failed'); return }
    setShowAdd(false); resetModal(); load()
  }

  /* ── Create new employee account ─────────────────────────────── */
  async function handleCreateNew() {
    setAddError(''); setSaving(true)
    const res  = await fetch('/api/employees/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, username: newUsername, email: newEmail, password: newPassword, role: newRole }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setAddError(data.error ?? 'Failed'); return }
    setShowAdd(false); resetModal(); load()
  }

  /* ── Role / remove actions ───────────────────────────────────── */
  async function handleRoleChange(emp: Employee, newRole: string) {
    if (!confirm(`Change ${emp.name}'s role to ${newRole}?`)) return
    await fetch(`/api/employees/${emp._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    load()
  }

  async function handleRemove(emp: Employee) {
    if (!confirm(`Remove ${emp.name} from this hotel?`)) return
    await fetch(`/api/employees/${emp._id}`, { method: 'DELETE' })
    load()
  }

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center flex-wrap gap-md">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{employees.length} team members</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { resetModal(); setShowAdd(true) }}>
            ✚ Add Employee
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--sp-3xl)' }}><span className="spinner spinner-lg" /></div>
      ) : employees.length === 0 ? (
        <div className="glass-card empty-state">
          <span className="empty-icon">👥</span>
          <div className="empty-title">No employees yet</div>
          <div className="empty-text">Create accounts for your team or add existing SyncZen users.</div>
        </div>
      ) : (
        <div className="glass-card">
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="emp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-pri)' }}>{emp.name}</td>
                    <td style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)', fontFamily: 'monospace' }}>
                      {emp.username ? `@${emp.username}` : '—'}
                    </td>
                    <td style={{ fontSize: 'var(--fs-sm)' }}>{emp.email}</td>
                    <td><span className={`badge ${ROLE_BADGE[emp.role] ?? 'badge-muted'}`}>{emp.role.replace('_', ' ')}</span></td>
                    <td style={{ fontSize: 'var(--fs-xs)' }}>{new Date(emp.createdAt).toLocaleDateString()}</td>
                    {canManage && (
                      <td>
                        {emp.role !== 'hotel_owner' && (
                          <div className="flex gap-xs">
                            {emp.role === 'staff'   && canMgr && <button className="btn btn-ghost btn-sm" onClick={() => handleRoleChange(emp, 'manager')}>→ Manager</button>}
                            {emp.role === 'manager' && canMgr && <button className="btn btn-ghost btn-sm" onClick={() => handleRoleChange(emp, 'staff')}>→ Staff</button>}
                            <button className="btn btn-danger btn-sm" onClick={() => handleRemove(emp)}>Remove</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add Employee Modal ────────────────────────────────────── */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); resetModal() }}
        title="Add Employee"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowAdd(false); resetModal() }}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={saving || (mode === 'existing' ? !addEmail : !newName || !newUsername || !newEmail || !newPassword)}
              onClick={mode === 'existing' ? handleAddExisting : handleCreateNew}
            >
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Saving…' : mode === 'existing' ? 'Add Employee' : 'Create & Add'}
            </button>
          </>
        }
      >
        {addError && <div style={{ color: 'var(--red)', fontSize: 'var(--fs-sm)', padding: '8px 12px', background: 'var(--red-dim)', borderRadius: 'var(--r-sm)' }}>{addError}</div>}

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--elevated)', borderRadius: 'var(--r-md)', padding: 4 }}>
          {(['create', 'existing'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setAddError('') }}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 'var(--r-sm)',
                fontSize: 'var(--fs-sm)', fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all var(--t-fast)',
                background: mode === m ? 'var(--surface)' : 'transparent',
                color: mode === m ? 'var(--text-pri)' : 'var(--text-mute)',
                boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {m === 'create' ? '✚ Create New Account' : '🔗 Add Existing User'}
            </button>
          ))}
        </div>

        {/* ── Create new ────────────────────────────────────────── */}
        {mode === 'create' && (
          <>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)', margin: 0 }}>
              Creates a new SyncZen account and immediately assigns them to your hotel.
              Password minimum is <strong>4 characters</strong> — suitable for shared devices.
            </p>

            {/* Name */}
            <div className="input-group">
              <label className="input-label" htmlFor="new-name">Full Name *</label>
              <input id="new-name" className="input" placeholder="Jane Doe" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>

            {/* Username */}
            <div className="input-group">
              <label className="input-label" htmlFor="new-username">Username *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="new-username"
                  className="input"
                  placeholder="jane_doe"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setNewUsername(generateUsername())}
                  title="Generate random username"
                  style={{ flexShrink: 0 }}
                >
                  ⟳ Generate
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="input-group">
              <label className="input-label" htmlFor="new-email">Email *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="new-email"
                  className="input"
                  type="email"
                  placeholder="jane@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setNewEmail(generateEmail())}
                  title="Generate placeholder email for temporary staff"
                  style={{ flexShrink: 0 }}
                >
                  ⟳ Generate
                </button>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>
                {"Use ⟳ Generate for temporary staff who won't use email login."}
              </span>
            </div>

            {/* Password */}
            <div className="input-group">
              <label className="input-label" htmlFor="new-password">Password * <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-mute)' }}>(min 4 chars)</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="new-password"
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 4 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowPass(s => !s)}
                  style={{ flexShrink: 0 }}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="input-group">
              <label className="input-label" htmlFor="new-role">Role *</label>
              <select id="new-role" className="input" value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="staff">Staff — can perform check-ins</option>
                {canMgr && <option value="manager">Manager — can manage rooms and employees</option>}
              </select>
            </div>
          </>
        )}

        {/* ── Add existing ─────────────────────────────────────── */}
        {mode === 'existing' && (
          <>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)', margin: 0 }}>
              The employee must already have a registered SyncZen account.
            </p>
            <div className="input-group">
              <label className="input-label" htmlFor="emp-email">Email address</label>
              <input id="emp-email" type="email" className="input" placeholder="employee@example.com" value={addEmail} onChange={e => setAddEmail(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="emp-role">Role</label>
              <select id="emp-role" className="input" value={addRole} onChange={e => setAddRole(e.target.value)}>
                <option value="staff">Staff — can perform check-ins</option>
                {canMgr && <option value="manager">Manager — can manage rooms and employees</option>}
              </select>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
