import { Metadata } from 'next';
import ShopPage from '@/components/shop/ShopPage';

export const metadata: Metadata = {
  title: 'Shop All Products | MyStore',
  description: 'Browse our collection of high-quality products at great prices.',
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Create a plain object with the search parameters to avoid using dynamic API synchronously
  const parsedParams: { [key: string]: string | string[] | undefined } = {};
  
  // Safely extract search parameters
  if (searchParams.category) parsedParams.category = searchParams.category;
  if (searchParams.sort) parsedParams.sort = searchParams.sort;
  if (searchParams.page) parsedParams.page = searchParams.page;
  if (searchParams.minPrice) parsedParams.minPrice = searchParams.minPrice;
  if (searchParams.maxPrice) parsedParams.maxPrice = searchParams.maxPrice;
  if (searchParams.search) parsedParams.search = searchParams.search;
  
  return <ShopPage searchParams={parsedParams} />;
} 