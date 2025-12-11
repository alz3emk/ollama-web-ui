import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Expose environment variables to the browser
  env: {
    NEXT_PUBLIC_OLLAMA_URL: process.env.NEXT_PUBLIC_OLLAMA_URL || '',
  },
};

export default nextConfig;
