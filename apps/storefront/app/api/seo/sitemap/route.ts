import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_GATEWAY_URL } from '@/lib/constants';

const FALLBACK_PAGES = [
  { slug: '', updatedAt: new Date().toISOString() },
  { slug: 'products', updatedAt: new Date().toISOString() },
  { slug: 'categories', updatedAt: new Date().toISOString() },
  { slug: 'blog', updatedAt: new Date().toISOString() },
  { slug: 'about', updatedAt: new Date().toISOString() },
  { slug: 'contact', updatedAt: new Date().toISOString() },
  { slug: 'login', updatedAt: new Date().toISOString() },
  { slug: 'signup', updatedAt: new Date().toISOString() },
  { slug: 'cart', updatedAt: new Date().toISOString() },
  { slug: 'checkout', updatedAt: new Date().toISOString() },
];

// Fallback data in case API calls fail
const fallbackProducts = [
  { id: '1', slug: 'sample-product-1', updatedAt: new Date().toISOString() },
  { id: '2', slug: 'sample-product-2', updatedAt: new Date().toISOString() },
];

const fallbackCategories = [
  { id: '1', slug: 'category-1', updatedAt: new Date().toISOString() },
  { id: '2', slug: 'category-2', updatedAt: new Date().toISOString() },
];

const fallbackBlogPosts = [
  { id: '1', slug: 'blog-post-1', updatedAt: new Date().toISOString() },
  { id: '2', slug: 'blog-post-2', updatedAt: new Date().toISOString() },
];

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  let entries = [...FALLBACK_PAGES];
  
  try {
    // Try to fetch dynamic data for the sitemap, with fallbacks in case of failure
    let products = fallbackProducts;
    let categories = fallbackCategories;
    let blogPosts = fallbackBlogPosts;
    
    // Try to fetch products
    try {
      const productsResponse = await axios.get(`${API_GATEWAY_URL}/products?limit=100`);
      if (productsResponse.data?.products && Array.isArray(productsResponse.data.products)) {
        products = productsResponse.data.products;
      }
    } catch (error) {
      console.error('Error fetching sitemap products:', error);
    }
    
    // Try to fetch categories
    try {
      const categoriesResponse = await axios.get(`${API_GATEWAY_URL}/categories`);
      if (categoriesResponse.data?.categories && Array.isArray(categoriesResponse.data.categories)) {
        categories = categoriesResponse.data.categories;
      }
    } catch (error) {
      console.error('Error fetching sitemap categories:', error);
    }
    
    // Try to fetch blog posts
    try {
      const blogResponse = await axios.get(`${API_GATEWAY_URL}/blog/posts?limit=50`);
      if (blogResponse.data?.posts && Array.isArray(blogResponse.data.posts)) {
        blogPosts = blogResponse.data.posts;
      }
    } catch (error) {
      console.error('Error fetching sitemap blog posts:', error);
    }

    const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  ${FALLBACK_PAGES.map(page => `
  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${page.updatedAt}</lastmod>
    <changefreq>${page.slug === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page.slug === '' ? '1.0' : '0.8'}</priority>
  </url>
  `).join('')}
  
  <!-- Products -->
  ${products.map((product: any) => `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${product.updatedAt || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  `).join('')}
  
  <!-- Categories -->
  ${categories.map((category: any) => `
  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <lastmod>${category.updatedAt || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  `).join('')}
  
  <!-- Blog Posts -->
  ${blogPosts.map((post: any) => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt || new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  `).join('')}
</urlset>`.trim();

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return a basic sitemap with just the static pages as fallback
    const basicSitemap = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${FALLBACK_PAGES.map(page => `
  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${page.updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  `).join('')}
</urlset>`.trim();
    
    return new NextResponse(basicSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }
} 