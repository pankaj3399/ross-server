/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use tsconfig.json paths; explicitly enable for Turbopack
  experimental: {
    tsconfigPaths: true,
  },
};

module.exports = nextConfig;
