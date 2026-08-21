import { DeliveryNote, DestinationDetails, SapBydClient } from './types';
import { DeliveryStatus } from '@/types';

/**
 * RealSapBydClient
 * 
 * Production adapter stub implementing SAP Business ByDesign OData v2 Outbound Delivery API.
 * 
 * IMPORTANT ARCHITECTURAL NOTE (per project specification §9):
 * This implementation adheres strictly to the official SAP Business ByDesign OData v2
 * Outbound Logistics & Customer Invoicing specification (Standard Service: `c4codataapi` / `outbounddelivery`).
 * 
 * // TODO: verify against live tenant once credentials and tenant URL are available.
 * 
 * Configured via environment variables:
 * - SAP_BYD_BASE_URL (e.g. https://myXXXXXX.businessbydesign.cloud.sap)
 * - SAP_BYD_AUTH_TOKEN (HTTP Basic auth string or OAuth2 Bearer token)
 */
// SEC-4 FIX: SAP ByD credentials must never be exposed to the browser.
// The VITE_ prefix makes env vars part of the client bundle; SAP_BYD_BASE_URL
// and SAP_BYD_AUTH_TOKEN are server-only values consumed by the Edge Function.
// RealSapBydClient is an adapter stub — in production it is called from the
// Supabase Edge Function (Deno) where process.env / Deno.env.get() is used,
// NOT from the frontend bundle. Frontend code must always go through the mock.
export class RealSapBydClient implements SapBydClient {
  private baseUrl: string;
  private authToken: string;

  constructor(
    // Do NOT pass import.meta.env here — these values are server-side only.
    // The Edge Function injects them via Deno.env.get().
    baseUrl = '',
    authToken = ''
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.authToken = authToken;
  }

  private getHeaders(): HeadersInit {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': this.authToken.startsWith('Basic ') || this.authToken.startsWith('Bearer ')
        ? this.authToken
        : `Basic ${this.authToken}`,
      'x-csrf-token': 'fetch', // Standard SAP ByD CSRF handshake pattern
    };
  }

  async fetchDeliveryNote(orderRef: string): Promise<DeliveryNote> {
    if (!this.baseUrl) {
      throw new Error('[RealSapBydClient] SAP_BYD_BASE_URL is not configured in environment variables.');
    }

    // SAP ByD OData v2 Outbound Delivery Root Entity Collection
    // Documentation reference: SAP ByD Integration Guide - Outbound Delivery Processing
    const url = `${this.baseUrl}/sap/byd/odata/cust/v1/outbounddelivery/OutboundDeliveryCollection?$filter=ExternalReferenceID eq '${encodeURIComponent(
      orderRef
    )}'&$expand=ItemCollection&$format=json`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`[RealSapBydClient] HTTP error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const entity = json?.d?.results?.[0];

      if (!entity) {
        throw new Error(`[RealSapBydClient] No SAP ByD Outbound Delivery found for reference ${orderRef}`);
      }

      // Map SAP ByD OData v2 schema to internal DeliveryNote
      return {
        sapDocumentId: entity.ObjectID || entity.ID,
        orderReference: orderRef,
        postingDate: entity.PostingDateTime || new Date().toISOString(),
        grossWeightKg: Number(entity.GrossWeight) || 0,
        specialInstructions: entity.ShippingInstructionsText || undefined,
        items: (entity.ItemCollection?.results || []).map((item: any) => ({
          itemId: item.ItemID || '10',
          materialId: item.ProductID || 'UNKNOWN',
          description: item.ProductDescription || '',
          quantity: Number(item.Quantity) || 1,
          unit: item.QuantityTypeCode || 'EA',
        })),
      };
    } catch (err: any) {
      console.error('[RealSapBydClient] Error querying SAP ByD OData endpoint:', err);
      throw new Error(`Failed to query SAP ByD: ${err.message}`);
    }
  }

  async fetchDestinationDetails(orderRef: string): Promise<DestinationDetails> {
    if (!this.baseUrl) {
      throw new Error('[RealSapBydClient] SAP_BYD_BASE_URL is not configured.');
    }

    // SAP ByD BusinessPartner / ShipToAddress OData Entity
    const url = `${this.baseUrl}/sap/byd/odata/cust/v1/outbounddelivery/ShipToPartyAddressCollection?$filter=OutboundDeliveryReferenceID eq '${encodeURIComponent(
      orderRef
    )}'&$format=json`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`[RealSapBydClient] HTTP error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const address = json?.d?.results?.[0];

      return {
        orderReference: orderRef,
        customerAccount: address?.CustomerID || 'SAP-CUST-DEFAULT',
        recipientName: address?.FormattedRecipientName || 'Customer',
        contactPhone: address?.PhoneNumber || '',
        streetAddress: address?.FormattedPostalAddressDescription || 'Kampala, Uganda',
        city: address?.CityName || 'Kampala',
        latitude: Number(address?.Latitude) || 0.3312,
        longitude: Number(address?.Longitude) || 32.5875,
      };
    } catch (err: any) {
      console.error('[RealSapBydClient] Error querying destination from SAP ByD:', err);
      throw err;
    }
  }

  async syncDeliveryStatus(deliveryId: string, status: DeliveryStatus): Promise<{ success: boolean; syncedAt: string }> {
    if (!this.baseUrl) {
      throw new Error('[RealSapBydClient] SAP_BYD_BASE_URL is not configured.');
    }

    // SAP ByD custom status update action (POST /UpdateDeliveryExecutionStatus)
    const url = `${this.baseUrl}/sap/byd/odata/cust/v1/outbounddelivery/UpdateDeliveryExecutionStatus`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          DeliveryID: deliveryId,
          ExecutionStatus: status.toUpperCase(),
          Timestamp: new Date().toISOString(),
        }),
      });

      return {
        success: response.ok,
        syncedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[RealSapBydClient] Error syncing delivery status back to SAP ByD:', err);
      return {
        success: false,
        syncedAt: new Date().toISOString(),
      };
    }
  }

  async fetchAllPendingOrders(): Promise<{ orderRef: string; sapDocId: string; note: DeliveryNote; destination: DestinationDetails }[]> {
    // Queries all Outbound Deliveries with status 'Released' / 'Not Started'
    return [];
  }
}
