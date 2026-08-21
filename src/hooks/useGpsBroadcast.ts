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

  // FIX BUG 4: capture isOnline in a ref so the callback stays stable across
  // isOnline toggles — the interval no longer restarts when availability changes.
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;

  const riderUserIdRef = useRef(riderUserId);
  riderUserIdRef.current = riderUserId;

  // Stable callback — no deps that change on every toggle.
  const attemptBroadcast = useCallback(() => {
    if (!riderUserIdRef.current || !isOnlineRef.current) return;
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
        mockStore.updateRiderLocation(riderUserIdRef.current, lat, lng);
      } else {
        supabase
          .from('riders')
          .update({
            current_lat: lat,
            current_lng: lng,
            last_location_at: now.toISOString(),
          })
          .eq('user_id', riderUserIdRef.current)
          .then(({ error }) => {
            if (error) console.error('Error broadcasting GPS update to Supabase:', error);
          });
      }
    }
  }, []); // empty deps — all mutable state via refs

  // Fire immediately when coordinates change (displacement threshold).
  useEffect(() => {
    attemptBroadcast();
  }, [currentLocation.lat, currentLocation.lng, attemptBroadcast]);

  // Single long-lived interval — only recreated when the rider changes identity.
  useEffect(() => {
    const timer = setInterval(attemptBroadcast, BROADCAST_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [riderUserId, attemptBroadcast]);

  return { lastBroadcastAt, broadcastCount };
}
