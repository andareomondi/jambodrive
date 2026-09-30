import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // output: "standalone",
  experimental: {
    imgOptTimeoutInSeconds: 30,
    optimizePackageImports: ["lucide-react", "lodash-es"],
  },
  images: {
    unoptimized: false,
    minimumCacheTTL: 86400,
    qualities: [75, 85, 100],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "axpglbklaqelbbkbynul.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
