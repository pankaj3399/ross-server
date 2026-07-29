/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@radix-ui/react-avatar',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-label',
    '@radix-ui/react-progress',
    '@radix-ui/react-scroll-area',
    '@radix-ui/react-select',
    '@radix-ui/react-separator',
    '@radix-ui/react-slot',
    '@radix-ui/react-switch',
    '@radix-ui/react-tabs',
    '@radix-ui/react-tooltip',
  ],
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

