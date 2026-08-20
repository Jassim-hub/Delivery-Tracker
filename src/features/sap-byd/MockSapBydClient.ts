import { DeliveryNote, DestinationDetails, SapBydClient } from './types';
import { DeliveryStatus } from '@/types';
import fixtureData from './fixtures/delivery-notes.json';

export class MockSapBydClient implements SapBydClient {
  private artificialDelayMs: number;

  constructor(delayMs = 600) {
    this.artificialDelayMs = delayMs;
  }

  private async simulateNetworkDelay(): Promise<void> {
    if (this.artificialDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.artificialDelayMs));
    }
  }

  async fetchDeliveryNote(orderRef: string): Promise<DeliveryNote> {
    await this.simulateNetworkDelay();
    const entry = fixtureData.find(
      (item) => item.orderRef.toLowerCase() === orderRef.toLowerCase() || item.sapDocId.toLowerCase() === orderRef.toLowerCase()
    );

    if (entry) {
      return entry.note as DeliveryNote;
    }

    // Dynamic fallback for newly generated order refs
    return {
      sapDocumentId: `SAP-OD-${Math.floor(90000 + Math.random() * 9999)}`,
      orderReference: orderRef,
      postingDate: new Date().toISOString(),
      grossWeightKg: 2.0,
      specialInstructions: 'Standard ByD ERP Outbound Logistics delivery parcel.',
      items: [
        {
          itemId: '10',
          materialId: 'GEN-SUP-001',
          description: 'Standard Logistics Outbound Parcel',
          quantity: 1,
          unit: 'EA',
        },
      ],
    };
  }

  async fetchDestinationDetails(orderRef: string): Promise<DestinationDetails> {
    await this.simulateNetworkDelay();
    const entry = fixtureData.find(
      (item) => item.orderRef.toLowerCase() === orderRef.toLowerCase() || item.sapDocId.toLowerCase() === orderRef.toLowerCase()
    );

    if (entry) {
      return entry.destination as DestinationDetails;
    }

    return {
      orderReference: orderRef,
      customerAccount: 'CUST-GEN-99',
      recipientName: 'Valued Client',
      contactPhone: '+256 700 000 000',
      streetAddress: 'Kampala Business District, Uganda',
      city: 'Kampala',
      latitude: 0.3138,
      longitude: 32.5815,
    };
  }

  async syncDeliveryStatus(deliveryId: string, status: DeliveryStatus): Promise<{ success: boolean; syncedAt: string }> {
    await this.simulateNetworkDelay();
    console.log(`[MockSapBydClient] Successfully synced status '${status}' for delivery '${deliveryId}' back to ERP Outbound Delivery document.`);
    return {
      success: true,
      syncedAt: new Date().toISOString(),
    };
  }

  async fetchAllPendingOrders(): Promise<Array<{ orderRef: string; sapDocId: string; note: DeliveryNote; destination: DestinationDetails }>> {
    await this.simulateNetworkDelay();
    return fixtureData as Array<{ orderRef: string; sapDocId: string; note: DeliveryNote; destination: DestinationDetails }>;
  }
}
