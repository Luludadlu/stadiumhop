import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "photo.hotellook.com" },
      { hostname: "images.unsplash.com" },
      { hostname: "upload.wikimedia.org" },
    ],
  },
};

export default nextConfig;
