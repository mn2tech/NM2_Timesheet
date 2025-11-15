/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For local development: basePath is empty
  // For production: basePath is '/nm2timesheet'
  // You can override with NEXT_PUBLIC_USE_BASEPATH=false to force empty basePath
  basePath: process.env.NEXT_PUBLIC_USE_BASEPATH === 'false' 
    ? '' 
    : (process.env.NODE_ENV === 'production' ? '/nm2timesheet' : ''),
  // Ensure static assets use the correct base path
  assetPrefix: process.env.NEXT_PUBLIC_USE_BASEPATH === 'false' 
    ? '' 
    : (process.env.NODE_ENV === 'production' ? '/nm2timesheet' : ''),
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig


