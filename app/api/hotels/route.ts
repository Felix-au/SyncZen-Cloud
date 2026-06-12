import { NextRequest, NextResponse } from 'next/server'
import { customAlphabet } from 'nanoid'
import { connectDB } from '@/lib/mongodb'
import Hotel from '@/lib/models/Hotel'
import User from '@/lib/models/User'
import { auth } from '@/lib/auth'
import { isSuperAdmin } from '@/lib/roles'

/** Generates invite keys like "HTLX-4F2K" — URL-safe uppercase alphanumeric */
const genKey = () => {
  const alpha = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4)
  return `${alpha()}-${alpha()}`
}

/**
 * GET /api/hotels
 * Super admin: returns all hotels with owner info and room/booking counts.
 * Hotel staff+: returns their own hotel only (via session hotelId).
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  if (isSuperAdmin(session.user.role as any)) {
    // Super admin sees all hotels, populated with owner name and email
    const hotels = await Hotel.find({})
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .lean()
    return NextResponse.json({ hotels })
  }

  // Regular users see only their own hotel
  if (!session.user.hotelId) {
    return NextResponse.json({ hotel: null })
  }

  const hotel = await Hotel.findById(session.user.hotelId)
    .populate('ownerId', 'name email')
    .lean()

  return NextResponse.json({ hotel })
}

/**
 * POST /api/hotels
 * Creates a new hotel and promotes the calling user to hotel_owner.
 * A user can only own one hotel (enforced by hotelId check).
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.user.hotelId) {
    return NextResponse.json(
      { error: 'You are already associated with a hotel. Leave it first to create a new one.' },
      { status: 409 }
    )
  }

  try {
    const { name, address, phone, email } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Hotel name is required' }, { status: 400 })
    }

    await connectDB()

    // Generate a unique invite key (retry on collision)
    let inviteKey = genKey()
    while (await Hotel.exists({ inviteKey })) { inviteKey = genKey() }

    const hotel = await Hotel.create({
      name: name.trim(),
      address: address?.trim() ?? '',
      phone: phone?.trim() ?? '',
      email: email?.toLowerCase().trim() ?? '',
      ownerId: session.user.id,
      inviteKey,
    })

    // Promote calling user to hotel_owner and link to this hotel
    await User.findByIdAndUpdate(session.user.id, {
      role: 'hotel_owner',
      hotelId: hotel._id,
    })

    return NextResponse.json(
      { hotel: { _id: hotel._id, name: hotel.name, inviteKey: hotel.inviteKey } },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[hotels POST] Error:', err)
    return NextResponse.json({ error: 'Failed to create hotel' }, { status: 500 })
  }
}
