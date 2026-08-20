import { useState, useEffect, useRef } from 'react';
import { GeoLocation } from '@/types';

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  enableSimulationIfDesktop?: boolean;
  targetDestination?: { lat: number; lng: number } | null;
  speedMultiplier?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    enableSimulationIfDesktop = true,
    targetDestination,
    speedMultiplier = 1,
  } = options;

  const [location, setLocation] = useState<GeoLocation>({
    lat: 0.3235,
    lng: 32.5855,
    accuracy: 10,
    heading: 45,
    speed: 6.5,
    timestamp: Date.now(),
  });
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const simStepRef = useRef<number>(0);

  useEffect(() => {
    let watchId: number | null = null;
    let simInterval: any = null;

    // Check if Geolocation is available
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          });
          setError(null);
          setIsSimulating(false);
        },
        (err) => {
          console.warn('Native geolocation failed or denied, using simulated route progression:', err.message);
          setError(err.message);

          if (enableSimulationIfDesktop) {
            startSimulation();
          }
        },
        {
          enableHighAccuracy,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    } else if (enableSimulationIfDesktop) {
      startSimulation();
    }

    function startSimulation() {
      setIsSimulating(true);
      const startLat = 0.3150;
      const startLng = 32.5980;
      const destLat = targetDestination?.lat || 0.3312;
      const destLng = targetDestination?.lng || 32.5875;

      simInterval = setInterval(() => {
        simStepRef.current = (simStepRef.current + 1) % 100;
        const progress = simStepRef.current / 100;

        // Smooth wave path toward destination
        const lat = startLat + (destLat - startLat) * progress + Math.sin(progress * Math.PI * 4) * 0.0008;
        const lng = startLng + (destLng - startLng) * progress + Math.cos(progress * Math.PI * 4) * 0.0008;

        setLocation({
          lat,
          lng,
          accuracy: 5,
          heading: 35,
          speed: 6.2 * speedMultiplier,
          timestamp: Date.now(),
        });
      }, 3000);
    }

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (simInterval) {
        clearInterval(simInterval);
      }
    };
  }, [enableHighAccuracy, enableSimulationIfDesktop, targetDestination?.lat, targetDestination?.lng, speedMultiplier]);

  return { location, error, isSimulating };
}
