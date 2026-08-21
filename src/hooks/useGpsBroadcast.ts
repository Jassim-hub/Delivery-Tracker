import { useCallback, useEffect, useRef, useState } from 'react';
import { GeoLocation } from '@/types';
import { shouldBroadcastLocation } from '@/lib/maps/geo-utils';
import { mockStore } from '@/lib/supabase/mock-store';
import { supabase, isUsingMockBackend } from '@/lib/supabase/client';

const BROADCAST_INTERVAL_MS = 12000;
const BROADCAST_MIN_DISTANCE_M = 25;

export function useGpsBroadcast(
  riderUserId: string | null,
  currentLocation: GeoLocation,
  isOnline: boolean
) {
  const [lastBroadcastAt, setLastBroadcastAt] = useState<Date | null>(null);
  const [broadcastCount, setBroadcastCount] = useState<number>(0);

  const lastLatRef = useRef<number | null>(null);
  const lastLngRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  // Keep a stable ref to the current location so the interval can read it
  const locationRef = useRef<GeoLocation>(currentLocation);
  locationRef.current = currentLocation;

  const attemptBroadcast = useCallback(() => {
    if (!riderUserId || !isOnline) return;
    const { lat, lng } = locationRef.current;

    const shouldBroadcast = shouldBroadcastLocation(
      lat,
      lng,
      lastLatRef.current,
      lastLngRef.current,
      lastTimeRef.current,
      BROADCAST_INTERVAL_MS,
      BROADCAST_MIN_DISTANCE_M
    );

    if (shouldBroadcast) {
      lastLatRef.current = lat;
      lastLngRef.current = lng;
      lastTimeRef.current = Date.now();
      const now = new Date();
      setLastBroadcastAt(now);
      setBroadcastCount((c) => c + 1);

      if (isUsingMockBackend) {
        mockStore.updateRiderLocation(riderUserId, lat, lng);
      } else {
        supabase
          .from('riders')
          .update({
            current_lat: lat,
            current_lng: lng,
            last_location_at: now.toISOString(),
          })
          .eq('user_id', riderUserId)
          .then(({ error }) => {
            if (error) console.error('Error broadcasting GPS update to Supabase:', error);
          });
      }
    }
  }, [riderUserId, isOnline]);

  // Bug 6 fix: fire on coordinate change AND on a 12s timer so stationary
  // riders still send a heartbeat write even when GPS does not emit new events.
  useEffect(() => {
    attemptBroadcast();
  }, [currentLocation.lat, currentLocation.lng, attemptBroadcast]);

  useEffect(() => {
    if (!riderUserId || !isOnline) return;
    const timer = setInterval(attemptBroadcast, BROADCAST_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [riderUserId, isOnline, attemptBroadcast]);

  return { lastBroadcastAt, broadcastCount };
}
