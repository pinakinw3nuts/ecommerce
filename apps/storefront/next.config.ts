import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'via.placeholder.com', 'picsum.photos', 'images.unsplash.com'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@lib': path.resolve(__dirname, './lib'),
      '@styles': path.resolve(__dirname, './styles'),
      '@utils': path.resolve(__dirname, './utils'),
    };
    return config;
  },
};

export default nextConfig;
