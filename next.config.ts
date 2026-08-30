import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
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
