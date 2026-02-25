import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // Allow bcryptjs on server side
  serverExternalPackages: ['bcryptjs'],
  async rewrites() {
    return [
      {
        source: '/helpline',
        destination: '/helpline/index.html',
      },
      {
        source: '/helpline/:path*',
        destination: '/helpline/index.html',
      },
    ];
  },
};

export default nextConfig;
