import React from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className="p-4 space-y-4">
        {children}
      </div>
    </div>
  );
}

interface FormRowProps {
  label: string;
  htmlFor: string;
  description?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

export function FormRow({ label, htmlFor, description, error, children }: FormRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4 items-start py-4">
      <div className="text-right">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className="col-span-2">
        {children}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function FormInput({ error, className = '', ...props }: FormInputProps) {
  return (
    <input
      {...props}
      className={`block w-full rounded-md border ${
        error ? 'border-red-300' : 'border-gray-300'
      } px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm ${className}`}
    />
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  error?: boolean;
}

export function FormSelect({ options, error, className = '', ...props }: FormSelectProps) {
  return (
    <select
      {...props}
      className={`block w-full rounded-md border ${
        error ? 'border-red-300' : 'border-gray-300'
      } px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function FormTextarea({ error, className = '', ...props }: FormTextareaProps) {
  return (
    <textarea
      {...props}
      className={`block w-full rounded-md border ${
        error ? 'border-red-300' : 'border-gray-300'
      } px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm ${className}`}
    />
  );
}

interface FormToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function FormToggle({ label, className = '', ...props }: FormToggleProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        {...props}
      />
      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
        peer-focus:ring-blue-300 rounded-full peer 
        peer-checked:after:translate-x-full peer-checked:after:border-white 
        after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
        after:bg-white after:border-gray-300 after:border after:rounded-full 
        after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${className}`}
      />
      {label && (
        <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
      )}
    </label>
  );
}

interface FormImageUploadProps {
  id: string;
  currentImage?: string;
  onImageChange: (file: File) => void;
  error?: string;
}

export function FormImageUpload({ id, currentImage, onImageChange, error }: FormImageUploadProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        {currentImage && (
          <div className="h-16 w-16 rounded-lg border border-gray-200 p-1">
            <img
              src={currentImage}
              alt="Current"
              className="h-full w-full object-contain"
            />
          </div>
        )}
        <label
          htmlFor={id}
          className="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200"
        >
          Choose Image
          <input
            id={id}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImageChange(file);
              }
            }}
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
} 