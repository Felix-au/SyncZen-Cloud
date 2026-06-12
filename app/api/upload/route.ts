import { NextRequest, NextResponse } from 'next/server'
import { uploadToDrive } from '@/lib/drive'
import { auth } from '@/lib/auth'
import { canCheckIn } from '@/lib/roles'

/**
 * POST /api/upload
 *
 * Receives a base64-encoded file from the client, uploads it to Google Drive
 * using the service account, makes it publicly readable, and returns the
 * file ID and direct CDN URL.
 *
 * The folder structure in Drive mirrors: hotelId/bookingRef/filename
 * This keeps uploads organised and easy to find/clean up.
 *
 * Body:
 * {
 *   data: string,       // base64 data URI, e.g. "data:image/jpeg;base64,/9j/..."
 *   filename: string,   // e.g. "guest1_photo.jpg"
 *   folder: string,     // Drive folder path, e.g. "hotelId/bookingRef"
 * }
 *
 * Response:
 * { fileId: string, url: string }
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

    // Parse base64 data URI: "data:image/jpeg;base64,<base64data>"
    const [header, base64] = data.split(',')
    if (!base64) {
      return NextResponse.json({ error: 'Invalid data URI format' }, { status: 400 })
    }

    const mimeType = header.match(/data:([^;]+)/)?.[1] ?? 'application/octet-stream'
    const buffer   = Buffer.from(base64, 'base64')

    // Use hotel ID as the root folder to keep uploads scoped per hotel
    const driveFolder = folder ?? session.user.hotelId ?? 'syncstay-uploads'

    const result = await uploadToDrive(buffer, filename, mimeType, driveFolder)

    return NextResponse.json(result, { status: 201 })
  } catch (err: any) {
    console.error('[upload] Drive upload error:', err)
    return NextResponse.json(
      { error: 'Upload failed', detail: err.message },
      { status: 500 }
    )
  }
}
