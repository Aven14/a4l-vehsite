/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'a4l-listeveh.vercel.app', 'res.cloudinary.com'],
    // Sur Vercel, les images sont optimisées automatiquement
    unoptimized: false,
  },
  // Mode SSR activé (pas d'export statique)
  // Les API routes fonctionneront sur Vercel Serverless Functions
}

module.exports = nextConfig
