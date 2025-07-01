import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'bg-gray-100 text-gray-800 hover:bg-gray-200/80',
        destructive:
          'bg-red-100 text-red-800 hover:bg-red-200/80',
        outline:
          'border border-gray-200 bg-white text-gray-800 hover:bg-gray-100',
        success:
          'bg-green-100 text-green-800 hover:bg-green-200/80',
        warning:
          'bg-yellow-100 text-yellow-800 hover:bg-yellow-200/80',
        info:
          'bg-blue-100 text-blue-800 hover:bg-blue-200/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
} 