/** @type {import('next').NextConfig} */
const nextConfig = {
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
