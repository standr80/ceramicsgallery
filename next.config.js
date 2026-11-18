/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async redirects() {
    return [
      { source: "/blog", destination: "/news", permanent: true },
      { source: "/blog/:slug*", destination: "/news/:slug*", permanent: true },
    ];
  },
};

module.exports = nextConfig;
