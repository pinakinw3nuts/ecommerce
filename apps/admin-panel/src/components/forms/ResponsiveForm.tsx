'use client';

import React, { ReactNode } from 'react';
import { Button } from '../ui/Button';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

const FormSection = ({ title, description, children }: FormSectionProps) => (
  <div className="border-b border-gray-200 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
    <div className="flex flex-col sm:flex-row">
      <div className="w-full sm:w-1/3 mb-4 sm:mb-0 pr-0 sm:pr-6">
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className="w-full sm:w-2/3">
        {children}
      </div>
    </div>
  </div>
);

interface FormRowProps {
  label: string;
  htmlFor: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

const FormRow = ({ label, htmlFor, description, required, error, children }: FormRowProps) => (
  <div className="mb-4 last:mb-0">
    <div className="flex flex-col sm:flex-row sm:items-start">
      <label 
        htmlFor={htmlFor} 
        className="block text-sm font-medium text-gray-700 sm:w-1/3 sm:pt-1 mb-1 sm:mb-0"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="sm:w-2/3">
        {children}
        {description && (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        )}
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  </div>
);

interface ResponsiveFormProps {
  onSubmit: (e: React.FormEvent) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ResponsiveForm({
  onSubmit,
  title,
  description,
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onCancel,
  isLoading = false,
  className = '',
}: ResponsiveFormProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>}
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      )}
      
      <div className="space-y-6">
        {children}
      </div>
      
      <div className="pt-5 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export { FormSection, FormRow }; 