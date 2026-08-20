import { describe, it, expect } from 'vitest';
import { MockSapBydClient } from '@/features/sap-byd/MockSapBydClient';

describe('SAP Business ByDesign Adapter Layer', () => {
  const client = new MockSapBydClient(0); // 0ms delay for fast unit tests

  it('fetches delivery note fixture data matching order reference', async () => {
    const note = await client.fetchDeliveryNote('ORD-2026-8801');
    expect(note.sapDocumentId).toBe('SAP-OD-90214');
    expect(note.orderReference).toBe('ORD-2026-8801');
    expect(note.items.length).toBeGreaterThan(0);
    expect(note.grossWeightKg).toBe(3.8);
  });

  it('fetches destination details matching delivery address and coordinates', async () => {
    const destination = await client.fetchDestinationDetails('ORD-2026-8801');
    expect(destination.recipientName).toBe('Grace Tumusiime');
    expect(destination.streetAddress).toContain('Acacia Avenue');
    expect(destination.latitude).toBeCloseTo(0.3312, 3);
    expect(destination.longitude).toBeCloseTo(32.5875, 3);
  });

  it('syncs delivery execution status back to ERP Outbound document', async () => {
    const result = await client.syncDeliveryStatus('d0000000-0000-0000-0000-000000000001', 'delivered');
    expect(result.success).toBe(true);
    expect(result.syncedAt).toBeDefined();
  });

  it('retrieves all pending ByD outbound orders for bulk dispatch sync', async () => {
    const all = await client.fetchAllPendingOrders();
    expect(all.length).toBeGreaterThanOrEqual(4);
    expect(all[0].orderRef).toBe('ORD-2026-8801');
  });
});
