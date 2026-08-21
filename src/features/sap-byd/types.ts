import { DeliveryStatus } from '@/types';

export interface SapDeliveryItem {
  itemId: string;
  materialId: string;
  description: string;
  quantity: number;
  unit: string;
}

export interface DeliveryNote {
  sapDocumentId: string;
  orderReference: string;
  postingDate: string;
  grossWeightKg: number;
  items: SapDeliveryItem[];
  specialInstructions?: string;
}

export interface DestinationDetails {
  orderReference: string;
  customerAccount: string;
  recipientName: string;
  contactPhone: string;
  streetAddress: string;
  city: string;
  latitude: number;
  longitude: number;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
}

export interface SapBydClient {
  fetchDeliveryNote(orderRef: string): Promise<DeliveryNote>;
  fetchDestinationDetails(orderRef: string): Promise<DestinationDetails>;
  syncDeliveryStatus(deliveryId: string, status: DeliveryStatus): Promise<{ success: boolean; syncedAt: string }>;
  fetchAllPendingOrders(): Promise<{ orderRef: string; sapDocId: string; note: DeliveryNote; destination: DestinationDetails }[]>;
}
