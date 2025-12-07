/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@shopify/polaris', '@shopify/polaris-icons'],
  webpack: (config, { isServer }) => {
    // Ignore source map warnings from Shopify Polaris
    config.ignoreWarnings = [
      { module: /@shopify\/polaris/ },
    ];
    return config;
  },
};

export default nextConfig;
