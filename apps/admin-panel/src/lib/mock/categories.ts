export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  parentId: string | null;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    slug: 'electronics',
    isActive: true,
    parentId: null,
    imageUrl: 'https://example.com/electronics.jpg',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Smartphones',
    description: 'Mobile phones and accessories',
    slug: 'smartphones',
    isActive: true,
    parentId: '1',
    imageUrl: 'https://example.com/smartphones.jpg',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Laptops',
    description: 'Laptops and accessories',
    slug: 'laptops',
    isActive: true,
    parentId: '1',
    imageUrl: 'https://example.com/laptops.jpg',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '4',
    name: 'Fashion',
    description: 'Clothing and accessories',
    slug: 'fashion',
    isActive: true,
    parentId: null,
    imageUrl: 'https://example.com/fashion.jpg',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '5',
    name: "Men's Clothing",
    description: "Men's apparel and accessories",
    slug: 'mens-clothing',
    isActive: true,
    parentId: '4',
    imageUrl: 'https://example.com/mens-clothing.jpg',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
]; 