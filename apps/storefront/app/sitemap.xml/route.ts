import { NextRequest, NextResponse } from 'next/server';
import api from '@lib/api';

export async function GET(req: NextRequest) {
  try {
    const { data: entries } = await api.get('/seo/sitemap'); // expects list of slugs/URLs

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