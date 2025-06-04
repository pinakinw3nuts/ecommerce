import { NextRequest, NextResponse } from 'next/server';

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
  try {
    // Get slug from query params
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }
    
    // In a real app, you would fetch SEO data from a database
    // Here we're creating mock SEO data based on the slug
    const productName = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Determine category based on slug
    let category = 'product';
    if (slug.includes('shirt') || slug.includes('tee') || slug.includes('sweater') || slug.includes('jacket')) {
      category = 'clothing';
    } else if (slug.includes('phone') || slug.includes('laptop') || slug.includes('headphone') || slug.includes('speaker')) {
      category = 'electronics';
    } else if (slug.includes('chair') || slug.includes('table') || slug.includes('sofa') || slug.includes('bed')) {
      category = 'home furnishings';
    } else if (slug.includes('watch') || slug.includes('glasses') || slug.includes('bag')) {
      category = 'accessories';
    } else if (slug.includes('cream') || slug.includes('lotion') || slug.includes('makeup')) {
      category = 'beauty';
    }
    
    // Generate meta title
    const title = `${productName} | Premium ${category.charAt(0).toUpperCase() + category.slice(1)} | Shopfinity`;
    
    // Generate meta description
    const descriptions = [
      `Shop our premium quality ${productName.toLowerCase()}. Made with high-quality materials and designed for comfort and style. Free shipping on orders over $50.`,
      `Discover our ${productName.toLowerCase()}, perfect for any occasion. Premium ${category} with exceptional craftsmanship and style. Shop now with free returns.`,
      `Premium ${productName.toLowerCase()} now available at Shopfinity. Discover the difference in quality and comfort. Fast shipping and 30-day returns.`,
      `Explore our best-selling ${productName.toLowerCase()}. Crafted from premium materials for lasting quality. Shop with confidence - free shipping & returns.`,
    ];
    
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // Generate canonical URL
    const canonicalUrl = `https://shopfinity.example.com/products/${slug}`;
    
    // Generate JSON-LD for rich snippets
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productName,
      description: description,
      image: `https://shopfinity.example.com/images/products/${slug}.jpg`,
      url: canonicalUrl,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: Math.floor(Math.random() * 150) + 19.99,
        availability: 'https://schema.org/InStock',
      },
    };
    
    return NextResponse.json({
      title,
      description,
      canonicalUrl,
      jsonLd: JSON.stringify(jsonLd),
    });
  } catch (error) {
    console.error('Error generating SEO metadata:', error);
    return NextResponse.json(
      { error: 'Failed to generate SEO metadata' },
      { status: 500 }
    );
  }
} 