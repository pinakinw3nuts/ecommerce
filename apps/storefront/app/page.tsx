import { Metadata } from 'next';
import Image from 'next/image';
import HeroSlider from '../components/sections/HeroSlider';
import CategoryIconsRow from '../components/sections/CategoryIconsRow';
import FeaturedCategories from '../components/sections/FeaturedCategories';
import BrandLogos from '../components/sections/BrandLogos';
import ProductCategories from '../components/sections/ProductCategories';
import FeaturedProducts from '@components/sections/FeaturedProducts';
import FlashSale from '../components/sections/FlashSale';
import AftermarketBrands from '../components/sections/AftermarketBrands';
import FeaturedBanners from '../components/sections/FeaturedBanners';
import TopReviews from '../components/sections/TopReviews';

export const metadata: Metadata = {
  title: 'Auto Parts Store – Premium OEM & Aftermarket Parts',
  description: 'Find the perfect parts for your vehicle. OEM and aftermarket auto parts with warranty and fast shipping.',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <HeroSlider />
      <CategoryIconsRow />
      <FeaturedCategories />
      <BrandLogos />
      <FeaturedProducts />
      <FlashSale />
      <ProductCategories />
      <AftermarketBrands />
      <FeaturedBanners />
      <TopReviews />
    </main>
  );
}
