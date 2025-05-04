/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'https://localhost:7091/api/:path*',
        },
      ];
    },
  };
  
  module.exports = nextConfig;