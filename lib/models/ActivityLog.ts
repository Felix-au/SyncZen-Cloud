import mongoose, { Schema, Document, Model, models } from 'mongoose'

export interface IActivityLog extends Document {
  hotelId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  action: string
  details: string
  createdAt: Date
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

const ActivityLog: Model<IActivityLog> = models.ActivityLog ?? mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema)
export default ActivityLog
