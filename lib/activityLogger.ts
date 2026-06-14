import { connectDB } from './mongodb'
import ActivityLog from './models/ActivityLog'

export async function logActivity(userId: string, hotelId: string, action: string, details: string) {
  try {
    await connectDB()
    await ActivityLog.create({
      userId,
      hotelId,
      action,
      details,
    })
  } catch (error) {
    console.error('[logActivity] failed:', error)
  }
}
