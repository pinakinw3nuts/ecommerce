import Link from 'next/link';
// import { AspectRatio } from '@/components/ui/aspect-ratio'; // Uncomment if available

const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    imageUrl: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Sports',
    slug: 'sports',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Toys',
    slug: 'toys',
    imageUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
  },
];

export function FeaturedCategories() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-gray-900 text-center">Featured Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group block rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <div className="relative w-full aspect-[4/3] overflow-hidden">
                {/* Use AspectRatio if available: <AspectRatio ratio={4/3}> ... </AspectRatio> */}
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  width={400}
                  height={300}
                />
              </div>
              <div className="p-5 flex flex-col items-center">
                <h3 className="font-semibold text-lg text-gray-900 mb-2 text-center">{cat.name}</h3>
                <span className="inline-block text-primary font-medium text-sm bg-primary/10 rounded px-3 py-1 mt-1 group-hover:bg-primary/20 transition-colors">Shop Now</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedCategories; 