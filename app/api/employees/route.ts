import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import { auth } from '@/lib/auth'
import { canManageEmployees } from '@/lib/roles'

/**
 * GET /api/employees
 * Lists all users associated with the current hotel, excluding the owner
 * (owner manages via settings). Sorted by role weight then name.
 */
export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageEmployees(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — manager role required' }, { status: 403 })
  }
  if (!session.user.hotelId) return NextResponse.json({ employees: [] })

  await connectDB()

  const employees = await User.find({
    hotelId: session.user.hotelId,
    role: { $ne: 'super_admin' },
  })
    .select('-passwordHash')
    .sort({ role: 1, name: 1 })
    .lean()

  return NextResponse.json({ employees })
}

/**
 * POST /api/employees
 * Adds an existing user to this hotel by email.
 * The user must already have a registered account but no hotelId.
 * Defaults new employee to 'staff' role.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageEmployees(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden — manager role required' }, { status: 403 })
  }
  if (!session.user.hotelId) {
    return NextResponse.json({ error: 'Not associated with a hotel' }, { status: 400 })
  }

  const { email, role = 'staff' } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const allowedRoles = ['manager', 'staff']
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'role must be manager or staff' }, { status: 400 })
  }

  await connectDB()

  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user) {
    return NextResponse.json(
      { error: 'No account found with that email. Ask them to register first.' },
      { status: 404 }
    )
  }

  if (user.hotelId) {
    return NextResponse.json(
      { error: 'This user is already associated with a hotel' },
      { status: 409 }
    )
  }

  user.hotelId = session.user.hotelId as any
  user.role = role
  await user.save()

  return NextResponse.json({
    employee: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  }, { status: 201 })
}
