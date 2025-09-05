import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Prevent ESLint warnings from failing Netlify builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
