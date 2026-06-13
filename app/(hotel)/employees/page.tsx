'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/Modal'
import { canManageEmployees, canManageManagers } from '@/lib/roles'

interface Employee {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
}

const ROLE_BADGE: Record<string, string> = {
  hotel_owner: 'badge-amber',
  manager:     'badge-blue',
  staff:       'badge-muted',
}

export default function EmployeesPage() {
  const { data: session } = useSession()
  const role = session?.user?.role as string
  const canManage = canManageEmployees(role as any)
  const canMgr    = canManageManagers(role as any)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)
  const [showAdd, setShowAdd]     = useState(false)
  const [addEmail, setAddEmail]   = useState('')
  const [addRole, setAddRole]     = useState('staff')
  const [addError, setAddError]   = useState('')
  const [saving, setSaving]       = useState(false)

  async function load() {
    const res  = await fetch('/api/employees')
    const data = await res.json()
    setEmployees(data.employees ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    setAddError('')
    setSaving(true)
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: addEmail, role: addRole }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setAddError(data.error ?? 'Failed to add employee'); return }
    setShowAdd(false); setAddEmail(''); setAddRole('staff')
    load()
  }

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

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center flex-wrap gap-md">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{employees.length} team members</p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>✚ Add Employee</button>}
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--sp-3xl)' }}><span className="spinner spinner-lg" /></div>
      ) : employees.length === 0 ? (
        <div className="glass-card empty-state">
          <span className="empty-icon">👥</span>
          <div className="empty-title">No employees yet</div>
          <div className="empty-text">Add employees by email or share your hotel&apos;s invite key so they can self-register.</div>
        </div>
      ) : (
        <div className="glass-card">
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
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
                    <td style={{ fontSize: 'var(--fs-sm)' }}>{emp.email}</td>
                    <td><span className={`badge ${ROLE_BADGE[emp.role] ?? 'badge-muted'}`}>{emp.role.replace('_', ' ')}</span></td>
                    <td style={{ fontSize: 'var(--fs-xs)' }}>{new Date(emp.createdAt).toLocaleDateString()}</td>
                    {canManage && (
                      <td>
                        {emp.role !== 'hotel_owner' && (
                          <div className="flex gap-xs">
                            {emp.role === 'staff' && canMgr && (
                              <button className="btn btn-ghost btn-sm" onClick={() => handleRoleChange(emp, 'manager')}>→ Manager</button>
                            )}
                            {emp.role === 'manager' && canMgr && (
                              <button className="btn btn-ghost btn-sm" onClick={() => handleRoleChange(emp, 'staff')}>→ Staff</button>
                            )}
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

      {/* Add Employee Modal */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setAddError('') }}
        title="Add Employee"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !addEmail}>
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Adding…' : 'Add Employee'}
            </button>
          </>
        }
      >
        {addError && <div style={{ color: 'var(--red)', fontSize: 'var(--fs-sm)' }}>{addError}</div>}
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-mute)' }}>
          The employee must already have a registered SyncStay account. They&apos;ll be immediately associated with your hotel.
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
      </Modal>
    </div>
  )
}
