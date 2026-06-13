/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'drive.google.com',
      'lh3.googleusercontent.com',
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  /**
   * Exclude mongoose and googleapis from webpack bundling (Next.js 15 API).
   *
   * These packages use Node.js-only APIs (native modules, eval) and cannot
   * run in the Edge Runtime. Marking them as external ensures they are
   * require()'d at runtime in Node.js API routes instead of being bundled,
   * which prevents them from ending up in Edge middleware chunks.
   *
   * Renamed from experimental.serverComponentsExternalPackages in Next.js 14.
   */
  serverExternalPackages: ['mongoose', 'googleapis'],
}

module.exports = nextConfig
