'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

interface FormToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function FormToggle({ checked, onCheckedChange, label, disabled }: FormToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <SwitchPrimitives.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-blue-600' : 'bg-gray-200'
        )}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </SwitchPrimitives.Root>
      {label && (
        <label className="text-sm text-gray-700">{label}</label>
      )}
    </div>
  );
} 