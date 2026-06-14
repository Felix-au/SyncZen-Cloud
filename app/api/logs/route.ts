import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import ActivityLog from '@/lib/models/ActivityLog'
import '@/lib/models/User' // ensure User schema is registered for populate
import { auth } from '@/lib/auth'
import { isSuperAdmin } from '@/lib/roles'

/**
 * GET /api/logs
 * Returns the activity logs for the user's hotel.
 * Restricted to hotel_owner and super_admin.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isOwner = session.user.role === 'hotel_owner'
  const isSuper = isSuperAdmin(session.user.role as any)

  if (!isOwner && !isSuper) {
    return NextResponse.json({ error: 'Forbidden — owner access required' }, { status: 403 })
  }

  await connectDB()

  const query: Record<string, any> = {}
  if (!isSuper) {
    if (!session.user.hotelId) {
      return NextResponse.json({ error: 'User is not associated with a hotel' }, { status: 400 })
    }
    query.hotelId = session.user.hotelId
  }

  try {
    const logs = await ActivityLog.find(query)
      .populate('userId', 'username name email role')
      .sort({ createdAt: -1 })
      .limit(200) // limit to 200 logs for rendering performance
      .lean()

    return NextResponse.json({ logs })
  } catch (err: any) {
    console.error('[logs GET] error:', err?.message ?? err)
    return NextResponse.json({ error: 'Failed to fetch logs', detail: err.message }, { status: 500 })
  }
}
