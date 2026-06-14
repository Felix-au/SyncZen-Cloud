'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/Modal'
import { canManageRooms } from '@/lib/roles'

type Status = 'available' | 'occupied' | 'maintenance' | 'checkout' | 'all'

interface Room {
  _id: string
  roomNumber: string
  roomType: string
  floor: number
  status: string
  pricePerNight: number
  notes: string
}

const STATUS_COLOR: Record<string, string> = {
  available:   'badge-green',
  occupied:    'badge-amber',
  maintenance: 'badge-red',
  checkout:    'badge-purple',
}

const STATUS_LABEL: Record<string, string> = {
  available:   'Available',
  occupied:    'Occupied',
  maintenance: 'Maintenance',
  checkout:    'Checkout',
}

export default function RoomsPage() {
  const { data: session } = useSession()
  const role = session?.user?.role as string
  const canManage = canManageRooms(role as any)
  const canChangeStatus = role === 'staff' || canManage

  const [rooms, setRooms]     = useState<Room[]>([])
  const [filter, setFilter]   = useState<Status>('all')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [error, setError]     = useState('')

  // Add/edit form state
  const [form, setForm] = useState({ roomNumber: '', roomType: 'Standard', floor: '1', pricePerNight: '0', notes: '' })
  const [saving, setSaving] = useState(false)

  async function loadRooms() {
    const res = await fetch('/api/rooms')
    const data = await res.json()
    setRooms(data.rooms ?? [])
    setLoading(false)
  }

  useEffect(() => { loadRooms() }, [])

  function openAdd() {
    setForm({ roomNumber: '', roomType: 'Standard', floor: '1', pricePerNight: '0', notes: '' })
    setError('')
    setShowAdd(true)
  }

  function openEdit(room: Room) {
    setForm({ roomNumber: room.roomNumber, roomType: room.roomType, floor: String(room.floor), pricePerNight: String(room.pricePerNight), notes: room.notes })
    setError('')
    setEditRoom(room)
  }

  async function handleSave() {
    setError('')
    setSaving(true)

    const body = { ...form, floor: Number(form.floor), pricePerNight: Number(form.pricePerNight) }

    const res = editRoom
      ? await fetch(`/api/rooms/${editRoom._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) { setError(data.error ?? 'Save failed'); return }

    setShowAdd(false)
    setEditRoom(null)
    loadRooms()
  }

  async function handleDelete(room: Room) {
    if (!confirm(`Delete room ${room.roomNumber}? This cannot be undone.`)) return
    const res = await fetch(`/api/rooms/${room._id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json(); alert(d.error); return }
    loadRooms()
  }

  async function handleStatusChange(room: Room, status: string) {
    await fetch(`/api/rooms/${room._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadRooms()
  }

  const displayed = filter === 'all' ? rooms : rooms.filter(r => r.status === filter)

  const counts = rooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center flex-wrap gap-md">
        <div>
          <h1 className="page-title">Rooms</h1>
          <p className="page-subtitle">{rooms.length} rooms registered</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openAdd}>✚ Add Room</button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-sm mb-lg flex-wrap">
        {(['all', 'available', 'occupied', 'maintenance', 'checkout'] as Status[]).map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? `All (${rooms.length})` : `${STATUS_LABEL[s]} (${counts[s] ?? 0})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--sp-3xl)' }}>
          <span className="spinner spinner-lg" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="glass-card empty-state">
          <span className="empty-icon">🏠</span>
          <div className="empty-title">{filter === 'all' ? 'No rooms yet' : `No ${filter} rooms`}</div>
          <div className="empty-text">{filter === 'all' && canManage ? 'Add your first room to get started.' : 'All rooms have a different status.'}</div>
          {filter === 'all' && canManage && <button className="btn btn-primary mt-md" onClick={openAdd}>✚ Add Room</button>}
        </div>
      ) : (
        <div className="room-grid">
          {displayed.map(room => (
            <div key={room._id} className="glass-card room-card">
              <div className="flex justify-between items-center mb-sm">
                <div className="room-number">{room.roomNumber}</div>
                <span className={`badge ${STATUS_COLOR[room.status]}`}>{STATUS_LABEL[room.status]}</span>
              </div>
              <div className="room-type">Floor {room.floor} · {room.roomType}</div>
              {room.pricePerNight > 0 && (
                <div className="room-price">₹{room.pricePerNight.toLocaleString()}/night</div>
              )}
              {room.notes && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)', marginTop: 'var(--sp-xs)' }}>{room.notes}</div>}

              {(canManage || canChangeStatus) && (
                <div className="flex gap-xs mt-md flex-wrap">
                  {canManage && (
                    <button className="btn btn-ghost btn-sm flex-1" onClick={() => openEdit(room)}>Edit</button>
                  )}
                  {canChangeStatus && (
                    <>
                      {room.status !== 'maintenance' && (
                        <button className="btn btn-ghost btn-sm flex-1" onClick={() => handleStatusChange(room, 'maintenance')} title="Mark under maintenance">🔧</button>
                      )}
                      {(room.status === 'maintenance' || room.status === 'checkout') && (
                        <button className="btn btn-ghost btn-sm flex-1" onClick={() => handleStatusChange(room, 'available')} title="Mark as available">
                          {room.status === 'checkout' ? '✓ Clean' : '✓ Fix'}
                        </button>
                      )}
                    </>
                  )}
                  {canManage && (
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(room)}>🗑</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={showAdd || !!editRoom}
        onClose={() => { setShowAdd(false); setEditRoom(null) }}
        title={editRoom ? `Edit Room ${editRoom.roomNumber}` : 'Add New Room'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setEditRoom(null) }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Saving…' : 'Save Room'}
            </button>
          </>
        }
      >
        {error && <div style={{ color: 'var(--red)', fontSize: 'var(--fs-sm)' }}>{error}</div>}
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label" htmlFor="room-number">Room Number *</label>
            <input id="room-number" className="input" placeholder="101" value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="room-floor">Floor</label>
            <input id="room-floor" className="input" type="number" min={0} value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} />
          </div>
        </div>
        <div className="input-group">
          <label className="input-label" htmlFor="room-type">Room Type</label>
          <select id="room-type" className="input" value={form.roomType} onChange={e => setForm(f => ({ ...f, roomType: e.target.value }))}>
            {['Standard', 'Deluxe', 'Suite', 'Executive', 'Family', 'Studio'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label" htmlFor="room-price">Price per Night (₹)</label>
          <input id="room-price" className="input" type="number" min={0} value={form.pricePerNight} onChange={e => setForm(f => ({ ...f, pricePerNight: e.target.value }))} />
        </div>
        <div className="input-group">
          <label className="input-label" htmlFor="room-notes">Notes (optional)</label>
          <textarea id="room-notes" className="input" placeholder="e.g. Sea view, needs maintenance…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
        </div>
      </Modal>
    </div>
  )
}
