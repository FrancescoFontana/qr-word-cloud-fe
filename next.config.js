/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  // Disable image optimization on Render (free tier has limited memory)
  images: {
    unoptimized: true,
  },
  // Minimize JavaScript in production
  swcMinify: true,
  // Configure environment variables
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Configure headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 