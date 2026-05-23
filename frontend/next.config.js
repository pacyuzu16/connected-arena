/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",        // static HTML/CSS/JS export for S3 hosting
  images: { unoptimized: true },  // required for static export
  // Remove trailingSlash to allow both /admin and /admin/ to work
};

module.exports = nextConfig;
