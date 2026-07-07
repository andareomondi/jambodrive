import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents: true,
  images: {
    qualities: [85, 100, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "axpglbklaqelbbkbynul.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  allowedDevOrigins: ["http://192.168.100.54:3000"],
};

export default nextConfig;
