import React, { useState } from 'react';
import { GeoLocation } from '@/types';
import {
  calculateHaversineDistance,
  calculateEstimatedDurationSeconds,
  generateGoogleMapsNavigationUrl,
} from '@/lib/maps/geo-utils';
import { formatDistance, formatDuration } from '@/lib/utils';
import { MapPin, Navigation, ExternalLink, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface DeliveryTrackingMapProps {
  riderLocation: GeoLocation;
  pickupLocation: { lat: number; lng: number; address?: string };
  dropoffLocation: { lat: number; lng: number; address?: string };
  riderName?: string;
  status?: string;
  className?: string;
  height?: string;
}

export const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  riderLocation,
  pickupLocation,
  dropoffLocation,
  riderName = 'Rider',
  status = 'in_transit',
  className = '',
  height = '380px',
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Calculate real-time distance and ETA
  const targetLocation = status === 'assigned' || status === 'accepted' ? pickupLocation : dropoffLocation;
  const distanceMeters = calculateHaversineDistance(
    riderLocation.lat,
    riderLocation.lng,
    targetLocation.lat,
    targetLocation.lng
  );
  const etaSeconds = calculateEstimatedDurationSeconds(
    riderLocation.lat,
    riderLocation.lng,
    targetLocation.lat,
    targetLocation.lng
  );

  // Normalize coordinates to bounding box percentages (0-100%) for SVG Canvas rendering
  const minLat = Math.min(riderLocation.lat, pickupLocation.lat, dropoffLocation.lat) - 0.008;
  const maxLat = Math.max(riderLocation.lat, pickupLocation.lat, dropoffLocation.lat) + 0.008;
  const minLng = Math.min(riderLocation.lng, pickupLocation.lng, dropoffLocation.lng) - 0.008;
  const maxLng = Math.max(riderLocation.lng, pickupLocation.lng, dropoffLocation.lng) + 0.008;

  const latRange = Math.max(0.001, maxLat - minLat);
  const lngRange = Math.max(0.001, maxLng - minLng);

  // SVG coordinate mapper
  const toX = (lng: number) => {
    const raw = ((lng - minLng) / lngRange) * 100;
    return 10 + (raw * 0.8);
  };

  const toY = (lat: number) => {
    // Latitude is inverted in SVG (higher lat = lower Y)
    const raw = ((maxLat - lat) / latRange) * 100;
    return 10 + (raw * 0.8);
  };

  const riderX = toX(riderLocation.lng);
  const riderY = toY(riderLocation.lat);
  const pickupX = toX(pickupLocation.lng);
  const pickupY = toY(pickupLocation.lat);
  const dropoffX = toX(dropoffLocation.lng);
  const dropoffY = toY(dropoffLocation.lat);

  const googleMapsUrl = generateGoogleMapsNavigationUrl(
    targetLocation.lat,
    targetLocation.lng,
    targetLocation.address
  );

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-orange-50 border border-orange-200 shadow-card ${className}`}
      style={{ height }}
    >
      {/* Interactive Map Visualizer */}
      <svg
        className="w-full h-full transition-transform duration-300 select-none"
        style={{ transform: `scale(${zoomLevel})` }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Street Grid Pattern */}
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Map Background */}
        <rect width="100%" height="100%" fill="#9A3412" />
        <rect width="100%" height="100%" fill="url(#grid)" />
        <circle cx="50" cy="50" r="45" fill="#0C4A6E" opacity="0.35" />

        {/* Road networks simulation */}
        <path
          d={`M ${pickupX - 20} ${pickupY + 15} Q ${pickupX} ${pickupY} ${riderX} ${riderY} T ${dropoffX + 15} ${dropoffY - 10}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1.2"
        />
        <path
          d={`M 0 50 Q 30 40 50 60 T 100 45`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="0.8"
        />

        {/* Route Line (Rider to Target) */}
        <line
          x1={riderX}
          y1={riderY}
          x2={targetLocation === pickupLocation ? pickupX : dropoffX}
          y2={targetLocation === pickupLocation ? pickupY : dropoffY}
          stroke="#38BDF8"
          strokeWidth="1.8"
          strokeDasharray="2 1.5"
          className="animate-pulse"
        />

        {/* Pickup Pin */}
        <g transform={`translate(${pickupX}, ${pickupY})`} className="cursor-pointer">
          <circle r="3.5" fill="#1E9E64" opacity="0.3" className="animate-ping" />
          <circle r="2.2" fill="#1E9E64" stroke="#FFFFFF" strokeWidth="0.6" />
          <text y="-3.5" fontSize="2.8" fill="#A7F3D0" fontWeight="bold" textAnchor="middle">
            Pickup Hub
          </text>
        </g>

        {/* Dropoff Pin */}
        <g transform={`translate(${dropoffX}, ${dropoffY})`} className="cursor-pointer">
          <circle r="4" fill="#60A5FA" opacity="0.3" className="animate-ping" />
          <circle r="2.5" fill="#60A5FA" stroke="#FFFFFF" strokeWidth="0.6" />
          <text y="-4" fontSize="2.8" fill="#DBEAFE" fontWeight="bold" textAnchor="middle">
            Destination
          </text>
        </g>

        {/* Live Rider Marker */}
        <g transform={`translate(${riderX}, ${riderY})`} className="transition-all duration-700 ease-out">
          {/* Animated radar rings */}
          <circle r="6" fill="#F5A623" opacity="0.2" className="animate-ping-slow" />
          <circle r="3.2" fill="#F5A623" stroke="#FFFFFF" strokeWidth="0.8" />
          <circle r="1.2" fill="#1A1A1A" />
          <text y="-4.5" fontSize="3" fill="#F5A623" fontWeight="bold" textAnchor="middle">
            🏍️ {riderName.split(' ')[0]}
          </text>
        </g>
      </svg>

      {/* Floating Info Overlay (Distance, ETA & Status) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-orange-100/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-orange-300 shadow-lg text-orange-950">
          <div className="flex flex-col">
            <span className="text-[10px] text-accent font-bold uppercase tracking-wider">Live ETA</span>
            {/* Bug 9 fix: was text-white on a light orange background — invisible */}
            <span className="text-sm font-extrabold text-orange-950">
              {formatDuration(etaSeconds)} ({formatDistance(distanceMeters)})
            </span>
          </div>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-gray-900 px-3 py-2 rounded-xl font-bold text-xs shadow-gold transition-all duration-150 hover:scale-105 active:scale-95"
          title="Open route in Google Maps Navigation"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Navigate</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Map Control Tools (Recenter, Zoom) */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        <button
          onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.25))}
          className="bg-surface/90 hover:bg-white text-gray-900 p-2 rounded-lg shadow-md border border-gray-200 transition-all hover:scale-105 active:scale-95"
          title="Zoom In"
          aria-label="Zoom in map"
        >
          <ZoomIn className="w-4 h-4 text-primary" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
          className="bg-surface/90 hover:bg-white text-gray-900 p-2 rounded-lg shadow-md border border-gray-200 transition-all hover:scale-105 active:scale-95"
          title="Zoom Out"
          aria-label="Zoom out map"
        >
          <ZoomOut className="w-4 h-4 text-primary" />
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          className="bg-surface/90 hover:bg-white text-gray-900 p-2 rounded-lg shadow-md border border-gray-200 transition-all hover:scale-105 active:scale-95"
          title="Reset View"
          aria-label="Reset map view"
        >
          <Compass className="w-4 h-4 text-accent" />
        </button>
      </div>

      {/* Live Coordinate Ticker */}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] text-gray-300 font-mono flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>GPS: {riderLocation.lat.toFixed(4)}, {riderLocation.lng.toFixed(4)}</span>
      </div>
    </div>
  );
};
