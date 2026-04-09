/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'static.wixstatic.com', pathname: '/media/**' },
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  // Firecrawl v2 depends on undici (a Node.js fetch impl) which can't be
  // bundled by webpack. Mark it as external so Next.js 14 loads it at
  // runtime from node_modules rather than trying to bundle it.
  experimental: {
    serverComponentsExternalPackages: ['@mendable/firecrawl-js', 'undici'],
  },
};

module.exports = nextConfig;
