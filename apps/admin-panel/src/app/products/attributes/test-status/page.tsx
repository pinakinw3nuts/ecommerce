'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { updateAttributeStatus } from '@/services/attributes';

export default function TestAttributeStatusPage() {
  const router = useRouter();
  const toast = useToast();
  const [attributeId, setAttributeId] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [approach, setApproach] = useState<'status' | 'direct' | 'raw'>('status');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!attributeId) {
      toast.error('Please enter an attribute ID');
      return;
    }
    
    try {
      setIsLoading(true);
      setResult(null);
      
      console.log(`Testing update of attribute ${attributeId} with isActive=${isActive} using approach: ${approach}`);
      
      let response;
      
      if (approach === 'status') {
        // Use the status update service
        response = await updateAttributeStatus(attributeId, isActive);
      } else if (approach === 'direct') {
        // Make a direct PUT request with minimal data
        response = await fetch(`/api/products/attributes/${attributeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive }),
        }).then(res => res.json());
      } else if (approach === 'raw') {
        // Try the raw update endpoint
        response = await fetch(`/api/products/attributes/${attributeId}/raw-update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            field: 'isActive', 
            value: isActive,
            sql: `UPDATE attributes SET "isActive" = ${isActive ? 'TRUE' : 'FALSE'} WHERE id = '${attributeId}'`
          }),
        }).then(res => res.json());
      }
      
      setResult(response);
      toast.success(`Attribute status update attempt completed`);
    } catch (error) {
      console.error('Error updating attribute status:', error);
      toast.error('Failed to update attribute status');
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Test Attribute Status Update</h1>
        <Button 
          variant="outline"
          onClick={() => router.push('/products/attributes')}
        >
          Back to Attributes
        </Button>
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="attributeId" className="block text-sm font-medium text-gray-700">
              Attribute ID
            </label>
            <input
              type="text"
              id="attributeId"
              value={attributeId}
              onChange={(e) => setAttributeId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter attribute ID"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Update Approach
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="approach-status"
                  name="approach"
                  checked={approach === 'status'}
                  onChange={() => setApproach('status')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="approach-status" className="ml-2 block text-sm text-gray-700">
                  Status Update Service
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="approach-direct"
                  name="approach"
                  checked={approach === 'direct'}
                  onChange={() => setApproach('direct')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="approach-direct" className="ml-2 block text-sm text-gray-700">
                  Direct PUT Request
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="approach-raw"
                  name="approach"
                  checked={approach === 'raw'}
                  onChange={() => setApproach('raw')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="approach-raw" className="ml-2 block text-sm text-gray-700">
                  Raw Update (SQL)
                </label>
              </div>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="mt-4"
          >
            {isLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </form>
      </div>
      
      {result && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Result</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 