export * from './database.types';

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export interface RouteInfo {
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  durationSeconds: number;
  polylinePoints: GeoLocation[];
  estimatedArrival: string;
}

export interface SAPSyncResult {
  success: boolean;
  importedCount: number;
  updatedCount: number;
  timestamp: string;
  documentIds: string[];
  rawPayload?: any;
  error?: string;
}

export interface QuickFilterOption {
  label: string;
  value: string;
  count?: number;
}
