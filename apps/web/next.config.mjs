/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ["@bind/shared", "@bind/core", "@bind/db"],
  webpack(config) {
    // Workspace packages use NodeNext-style ".js" specifiers for ".ts" sources.
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
};
