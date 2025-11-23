/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure API routes work correctly
  async rewrites() {
    return []
  },
}

// PWA configuration - only apply if next-pwa is available
let withPWA
try {
  withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development', // Disable di development
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'offlineCache',
          expiration: {
            maxEntries: 200,
          },
        },
      },
    ],
  })
  module.exports = withPWA(nextConfig)
} catch (error) {
  // If next-pwa is not available, use config without PWA
  console.warn('next-pwa not found, skipping PWA configuration')
  module.exports = nextConfig
}

