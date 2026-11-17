import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  headers: async () => [{ source: '/:path*', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'same-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ] }],
  turbopack: {
    root: path.resolve(__dirname),
  },
  webpack: (config) => {
    config.watchOptions = {
      ...(config.watchOptions || {}),
      ignored: ["**/data/**", "**/node_modules/**", "**/.git/**"],
    };
    return config;
  },
};

export default nextConfig;
