/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  /**
   * Exclude mongoose and cloudinary from webpack bundling.
   * These packages use Node.js-only APIs and cannot run in the Edge Runtime.
   */
  serverExternalPackages: ['mongoose', 'cloudinary'],
}

module.exports = nextConfig
