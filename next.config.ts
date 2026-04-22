import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['pdf-lib', '@pdf-lib/fontkit', 'pizzip', 'docxtemplater'],
}

export default nextConfig
