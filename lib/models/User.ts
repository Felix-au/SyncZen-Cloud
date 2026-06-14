import mongoose, { Schema, Document, Model } from 'mongoose'

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
 * Safe model registration for Next.js hot-reload.
 *
 * DO NOT use `delete mongoose.models['User']` — it breaks `.populate('createdBy')`
 * in other routes that reference 'User' by name without importing this file,
 * because Mongoose looks up the schema from the models registry.
 *
 * Instead: if the model already exists (from a previous hot-reload cycle),
 * return it as-is. The schema is effectively the same — the username field
 * change only needs a dev server restart to take effect, which the user
 * should do once after the schema migration.
 */
const User: Model<IUser> =
  (mongoose.models['User'] as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema)

export default User
