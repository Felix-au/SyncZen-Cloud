import mongoose, { Schema, Document, Model, models } from 'mongoose'

/**
 * User model — covers all roles in the system.
 * super_admin: global access (Felix), no hotelId
 * hotel_owner: full control of their hotel
 * manager: same as owner except hotel deletion & managing managers
 * staff: check-in / check-out only
 */

export interface IUser extends Document {
  email: string
  username?: string
  passwordHash: string
  name: string
  role: 'super_admin' | 'hotel_owner' | 'manager' | 'staff'
  hotelId: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      index: { unique: true, sparse: true },
    },
    role: {
      type: String,
      enum: ['super_admin', 'hotel_owner', 'manager', 'staff'],
      default: 'staff',
      required: true,
    },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', default: null },
  },
  { timestamps: true }
)

/**
 * In Next.js dev mode, hot-reload keeps mongoose.models alive but may have
 * compiled the schema BEFORE the username field was added — so the cached
 * model silently strips the username field on every User.create().
 *
 * Fix: delete the cached model so this file always re-registers it with
 * the CURRENT schema. Safe because mongoose.connection persists separately.
 */
if (models['User']) {
  delete (models as Record<string, unknown>)['User']
}

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema)
export default User
