import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.resolve.alias["@huggingface/transformers"] = "@xenova/transformers";
    return config;
  }
};

export default nextConfig;
