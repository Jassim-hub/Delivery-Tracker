import { useEffect, useRef, useState } from 'react';
import { GeoLocation } from '@/types';
import { shouldBroadcastLocation } from '@/lib/maps/geo-utils';
import { mockStore } from '@/lib/supabase/mock-store';
import { supabase, isUsingMockBackend } from '@/lib/supabase/client';

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

  useEffect(() => {
    if (!riderUserId || !isOnline) return;

    const { lat, lng } = currentLocation;
    const shouldBroadcast = shouldBroadcastLocation(
      lat,
      lng,
      lastLatRef.current,
      lastLngRef.current,
      lastTimeRef.current,
      12000, // 12 seconds minimum interval
      25     // 25 meters minimum movement
    );

    if (shouldBroadcast) {
      lastLatRef.current = lat;
      lastLngRef.current = lng;
      lastTimeRef.current = Date.now();
      const now = new Date();
      setLastBroadcastAt(now);
      setBroadcastCount((c) => c + 1);

      // Perform throttled broadcast write
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
  }, [riderUserId, currentLocation.lat, currentLocation.lng, isOnline]);

  return { lastBroadcastAt, broadcastCount };
}
