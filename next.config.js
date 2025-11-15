/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For local development: set to ''
  // For production: set to '/nm2timesheet'
  basePath: process.env.NEXT_PUBLIC_USE_BASEPATH === 'false' ? '' : (process.env.NODE_ENV === 'production' ? '/nm2timesheet' : ''),
  // Ensure static assets use the correct base path
  assetPrefix: process.env.NEXT_PUBLIC_USE_BASEPATH === 'false' ? '' : (process.env.NODE_ENV === 'production' ? '/nm2timesheet' : ''),
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig


