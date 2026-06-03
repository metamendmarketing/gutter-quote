import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/nolands/gutterquote',
  serverExternalPackages: ["canvas"],
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts",
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
