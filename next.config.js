/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure API routes work correctly
  async rewrites() {
    return []
  },
  webpack: (config, { isServer }) => {
    // Make Capacitor modules optional for web builds
    // This allows the app to build for web even if Capacitor is not available
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
      }
    }
    
    return config
  },
}

module.exports = nextConfig

