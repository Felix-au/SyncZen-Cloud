'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface ActivityLog {
  _id: string
  action: string
  details: string
  createdAt: string
  userId: {
    username?: string
    name: string
    email: string
    role: string
  }
}

const ACTION_LABELS: Record<string, string> = {
  booking_create: 'Booking Created',
  booking_checkout: 'Guest Checked Out',
  booking_checkout_date_update: 'Checkout Date Changed',
  room_create: 'Room Created',
  room_delete: 'Room Deleted',
  room_status_change: 'Room Status Changed',
  room_maintenance_started: 'Maintenance Started',
  room_maintenance_resolved: 'Maintenance Resolved',
  room_update: 'Room Updated',
  employee_create: 'Employee Added',
  employee_update: 'Employee Role Updated',
  employee_delete: 'Employee Removed',
}

const ACTION_BADGES: Record<string, string> = {
  booking_create: 'badge-green',
  booking_checkout: 'badge-purple',
  booking_checkout_date_update: 'badge-amber',
  room_create: 'badge-blue',
  room_delete: 'badge-red',
  room_status_change: 'badge-muted',
  room_maintenance_started: 'badge-red',
  room_maintenance_resolved: 'badge-green',
  employee_create: 'badge-blue',
  employee_update: 'badge-amber',
  employee_delete: 'badge-red',
}

export default function LogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user) {
      const role = session.user.role
      if (role !== 'hotel_owner' && role !== 'super_admin') {
        setLoading(false)
        return
      }

      fetch('/api/logs')
        .then((r) => r.json())
        .then((data) => {
          setLogs(data.logs ?? [])
          setLoading(false)
        })
        .catch((err) => {
          console.error('Failed to load logs:', err)
          setLoading(false)
        })
    }
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="page-container flex justify-center" style={{ paddingTop: 80 }}>
        <span className="spinner spinner-lg" />
      </div>
    )
  }

  const role = session?.user?.role
  if (role !== 'hotel_owner' && role !== 'super_admin') {
    return (
      <div className="page-container">
        <div className="glass-card empty-state">
          <span className="empty-icon">🔒</span>
          <div className="empty-title">Access Denied</div>
          <div className="empty-text">
            Activity logs are security-restricted and accessible only to the Hotel Owner.
          </div>
          <button className="btn btn-ghost" onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Get unique actions present in logs for filter dropdown
  const actionTypes = Array.from(new Set(logs.map((l) => l.action)))

  // Filter logs
  const filtered = logs.filter((log) => {
    const username = log.userId?.username?.toLowerCase() || ''
    const name = log.userId?.name?.toLowerCase() || ''
    const email = log.userId?.email?.toLowerCase() || ''
    const details = log.details.toLowerCase()
    const matchSearch =
      username.includes(search.toLowerCase()) ||
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      details.includes(search.toLowerCase())

    const matchAction = actionFilter === 'all' || log.action === actionFilter

    return matchSearch && matchAction
  })

  // Format relative time helper
  function getRelativeTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center flex-wrap gap-md">
        <div>
          <h1 className="page-title">Activity Logs</h1>
          <p className="page-subtitle">Track operational changes and staff activities</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card flex gap-md items-center flex-wrap" style={{ padding: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
        <div className="input-group" style={{ flex: 1, minWidth: 200, margin: 0 }}>
          <input
            type="text"
            className="input"
            placeholder="Search by username, detail, or staff name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="input-group" style={{ width: 220, margin: 0 }}>
          <select
            className="input"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="all">All Activities</option>
            {actionTypes.map((t) => (
              <option key={t} value={t}>
                {ACTION_LABELS[t] || t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card empty-state">
          <span className="empty-icon">📋</span>
          <div className="empty-title">No logs found</div>
          <div className="empty-text">
            {logs.length === 0 ? 'No activity has been logged yet.' : 'Try adjusting your search filters.'}
          </div>
        </div>
      ) : (
        <div className="glass-card">
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="emp-table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>User (Staff)</th>
                  <th style={{ width: '20%' }}>Action</th>
                  <th style={{ width: '45%' }}>Activity Details</th>
                  <th style={{ width: '15%' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-pri)' }}>
                        {log.userId?.username ? `@${log.userId.username}` : log.userId?.name ?? 'Deleted User'}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)' }}>
                        {log.userId?.name}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${ACTION_BADGES[log.action] ?? 'badge-muted'}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-sec)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {log.details}
                    </td>
                    <td>
                      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-pri)' }}>
                        {getRelativeTime(log.createdAt)}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)' }}>
                        {new Date(log.createdAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
