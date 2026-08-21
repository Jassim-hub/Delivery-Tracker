import { GeoLocation } from '@/types';

/**
 * Calculates the Haversine distance between two coordinates in meters.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks if a location update should be broadcast according to §8 throttling rules:
 * Broadcast if:
 * 1. Elapsed time >= minIntervalMs (default 12,000ms / 12s) OR
 * 2. Distance moved >= minDistanceMeters (default 25m)
 */
export function shouldBroadcastLocation(
  currentLat: number,
  currentLng: number,
  lastBroadcastLat: number | null,
  lastBroadcastLng: number | null,
  lastBroadcastTime: number,
  minIntervalMs = 12000,
  minDistanceMeters = 25
): boolean {
  if (lastBroadcastLat === null || lastBroadcastLng === null || lastBroadcastTime === 0) {
    return true;
  }

  const elapsed = Date.now() - lastBroadcastTime;
  if (elapsed >= minIntervalMs) {
    return true;
  }

  const distanceMoved = calculateHaversineDistance(
    lastBroadcastLat,
    lastBroadcastLng,
    currentLat,
    currentLng
  );

  return distanceMoved >= minDistanceMeters;
}

/**
 * Calculates estimated time of arrival (ETA) based on average motorcycle speed in urban traffic (~24 km/h / 6.67 m/s)
 * with a 1.25 urban curvature factor for straight-line estimation.
 */
export function calculateEstimatedDurationSeconds(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  speedMps = 6.67
): number {
  const straightDistance = calculateHaversineDistance(lat1, lng1, lat2, lng2);
  const roadDistanceEstimate = straightDistance * 1.35; // urban factor
  return Math.max(60, Math.round(roadDistanceEstimate / speedMps));
}

/**
 * Generates an external Google Maps turn-by-turn navigation deep-link.
 *
 * FIX BUG 8: The Maps Directions URL only honours `destination` — it accepts
 * either a place name or a lat,lng pair.  When we have an address string we
 * pass it as the destination value directly so Maps resolves it to the right
 * place.  The `destination_name` parameter is not a valid Directions API field
 * and was previously silently ignored.
 */
export function generateGoogleMapsNavigationUrl(
  destinationLat: number,
  destinationLng: number,
  destinationName?: string
): string {
  // Prefer human-readable address when available so Maps shows the name in UI.
  const destination = destinationName
    ? encodeURIComponent(destinationName)
    : `${destinationLat},${destinationLng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

/**
 * Interpolates points along a straight line for fallback map polyline animation
 */
export function interpolateCoordinates(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  steps = 20
): { lat: number; lng: number }[] {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const factor = i / steps;
    // Add slight curve for realism
    const curveOffset = Math.sin(factor * Math.PI) * 0.002;
    points.push({
      lat: start.lat + (end.lat - start.lat) * factor + curveOffset,
      lng: start.lng + (end.lng - start.lng) * factor - curveOffset,
    });
  }
  return points;
}
