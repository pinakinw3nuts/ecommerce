import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter as FilterIcon, Calendar, X, Check, ChevronDown, Star, StarOff, CheckSquare, Ban, Tag, Percent } from 'lucide-react';
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
    type: 'text' | 'select' | 'daterange' | 'valueRange' | 'boolean';
    placeholder: string;
    options?: Array<{ value: string; label: string }>;
    isLoading?: boolean;
  };
}

export interface FilterState {
  [key: string]: string | string[] | DateRangeFilter | RangeFilter | undefined;
  search?: string;
  categories?: string[];
  statuses?: string[];
  isFeatured?: string[];
  isPublished?: string[];
  valueRange?: RangeFilter;
  dateRange?: DateRangeFilter;
}

export interface CommonFiltersProps {
  config: FilterConfig;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function CommonFilters({ config, filters, onChange, onReset }: CommonFiltersProps) {
  const [isOpen, setIsOpen] = useState(() => {
    // Try to restore the filter popup state from localStorage
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('filterPopupOpen');
      return savedState === 'true';
    }
    return false;
  });
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('top');
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [dropdownSearches, setDropdownSearches] = useState<Record<string, string>>({});
  // Track the last focused input to restore focus after refresh
  const [lastFocusedInput, setLastFocusedInput] = useState<{
    type: 'search' | 'valueRange' | 'dateRange';
    key?: string;
    field?: 'min' | 'max' | 'from' | 'to';
  }>({ type: 'search' });
  
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const valueMinInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const valueMaxInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Store last focused input in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastFocusedInput', JSON.stringify(lastFocusedInput));
    }
  }, [lastFocusedInput]);
  
  // Load last focused input from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedFocus = localStorage.getItem('lastFocusedInput');
        if (savedFocus) {
          setLastFocusedInput(JSON.parse(savedFocus));
        }
      } catch (e) {
        console.error('Error loading last focused input:', e);
      }
    }
  }, []);

  // Always position the dropdown at the top
  useEffect(() => {
    setDropdownPosition('top');
  }, [isOpen]);

  // Save isOpen state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('filterPopupOpen', isOpen.toString());
    }
    
    // When filter popup opens, focus on the appropriate input
    if (isOpen) {
      setTimeout(() => {
        // First priority: Focus on the last focused input if available
        if (lastFocusedInput) {
          if (lastFocusedInput.type === 'search' && searchInputRef.current) {
            searchInputRef.current.focus();
            return;
          } 
          else if (lastFocusedInput.type === 'valueRange' && lastFocusedInput.key && lastFocusedInput.field) {
            if (lastFocusedInput.field === 'min' && valueMinInputRefs.current[lastFocusedInput.key]) {
              valueMinInputRefs.current[lastFocusedInput.key]?.focus();
              return;
            } 
            else if (lastFocusedInput.field === 'max' && valueMaxInputRefs.current[lastFocusedInput.key]) {
              valueMaxInputRefs.current[lastFocusedInput.key]?.focus();
              return;
            }
          }
        }
        
        // Second priority: Focus on search input if it exists and is empty
        if (searchInputRef.current && (!filters.search || (filters.search as string) === '')) {
          searchInputRef.current.focus();
          return;
        }
        
        // Third priority: Find the first value range filter with a min value
        const valueRangeKey = Object.keys(filters).find(key => {
          const filter = filters[key];
          return (
            filter && 
            typeof filter === 'object' && 
            'min' in filter && 
            config[key]?.type === 'valueRange'
          );
        });
        
        if (valueRangeKey && valueMinInputRefs.current[valueRangeKey]) {
          valueMinInputRefs.current[valueRangeKey]?.focus();
        }
      }, 50); // Shorter delay for better responsiveness
    }
  }, [isOpen, filters, config, lastFocusedInput]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close filter popup when clicking outside
      if (
        isOpen &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }

      // Close individual dropdowns when clicking outside
      Object.entries(selectDropdownRefs.current).forEach(([key, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdowns(prev => ({...prev, [key]: false}));
        }
      });
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Add an effect to handle keyboard events globally
  useEffect(() => {
    // Function to handle keydown events
    const handleKeyDown = (e: KeyboardEvent) => {
      // Get the active element
      const activeElement = document.activeElement;
      const activeElementType = activeElement ? (activeElement as HTMLElement).getAttribute('data-input-type') : null;
      
      // If we're focused on a value range input, prevent other inputs from capturing keystrokes
      if (activeElementType === 'valueRange') {
        // Mark that we're in a value input
        if (typeof window !== 'undefined') {
          localStorage.setItem('isChangingValue', 'true');
        }
        
        // Clear the flag after a short delay
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('isChangingValue', 'false');
          }
        }, 100);
      }
    };
    
    // Add the event listener
    document.addEventListener('keydown', handleKeyDown, true);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChange = (key: string, value: string | string[] | DateRangeFilter | RangeFilter) => {
    // Get the currently focused element before update
    const activeElement = document.activeElement;
    const activeElementType = activeElement ? (activeElement as HTMLElement).getAttribute('data-input-type') : null;
    const activeElementId = activeElement ? (activeElement as HTMLElement).id : null;
    
    // Block search focus if we're changing a value range
    const isChangingValue = typeof window !== 'undefined' && localStorage.getItem('isChangingValue') === 'true';
    
    // Update the filter state without closing the popup
    onChange({
      ...filters,
      [key]: value
    });
    
    // Ensure the popup stays open by setting it explicitly
    if (typeof window !== 'undefined') {
      localStorage.setItem('filterPopupOpen', 'true');
    }
    
    // If the active element was a value range input or we're in the middle of changing a value, restore focus after state update
    if ((activeElementType === 'valueRange' && activeElementId) || isChangingValue) {
      // Use multiple attempts to restore focus
      const focusElement = () => {
        const elementToFocus = activeElementId ? document.getElementById(activeElementId) : null;
        if (elementToFocus) {
          elementToFocus.focus();
          return true;
        }
        
        // If we can't find the element by ID, try to find it by type
        if (activeElementType === 'valueRange') {
          // Try to find any value range input and focus it
          const valueInputs = document.querySelectorAll('[data-input-type="valueRange"]');
          if (valueInputs.length > 0) {
            (valueInputs[0] as HTMLElement).focus();
            return true;
          }
        }
        
        return false;
      };
      
      // Attempt focus restoration multiple times with increasing delays
      setTimeout(focusElement, 0);
      setTimeout(focusElement, 50);
      setTimeout(focusElement, 100);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Store the current selection/cursor position
    const input = e.target;
    const cursorPosition = input.type !== 'number' ? input.selectionStart || 0 : 0;
    
    // Update last focused input
    setLastFocusedInput({
      type: 'search'
    });
    
    handleChange('search', e.target.value);
    
    // Restore focus and cursor position after state update
    setTimeout(() => {
      input.focus();
      if (input.type !== 'number') {
        input.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  const handleOptionToggle = (groupKey: string, value: string, event?: React.MouseEvent) => {
    // Prevent event propagation if provided
    if (event) {
      event.stopPropagation();
    }
    
    const currentValues = (filters[groupKey] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    handleChange(groupKey, newValues);
  };

  const handleSelectAll = (groupKey: string, options: FilterOption[], event?: React.MouseEvent) => {
    // Prevent event propagation if provided
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const allValues = options.map(option => option.value);
    const currentValues = filters[groupKey] as string[];
    
    // If all are already selected, deselect all
    if (currentValues && currentValues.length === allValues.length) {
      handleChange(groupKey, []);
    } else {
      // Otherwise select all
      handleChange(groupKey, allValues);
    }
  };

  const handleRemoveFilter = (filterKey: string, value: string) => {
    // If we already have the direct key, use it
    if (config[filterKey]) {
      const currentValues = (filters[filterKey] as string[]) || [];
      handleChange(filterKey, currentValues.filter(v => v !== value));
      return;
    }
    
    // Otherwise try to find the key by matching the formatted name
    const key = Object.keys(config).find(k => formatFilterName(k) === filterKey);
    
    if (key) {
      const currentValues = (filters[key] as string[]) || [];
      handleChange(key, currentValues.filter(v => v !== value));
    } else {
      // Fallback to try extracting the key from the displayed name
      const fallbackKey = filterKey.toLowerCase().replace(/filter by |s$/g, '');
      const currentValues = (filters[fallbackKey] as string[]) || [];
      handleChange(fallbackKey, currentValues.filter(v => v !== value));
    }
  };

  const handleValueRangeChange = (key: string, field: 'min' | 'max', value: string, event?: React.ChangeEvent) => {
    // Prevent event propagation if provided
    if (event) {
      event.stopPropagation();
      // Prevent any default behavior
      event.preventDefault();
    }
    
    // Store the current selection/cursor position
    const input = event?.target as HTMLInputElement;
    const cursorPosition = input?.selectionStart || 0;
    
    // Update last focused input
    setLastFocusedInput({
      type: 'valueRange',
      key,
      field
    });
    
    // Store the input element for focus restoration
    const inputElement = field === 'min' ? 
      valueMinInputRefs.current[key] : 
      valueMaxInputRefs.current[key];
      
    // Set a flag in localStorage to indicate we're in the middle of a value change
    if (typeof window !== 'undefined') {
      localStorage.setItem('isChangingValue', 'true');
    }
    
    handleChange(key, {
      ...(filters[key] as RangeFilter),
      [field]: value,
    });
    
    // Restore focus and cursor position after state update
    if (inputElement) {
      // Use multiple timeouts with increasing delays to ensure focus is maintained
      setTimeout(() => {
        inputElement.focus();
        if (cursorPosition !== null) {
          try {
            inputElement.setSelectionRange(cursorPosition, cursorPosition);
          } catch (e) {
            console.error('Failed to set selection range:', e);
          }
        }
        
        // Clear the flag after focus is restored
        if (typeof window !== 'undefined') {
          localStorage.setItem('isChangingValue', 'false');
        }
      }, 0);
      
      // Additional focus attempt with a slightly longer delay
      setTimeout(() => {
        inputElement.focus();
      }, 50);
    }
  };

  const handleDateRangeChange = (key: string, field: 'from' | 'to', value: string, event?: React.ChangeEvent) => {
    // Prevent event propagation if provided
    if (event) {
      event.stopPropagation();
    }
    
    // Store the current selection/cursor position
    const input = event?.target as HTMLInputElement;
    
    // Update last focused input
    setLastFocusedInput({
      type: 'dateRange',
      key,
      field
    });
    
    handleChange(key, {
      ...(filters[key] as DateRangeFilter),
      [field]: value,
    });
    
    // Restore focus after state update
    if (input) {
      setTimeout(() => {
        input.focus();
      }, 0);
    }
  };

  const handleDropdownSearch = (key: string, value: string, event?: React.ChangeEvent<HTMLInputElement>) => {
    // Store the input element and cursor position if event is provided
    const input = event?.target;
    const cursorPosition = input?.type !== 'number' ? input?.selectionStart || 0 : 0;
    
    setDropdownSearches(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Restore focus and cursor position after state update
    if (input) {
      setTimeout(() => {
        input.focus();
        if (input.type !== 'number') {
          input.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    }
  };

  // Filter options based on search
  const getFilteredOptions = (key: string, options: FilterOption[]) => {
    const searchTerm = dropdownSearches[key]?.toLowerCase() || '';
    if (!searchTerm) return options;
    
    return options.filter(option => 
      option.label.toLowerCase().includes(searchTerm)
    );
  };

  // Count active filters dynamically
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    // Skip search as it's displayed separately in the search box
    if (key === 'search') return count;
    
    // Count array filters with items
    if (Array.isArray(value) && value.length > 0) {
      return count + 1; // Count each filter type once, not each selected value
    }
    
    // Count object filters (like range filters) that have at least one value
    if (value && typeof value === 'object') {
      const hasValues = Object.values(value as object).some(v => 
        v !== null && v !== undefined && v !== ''
      );
      return count + (hasValues ? 1 : 0);
    }
    
    // Count other non-empty values
    return count + (value ? 1 : 0);
  }, 0);

  // Format user-friendly filter names for display
  const formatFilterName = (key: string): string => {
    // Get the name from the config if available, otherwise format the key name
    return config[key]?.placeholder || key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase());
  };

  // Get active filters for display
  const getActiveFilters = () => {
    const active: { group: string; value: string; label: string; key: string }[] = [];
    
    // Process all filter types
    Object.entries(filters).forEach(([key, value]) => {
      // Skip search field as it's displayed in the search box
      if (key === 'search') {
        return;
      }
      
      const field = config[key];
      if (!field) return; // Skip if not in config
      
      // Handle select/array type filters
      if (Array.isArray(value) && value.length > 0) {
        value.forEach(val => {
          const option = field.options?.find(opt => opt.value === val);
          if (option) {
            active.push({
              group: formatFilterName(key),
              value: val,
              label: option.label,
              key
            });
          }
        });
      }
      
      // Handle value range filters
      else if (field.type === 'valueRange' && typeof value === 'object') {
        const range = value as RangeFilter;
        if (range.min || range.max) {
          const label = [
            range.min ? `$${range.min}` : '',
            range.min && range.max ? ' - ' : '',
            range.max ? `$${range.max}` : ''
          ].join('');
          
          active.push({
            group: field.placeholder || 'Price Range',
            value: 'range',
            label,
            key
          });
        }
      }
      
      // Handle date range filters
      else if (field.type === 'daterange' && typeof value === 'object') {
        const range = value as DateRangeFilter;
        if (range.from || range.to) {
          const label = [
            range.from ? new Date(range.from).toLocaleDateString() : '',
            range.from && range.to ? ' - ' : '',
            range.to ? new Date(range.to).toLocaleDateString() : ''
          ].join('');
          
          active.push({
            group: field.placeholder || 'Date Range',
            value: 'range',
            label,
            key
          });
        }
      }
    });

    return active;
  };

  const activeFilters = getActiveFilters();

  // Function to focus the search input
  const focusSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Function to focus a specific input
  const focusInput = (key: string, field: 'min' | 'max') => {
    if (field === 'min' && valueMinInputRefs.current[key]) {
      valueMinInputRefs.current[key]?.focus();
    } else if (field === 'max' && valueMaxInputRefs.current[key]) {
      valueMaxInputRefs.current[key]?.focus();
    }
  };

  // Function to set dropdown ref
  const setDropdownRef = (key: string) => (el: HTMLDivElement | null) => {
    selectDropdownRefs.current[key] = el;
  };

  return (
    <div className="space-y-4" onKeyDown={(e) => {
      // Get the active element
      const activeElement = document.activeElement;
      const activeElementType = activeElement ? (activeElement as HTMLElement).getAttribute('data-input-type') : null;
      
      // If we're focused on a value range input, prevent event propagation
      if (activeElementType === 'valueRange') {
        // Don't let the event bubble up to other handlers
        e.stopPropagation();
      }
    }}>
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
            ref={searchInputRef}
            onFocus={(e) => {
              // Check if we're in the middle of changing a value range
              const isChangingValue = typeof window !== 'undefined' && localStorage.getItem('isChangingValue') === 'true';
              if (isChangingValue) {
                // Prevent focus on search if we're changing a value range
                e.preventDefault();
                e.stopPropagation();
                
                // Try to find and focus the last active value input
                const lastFocused = localStorage.getItem('lastFocusedInput');
                if (lastFocused) {
                  try {
                    const focusInfo = JSON.parse(lastFocused);
                    if (focusInfo.type === 'valueRange' && focusInfo.key && focusInfo.field) {
                      const inputRef = focusInfo.field === 'min' ? 
                        valueMinInputRefs.current[focusInfo.key] : 
                        valueMaxInputRefs.current[focusInfo.key];
                      
                      if (inputRef) {
                        setTimeout(() => inputRef.focus(), 0);
                        return;
                      }
                    }
                  } catch (err) {
                    console.error('Error parsing last focused input:', err);
                  }
                }
                
                // If we can't find the specific input, try to find any value range input
                const valueInputs = document.querySelectorAll('[data-input-type="valueRange"]');
                if (valueInputs.length > 0) {
                  setTimeout(() => (valueInputs[0] as HTMLElement).focus(), 0);
                  return;
                }
              }
              
              setLastFocusedInput({ type: 'search' });
            }}
            data-input-type="search"
            id="global-search-input"
          />
        </div>
        <div className="relative">
          <Button
            ref={filterButtonRef}
            variant="outline"
            size="default"
            onClick={() => {
              const newIsOpen = !isOpen;
              setIsOpen(newIsOpen);
              
              // If opening the popup, focus on the search input after a brief delay
              if (newIsOpen) {
                setTimeout(() => {
                  if (searchInputRef.current) {
                    searchInputRef.current.focus();
                  }
                }, 50);
              }
            }}
            className="flex items-center gap-2 px-4"
          >
            <FilterIcon className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center ml-1 bg-blue-600 text-white rounded-full w-5 h-5 text-xs font-medium">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Filter Panel */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className="absolute top-full mt-2 right-0 w-[360px] max-h-[80vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-50"
            >
              <div className="space-y-5 p-5">
                <div className="flex justify-between items-center">
                  <h3 
                    className="font-medium text-lg text-gray-900 cursor-pointer" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      focusSearchInput();
                    }}
                  >
                    Filter Options
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Filter Groups */}
                {Object.entries(config).map(([key, field]) => {
                  // Skip text type (search) in the dropdown
                  if (field.type === 'text') return null;
                  
                  // Custom status filter as buttons
                  if (key === 'isActive') {
                    const selected = Array.isArray(filters.isActive) ? filters.isActive[0] : undefined;
                    return (
                      <div key={key} className="space-y-2 border-t border-gray-100 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-700">{field.placeholder}</h4>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={selected === 'true' ? 'default' : 'outline'}
                            className={selected === 'true' ? 'bg-green-600 text-white' : ''}
                            onClick={() => handleChange('isActive', ['true'])}
                          >
                            Active
                          </Button>
                          <Button
                            type="button"
                            variant={selected === 'false' ? 'default' : 'outline'}
                            className={selected === 'false' ? 'bg-gray-700 text-white' : ''}
                            onClick={() => handleChange('isActive', ['false'])}
                          >
                            Inactive
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={key} className="space-y-2 border-t border-gray-100 pt-4 mt-4">
                      <h4 
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // If this is a value range filter, focus the min input
                          if (field.type === 'valueRange' && valueMinInputRefs.current[key]) {
                            focusInput(key, 'min');
                          }
                          // For other types, focus the search input
                          else {
                            focusSearchInput();
                          }
                        }}
                      >
                        {field.placeholder}
                      </h4>
                      
                      {/* Boolean filter (buttons) - Status with box style */}
                      {field.type === 'boolean' && field.options && (key === 'isActive' || key === 'status') && (
                        <div className="space-y-3 border border-gray-100 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                          <div className="flex flex-row gap-2">
                            {field.options.map(option => {
                              const isSelected = Array.isArray(filters[key]) && 
                                (filters[key] as string[]).includes(option.value);
                              
                              // Match the icon style from the image
                              const Icon = option.value === 'active' ? CheckSquare : Ban;
                              
                              return (
                                <button
                                  type="button"
                                  key={option.value}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const currentValues = (filters[key] as string[]) || [];
                                    
                                    // Toggle logic for status filters
                                    if (currentValues.includes(option.value)) {
                                      // If clicked option is already selected, remove it
                                      handleChange(key, currentValues.filter(v => v !== option.value));
                                    } else {
                                      // Replace any existing selection with this one
                                      handleChange(key, [option.value]);
                                    }
                                  }}
                                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                                    isSelected 
                                      ? "bg-gray-700 text-white" 
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                                >
                                  <Icon className="h-4 w-4 mr-2" />
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Other boolean filters */}
                      {field.type === 'boolean' && field.options && key !== 'isActive' && key !== 'status' && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.options.map(option => {
                            const isSelected = Array.isArray(filters[key]) && 
                              (filters[key] as string[]).includes(option.value);
                            
                            // Determine appropriate icon based on option value and filter key
                            let Icon;
                            if (key === 'isFeatured') {
                              Icon = option.value === 'true' ? Star : StarOff;
                            } else {
                              Icon = option.value === 'true' ? Check : X;
                            }

                            // Determine button style based on key and option value
                            let buttonStyle = '';
                            if (isSelected) {
                              buttonStyle = option.value === 'true' 
                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                : 'bg-gray-700 text-white hover:bg-gray-800';
                            } else {
                              buttonStyle = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
                            }
                            
                            return (
                              <button
                                type="button"
                                key={option.value}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // For boolean filters, we want to make it behave like a radio button
                                  // So we set it to the value or clear it if already selected
                                  const currentValues = (filters[key] as string[]) || [];
                                  if (currentValues.includes(option.value)) {
                                    // If already selected, clear the filter
                                    handleChange(key, []);
                                  } else {
                                    // Otherwise, set just this value (replace any existing)
                                    handleChange(key, [option.value]);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${buttonStyle}`}
                              >
                                <Icon className="h-4 w-4" />
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {field.type === 'select' && (key === 'status' || key === 'type') && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            {field.options?.map(option => {
                              const isSelected = Array.isArray(filters[key]) && 
                                (filters[key] as string[]).includes(option.value);
                              
                              // Determine icon based on filter type and option
                              let Icon;
                              let buttonStyle = '';
                              
                              if (key === 'status') {
                                Icon = option.value === 'active' ? CheckSquare : Ban;
                                // Status-specific styling
                                buttonStyle = isSelected
                                  ? option.value === 'active'
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-700 text-white hover:bg-gray-800'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
                              } else if (key === 'type') {
                                // For discount type (flat vs percent)
                                Icon = option.value === 'flat' ? Tag : Percent;
                                // Type-specific styling
                                buttonStyle = isSelected
                                  ? option.value === 'flat'
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
                              }
                              
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    const currentValues = (filters[key] as string[]) || [];
                                    if (currentValues.includes(option.value)) {
                                      // If already selected, remove it
                                      handleChange(key, currentValues.filter(v => v !== option.value));
                                    } else {
                                      // Add to selection (multi-select)
                                      handleChange(key, [...currentValues, option.value]);
                                    }
                                  }}
                                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${buttonStyle}`}
                                >
                                  {Icon && <Icon className="h-4 w-4" />}
                                  {option.label}
                                </button>
                              );
                            })}
                            
                            {/* Clear selection button */}
                            {Array.isArray(filters[key]) && (filters[key] as string[]).length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleChange(key, []);
                                }}
                                className="px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 border border-gray-200 text-gray-500 hover:bg-gray-50"
                              >
                                <X className="h-4 w-4" />
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {field.type === 'select' && key !== 'status' && key !== 'type' && (
                        <div className="relative mt-2" ref={setDropdownRef(key)}>
                          {field.isLoading ? (
                            <div className="flex items-center justify-center w-full py-2 text-sm text-gray-500">
                              Loading options...
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleDropdown(key)}
                                className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <span>
                                  {Array.isArray(filters[key]) && (filters[key] as string[]).length > 0
                                    ? `${(filters[key] as string[]).length} selected`
                                    : `Select ${field.placeholder}`}
                                </span>
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              </button>
                              
                              {openDropdowns[key] && (
                                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
                                  {field.options && field.options.length > 0 ? (
                                    <div>
                                      {/* Search input */}
                                      <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
                                        <div className="relative">
                                          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                                          <input
                                            type="text"
                                            value={dropdownSearches[key] || ''}
                                            onChange={(e) => handleDropdownSearch(key, e.target.value, e)}
                                            placeholder="Search..."
                                            className="w-full rounded-md border border-gray-200 bg-white pl-7 pr-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                      </div>
                                      
                                      {/* Select All option */}
                                      <div
                                        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                                        onClick={(e) => handleSelectAll(key, field.options || [], e)}
                                      >
                                        <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                                          Array.isArray(filters[key]) && 
                                          field.options && 
                                          (filters[key] as string[]).length === field.options.length
                                            ? 'bg-blue-500 border-blue-500' 
                                            : 'border-gray-300'
                                        } mr-2`}>
                                          {Array.isArray(filters[key]) && 
                                           field.options && 
                                           (filters[key] as string[]).length === field.options.length && 
                                            <Check className="h-3 w-3 text-white" />
                                          }
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">Select All</span>
                                      </div>
                                      
                                      {/* Individual options */}
                                      <div className="py-1">
                                        {getFilteredOptions(key, field.options).map(option => {
                                          const isSelected = Array.isArray(filters[key]) && 
                                            (filters[key] as string[]).includes(option.value);
                                          
                                          return (
                                            <div
                                              key={option.value}
                                              className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                              onClick={(e) => {
                                                handleOptionToggle(key, option.value, e);
                                              }}
                                            >
                                              <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                                                isSelected 
                                                  ? 'bg-blue-500 border-blue-500' 
                                                  : 'border-gray-300'
                                              } mr-2`}>
                                                {isSelected && <Check className="h-3 w-3 text-white" />}
                                              </div>
                                              <span className="text-sm text-gray-700">{option.label}</span>
                                            </div>
                                          );
                                        })}
                                        
                                        {/* No results message */}
                                        {dropdownSearches[key] && getFilteredOptions(key, field.options).length === 0 && (
                                          <div className="px-3 py-2 text-sm text-gray-500">
                                            No results match "{dropdownSearches[key]}"
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {field.type === 'daterange' && (
                        <div className="flex gap-3 mt-2">
                          <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">From</label>
                            <input
                              type="date"
                              value={(filters[key] as DateRangeFilter)?.from || ''}
                              onChange={(e) => handleDateRangeChange(key, 'from', e.target.value, e)}
                              className="w-full rounded-md border border-gray-200 py-1.5 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onFocus={() => setLastFocusedInput({ type: 'dateRange', key, field: 'from' })}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">To</label>
                            <input
                              type="date"
                              value={(filters[key] as DateRangeFilter)?.to || ''}
                              onChange={(e) => handleDateRangeChange(key, 'to', e.target.value, e)}
                              className="w-full rounded-md border border-gray-200 py-1.5 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onFocus={() => setLastFocusedInput({ type: 'dateRange', key, field: 'to' })}
                            />
                          </div>
                        </div>
                      )}
                      {field.type === 'valueRange' && (
                        <div className="space-y-2 mt-2">
                          <div 
                            className="grid grid-cols-2 gap-3"
                            onClick={() => focusInput(key, 'min')}
                          >
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Min"
                                value={(filters[key] as RangeFilter)?.min || ''}
                                onChange={(e) => {
                                  // Only allow numeric input
                                  if (e.target.value === '' || /^[0-9]+$/.test(e.target.value)) {
                                    handleValueRangeChange(key, 'min', e.target.value, e);
                                  }
                                }}
                                className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                ref={(el) => {
                                  valueMinInputRefs.current[key] = el;
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={() => {
                                  setLastFocusedInput({ type: 'valueRange', key, field: 'min' });
                                  // Set flag that we're in a value input
                                  if (typeof window !== 'undefined') {
                                    localStorage.setItem('isChangingValue', 'true');
                                  }
                                }}
                                onBlur={() => {
                                  // Clear the flag with a delay to allow focus to transfer to another value input
                                  setTimeout(() => {
                                    if (typeof window !== 'undefined') {
                                      localStorage.setItem('isChangingValue', 'false');
                                    }
                                  }, 100);
                                }}
                                onKeyDown={(e) => {
                                  // Prevent event bubbling for all keyboard events
                                  e.stopPropagation();
                                }}
                                data-input-type="valueRange"
                                id={`valueRange-${key}-min`}
                              />
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Max"
                                value={(filters[key] as RangeFilter)?.max || ''}
                                onChange={(e) => {
                                  // Only allow numeric input
                                  if (e.target.value === '' || /^[0-9]+$/.test(e.target.value)) {
                                    handleValueRangeChange(key, 'max', e.target.value, e);
                                  }
                                }}
                                className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                ref={(el) => {
                                  valueMaxInputRefs.current[key] = el;
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={() => {
                                  setLastFocusedInput({ type: 'valueRange', key, field: 'max' });
                                  // Set flag that we're in a value input
                                  if (typeof window !== 'undefined') {
                                    localStorage.setItem('isChangingValue', 'true');
                                  }
                                }}
                                onBlur={() => {
                                  // Clear the flag with a delay to allow focus to transfer to another value input
                                  setTimeout(() => {
                                    if (typeof window !== 'undefined') {
                                      localStorage.setItem('isChangingValue', 'false');
                                    }
                                  }, 100);
                                }}
                                onKeyDown={(e) => {
                                  // Prevent event bubbling for all keyboard events
                                  e.stopPropagation();
                                }}
                                data-input-type="valueRange"
                                id={`valueRange-${key}-max`}
                              />
                            </div>
                          </div>
                          
                          {/* Clear button for value range */}
                          {((filters[key] as RangeFilter)?.min || (filters[key] as RangeFilter)?.max) && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleChange(key, { min: '', max: '' });
                                  setTimeout(() => focusInput(key, 'min'), 0);
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                Clear range
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Action Buttons */}
                <div className="flex justify-between gap-3 pt-4 mt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      onReset();
                      setIsOpen(false);
                    }}
                    disabled={activeFilterCount === 0}
                    className="text-gray-700 font-medium hover:text-gray-900 px-3 py-2"
                  >
                    Reset All
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Tags */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map(({ group, value, label, key }) => {
            // Special styling for status filters
            if (key === 'isActive' || key === 'status') {
              return (
                <div
                  key={`${key}-${value}-${label}`}
                  className="inline-flex items-center rounded-full bg-slate-800 text-white"
                >
                  <span className="px-3 py-1 text-sm font-medium">
                    {group}: {label}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveFilter(key, value);
                    }}
                    className="ml-1 mr-1 hover:bg-slate-700 rounded-full p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            }
            
            // Default styling for other filters
            return (
              <div
                key={`${key}-${value}-${label}`}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-600"
              >
                <span>
                  {group}: {label}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const field = config[key];
                    if (field && (field.type === 'valueRange' || field.type === 'daterange')) {
                      // For range types, clear the whole range
                      handleChange(key, field.type === 'valueRange' ? { min: '', max: '' } : { from: '', to: '' });
                    } else {
                      // For array types, remove the specific value
                      handleRemoveFilter(key, value);
                    }
                  }}
                  className="rounded-sm hover:bg-opacity-20 -mr-1 ml-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => {
              onReset();
              setIsOpen(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
} 