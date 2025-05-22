import { NextResponse } from 'next/server';
import { z } from 'zod';

// Mock data for coupons
const mockCoupons = [
  {
    id: 'cpn_001',
    code: 'SUMMER2024',
    type: 'percent' as const,
    value: 20,
    expiryDate: '2024-08-31',
    maxUsage: 1000,
    usageCount: 45,
    isActive: true,
    description: 'Summer sale discount',
  },
  {
    id: 'cpn_002',
    code: 'WELCOME50',
    type: 'flat' as const,
    value: 50,
    expiryDate: '2024-12-31',
    maxUsage: 500,
    usageCount: 120,
    isActive: true,
    description: 'New customer welcome offer',
  },
  {
    id: 'cpn_003',
    code: 'FLASH25',
    type: 'percent' as const,
    value: 25,
    expiryDate: '2024-06-30',
    maxUsage: 200,
    usageCount: 75,
    isActive: false,
    description: 'Flash sale discount',
  },
];

const couponSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be less than 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and hyphens'),
  type: z.enum(['flat', 'percent']),
  value: z.number()
    .min(0, 'Value must be positive')
    .max(100, 'Percentage cannot exceed 100%'),
  expiryDate: z.string(),
  maxUsage: z.number()
    .int('Must be a whole number')
    .min(1, 'Must allow at least one use')
    .max(10000, 'Maximum usage limit is 10,000'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(200, 'Description must be less than 200 characters')
    .optional(),
});

export async function GET() {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real application, you would fetch coupons from a database
    return NextResponse.json(mockCoupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = couponSchema.parse(body);

    // Check if coupon code already exists
    const codeExists = mockCoupons.some(
      coupon => coupon.code === validatedData.code
    );

    if (codeExists) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    // Create new coupon
    const newCoupon = {
      id: `cpn_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      usageCount: 0,
      isActive: true,
    };

    // In a real application, you would save to a database
    // For now, we'll just return the new coupon
    return NextResponse.json(newCoupon);
  } catch (error) {
    console.error('Error creating coupon:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid coupon data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
} 