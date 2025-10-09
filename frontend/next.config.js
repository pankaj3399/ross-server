/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ensure proper module resolution
    esmExternals: true,
  },
  // Ensure TypeScript path mapping works
  typescript: {
    ignoreBuildErrors: false,
  },
  // Webpack configuration for better module resolution
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname, "src"),
    };
    return config;
  },
};

module.exports = nextConfig;
