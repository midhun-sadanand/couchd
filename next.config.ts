import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['image.tmdb.org']
  },
  typescript: {
    ignoreBuildErrors: true
  },
  transpilePackages: ['@hello-pangea/dnd']
};

export default nextConfig;
