/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/notifications/unsubscribe/:token*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:4000'}/notifications/unsubscribe/:token*`,
      },
    ];
  },
};

module.exports = nextConfig;
