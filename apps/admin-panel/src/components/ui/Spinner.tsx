import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const spinnerVariants = cva(
  'animate-spin text-gray-400',
  {
    variants: {
      size: {
        default: 'h-4 w-4',
        sm: 'h-3 w-3',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

export function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      <Loader2 className={spinnerVariants({ size })} />
    </div>
  );
} 