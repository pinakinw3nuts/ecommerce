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
  
  // Safely extract search parameters - await the searchParams object first
  const params = await Promise.resolve(searchParams);
  
  if (params.category) parsedParams.category = params.category;
  if (params.sort) parsedParams.sort = params.sort;
  if (params.page) parsedParams.page = params.page;
  if (params.minPrice) parsedParams.minPrice = params.minPrice;
  if (params.maxPrice) parsedParams.maxPrice = params.maxPrice;
  if (params.search) parsedParams.search = params.search;
  
  return <ShopPage searchParams={parsedParams} />;
} 