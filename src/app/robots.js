export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/'], // Protect private routes from indexing
    },
    sitemap: 'https://cognify.app/sitemap.xml',
  }
}
