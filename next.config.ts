import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.20.10.7'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.slovenscinakzk.com",
      }
    ],
  },
};

export default nextConfig;
