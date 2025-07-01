'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type SortDirection = 'asc' | 'desc' | null;

export interface TableInstance {
  getIsAllRowsSelected: () => boolean;
  getToggleAllRowsSelectedHandler: () => () => void;
}

interface RowInstance<T> {
  row: T;
  getIsSelected: () => boolean;
  getToggleSelectedHandler: () => () => void;
}

export interface Column<T> {
  header: string | React.ReactNode | ((props: { table: TableInstance }) => React.ReactNode);
  accessorKey?: keyof T;
  cell?: (props: { row: T; table: TableInstance & { getRowProps: (row: T) => { getIsSelected: () => boolean; getToggleSelectedHandler: () => () => void } } }) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  pagination?: PaginationProps;
  onSort?: (key: keyof T, direction: SortDirection) => void;
  selection?: {
    selectedRows: string[];
    onSelectedRowsChange: (selectedRows: string[]) => void;
  };
  onAdd?: () => void;
  emptyState?: React.ReactNode;
}

export default function Table<T extends { id: string }>({
  data,
  columns,
  isLoading,
  pagination,
  onSort,
  selection,
  onAdd,
  emptyState,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: SortDirection;
  }>({
    key: null,
    direction: null,
  });

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 0;

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !column.accessorKey) return;

    const key = column.accessorKey;
    const direction: SortDirection =
      sortConfig.key === key
        ? sortConfig.direction === 'asc'
          ? 'desc'
          : sortConfig.direction === 'desc'
          ? null
          : 'asc'
        : 'asc';

    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable || !column.accessorKey) return null;

    if (sortConfig.key === column.accessorKey) {
      return sortConfig.direction === 'asc' ? (
        <ChevronUp className="h-4 w-4" />
      ) : sortConfig.direction === 'desc' ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 text-gray-400" />
      );
    }

    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  };

  const isRowSelected = (row: T) => {
    return selection?.selectedRows.includes(row.id) ?? false;
  };

  const toggleRowSelection = (row: T) => {
    if (!selection) return;
    const newSelectedRows = isRowSelected(row)
      ? selection.selectedRows.filter(id => id !== row.id)
      : [...selection.selectedRows, row.id];
    selection.onSelectedRowsChange(newSelectedRows);
  };

  const toggleAllRows = () => {
    if (!selection) return;
    const newSelectedRows = selection.selectedRows.length === data.length
      ? []
      : data.map(row => row.id);
    selection.onSelectedRowsChange(newSelectedRows);
  };

  return (
    <div className="w-full">
      {/* Table with horizontal scrolling */}
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {columns.map((column, i) => (
              <th
                key={i}
                scope="col"
                style={{ width: column.width }}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                  column.sortable ? 'cursor-pointer select-none' : ''
                }`}
                onClick={() => column.sortable ? handleSort(column) : undefined}
              >
                <div className="flex items-center gap-1">
                  {typeof column.header === 'function' ? column.header({
                    table: {
                      getIsAllRowsSelected: () => selection?.selectedRows.length === data.length,
                      getToggleAllRowsSelectedHandler: () => () => toggleAllRows(),
                    },
                  }) : column.header}
                  {column.sortable && getSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-4 whitespace-nowrap text-center"
              >
                <div className="flex items-center justify-center text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 whitespace-nowrap text-center text-gray-500"
              >
                {emptyState || (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="text-lg font-semibold text-gray-700">No data found</div>
                    <div className="text-sm text-gray-500">No items match your criteria.</div>
                    {typeof onAdd === 'function' && (
                      <Button variant="default" size="sm" onClick={onAdd}>
                        + Add New
                      </Button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 focus-within:bg-gray-50 transition-colors"
              >
                {columns.map((column, i) => (
                  <td
                    key={i}
                    className="px-6 py-4"
                    style={{ width: column.width }}
                  >
                    {column.cell
                      ? column.cell({
                          row,
                          table: {
                            getIsAllRowsSelected: () => selection?.selectedRows.length === data.length,
                            getToggleAllRowsSelectedHandler: () => () => toggleAllRows(),
                            getRowProps: (row: T) => ({
                              getIsSelected: () => isRowSelected(row),
                              getToggleSelectedHandler: () => () => toggleRowSelection(row),
                            }),
                          },
                        })
                      : column.accessorKey
                      ? String(row[column.accessorKey])
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page{' '}
                <span className="font-medium">{pagination.page}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-l-md"
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {/* Page numbers */}
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNumber = i + 1;
                  const isCurrentPage = pageNumber === pagination.page;

                  // Show first page, last page, current page, and pages around current page
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= pagination.page - 1 &&
                      pageNumber <= pagination.page + 1)
                  ) {
                    return (
                      <Button
                        key={pageNumber}
                        variant={isCurrentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => pagination.onPageChange(pageNumber)}
                        className={`${
                          isCurrentPage
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  }

                  // Show ellipsis
                  if (
                    pageNumber === pagination.page - 2 ||
                    pageNumber === pagination.page + 2
                  ) {
                    return (
                      <span
                        key={pageNumber}
                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }

                  return null;
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-r-md"
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 