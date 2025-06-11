'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface ProductImageZoomProps {
  image: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductImageZoom({ image, alt, isOpen, onClose }: ProductImageZoomProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom when changing images or closing/opening modal
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [image, isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 1));
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartPosition({ ...position });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setPosition({
      x: dragStartPosition.x + dx,
      y: dragStartPosition.y + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" 
      onClick={onClose}
    >
      <div 
        className="absolute top-4 right-4 z-10"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close zoom view"
        >
          <X className="h-6 w-6 text-white" />
        </button>
      </div>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); zoomOut(); }}
          disabled={scale <= 1}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Zoom out"
        >
          <span className="text-white text-xl font-bold">-</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); resetZoom(); }}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Reset zoom"
        >
          <span className="text-white text-sm">{Math.round(scale * 100)}%</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); zoomIn(); }}
          disabled={scale >= 4}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Zoom in"
        >
          <span className="text-white text-xl font-bold">+</span>
        </button>
      </div>
      
      <div 
        ref={containerRef}
        className={`relative w-full h-full max-w-5xl max-h-[80vh] overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div 
          className="absolute left-1/2 top-1/2 transition-transform duration-200 ease-out"
          style={{ 
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          <Image
            src={image}
            alt={alt}
            width={1200}
            height={1200}
            className="pointer-events-none select-none"
            priority
            unoptimized={true} // For better zoom quality
            onError={(e) => {
              e.currentTarget.src = '/images/placeholder-product.jpg';
            }}
          />
        </div>
      </div>
      
      <div className="absolute bottom-4 text-white/70 text-sm">
        <p>Scroll to zoom, drag to pan</p>
      </div>
    </div>
  );
} 