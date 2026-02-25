import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "acculekhaa.com" },
      { protocol: "https", hostname: "www.acculekhaa.com" },
      { protocol: "https", hostname: "*.vercel-storage.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" }
    ]
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/catalogue.html",
        permanent: false
      },
      {
        source: "/catalogue",
        destination: "/catalogue.html",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
