import { NextRequest, NextResponse } from 'next/server';

// Fallback static pages if the API is unavailable
const FALLBACK_PAGES = [
  { slug: '', updatedAt: new Date().toISOString() },
  { slug: 'products', updatedAt: new Date().toISOString() },
  { slug: 'about', updatedAt: new Date().toISOString() },
  { slug: 'contact', updatedAt: new Date().toISOString() },
  { slug: 'cart', updatedAt: new Date().toISOString() },
  { slug: 'checkout', updatedAt: new Date().toISOString() },
];

export async function GET(req: NextRequest) {
  try {
    const entries = FALLBACK_PAGES;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mystore.com';

    const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${entries
    .map(
      (entry: { slug: string; updatedAt?: string }) => `
    <url>
      <loc>${baseUrl}/${entry.slug}</loc>
      ${entry.updatedAt ? `<lastmod>${new Date(entry.updatedAt).toISOString()}</lastmod>` : ''}
    </url>`
    )
    .join('\n')}
</urlset>`.trim();

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[SITEMAP ERROR]', err);
    return new NextResponse('Sitemap generation failed', { status: 500 });
  }
} 