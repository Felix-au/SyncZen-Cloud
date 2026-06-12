import mongoose from 'mongoose'

/**
 * MongoDB connection singleton.
 * Reuses the existing connection across hot-reloads in development
 * and across requests in production (each serverless function reuses the cached promise).
 */

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// In development, Next.js hot-reloads can create multiple connections.
// We cache the connection on the global object to prevent that.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null }
global._mongooseCache = cached

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
