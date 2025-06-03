import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Mock SEO data based on slug
const seoData = {
  home: {
    title: "MyStore – Best Online Deals",
    description: "Buy high-quality products at affordable prices. Free shipping on orders over $50.",
    canonicalUrl: "https://mystore.com/",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "MyStore",
      "url": "https://mystore.com/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://mystore.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    })
  },
  products: {
    title: "Products – MyStore",
    description: "Browse our wide selection of products at great prices.",
    canonicalUrl: "https://mystore.com/products",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Classic T-Shirt",
          "url": "https://mystore.com/products/classic-t-shirt"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Wireless Headphones",
          "url": "https://mystore.com/products/wireless-headphones"
        }
      ]
    })
  },
  'classic-t-shirt': {
    title: "Classic T-Shirt – MyStore",
    description: "A comfortable classic t-shirt made from 100% organic cotton. Perfect for everyday wear.",
    canonicalUrl: "https://mystore.com/products/classic-t-shirt",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Classic T-Shirt",
      "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop",
      "description": "A comfortable classic t-shirt made from 100% organic cotton. Perfect for everyday wear with a relaxed fit and soft touch.",
      "brand": {
        "@type": "Brand",
        "name": "MyStore"
      },
      "offers": {
        "@type": "Offer",
        "price": 19.99,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.7",
        "reviewCount": "3"
      }
    })
  },
  'wireless-headphones': {
    title: "Wireless Headphones – MyStore",
    description: "High-quality wireless headphones with noise cancellation technology.",
    canonicalUrl: "https://mystore.com/products/wireless-headphones",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Wireless Headphones",
      "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1470&auto=format&fit=crop",
      "description": "High-quality wireless headphones with noise cancellation technology. Enjoy crystal clear sound and up to 20 hours of battery life.",
      "brand": {
        "@type": "Brand",
        "name": "MyStore"
      },
      "offers": {
        "@type": "Offer",
        "price": 89.99,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.0",
        "reviewCount": "3"
      }
    })
  },
  'smart-watch': {
    title: "Smart Watch – MyStore",
    description: "A feature-rich smart watch with health tracking, notifications, and a beautiful display.",
    canonicalUrl: "https://mystore.com/products/smart-watch",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Smart Watch",
      "image": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1528&auto=format&fit=crop",
      "description": "A feature-rich smart watch with health tracking, notifications, and a beautiful display. Water resistant up to 50 meters.",
      "brand": {
        "@type": "Brand",
        "name": "MyStore"
      },
      "offers": {
        "@type": "Offer",
        "price": 199.99,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.7",
        "reviewCount": "3"
      }
    })
  },
  'running-shoes': {
    title: "Running Shoes – MyStore",
    description: "Lightweight and responsive running shoes designed for comfort and performance.",
    canonicalUrl: "https://mystore.com/products/running-shoes",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Running Shoes",
      "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop",
      "description": "Lightweight and responsive running shoes designed for comfort and performance. Perfect for daily runs and training.",
      "brand": {
        "@type": "Brand",
        "name": "MyStore"
      },
      "offers": {
        "@type": "Offer",
        "price": 79.99,
        "priceCurrency": "USD",
        "availability": "https://schema.org/OutOfStock"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.0",
        "reviewCount": "3"
      }
    })
  }
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');

  // Return data for requested slug or default to home
  const data = slug && slug in seoData ? seoData[slug as keyof typeof seoData] : seoData.home;

  return NextResponse.json(data);
} 