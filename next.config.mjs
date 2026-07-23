/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["ioredis", "ws"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
        serverActions: {
          bodySizeLimit: "20mb", // Adjust as needed
        },
      },
}

export default nextConfig
