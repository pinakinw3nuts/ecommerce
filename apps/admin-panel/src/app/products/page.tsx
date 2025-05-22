'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Download,
  Trash2, 
  Eye, 
  EyeOff,
  Pencil,
  CheckSquare
} from 'lucide-react';
import Table from '@/components/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { TableInstance } from '@/components/Table';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  isPublished: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{
    products: Product[];
    total: number;
  }>(`/api/products?page=${page}&search=${search}&category=${category}&status=${status}`, fetcher);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      setIsLoadingAction(true);
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      mutate();
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleTogglePublish = async (productId: string, currentStatus: boolean) => {
    try {
      setIsLoadingAction(true);
      const response = await fetch(`/api/products/${productId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product status');
      }

      mutate();
      toast.success(`Product status updated to ${!currentStatus ? 'published' : 'draft'}`);
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;

    try {
      setIsLoadingAction(true);
      const response = await fetch('/api/products/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: selectedProducts }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete products');
      }

      mutate();
      setSelectedProducts([]);
      toast.success(`${selectedProducts.length} products deleted successfully`);
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error('Failed to delete products');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleBulkPublish = async (publish: boolean) => {
    try {
      setIsLoadingAction(true);
      const response = await fetch('/api/products/bulk-publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          productIds: selectedProducts,
          isPublished: publish
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update products');
      }

      mutate();
      setSelectedProducts([]);
      toast.success(`${selectedProducts.length} products ${publish ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error updating products:', error);
      toast.error('Failed to update products');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoadingAction(true);
      const response = await fetch('/api/products/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: selectedProducts.length ? selectedProducts : 'all' }),
      });

      if (!response.ok) {
        throw new Error('Failed to export products');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Products exported successfully');
    } catch (error) {
      console.error('Error exporting products:', error);
      toast.error('Failed to export products');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const columns = [
    {
      header: ({ table }: { table: TableInstance }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row, table }: { row: Product; table: TableInstance & { getRowProps: (row: Product) => { getIsSelected: () => boolean; getToggleSelectedHandler: () => () => void } } }) => {
        const rowProps = table.getRowProps(row);
        return (
          <input
            type="checkbox"
            checked={rowProps.getIsSelected()}
            onChange={rowProps.getToggleSelectedHandler()}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        );
      },
    },
    {
      header: 'Product',
      cell: ({ row }: { row: Product }) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg">
            <Image
              src={row.image}
              alt={row.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-sm text-gray-500">
              ${row.price.toFixed(2)}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: ({ row }: { row: Product }) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
          {row.category}
        </span>
      ),
    },
    {
      header: 'Stock',
      cell: ({ row }: { row: Product }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.stock > 0 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
          }`}
        >
          {row.stock > 0 ? 'In Stock' : 'Out of Stock'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }: { row: Product }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${row.isPublished 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.isPublished ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: Product }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/products/${row.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTogglePublish(row.id, row.isPublished)}
            disabled={isLoadingAction}
          >
            {row.isPublished ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.id)}
            disabled={isLoadingAction}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load products</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isLoadingAction}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push('/products/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="books">Books</option>
          <option value="home">Home & Garden</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            {selectedProducts.length} products selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkPublish(true)}
              disabled={isLoadingAction}
            >
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkPublish(false)}
              disabled={isLoadingAction}
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Unpublish
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isLoadingAction}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          data={data?.products ?? []}
          columns={columns}
          isLoading={isLoading}
          pagination={{
            page,
            pageSize: 10,
            total: data?.total ?? 0,
            onPageChange: setPage,
          }}
          selection={{
            selectedRows: selectedProducts,
            onSelectedRowsChange: setSelectedProducts,
          }}
        />
      </div>
    </div>
  );
} 