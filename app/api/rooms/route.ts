import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Room from '@/lib/models/Room'
import { auth } from '@/lib/auth'
import { canCheckIn, canManageRooms, belongsToHotel } from '@/lib/roles'

/**
 * GET /api/rooms?status=available
 * Returns rooms for the user's hotel.
 * Optional `status` query param to filter (available | occupied | maintenance | checkout).
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCheckIn(session.user.role as any)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!session.user.hotelId) return NextResponse.json({ rooms: [] })

  await connectDB()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const query: Record<string, any> = { hotelId: session.user.hotelId }
  if (status) query.status = status

  const rooms = await Room.find(query).sort({ floor: 1, roomNumber: 1 }).lean()
  return NextResponse.json({ rooms })
}

/**
 * POST /api/rooms
 * Adds a new room to the hotel. Requires manager+ role.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageRooms(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — manager role required' }, { status: 403 })
  }
  if (!session.user.hotelId) {
    return NextResponse.json({ error: 'Not associated with a hotel' }, { status: 400 })
  }

  try {
    const { roomNumber, roomType, floor, pricePerNight, notes } = await req.json()
    if (!roomNumber?.trim()) {
      return NextResponse.json({ error: 'roomNumber is required' }, { status: 400 })
    }

    await connectDB()

    const room = await Room.create({
      hotelId: session.user.hotelId,
      roomNumber: roomNumber.trim(),
      roomType: roomType?.trim() || 'Standard',
      floor: floor ?? 1,
      pricePerNight: pricePerNight ?? 0,
      notes: notes?.trim() ?? '',
      status: 'available',
    })

    return NextResponse.json({ room }, { status: 201 })
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: `Room ${err.keyValue?.roomNumber} already exists in this hotel` }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create room', detail: err.message }, { status: 500 })
  }
}
