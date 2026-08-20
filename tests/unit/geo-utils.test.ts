import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistance,
  shouldBroadcastLocation,
  calculateEstimatedDurationSeconds,
} from '@/lib/maps/geo-utils';
import { formatDistance, formatDuration } from '@/lib/utils';

describe('Geo & GPS Utilities', () => {
  it('calculates accurate distance between coordinates (Kampala to Kololo)', () => {
    // 0.3150, 32.5980 (Industrial Area) to 0.3312, 32.5875 (Kololo)
    const distance = calculateHaversineDistance(0.3150, 32.5980, 0.3312, 32.5875);
    expect(distance).toBeGreaterThan(2000);
    expect(distance).toBeLessThan(2600);
  });

  it('formats distance into human-readable meters and kilometers', () => {
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(2400)).toBe('2.4 km');
  });

  it('formats duration into minutes and hours', () => {
    expect(formatDuration(45)).toBe('45 sec');
    expect(formatDuration(900)).toBe('15 min');
    expect(formatDuration(3900)).toBe('1h 5m');
  });

  it('enforces throttling rules per §8 (only broadcast if elapsed >=12s OR distance >=25m)', () => {
    const now = Date.now();

    // Case 1: Initial broadcast (no previous coordinates) -> Should broadcast
    expect(shouldBroadcastLocation(0.32, 32.58, null, null, 0)).toBe(true);

    // Case 2: Minimal movement (2 meters) and only 2 seconds elapsed -> Should NOT broadcast
    const smallLat = 0.32001;
    const smallLng = 32.58001;
    expect(
      shouldBroadcastLocation(smallLat, smallLng, 0.32, 32.58, now - 2000, 12000, 25)
    ).toBe(false);

    // Case 3: Significant movement (>25 meters) even if only 3 seconds elapsed -> Should broadcast
    const largeLat = 0.3205; // ~55 meters away
    const largeLng = 32.5805;
    expect(
      shouldBroadcastLocation(largeLat, largeLng, 0.32, 32.58, now - 3000, 12000, 25)
    ).toBe(true);

    // Case 4: No movement but elapsed time >=12 seconds -> Should broadcast
    expect(
      shouldBroadcastLocation(0.32, 32.58, 0.32, 32.58, now - 13000, 12000, 25)
    ).toBe(true);
  });

  it('calculates realistic ETA based on motorcycle urban velocity', () => {
    const duration = calculateEstimatedDurationSeconds(0.3150, 32.5980, 0.3312, 32.5875);
    expect(duration).toBeGreaterThan(300); // at least 5 minutes
    expect(duration).toBeLessThan(1200); // under 20 minutes
  });
});
