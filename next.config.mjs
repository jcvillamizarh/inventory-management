/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove ignoreBuildErrors to catch TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Allow resolving .js extensions for .ts files
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
