import mongoose, { Schema, Document, Model, models } from 'mongoose'

/**
 * Booking model — represents a completed hotel check-in.
 *
 * Each booking has:
 *  - One or more guests (first = primary contact)
 *  - One or more rooms
 *  - Optional photos per guest and a single group ID proof document
 *    (both stored in Google Drive, referenced by fileId + public URL)
 *  - Status lifecycle: checked_in → checked_out | cancelled
 */

export interface IGuest {
  name: string
  phone?: string
  age?: number
  sex?: 'male' | 'female' | 'other'
  photoFileId?: string   // Google Drive file ID
  photoUrl?: string      // Public CDN URL (drive.google.com thumbnail)
  isPrimary: boolean
}

export interface IBooking extends Document {
  hotelId: mongoose.Types.ObjectId
  bookingReference: string        // e.g. "SS1A2B3C" — unique, human-readable
  checkInTime: Date
  checkOutDate: Date
  status: 'checked_in' | 'checked_out' | 'cancelled'
  roomIds: mongoose.Types.ObjectId[]
  guests: IGuest[]
  idProofFileId?: string          // Google Drive file ID for group ID document
  idProofUrl?: string             // Public CDN URL
  notes?: string
  nights: number
  createdBy: mongoose.Types.ObjectId  // User who performed the check-in
  createdAt: Date
}

const GuestSchema = new Schema<IGuest>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    age: { type: Number, min: 0, max: 150 },
    sex: { type: String, enum: ['male', 'female', 'other'] },
    photoFileId: { type: String },
    photoUrl: { type: String },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }  // guests are sub-documents, no separate _id needed
)

const BookingSchema = new Schema<IBooking>(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    bookingReference: { type: String, required: true, unique: true, uppercase: true, trim: true },
    checkInTime: { type: Date, default: Date.now },
    checkOutDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['checked_in', 'checked_out', 'cancelled'],
      default: 'checked_in',
      required: true,
    },
    roomIds: [{ type: Schema.Types.ObjectId, ref: 'Room' }],
    guests: { type: [GuestSchema], required: true, validate: [(v: IGuest[]) => v.length > 0, 'At least one guest required'] },
    idProofFileId: { type: String },
    idProofUrl: { type: String },
    notes: { type: String, trim: true },
    nights: { type: Number, required: true, min: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
)

// Index for common queries: hotel bookings sorted by check-in time
BookingSchema.index({ hotelId: 1, checkInTime: -1 })
// Index for status filtering
BookingSchema.index({ hotelId: 1, status: 1 })

const Booking: Model<IBooking> = models.Booking ?? mongoose.model<IBooking>('Booking', BookingSchema)
export default Booking
