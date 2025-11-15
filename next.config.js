/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For local testing, comment out basePath or set to empty string
  // For production, uncomment and set to '/nm2timesheet'
  // basePath: '/nm2timesheet',
  basePath: '', // Empty for local development
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig


