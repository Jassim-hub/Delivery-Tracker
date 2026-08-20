import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'danger' | 'warning' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    primary: 'bg-blue-700 text-white border-blue-700',
    accent: 'bg-accent-light text-amber-900 border-amber-300 font-semibold',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 font-medium',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
    outline: 'border border-gray-300 text-gray-700 bg-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
