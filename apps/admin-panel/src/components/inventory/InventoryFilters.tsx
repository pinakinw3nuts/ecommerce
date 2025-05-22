import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FilterState {
  search: string;
  categories: string[];
  status: string[];
  priceRange: {
    min: string;
    max: string;
  };
  stockRange: {
    min: string;
    max: string;
  };
}

interface InventoryFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const STATUSES = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' }
];

const CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'books', label: 'Books' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports' },
  { value: 'toys', label: 'Toys' }
];

export function InventoryFilters({ filters, onChange, onReset }: InventoryFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleCategoryToggle = (category: string) => {
    const categories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onChange({ ...filters, categories });
  };

  const handleStatusToggle = (status: string) => {
    const statuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onChange({ ...filters, status: statuses });
  };

  const handlePriceChange = (field: 'min' | 'max', value: string) => {
    onChange({
      ...filters,
      priceRange: { ...filters.priceRange, [field]: value },
    });
  };

  const handleStockChange = (field: 'min' | 'max', value: string) => {
    onChange({
      ...filters,
      stockRange: { ...filters.stockRange, [field]: value },
    });
  };

  const handleRemoveCategory = (category: string) => {
    onChange({
      ...filters,
      categories: filters.categories.filter(c => c !== category)
    });
  };

  const handleRemoveStatus = (status: string) => {
    onChange({
      ...filters,
      status: filters.status.filter(s => s !== status)
    });
  };

  const handleRemovePriceRange = () => {
    onChange({
      ...filters,
      priceRange: { min: '', max: '' }
    });
  };

  const handleRemoveStockRange = () => {
    onChange({
      ...filters,
      stockRange: { min: '', max: '' }
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.categories.length > 0 ||
    filters.status.length > 0 ||
    filters.priceRange.min ||
    filters.priceRange.max ||
    filters.stockRange.min ||
    filters.stockRange.max;

  return (
    <div className="space-y-4">
      {/* Search Bar and Filter Button */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search inventory..."
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <Button
            variant="outline"
            className={hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
                {(filters.categories.length > 0 ? 1 : 0) +
                  (filters.status.length > 0 ? 1 : 0) +
                  ((filters.priceRange.min || filters.priceRange.max) ? 1 : 0) +
                  ((filters.stockRange.min || filters.stockRange.max) ? 1 : 0)}
              </span>
            )}
          </Button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-md border border-gray-200 bg-white p-4 shadow-lg z-50">
              <div className="space-y-4">
                {/* Category Filter */}
                <div>
                  <h4 className="font-medium mb-2">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(category => (
                      <button
                        key={category.value}
                        onClick={() => handleCategoryToggle(category.value)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors
                          ${filters.categories.includes(category.value)
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map(status => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusToggle(status.value)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors
                          ${filters.status.includes(status.value)
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <h4 className="font-medium mb-2">Price Range</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Min</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={filters.priceRange.min}
                          onChange={(e) => handlePriceChange('min', e.target.value)}
                          className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Max</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={filters.priceRange.max}
                          onChange={(e) => handlePriceChange('max', e.target.value)}
                          className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Range Filter */}
                <div>
                  <h4 className="font-medium mb-2">Stock Range</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Min</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.stockRange.min}
                        onChange={(e) => handleStockChange('min', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Max</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.stockRange.max}
                        onChange={(e) => handleStockChange('max', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={onReset}
                    >
                      Reset Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.categories.map(category => {
            const categoryLabel = CATEGORIES.find(c => c.value === category)?.label || category;
            return (
              <div
                key={category}
                className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-sm text-red-700"
              >
                <span>Category: {categoryLabel}</span>
                <button
                  onClick={() => handleRemoveCategory(category)}
                  className="ml-1 rounded-full p-0.5 hover:bg-red-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {filters.status.map(status => {
            const statusLabel = STATUSES.find(s => s.value === status)?.label || status;
            return (
              <div
                key={status}
                className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-sm text-red-700"
              >
                <span>Status: {statusLabel}</span>
                <button
                  onClick={() => handleRemoveStatus(status)}
                  className="ml-1 rounded-full p-0.5 hover:bg-red-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {(filters.priceRange.min || filters.priceRange.max) && (
            <div
              className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-sm text-red-700"
            >
              <span>
                Price: {filters.priceRange.min && `$${filters.priceRange.min}`}
                {filters.priceRange.min && filters.priceRange.max && ' - '}
                {filters.priceRange.max && `$${filters.priceRange.max}`}
              </span>
              <button
                onClick={handleRemovePriceRange}
                className="ml-1 rounded-full p-0.5 hover:bg-red-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {(filters.stockRange.min || filters.stockRange.max) && (
            <div
              className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-sm text-red-700"
            >
              <span>
                Stock: {filters.stockRange.min && filters.stockRange.min}
                {filters.stockRange.min && filters.stockRange.max && ' - '}
                {filters.stockRange.max && filters.stockRange.max}
              </span>
              <button
                onClick={handleRemoveStockRange}
                className="ml-1 rounded-full p-0.5 hover:bg-red-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 