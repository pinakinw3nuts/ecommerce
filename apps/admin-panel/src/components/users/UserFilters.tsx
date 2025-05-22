import React, { useState } from 'react';
import { Search, X, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FilterState {
  search: string;
  roles: string[];
  statuses: string[];
  dateRange: {
    from: string;
    to: string;
  };
}

interface UserFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'user', label: 'User' },
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
];

export function UserFilters({ filters, onChange, onReset }: UserFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleRoleToggle = (role: string) => {
    const roles = filters.roles.includes(role)
      ? filters.roles.filter(r => r !== role)
      : [...filters.roles, role];
    onChange({ ...filters, roles });
  };

  const handleStatusToggle = (status: string) => {
    const statuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses });
  };

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    onChange({
      ...filters,
      dateRange: { ...filters.dateRange, [field]: value },
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.roles.length > 0 ||
    filters.statuses.length > 0 ||
    filters.dateRange.from ||
    filters.dateRange.to;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search users..."
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
                {(filters.roles.length > 0 ? 1 : 0) +
                  (filters.statuses.length > 0 ? 1 : 0) +
                  (filters.dateRange.from || filters.dateRange.to ? 1 : 0)}
              </span>
            )}
          </Button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-md border border-gray-200 bg-white p-4 shadow-lg z-50">
              <div className="space-y-4">
                {/* Role Filter */}
                <div>
                  <h4 className="font-medium mb-2">Roles</h4>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map(role => (
                      <button
                        key={role.value}
                        onClick={() => handleRoleToggle(role.value)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors
                          ${filters.roles.includes(role.value)
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {role.label}
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
                          ${filters.statuses.includes(status.value)
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <h4 className="font-medium mb-2">Created Date</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">From</label>
                      <input
                        type="date"
                        value={filters.dateRange.from}
                        onChange={(e) => handleDateChange('from', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">To</label>
                      <input
                        type="date"
                        value={filters.dateRange.to}
                        onChange={(e) => handleDateChange('to', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                  <div className="border-t pt-4 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        onReset();
                        setIsOpen(false);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reset Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.roles.map(role => (
            <span
              key={role}
              className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
            >
              Role: {role}
              <button
                onClick={() => handleRoleToggle(role)}
                className="ml-1 rounded-full p-1 hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {filters.statuses.map(status => (
            <span
              key={status}
              className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
            >
              Status: {status}
              <button
                onClick={() => handleStatusToggle(status)}
                className="ml-1 rounded-full p-1 hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {(filters.dateRange.from || filters.dateRange.to) && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <Calendar className="h-3 w-3 mr-1" />
              {filters.dateRange.from && filters.dateRange.to
                ? `${filters.dateRange.from} - ${filters.dateRange.to}`
                : filters.dateRange.from
                ? `From ${filters.dateRange.from}`
                : `Until ${filters.dateRange.to}`}
              <button
                onClick={() => onChange({ ...filters, dateRange: { from: '', to: '' } })}
                className="ml-1 rounded-full p-1 hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
} 