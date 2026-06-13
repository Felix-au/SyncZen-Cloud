'use client'

import { useEffect, useState } from 'react'

interface PlatformStats {
  totalHotels: number
  totalUsers: number
  totalRooms: number
  occupiedRooms: number
  activeBookings: number
  todayBookings: number
}

interface HotelRow {
  _id: string
  name: string
  inviteKey: string
  ownerId: { name: string; email: string }
  createdAt: string
  roomCount: number
  occupiedCount: number
  activeBookings: number
}

export default function SuperDashboardPage() {
  const [stats, setStats]   = useState<PlatformStats | null>(null)
  const [hotels, setHotels] = useState<HotelRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/super/stats')
      .then(r => r.json())
      .then(d => { setStats(d.stats); setHotels(d.hotels ?? []); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="page-container flex justify-center" style={{ paddingTop: 80 }}>
      <span className="spinner spinner-lg" />
    </div>
  )

  const occupancyPct = stats ? Math.round((stats.occupiedRooms / (stats.totalRooms || 1)) * 100) : 0

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Platform Overview</h1>
        <p className="page-subtitle">Super admin — all hotels, users, and activity</p>
      </div>

      {/* Platform stats */}
      <div className="grid-3 mb-lg">
        {[
          { label: 'Total Hotels',    value: stats?.totalHotels    ?? 0, color: 'blue',  note: 'registered properties' },
          { label: 'Total Users',     value: stats?.totalUsers     ?? 0, color: 'purple', note: 'across all hotels' },
          { label: 'Active Bookings', value: stats?.activeBookings ?? 0, color: 'green', note: `${stats?.todayBookings ?? 0} checked in today` },
        ].map(s => (
          <div key={s.label} className={`glass-card stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-note">{s.note}</div>
          </div>
        ))}
        {[
          { label: 'Total Rooms',     value: stats?.totalRooms     ?? 0, color: 'blue',  note: 'across all hotels' },
          { label: 'Occupied Rooms',  value: stats?.occupiedRooms  ?? 0, color: 'amber', note: `${occupancyPct}% platform occupancy` },
        ].map(s => (
          <div key={s.label} className={`glass-card stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-note">{s.note}</div>
          </div>
        ))}
      </div>

      {/* Hotels table */}
      <div className="glass-card">
        <div style={{ padding: 'var(--sp-md) var(--sp-lg)', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 800, fontSize: 'var(--fs-md)', color: 'var(--text-pri)' }}>
            All Hotels ({hotels.length})
          </h2>
        </div>
        {hotels.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🌐</span>
            <div className="empty-title">No hotels registered yet</div>
            <div className="empty-text">Hotels will appear here as users register them.</div>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Hotel</th>
                  <th>Owner</th>
                  <th>Invite Key</th>
                  <th>Rooms</th>
                  <th>Occupied</th>
                  <th>Active Bookings</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map(h => (
                  <tr key={h._id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-pri)' }}>{h.name}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text-pri)' }}>{h.ownerId?.name}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)' }}>{h.ownerId?.email}</div>
                    </td>
                    <td>
                      <code style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                        {h.inviteKey}
                      </code>
                    </td>
                    <td>{h.roomCount}</td>
                    <td>
                      {h.occupiedCount > 0
                        ? <span className="badge badge-amber">{h.occupiedCount}</span>
                        : <span style={{ color: 'var(--text-mute)' }}>0</span>
                      }
                    </td>
                    <td>
                      {h.activeBookings > 0
                        ? <span className="badge badge-green">{h.activeBookings}</span>
                        : <span style={{ color: 'var(--text-mute)' }}>0</span>
                      }
                    </td>
                    <td style={{ fontSize: 'var(--fs-xs)' }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
