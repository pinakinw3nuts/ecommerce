'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, Loader2, Pencil, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import { getAttributeById, deleteAttribute } from '@/services/attributes';

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch attribute');
  return response.json();
};

export default function AttributeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: attribute, error, isLoading, mutate } = useSWR(
    `/api/products/attributes/${params.id}`,
    fetcher
  );

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this attribute?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteAttribute(params.id);
      toast.success('Attribute deleted successfully');
      router.push('/products/attributes');
    } catch (error) {
      console.error('Error deleting attribute:', error);
      toast.error('Failed to delete attribute');
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load attribute</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isLoading ? 'Loading...' : (attribute ? attribute.name : 'Attribute Not Found')}
          </h1>
        </div>
        
        {attribute && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/products/attributes/${params.id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : !attribute ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">Attribute not found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Attribute Details */}
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">Attribute Details</h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{attribute.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{attribute.type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Filterable</dt>
                  <dd className="mt-1 text-sm text-gray-900">{attribute.isFilterable ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Required</dt>
                  <dd className="mt-1 text-sm text-gray-900">{attribute.isRequired ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sort Order</dt>
                  <dd className="mt-1 text-sm text-gray-900">{attribute.sortOrder}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">{attribute.isActive ? 'Active' : 'Inactive'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(attribute.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(attribute.updatedAt)}</dd>
                </div>
                {attribute.description && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{attribute.description}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Attribute Values */}
          {(attribute.type === 'select' || attribute.type === 'multiple') && attribute.values && attribute.values.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">Attribute Values</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Display Value
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Color
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sort Order
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attribute.values.map((value: any) => (
                      <tr key={value.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {value.value}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {value.displayValue || value.value}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {value.metadata?.hexColor ? (
                            <div className="flex items-center">
                              <div 
                                className="w-6 h-6 mr-2 rounded-full border border-gray-300" 
                                style={{ backgroundColor: value.metadata.hexColor }}
                              />
                              {value.metadata.hexColor}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {value.metadata?.sortOrder || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {value.isActive !== false ? 'Active' : 'Inactive'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 