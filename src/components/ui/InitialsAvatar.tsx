import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface InitialsAvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm:  'w-7 h-7 text-[10px]',
  md:  'w-10 h-10 text-xs',
  lg:  'w-12 h-12 text-sm',
  xl:  'w-20 h-20 text-xl',
};

// Deterministic colour from name so the same person always gets the same colour
const COLOURS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-orange-500',
];

function colourFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOURS[Math.abs(hash) % COLOURS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const InitialsAvatar: React.FC<InitialsAvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const showImage = src && !imgFailed;
  const colour = colourFromName(name);
  const initials = getInitials(name);
  const sizeClass = SIZE_MAP[size];

  if (showImage) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgFailed(true)}
        className={cn('rounded-full object-cover', sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white flex-shrink-0',
        colour,
        sizeClass,
        className
      )}
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  );
};
