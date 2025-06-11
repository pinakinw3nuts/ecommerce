'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ZoomIn } from 'lucide-react';
import ProductImageZoom from './ProductImageZoom';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [magnifyPosition, setMagnifyPosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Handle case where images array is empty
  const displayImages = images && images.length > 0 ? images : ['/images/placeholder-product.jpg'];
  
  // Handle image loading error by showing a placeholder
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/images/placeholder-product.jpg';
    e.currentTarget.srcset = '/images/placeholder-product.jpg';
  };

  // Calculate magnifier position based on mouse coordinates
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    
    // Calculate relative position (0 to 1)
    const x = Math.max(0, Math.min(1, (e.clientX - left) / width));
    const y = Math.max(0, Math.min(1, (e.clientY - top) / height));
    
    setMagnifyPosition({ x, y });
  };

  return (
    <>
      <div className="space-y-4">
        <div 
          ref={imageRef}
          className="relative aspect-square overflow-hidden rounded-lg border shadow-sm bg-gray-50 group cursor-zoom-in"
          onClick={() => setIsZoomOpen(true)}
          onMouseEnter={() => setShowMagnifier(true)}
          onMouseLeave={() => setShowMagnifier(false)}
          onMouseMove={handleMouseMove}
        >
          <Image 
            src={displayImages[selectedImage] || '/images/placeholder-product.jpg'} 
            alt={productName}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-opacity duration-300"
            onError={handleImageError}
          />
          
          {/* Magnifier glass effect */}
          {showMagnifier && (
            <div 
              className="absolute w-32 h-32 border-2 border-white rounded-full pointer-events-none shadow-lg hidden md:block z-10"
              style={{
                top: `calc(${magnifyPosition.y * 100}% - 64px)`,
                left: `calc(${magnifyPosition.x * 100}% - 64px)`,
                backgroundImage: `url(${displayImages[selectedImage]})`,
                backgroundPosition: `${magnifyPosition.x * 100}% ${magnifyPosition.y * 100}%`,
                backgroundSize: '400% 400%',
                backgroundRepeat: 'no-repeat'
              }}
            />
          )}
          
          {/* Zoom button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
            <button 
              className="bg-white/80 hover:bg-white rounded-full p-3 shadow-md transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomOpen(true);
              }}
              aria-label="Zoom image"
            >
              <ZoomIn className="h-6 w-6 text-gray-800" />
            </button>
          </div>
        </div>
        
        {displayImages.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {displayImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative aspect-square overflow-hidden rounded-md border ${
                  selectedImage === index ? 'ring-2 ring-[#D23F57]' : ''
                } bg-gray-50 hover:opacity-90 transition-all duration-200 ease-in-out`}
                aria-label={`View image ${index + 1} of ${displayImages.length}`}
              >
                <Image 
                  src={image || '/images/placeholder-product.jpg'} 
                  alt={`${productName} - Image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 25vw, 10vw"
                  className="object-cover"
                  onError={handleImageError}
                />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Image zoom modal */}
      <ProductImageZoom 
        image={displayImages[selectedImage]}
        alt={productName}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
      />
    </>
  );
} 