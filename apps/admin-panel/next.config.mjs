/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PORT: '5001',
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
};

export default nextConfig; 