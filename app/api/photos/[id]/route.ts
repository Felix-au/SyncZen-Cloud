import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Photo from '@/lib/models/Photo'

/**
 * GET /api/photos/[id]
 *
 * Serves a stored photo by its MongoDB _id.
 * Returns the raw image bytes with the correct Content-Type.
 * Cached by browsers for 1 hour (photos are immutable once stored).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const photo = await Photo.findById(params.id).select('dataUri mimeType filename').lean()

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Parse the base64 data URI
    const base64 = (photo.dataUri as string).split(',')[1]
    if (!base64) {
      return NextResponse.json({ error: 'Invalid photo data' }, { status: 500 })
    }

    const buffer = Buffer.from(base64, 'base64')

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':  photo.mimeType as string,
        'Cache-Control': 'public, max-age=3600, immutable',
        'Content-Disposition': `inline; filename="${photo.filename}"`,
      },
    })
  } catch (err: any) {
    console.error('[photos/get]', err?.message ?? err)
    return NextResponse.json({ error: 'Failed to load photo' }, { status: 500 })
  }
}
