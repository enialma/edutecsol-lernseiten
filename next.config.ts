import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Die bisherige statische Startseite bleibt unter / erreichbar.
    return [{ source: "/", destination: "/index.html" }];
  },
};

export default nextConfig;
