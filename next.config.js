/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Run ESLint on source directories during build
    dirs: ['src'],
    // Fail build on ESLint errors, but allow warnings
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Fail build on TypeScript errors
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
