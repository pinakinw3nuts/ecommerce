import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter as FilterIcon, Calendar, X } from 'lucide-react';
import { Button } from './Button';

export interface FilterOption {
  value: string;
  label: string;
}

export interface RangeFilter {
  min: string;
  max: string;
}

export interface DateRangeFilter {
  from: string;
  to: string;
}

export interface FilterConfig {
  [key: string]: {
    type: 'text' | 'select' | 'daterange' | 'valueRange';
    placeholder: string;
    options?: Array<{ value: string; label: string }>;
  };
}

export interface FilterState {
  [key: string]: string | string[] | DateRangeFilter | RangeFilter;
}

export interface CommonFiltersProps {
  config: FilterConfig;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function CommonFilters({ config, filters, onChange, onReset }: CommonFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && filterButtonRef.current && dropdownRef.current) {
      const buttonRect = filterButtonRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Check if there's enough space below
      const spaceBelow = windowHeight - buttonRect.bottom;
      const spaceNeeded = dropdownRect.height + 8; // 8px for margin
      
      setDropdownPosition(spaceBelow >= spaceNeeded ? 'bottom' : 'top');
    }
  }, [isOpen]);

  const handleChange = (key: string, value: string | string[] | DateRangeFilter | RangeFilter) => {
    onChange({
      ...filters,
      [key]: value
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange('search', e.target.value);
  };

  const handleOptionToggle = (groupKey: string, value: string) => {
    const currentValues = (filters[groupKey] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    handleChange(groupKey, newValues);
  };

  const handleRemoveFilter = (groupKey: string, value: string) => {
    const currentValues = (filters[groupKey] as string[]) || [];
    handleChange(groupKey, currentValues.filter(v => v !== value));
  };

  const handleValueRangeChange = (field: 'min' | 'max', value: string) => {
    handleChange('valueRange', {
      ...(filters.valueRange as RangeFilter),
      [field]: value,
    });
  };

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    handleChange('dateRange', {
      ...(filters.dateRange as DateRangeFilter),
      [field]: value,
    });
  };

  // Get active filters for display
  const getActiveFilters = () => {
    const active: { group: string; value: string; label: string }[] = [];
    
    Object.entries(config).forEach(([key, field]) => {
      const values = filters[key] as string[];
      if (values?.length) {
        values.forEach(value => {
          const option = field.options?.find(opt => opt.value === value);
          if (option) {
            active.push({
              group: key,
              value: value,
              label: option.label
            });
          }
        });
      }
    });

    return active;
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'search') return count;
    if (Array.isArray(value) && value.length > 0) return count + value.length;
    if (typeof value === 'object') {
      const rangeValues = Object.values(value as object).filter(v => v !== '');
      return count + (rangeValues.length > 0 ? 1 : 0);
    }
    return count;
  }, 0);

  const activeFilters = getActiveFilters();

  return (
    <div className="space-y-4">
      {/* Search Bar and Filter Button */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={(filters.search as string) || ''}
            onChange={handleSearchChange}
            placeholder={Object.entries(config).find(([_, field]) => field.type === 'text')?.[1]?.placeholder || ''}
            className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Button
            ref={filterButtonRef}
            variant="outline"
            size="default"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4"
          >
            <FilterIcon className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Filter Panel */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className={`absolute ${
                dropdownPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
              } right-0 w-[320px] rounded-lg border border-gray-200 bg-white p-4 shadow-lg z-50`}
            >
              <div className="space-y-6">
                {/* Filter Groups */}
                {Object.entries(config).map(([key, field]) => (
                  <div key={key} className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900">{field.placeholder}</h3>
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={filters[key] as string || ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={field.placeholder}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    )}
                    {field.type === 'select' && field.options && (
                      <select
                        value={(filters[key] as string[]) || []}
                        onChange={(e) => handleChange(key, Array.from(e.target.selectedOptions, option => option.value))}
                        multiple
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        {field.options.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {field.type === 'daterange' && (
                      <div className="flex gap-4">
                        <input
                          type="date"
                          value={(filters[key] as DateRangeFilter)?.from || ''}
                          onChange={(e) => handleChange(key, {
                            ...(filters[key] as DateRangeFilter || { to: '' }),
                            from: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <input
                          type="date"
                          value={(filters[key] as DateRangeFilter)?.to || ''}
                          onChange={(e) => handleChange(key, {
                            ...(filters[key] as DateRangeFilter || { from: '' }),
                            to: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Value Range Filter */}
                {Object.entries(config).find(([_, field]) => field.type === 'valueRange') && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      {Object.entries(config).find(([_, field]) => field.type === 'valueRange')?.[1]?.placeholder || 'Value Range'}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Min"
                          value={(filters.valueRange as RangeFilter)?.min || ''}
                          onChange={(e) => handleValueRangeChange('min', e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Max"
                          value={(filters.valueRange as RangeFilter)?.max || ''}
                          onChange={(e) => handleValueRangeChange('max', e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Reset Button */}
                {activeFilterCount > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onReset();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Reset Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Tags */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map(({ group, value, label }) => (
            <div
              key={`${group}-${value}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600"
            >
              <span className="text-blue-600">{group}: {label}</span>
              <button
                onClick={() => handleRemoveFilter(group.toLowerCase().replace('s', ''), value)}
                className="rounded-sm hover:bg-blue-100 -mr-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              onReset();
              setIsOpen(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
} 