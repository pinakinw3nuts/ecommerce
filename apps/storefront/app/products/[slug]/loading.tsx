export default function ProductLoading() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumbs skeleton */}
      <div className="flex items-center mb-8">
        <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 w-3 mx-2 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 w-3 mx-2 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Image skeleton */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-200 animate-pulse"></div>
          
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, index) => (
              <div 
                key={index}
                className="aspect-square rounded-md bg-gray-200 animate-pulse"
              ></div>
            ))}
          </div>
        </div>
        
        {/* Product Info skeleton */}
        <div className="space-y-6">
          <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-5 w-5 bg-gray-200 rounded animate-pulse mr-1"></div>
              ))}
            </div>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-7 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="space-y-4">
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 w-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="h-12 w-36 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Tabs skeleton */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <div className="flex gap-8">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="py-6">
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Related Products skeleton */}
      <div>
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden bg-white border border-gray-100">
              <div className="aspect-square bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 