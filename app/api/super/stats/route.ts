import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Hotel from '@/lib/models/Hotel'
import Booking from '@/lib/models/Booking'
import Room from '@/lib/models/Room'
import User from '@/lib/models/User'
import { auth } from '@/lib/auth'
import { isSuperAdmin } from '@/lib/roles'

/**
 * GET /api/super/stats
 * Platform-wide statistics for the super admin dashboard.
 * Returns counts of hotels, users, rooms, and today's activity.
 */
export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user || !isSuperAdmin(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 })
  }

  await connectDB()

  const [
    totalHotels,
    totalUsers,
    totalRooms,
    occupiedRooms,
    activeBookings,
    todayBookings,
    hotels,
  ] = await Promise.all([
    Hotel.countDocuments(),
    User.countDocuments({ role: { $ne: 'super_admin' } }),
    Room.countDocuments(),
    Room.countDocuments({ status: 'occupied' }),
    Booking.countDocuments({ status: 'checked_in' }),
    Booking.countDocuments({
      checkInTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      status: 'checked_in',
    }),
    // Recent hotels with owner info and room count
    Hotel.find({})
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ])

  // Attach room and booking counts per hotel
  const hotelIds = hotels.map((h) => h._id)
  const [roomCounts, bookingCounts] = await Promise.all([
    Room.aggregate([
      { $match: { hotelId: { $in: hotelIds } } },
      { $group: { _id: '$hotelId', count: { $sum: 1 }, occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } } } },
    ]),
    Booking.aggregate([
      { $match: { hotelId: { $in: hotelIds }, status: 'checked_in' } },
      { $group: { _id: '$hotelId', count: { $sum: 1 } } },
    ]),
  ])

  const roomMap   = Object.fromEntries(roomCounts.map((r) => [r._id.toString(), r]))
  const bookMap   = Object.fromEntries(bookingCounts.map((b) => [b._id.toString(), b]))

  const hotelsWithStats = hotels.map((h) => ({
    ...h,
    roomCount: roomMap[h._id.toString()]?.count ?? 0,
    occupiedCount: roomMap[h._id.toString()]?.occupied ?? 0,
    activeBookings: bookMap[h._id.toString()]?.count ?? 0,
  }))

  return NextResponse.json({
    stats: { totalHotels, totalUsers, totalRooms, occupiedRooms, activeBookings, todayBookings },
    hotels: hotelsWithStats,
  })
}
