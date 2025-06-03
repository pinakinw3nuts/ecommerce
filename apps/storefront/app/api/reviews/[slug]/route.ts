import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Mock reviews data
const reviewsData: Record<string, Array<{ rating: number; comment: string; user: { name: string } }>> = {
  'classic-t-shirt': [
    {
      rating: 5,
      comment: "This t-shirt is incredibly comfortable and fits perfectly. The material is soft and breathable.",
      user: { name: "John D." }
    },
    {
      rating: 4,
      comment: "Great quality for the price. I've washed it several times and it still looks new.",
      user: { name: "Sarah M." }
    },
    {
      rating: 5,
      comment: "Love the fit and feel. Will definitely buy more in different colors.",
      user: { name: "Michael T." }
    }
  ],
  'wireless-headphones': [
    {
      rating: 5,
      comment: "Amazing sound quality and the noise cancellation works great. Battery life is impressive too!",
      user: { name: "Emily R." }
    },
    {
      rating: 4,
      comment: "Very comfortable to wear for long periods. The sound is clear and balanced.",
      user: { name: "David K." }
    },
    {
      rating: 3,
      comment: "Good headphones but the ear cushions could be more comfortable.",
      user: { name: "Lisa P." }
    }
  ],
  'smart-watch': [
    {
      rating: 5,
      comment: "This smart watch has everything I need. The health tracking features are accurate and the battery lasts for days.",
      user: { name: "Robert J." }
    },
    {
      rating: 5,
      comment: "Excellent build quality and the screen is bright and responsive. Very happy with this purchase!",
      user: { name: "Amanda S." }
    },
    {
      rating: 4,
      comment: "Great watch overall, but the app could use some improvements.",
      user: { name: "Chris B." }
    }
  ],
  'running-shoes': [
    {
      rating: 4,
      comment: "Very comfortable for running. Good support and cushioning.",
      user: { name: "Jessica T." }
    },
    {
      rating: 5,
      comment: "These shoes are perfect for my daily runs. They're lightweight but still provide enough support.",
      user: { name: "Mark L." }
    },
    {
      rating: 3,
      comment: "Decent shoes but they run a bit small. Consider ordering a half size up.",
      user: { name: "Sophia W." }
    }
  ]
};

// Helper function to extract slug safely
async function extractSlug(params: any): Promise<string> {
  // In Next.js 14, params might be a Promise
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  return resolvedParams?.slug || '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Extract the slug safely
    const slug = await extractSlug(params);
    
    // Return reviews for the requested product or an empty array if none exist
    const reviews = slug in reviewsData ? reviewsData[slug] : [];
    
    return NextResponse.json({
      reviews: reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch reviews' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
} 