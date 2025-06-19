import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const WISHLIST_API_URL = process.env.NEXT_PUBLIC_WISHLIST_SERVICE_URL || 'http://127.0.0.1:3013/api/v1';

function getIpv4Url(url: string): string {
  return url.replace('localhost', '127.0.0.1');
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    const data = await req.json();

    if (!data.productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Match the exact schema expected by the wishlist service
    const wishlistData = {
      productId: data.productId,
      variantId: data.variantId || undefined, // Optional field should be undefined if not provided
      productName: data.name,
      productImage: data.imageUrl || data.productImage,
      price: Number(data.price), // Ensure price is a number
      metadata: {
        slug: data.slug,
        ...(data.sku && { sku: data.sku }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.brand && { brand: data.brand }),
        ...(data.metadata && { ...data.metadata })
      }
    };

    const response = await axios.post(
      `${getIpv4Url(WISHLIST_API_URL)}/wishlist`,
      wishlistData,
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (err: any) {
    console.error('Error adding to wishlist:', err.response?.data || err.message);
    return NextResponse.json(
      { 
        error: 'Failed to add to wishlist', 
        message: err.response?.data?.message || err.message 
      }, 
      { status: err.response?.status || 500 }
    );
  }
}