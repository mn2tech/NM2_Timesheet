require('./load-env.cjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath:
    process.env.NEXT_PUBLIC_USE_BASEPATH === 'false'
      ? ''
      : process.env.NODE_ENV === 'production'
        ? '/nm2timesheet'
        : '',
  assetPrefix:
    process.env.NEXT_PUBLIC_USE_BASEPATH === 'false'
      ? ''
      : process.env.NODE_ENV === 'production'
        ? '/nm2timesheet'
        : '',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
