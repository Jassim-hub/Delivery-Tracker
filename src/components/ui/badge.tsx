import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'danger' | 'warning' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
    primary: 'bg-blue-700 text-white border-blue-700',
    accent: 'bg-accent-light dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700 font-semibold',
    success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 font-medium',
    danger: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700 font-medium',
    warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 font-medium',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent',
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