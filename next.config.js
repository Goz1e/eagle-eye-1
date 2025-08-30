/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        events: false,
        'node:crypto': false,
        'node:events': false,
        'node:net': false,
        'node:tls': false,
        'node:timers/promises': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
