import { google } from 'googleapis'
import { Readable } from 'stream'

/**
 * Google Drive service account client.
 *
 * Uses the service account credentials from environment variables.
 * No OAuth or user interaction required — this is a server-to-server
 * integration where the service account acts as its own identity.
 *
 * All uploaded files are made publicly readable so they can be served
 * directly from Google's CDN via a thumbnail URL, with no proxy needed.
 */

function getDriveClient() {
  const clientEmail = process.env.GOOGLE_SA_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive service account credentials not configured in environment variables')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  return google.drive({ version: 'v3', auth })
}

/**
 * Ensures a folder exists inside the service account's Drive.
 * Creates intermediate folders as needed (e.g. "hotelId/bookingRef").
 *
 * @param path - slash-separated folder path, e.g. "abc123/SS1A2B3C"
 * @returns the Google Drive folder ID of the deepest folder
 */
async function ensureFolder(path: string): Promise<string> {
  const drive = getDriveClient()
  const parts = path.split('/').filter(Boolean)
  let parentId = 'root'

  for (const part of parts) {
    // Search for existing folder with this name under the current parent
    const res = await drive.files.list({
      q: `name='${part}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    })

    if (res.data.files && res.data.files.length > 0) {
      parentId = res.data.files[0].id!
    } else {
      // Create the folder
      const folder = await drive.files.create({
        requestBody: {
          name: part,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        },
        fields: 'id',
      })
      parentId = folder.data.id!
    }
  }

  return parentId
}

export interface DriveUploadResult {
  fileId: string
  /** Direct Google CDN thumbnail URL — usable as <img src> without any proxy */
  url: string
}

/**
 * Uploads a file to Google Drive under the given folder path.
 * After upload, sets the file to publicly readable so the URL works
 * in any browser without authentication.
 *
 * @param buffer - the file data
 * @param filename - the file name to store in Drive
 * @param mimeType - MIME type, e.g. 'image/jpeg'
 * @param folderPath - Drive folder path, e.g. 'hotelId/bookingReference'
 */
export async function uploadToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folderPath: string
): Promise<DriveUploadResult> {
  const drive = getDriveClient()

  // Ensure folder structure exists
  const folderId = await ensureFolder(folderPath)

  // Upload the file
  const { data } = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id',
  })

  const fileId = data.id!

  // Make publicly readable — "anyone with the link" can view
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  // Use the thumbnail endpoint for consistent image delivery
  // sz=w800 gives an 800px-wide version — good for display
  const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`

  return { fileId, url }
}

/**
 * Deletes a file from Google Drive by its file ID.
 * Used when a booking is cancelled or a photo is replaced.
 */
export async function deleteFromDrive(fileId: string): Promise<void> {
  const drive = getDriveClient()
  await drive.files.delete({ fileId })
}
