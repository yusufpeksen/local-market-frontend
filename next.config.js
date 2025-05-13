/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8072/api/:path*',
      },
    ];
  },
  images: {
    domains: ['pub-067aa8f526aa4ebfafcb51ac9ebc0e4c.r2.dev'],
  },
};

module.exports = nextConfig; 