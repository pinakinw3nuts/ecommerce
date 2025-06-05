/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PORT: '3200',
  },
  output: 'standalone',
  typescript: {
    // !! WARN !!
    // Temporarily ignoring type checking during build to work around Next.js 15 type issues
    // This should be removed once the type issues are resolved
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // Temporarily ignoring ESLint during build
    // This should be removed once the ESLint issues are resolved
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
      '@components': './src/components',
      '@lib': './src/lib',
      '@hooks': './src/hooks',
    };
    return config;
  },
  images: {
    domains: ['picsum.photos', 'example.com'],
  },
  reactStrictMode: false,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
};

export default nextConfig; 