/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  distDir: '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/' : '',
}

module.exports = nextConfig 