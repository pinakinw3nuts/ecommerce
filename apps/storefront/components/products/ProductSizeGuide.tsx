'use client';

import { useState } from 'react';
import { Ruler, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SizeGuideRow {
  size: string;
  chest: string;
  waist: string;
  hips: string;
}

interface ProductSizeGuideProps {
  productType: string;
}

export default function ProductSizeGuide({ productType }: ProductSizeGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Sample size guide data - in a real app, this would come from an API or database
  // and would be specific to the product category
  const sizeGuideData: Record<string, SizeGuideRow[]> = {
    clothing: [
      { size: 'XS', chest: '34"', waist: '28"', hips: '34"' },
      { size: 'S', chest: '36"', waist: '30"', hips: '36"' },
      { size: 'M', chest: '38"', waist: '32"', hips: '38"' },
      { size: 'L', chest: '40"', waist: '34"', hips: '40"' },
      { size: 'XL', chest: '42"', waist: '36"', hips: '42"' },
      { size: 'XXL', chest: '44"', waist: '38"', hips: '44"' },
    ],
    shoes: [
      { size: 'US 7', chest: 'EU 40', waist: 'UK 6.5', hips: '9.5"' },
      { size: 'US 8', chest: 'EU 41', waist: 'UK 7.5', hips: '10"' },
      { size: 'US 9', chest: 'EU 42', waist: 'UK 8.5', hips: '10.5"' },
      { size: 'US 10', chest: 'EU 43', waist: 'UK 9.5', hips: '11"' },
      { size: 'US 11', chest: 'EU 44', waist: 'UK 10.5', hips: '11.5"' },
      { size: 'US 12', chest: 'EU 45', waist: 'UK 11.5', hips: '12"' },
    ],
  };
  
  // Determine which size guide to show based on product type
  const sizeGuide = productType === 'shoes' ? sizeGuideData.shoes : sizeGuideData.clothing;
  
  // Column labels based on product type
  const columns = productType === 'shoes' 
    ? { size: 'US Size', chest: 'EU Size', waist: 'UK Size', hips: 'Foot Length' }
    : { size: 'Size', chest: 'Chest', waist: 'Waist', hips: 'Hips' };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        variant="ghost"
      >
        <Ruler className="h-4 w-4" />
        <span>Size Guide</span>
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium text-lg">Size Guide</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close size guide"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                Use this guide to find the perfect fit. Measurements are in inches unless otherwise noted.
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {columns.size}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {columns.chest}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {columns.waist}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {columns.hips}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sizeGuide.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.chest}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.waist}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.hips}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 bg-gray-50 p-4 rounded text-sm text-gray-600">
                <h4 className="font-medium text-gray-900 mb-2">How to Measure</h4>
                <ul className="space-y-2 list-disc pl-5">
                  <li><strong>Chest:</strong> Measure under your arms around the fullest part of your chest.</li>
                  <li><strong>Waist:</strong> Measure around your natural waistline, keeping the tape comfortably loose.</li>
                  <li><strong>Hips:</strong> Measure around the fullest part of your hips.</li>
                  {productType === 'shoes' && (
                    <li><strong>Foot Length:</strong> Measure from the heel to the longest toe while standing.</li>
                  )}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end border-t p-4">
              <Button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 