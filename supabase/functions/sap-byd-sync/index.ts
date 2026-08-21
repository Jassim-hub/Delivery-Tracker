// Deno / Supabase Edge Function: sap-byd-sync
// Syncs Outbound Logistics delivery notes from SAP Business ByDesign into public.deliveries

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// SEC-5 FIX: Restrict CORS to the known frontend origin instead of wildcard (*).
// Set ALLOWED_ORIGIN in Supabase Edge Function secrets for production.
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'http://localhost:5173';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // SEC-5 FIX: Require a valid caller JWT (anon or service role) via the
  // Authorization header. Unauthenticated requests are rejected with 401.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing Authorization header.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    );
  }

  try {
    // Create client with user's JWT for auth verification
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );

    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Now create admin client with service role for DB operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // SEC-6 FIX: Edge Functions run in Deno — they do NOT use the VITE_ prefix.
    // The correct key is SAP_BYD_USE_MOCK (set via `supabase secrets set`).
    const useMock = Deno.env.get('SAP_BYD_USE_MOCK') !== 'false';
    const sapBaseUrl = Deno.env.get('SAP_BYD_BASE_URL') || '';
    const sapAuthToken = Deno.env.get('SAP_BYD_AUTH_TOKEN') || '';

    const syncedItems = [];

    if (useMock) {
      // Mock Sync payload
      const mockDeliveries = [
        {
          order_reference: `ORD-${new Date().getFullYear()}-${Math.floor(8800 + Math.random() * 200)}`,
          sap_byd_document_id: `SAP-OD-${Math.floor(90200 + Math.random() * 100)}`,
          pickup_address: 'Industrial Area Central Warehouse, 7th Street, Kampala',
          pickup_lat: 0.3150,
          pickup_lng: 32.5980,
          dropoff_address: 'Plot 14 Acacia Avenue, Kololo, Kampala',
          dropoff_lat: 0.3312,
          dropoff_lng: 32.5875,
          delivery_notes: 'Temperature-controlled medical supplies. Handover verification required.',
          status: 'pending',
          estimated_delivery_at: new Date(Date.now() + 45 * 60000).toISOString(),
        }
      ];

      // Upsert into deliveries table
      for (const item of mockDeliveries) {
        // Find a customer id
        const { data: customers } = await adminClient
          .from('profiles')
          .select('id')
          .eq('role', 'customer')
          .limit(1);

        const customerId = customers?.[0]?.id;
        if (customerId) {
          const { data, error } = await adminClient
            .from('deliveries')
            .upsert({ ...item, customer_id: customerId }, { onConflict: 'order_reference' })
            .select();

          if (!error && data) {
            syncedItems.push(data[0]);
          }
        }
      }
    } else {
      // Real SAP ByD OData Fetch
      const response = await fetch(`${sapBaseUrl}/sap/byd/odata/cust/v1/outbounddelivery/OutboundDeliveryCollection?$format=json`, {
        headers: {
          'Authorization': `Basic ${sapAuthToken}`,
          'Accept': 'application/json',
        }
      });
      const data = await response.json();
      // Process OData entities...
      syncedItems.push(...(data?.d?.results || []));
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: syncedItems.length,
        synced: syncedItems,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});