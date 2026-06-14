import mongoose, { Schema, Document, Model, models } from 'mongoose'

/**
 * PhotoStore — stores compressed guest/ID photos as base64 in MongoDB.
 *
 * Photos are compressed to max 1024px JPEG@85% by the client before upload,
 * so each document is typically 50–200 KB — well within MongoDB's 16 MB
 * document limit and BSON string limits.
 *
 * Indexed by hotelId so photos can be scoped and cleaned up per hotel.
 */
export interface IPhoto extends Document {
  hotelId: mongoose.Types.ObjectId | string | null
  filename: string
  mimeType: string
  /** Full base64 data URI: "data:image/jpeg;base64,..." */
  dataUri: string
  folder: string
  createdAt: Date
}

const PhotoSchema = new Schema<IPhoto>(
  {
    hotelId:  { type: Schema.Types.Mixed, default: null, index: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    dataUri:  { type: String, required: true },
    folder:   { type: String, default: '' },
  },
  { timestamps: true }
)

if (models['Photo']) {
  delete (models as Record<string, unknown>)['Photo']
}

const Photo: Model<IPhoto> = mongoose.model<IPhoto>('Photo', PhotoSchema)
export default Photo
