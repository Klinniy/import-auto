import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.tru.ru", pathname: "/imgs/**" },
      { protocol: "http", hostname: "*.tru.ru", pathname: "/imgs/**" },
    ],
  },
};

export default nextConfig;
