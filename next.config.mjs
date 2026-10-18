/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ship the assistant's markdown knowledge base with the serverless function.
  outputFileTracingIncludes: {
    '/api/assistant': ['./content/knowledge/**'],
  },
}

export default nextConfig
