import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents: true,
  // output: "standalone",
  experimental: {
    imgOptTimeoutInSeconds: 30,
    optimizePackageImports: ["lucide-react", "lodash-es"],
  },
  images: {
    unoptimized: false,
    //Set to 40 days (in seconds) to improve from the default cache duration of Next.js for optimized images. This ensures that the images are cached for a reasonable amount of time, improving performance and reducing server load.
    minimumCacheTTL: 3456000,
    // qualities: [75, 85, 100],
    formats: ["image/avif", "image/webp"],
    // deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
