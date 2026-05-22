/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cards.scryfall.io',
      },
    ],
  },
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
