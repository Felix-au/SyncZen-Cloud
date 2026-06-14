import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Room from '@/lib/models/Room'
import Booking from '@/lib/models/Booking'
import { auth } from '@/lib/auth'
import { canManageRooms } from '@/lib/roles'
import { logActivity } from '@/lib/activityLogger'

type Params = { params: Promise<{ id: string }> }

/** PATCH /api/rooms/[id] — Edit room details or status (manager+) */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageRooms(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — manager role required' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const allowed = ['roomNumber', 'roomType', 'floor', 'pricePerNight', 'notes', 'status']

    await connectDB()
    const { id } = await params

    const room = await Room.findOne({ _id: id, hotelId: session.user.hotelId })
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const oldStatus = room.status

    // Apply updates
    for (const key of allowed) {
      if (body[key] !== undefined) {
        (room as any)[key] = body[key]
      }
    }

    await room.save()

    // Activity logging
    if (oldStatus === 'maintenance' && room.status === 'available') {
      await logActivity(
        session.user.id,
        session.user.hotelId!,
        'room_maintenance_resolved',
        `Room ${room.roomNumber} marked as Available (Serviced) from Maintenance.`
      )
    } else if (oldStatus !== 'maintenance' && room.status === 'maintenance') {
      await logActivity(
        session.user.id,
        session.user.hotelId!,
        'room_maintenance_started',
        `Room ${room.roomNumber} marked as Under Maintenance.`
      )
    } else if (oldStatus !== room.status) {
      await logActivity(
        session.user.id,
        session.user.hotelId!,
        'room_status_change',
        `Room ${room.roomNumber} status changed from ${oldStatus} to ${room.status}.`
      )
    } else {
      await logActivity(
        session.user.id,
        session.user.hotelId!,
        'room_update',
        `Updated details for Room ${room.roomNumber}.`
      )
    }

    return NextResponse.json({ room })
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'Room number already exists in this hotel' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Update failed', detail: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/rooms/[id]
 * Deletes a room. Blocked if the room is currently occupied.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageRooms(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — manager role required' }, { status: 403 })
  }

  await connectDB()
  const { id } = await params

  const room = await Room.findOne({ _id: id, hotelId: session.user.hotelId })
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  if (room.status === 'occupied') {
    return NextResponse.json(
      { error: 'Cannot delete an occupied room — check out guests first' },
      { status: 409 }
    )
  }

  await Room.findByIdAndDelete(id)

  await logActivity(
    session.user.id,
    session.user.hotelId!,
    'room_delete',
    `Deleted room: Room ${room.roomNumber}`
  )

  return NextResponse.json({ message: 'Room deleted' })
}
