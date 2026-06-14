import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import { auth } from '@/lib/auth'
import { canManageEmployees } from '@/lib/roles'

/**
 * POST /api/employees/create
 *
 * Creates a brand-new user account AND immediately assigns them to the
 * manager's hotel. Intended for short-term / temporary staff who don't
 * have an existing account.
 *
 * Password minimum is intentionally relaxed to 4 chars so owners/managers
 * can create simple PIN-style credentials for temporary workers.
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

  const { name, username, email, password, role = 'staff' } = await req.json()

  // Basic validation
  if (!name?.trim())     return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!username?.trim()) return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  if (!email?.trim())    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  if (!password)         return NextResponse.json({ error: 'Password is required' }, { status: 400 })

  const cleanUsername = username.trim().toLowerCase()
  if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
    return NextResponse.json(
      { error: 'Username must be 3–20 chars: letters, numbers, underscores' },
      { status: 400 }
    )
  }

  // Relaxed minimum: 4 chars (not the public-facing 8)
  if (password.length < 4) {
    return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
  }

  const allowedRoles = ['manager', 'staff']
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'role must be manager or staff' }, { status: 400 })
  }

  await connectDB()

  // Check uniqueness
  const conflict = await User.findOne({
    $or: [{ email: email.toLowerCase().trim() }, { username: cleanUsername }],
  })
  if (conflict) {
    const field = conflict.email === email.toLowerCase().trim() ? 'email' : 'username'
    return NextResponse.json({ error: `That ${field} is already in use` }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({
    name: name.trim(),
    username: cleanUsername,
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
    hotelId: session.user.hotelId,
  })

  return NextResponse.json({
    employee: {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    }
  }, { status: 201 })
}
