import mongoose, { Schema, Document, Model, models } from 'mongoose'

/**
 * Room model — a single physical room in a hotel.
 * Status lifecycle: available → occupied (on check-in) → checkout → available
 */

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'checkout'

export interface IRoom extends Document {
  hotelId: mongoose.Types.ObjectId
  roomNumber: string
  roomType: string
  floor: number
  status: RoomStatus
  pricePerNight: number
  notes: string
  createdAt: Date
  updatedAt: Date
}

const RoomSchema = new Schema<IRoom>(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    roomNumber: { type: String, required: true, trim: true },
    roomType: {
      type: String,
      default: 'Standard',
      trim: true,
      // Common types — staff can also enter custom
    },
    floor: { type: Number, default: 1, min: 0 },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'checkout'],
      default: 'available',
      required: true,
    },
    pricePerNight: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true }
)

// Compound index: room numbers are unique per hotel (not globally)
RoomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true })

const Room: Model<IRoom> = models.Room ?? mongoose.model<IRoom>('Room', RoomSchema)
export default Room
