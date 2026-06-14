import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Photo from '@/lib/models/Photo'
import { auth } from '@/lib/auth'
import { canCheckIn } from '@/lib/roles'

/**
 * POST /api/upload
 *
 * Stores a base64-encoded photo in MongoDB and returns a stable URL
 * via the /api/photos/[id] route.
 *
 * Replaces the previous Google Drive integration which failed with
 * "Service Accounts do not have storage quota".
 *
 * Body: { data: string, filename: string, folder: string }
 * Response: { fileId: string, url: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCheckIn(session.user.role as any)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { data, filename, folder } = await req.json()

    if (!data || !filename) {
      return NextResponse.json({ error: 'data and filename are required' }, { status: 400 })
    }

    // Validate it's a proper data URI
    if (!data.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid data URI format' }, { status: 400 })
    }

    const mimeMatch = data.match(/^data:([^;]+);base64,/)
    const mimeType  = mimeMatch?.[1] ?? 'image/jpeg'

    await connectDB()

    const photo = await Photo.create({
      hotelId:  session.user.hotelId ?? null,
      filename: filename.trim(),
      mimeType,
      dataUri:  data,
      folder:   folder ?? '',
    })

    const fileId = photo._id.toString()
    const url    = `/api/photos/${fileId}`

    return NextResponse.json({ fileId, url }, { status: 201 })
  } catch (err: any) {
    console.error('[upload] Error:', err?.message ?? err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
