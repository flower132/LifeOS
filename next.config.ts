import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.5", "172.20.10.13", "192.168.1.13", "192.168.1.15", "192.168.1.18"],
};

export default nextConfig;
