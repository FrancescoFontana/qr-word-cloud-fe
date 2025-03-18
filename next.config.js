/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: false,
  webpack: (config, { dev, isServer }) => {
    // Disable minification in production
    if (!dev) {
      config.optimization.minimize = false;
      config.optimization.minimizer = [];
    }
    return config;
  }
}

module.exports = nextConfig 