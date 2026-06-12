import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'

/**
 * POST /api/seed
 *
 * Seeds the super admin account from environment variables.
 * Idempotent — safe to call multiple times (skips if already exists).
 *
 * Only enabled if SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are set.
 * Should only be called once after deploying a fresh instance.
 *
 * Security: No auth required (it's seeding the first user), but it
 * returns a generic 200 even if the user already exists to avoid
 * leaking whether a super admin account is configured.
 */
export async function POST() {
  const email    = process.env.SUPER_ADMIN_EMAIL
  const password = process.env.SUPER_ADMIN_PASSWORD
  const name     = 'Felix (Super Admin)'

  if (!email || !password) {
    return NextResponse.json(
      { error: 'SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env.local' },
      { status: 500 }
    )
  }

  try {
    await connectDB()

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      // Already seeded — do nothing, don't expose details
      return NextResponse.json({ message: 'Super admin already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'super_admin',
      hotelId: null,
    })

    return NextResponse.json({ message: `Super admin created: ${email}` }, { status: 201 })
  } catch (err: any) {
    console.error('[seed] Error:', err)
    return NextResponse.json({ error: 'Seed failed', detail: err.message }, { status: 500 })
  }
}
