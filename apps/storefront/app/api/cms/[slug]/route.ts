import { NextRequest, NextResponse } from 'next/server';

// Mock CMS data for different pages
const mockCMSPages = {
  'about-us': {
    title: 'About Us',
    slug: 'about-us',
    metaTitle: 'About MyStore',
    metaDesc: 'Learn about our mission and team.',
    content: [
      { 
        type: 'text', 
        value: 'We started MyStore to make online shopping better. Our mission is to provide high-quality products at affordable prices with exceptional customer service. Founded in 2020, we have quickly grown to become a trusted name in e-commerce.' 
      },
      { 
        type: 'image', 
        value: { 
          url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80', 
          alt: 'Our Team' 
        } 
      },
      { 
        type: 'text', 
        value: 'Our team consists of passionate individuals who are experts in their fields. From product sourcing to customer support, we strive for excellence in everything we do.'
      },
      { 
        type: 'faq', 
        value: { 
          question: 'How fast is shipping?', 
          answer: 'We offer fast shipping options. Standard shipping usually takes 2-5 business days, while express shipping can deliver your items within 1-2 business days.' 
        } 
      },
      { 
        type: 'faq', 
        value: { 
          question: 'What is your return policy?', 
          answer: 'We offer a 30-day return policy on all items. If you are not satisfied with your purchase, you can return it for a full refund within 30 days of delivery.' 
        } 
      }
    ],
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'MyStore',
      'url': 'https://mystore.com',
      'logo': 'https://mystore.com/logo.png',
      'description': 'Learn about our mission and team.'
    })
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    metaTitle: 'Privacy Policy | MyStore',
    metaDesc: 'Our privacy policy explains how we collect and use your data.',
    content: [
      { 
        type: 'text', 
        value: 'This Privacy Policy describes how MyStore collects, uses, and discloses your personal information when you visit our website or make a purchase.' 
      },
      { 
        type: 'text', 
        value: 'We collect personal information that you provide to us, such as your name, address, email, and payment information when you make a purchase. We use this information to process your orders, communicate with you, and improve our services.' 
      },
      { 
        type: 'faq', 
        value: { 
          question: 'Do you share my data with third parties?', 
          answer: 'We only share your data with third parties who help us process orders and deliver products to you. We never sell your personal information.' 
        } 
      },
      { 
        type: 'faq', 
        value: { 
          question: 'How do you protect my data?', 
          answer: 'We implement a variety of security measures to maintain the safety of your personal information, including encryption and secure servers.' 
        } 
      }
    ],
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Privacy Policy',
      'description': 'Our privacy policy explains how we collect and use your data.'
    })
  },
  'terms-of-service': {
    title: 'Terms of Service',
    slug: 'terms-of-service',
    metaTitle: 'Terms of Service | MyStore',
    metaDesc: 'Our terms of service outline the rules for using our website and services.',
    content: [
      { 
        type: 'text', 
        value: 'Welcome to MyStore. By accessing our website and making purchases, you agree to these Terms of Service.' 
      },
      { 
        type: 'text', 
        value: 'All content on this website is owned by MyStore and is protected by copyright laws. You may not reproduce, distribute, or create derivative works without our express permission.' 
      },
      { 
        type: 'faq', 
        value: { 
          question: 'What happens if there\'s an issue with my order?', 
          answer: 'If there\'s a problem with your order, please contact our customer service team within 48 hours of receiving your items.' 
        } 
      },
      { 
        type: 'faq', 
        value: { 
          question: 'Can I cancel my order?', 
          answer: 'You can cancel your order within 1 hour of placing it. After that, the order may have already been processed and cannot be canceled.' 
        } 
      }
    ],
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Terms of Service',
      'description': 'Our terms of service outline the rules for using our website and services.'
    })
  }
};

// Helper function to extract slug safely
async function extractSlug(params: any): Promise<string> {
  // In Next.js 14, params might be a Promise
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  return resolvedParams?.slug || '';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Extract slug safely
    const slug = await extractSlug(params);
    
    // Check if the requested page exists in our mock data
    if (!mockCMSPages[slug as keyof typeof mockCMSPages]) {
      return new NextResponse('Page not found', { status: 404 });
    }
    
    // In a real implementation, we would fetch the page content from a CMS
    // based on the slug parameter
    const pageData = mockCMSPages[slug as keyof typeof mockCMSPages];
    
    return NextResponse.json(pageData);
  } catch (error) {
    console.error('Error fetching CMS page:', error);
    return new NextResponse('Failed to fetch page content', { status: 500 });
  }
} 