import type { NextConfig } from "next";

// Bundle analyzer - run with ANALYZE=true npm run build
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Disable ESLint errors during build (warnings only)
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Enable compression (Next.js handles this automatically in production)
  compress: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable React strict mode
  reactStrictMode: true,

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // No custom webpack configuration needed
    // Using Next.js defaults which work correctly for all use cases
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
