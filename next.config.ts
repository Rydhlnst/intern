import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: process.env.MINIO_ENDPOINT ?? "localhost",
        port: process.env.MINIO_PORT ?? "9000",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
