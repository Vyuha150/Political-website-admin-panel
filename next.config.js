/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  images: { unoptimized: true },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      bufferutil: false,
      "utf-8-validate": false,
      ws: false,
    };
    return config;
  },
};

module.exports = nextConfig;
