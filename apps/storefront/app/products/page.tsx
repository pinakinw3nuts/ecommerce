import { Metadata } from 'next';
import ShopPage from '@/components/shop/ShopPage';

export const metadata: Metadata = {
  title: 'Shop All Products | MyStore',
  description: 'Browse our collection of high-quality products at great prices.',
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return <ShopPage searchParams={searchParams} />;
} 