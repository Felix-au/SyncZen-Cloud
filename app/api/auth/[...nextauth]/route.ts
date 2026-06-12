import { handlers } from '@/lib/auth'

/**
 * NextAuth v5 route handler.
 * Handles GET /api/auth/[...nextauth] (session, providers, csrf)
 * and POST /api/auth/[...nextauth] (sign in, sign out callbacks).
 */
export const { GET, POST } = handlers
