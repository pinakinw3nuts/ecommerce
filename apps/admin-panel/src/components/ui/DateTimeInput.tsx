import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

interface DateTimeInputProps {
  name: string;
  label: string;
  required?: boolean;
  minDate?: Date;
  className?: string;
}

export function DateTimeInput({ name, label, required = false, minDate, className = '' }: DateTimeInputProps) {
  const { register, setValue, watch } = useFormContext();
  const [localDateTime, setLocalDateTime] = useState('');
  const watchedValue = watch(name);

  // Format ISO date string to local datetime-local input value
  const formatDateForInput = (isoString: string | null): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      
      // Format as YYYY-MM-DDThh:mm (format required by datetime-local input)
      return date.toISOString().slice(0, 16);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Convert local datetime to ISO string with proper timezone handling
  const handleDateTimeChange = (value: string) => {
    setLocalDateTime(value);
    
    if (!value) {
      setValue(name, null);
      return;
    }

    try {
      // Create a date object from the local input
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Convert to ISO string format
        const isoString = date.toISOString();
        setValue(name, isoString);
      } else {
        setValue(name, null);
      }
    } catch (error) {
      console.error('Error converting date:', error);
      setValue(name, null);
    }
  };

  // Initialize local state from form value
  useEffect(() => {
    setLocalDateTime(formatDateForInput(watchedValue));
  }, [watchedValue]);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="datetime-local"
        value={localDateTime}
        onChange={(e) => handleDateTimeChange(e.target.value)}
        min={minDate ? formatDateForInput(minDate.toISOString()) : undefined}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <input 
        type="hidden" 
        {...register(name)}
      />
    </div>
  );
} 