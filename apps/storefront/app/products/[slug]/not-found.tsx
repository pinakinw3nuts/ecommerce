import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Product Not Found</h1>
        <p className="text-gray-600 mb-8">
          We couldn't find the product you were looking for. It may have been removed or the URL might be incorrect.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/products" 
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition"
          >
            Browse All Products
          </Link>
          <Link 
            href="/" 
            className="bg-gray-100 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-200 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 