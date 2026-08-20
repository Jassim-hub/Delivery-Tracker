import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '--';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTimeOnly(isoString?: string | null): string {
  if (!isoString) return '--';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getStatusBadgeProps(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case 'pending':
      return { bg: 'bg-amber-100 border-amber-200', text: 'text-amber-800', label: 'Pending Dispatch' };
    case 'assigned':
      return { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-800', label: 'Assigned to Rider' };
    case 'accepted':
      return { bg: 'bg-indigo-100 border-indigo-200', text: 'text-indigo-800', label: 'Accepted by Rider' };
    case 'picked_up':
      return { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-800', label: 'Package Picked Up' };
    case 'in_transit':
      return { bg: 'bg-amber-500 text-white border-amber-600', text: 'text-white', label: 'In Transit 🚚' };
    case 'delivered':
      return { bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-800', label: 'Delivered ✅' };
    case 'failed':
      return { bg: 'bg-rose-100 border-rose-200', text: 'text-rose-800', label: 'Delivery Failed' };
    case 'cancelled':
      return { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-700', label: 'Cancelled' };
    default:
      return { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-800', label: status };
  }
}
