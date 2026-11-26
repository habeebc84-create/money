import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // fully static: host free on Cloudflare Pages or Vercel, no server
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
