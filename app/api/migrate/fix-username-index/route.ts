import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'

/**
 * GET /api/migrate/fix-username-index
 *
 * One-off migration:
 * - Drops the old non-sparse unique index on `username` (which causes
 *   E11000 duplicate key errors for all legacy docs with no username).
 * - Mongoose will recreate it as sparse on next model sync.
 *
 * Safe to run multiple times. DELETE THIS FILE after running.
 */
export async function GET() {
  await connectDB()
  const db = mongoose.connection.db!
  const col = db.collection('users')

  // List existing indexes
  const indexes = await col.indexes()
  const existing = indexes.find(i => i.key?.username === 1)

  if (!existing) {
    return NextResponse.json({ message: 'No username index found — nothing to drop.' })
  }

  await col.dropIndex(existing.name as string)

  return NextResponse.json({
    message: `Dropped index "${existing.name}". Restart the dev server — Mongoose will recreate it as sparse.`,
  })
}
