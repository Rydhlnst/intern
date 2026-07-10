import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Ensure sharp native binaries are included in the standalone trace
  outputFileTracingIncludes: {
    "/*": ["node_modules/sharp/**/*", "node_modules/@img/**/*"],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        // MINIO_PUBLIC_HOST is the publicly reachable hostname (e.g. your VPS IP).
        // Falls back to MINIO_ENDPOINT for local dev.
        protocol: (process.env.MINIO_USE_SSL === "true" ? "https" : "http") as "http" | "https",
        hostname: process.env.MINIO_PUBLIC_HOST ?? process.env.MINIO_ENDPOINT ?? "localhost",
        port: process.env.MINIO_PORT ?? "9000",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
