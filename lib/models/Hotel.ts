import mongoose, { Schema, Document, Model, models } from 'mongoose'

/**
 * Hotel model — represents a registered hotel property.
 * Each hotel has an owner, a unique invite key for employee self-registration,
 * and optional Drive-hosted logo.
 */

export interface IHotel extends Document {
  name: string
  address: string
  phone: string
  email: string
  ownerId: mongoose.Types.ObjectId
  inviteKey: string          // e.g. "HTLX-4F2K" — employees use this to join
  logoFileId: string | null  // Google Drive file ID
  logoUrl: string | null     // public CDN URL
  createdAt: Date
  updatedAt: Date
}

const HotelSchema = new Schema<IHotel>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    inviteKey: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    logoFileId: { type: String, default: null },
    logoUrl: { type: String, default: null },
  },
  { timestamps: true }
)

const Hotel: Model<IHotel> = models.Hotel ?? mongoose.model<IHotel>('Hotel', HotelSchema)
export default Hotel
