import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: any): string {
  if (!date) {
    return 'N/A';
  }
  
  try {
    // Handle case where date is an object with id, name, description, etc.
    if (typeof date === 'object' && date !== null && !(date instanceof Date)) {
      // If it has an 'id' property, it's likely a relation object
      if ('id' in date) {
        console.warn('Received object instead of date value:', date);
        return 'Invalid date format';
      }
      
      // If object has toString method that returns a non-object representation
      if (date.toString && typeof date.toString === 'function' && date.toString() !== '[object Object]') {
        console.warn('Converting object to string for date:', date);
        date = date.toString();
      }
    }
    
    // Convert to Date object if it's a string or number
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date value:', date);
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Invalid date';
  }
}

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });
  
  return searchParams.toString();
}