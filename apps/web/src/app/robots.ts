import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bookmyshow.example.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/movies', '/movies/*', '/theaters', '/theaters/*'],
        disallow: ['/admin/', '/checkout/', '/account/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
