import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "acculekhaa.com" },
      { protocol: "https", hostname: "www.acculekhaa.com" }
    ]
  }
};

export default nextConfig;
