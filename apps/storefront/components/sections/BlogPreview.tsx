import Link from 'next/link';
// import { motion } from 'framer-motion'; // Uncomment if framer-motion is available

const blogPosts = [
  {
    title: '10 Tips for Smarter Online Shopping',
    slug: '10-tips-for-smarter-online-shopping',
    excerpt: 'Discover how to save money and find the best deals with these expert shopping tips.',
    imageUrl: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'How to Choose the Perfect Gift',
    slug: 'how-to-choose-the-perfect-gift',
    excerpt: 'A quick guide to picking thoughtful gifts for any occasion and recipient.',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Sustainable Shopping: What You Need to Know',
    slug: 'sustainable-shopping-what-you-need-to-know',
    excerpt: 'Learn how to make eco-friendly choices and support sustainable brands.',
    imageUrl: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80',
  },
];

export function BlogPreview() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">From our blog</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, i) => (
            // For animation, wrap in <motion.div ...> if framer-motion is installed
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-xl overflow-hidden bg-gray-50 shadow-sm hover:shadow-lg transition-shadow border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <div className="relative w-full aspect-[4/3] overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  width={400}
                  height={300}
                />
              </div>
              <div className="p-5 flex flex-col h-full">
                <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                <span className="mt-auto inline-block text-primary font-medium text-sm bg-primary/10 rounded px-3 py-1 group-hover:bg-primary/20 transition-colors">Read more</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BlogPreview; 