import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Booking from '@/lib/models/Booking'
import Room from '@/lib/models/Room'
import { auth } from '@/lib/auth'
import { canCheckIn } from '@/lib/roles'

type Params = { params: { id: string } }

/** GET /api/bookings/[id] — Full booking detail including guests and rooms */
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCheckIn(session.user.role as any)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()

  const booking = await Booking.findOne({
    _id: params.id,
    hotelId: session.user.hotelId,
  })
    .populate('roomIds', 'roomNumber roomType floor pricePerNight')
    .populate('createdBy', 'name email')
    .lean()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  return NextResponse.json({ booking })
}
