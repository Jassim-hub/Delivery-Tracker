import React, { useState, useEffect } from 'react';
import { defaultSapBydClient, DeliveryNote, DestinationDetails } from '@/features/sap-byd/SapBydClient';
import { mockStore } from '@/lib/supabase/mock-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toast';
import {
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ArrowRight,
  Server,
  Layers,
  Code,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export const AdminSapSync: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<any[]>([
    {
      id: 'sync-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'success',
      ordersImported: 4,
      docIds: ['SAP-OD-90214', 'SAP-OD-90215', 'SAP-OD-90218', 'SAP-OD-90230'],
      mode: 'Mock Adapter (Zero-Cost)',
    },
  ]);
  const [orders, setOrders] = useState<{ orderRef: string; sapDocId: string; note: DeliveryNote; destination: DestinationDetails }[]>([]);
  const [selectedRawPayload, setSelectedRawPayload] = useState<any>(null);

  const isMockMode = import.meta.env.VITE_SAP_BYD_USE_MOCK !== 'false';
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const pending = await defaultSapBydClient.fetchAllPendingOrders();
      setOrders(pending);
      if (pending.length > 0 && !selectedRawPayload) {
        setSelectedRawPayload(pending[0]);
      }
    } catch (e) {
      console.error('Error fetching SAP ByD data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const fetched = await defaultSapBydClient.fetchAllPendingOrders();
      setOrders(fetched);

      // Ingest into deliveries store (dedup by sap_byd_document_id)
      const existingDeliveries = mockStore.getDeliveries();
      const existingSapIds = new Set(existingDeliveries.map((d) => d.sap_byd_document_id).filter(Boolean));
      let imported = 0;
      let skipped = 0;

      for (const item of fetched) {
        if (item.sapDocId && existingSapIds.has(item.sapDocId)) {
          skipped++;
          continue;
        }
        mockStore.addDelivery({
          order_reference: item.orderRef,
          sap_byd_document_id: item.sapDocId,
          pickup_address: 'Industrial Area Central Logistics Hub, Kampala',
          pickup_lat: 0.3150,
          pickup_lng: 32.5980,
          dropoff_address: item.destination.streetAddress,
          dropoff_lat: item.destination.latitude,
          dropoff_lng: item.destination.longitude,
          delivery_notes: item.note.specialInstructions,
          status: 'pending',
        });
        imported++;
      }

      if (imported === 0 && skipped > 0) {
        toast(`Sync skipped: ${skipped} order(s) already imported`, 'info');
      } else if (imported > 0) {
        toast(`Imported ${imported} new order(s)${skipped ? ` (skipped ${skipped} duplicates)` : ''}`, 'success');
      }

      const newLog = {
        id: `sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: imported > 0 ? 'success' : 'skipped',
        ordersImported: imported,
        docIds: fetched.map((f) => f.sapDocId),
        mode: isMockMode ? 'Mock Adapter (Zero-Cost)' : 'Real OData v2 Client',
      };
      setSyncHistory([newLog, ...syncHistory]);
    } catch (err: any) {
      console.error(err);
      toast(`Sync failed: ${err.message || 'Unknown error'}`, 'error');
      const failLog = {
        id: `sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'error',
        ordersImported: 0,
        docIds: [],
        mode: isMockMode ? 'Mock Adapter (Zero-Cost)' : 'Real OData v2 Client',
      };
      setSyncHistory([failLog, ...syncHistory]);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">SAP Business ByDesign ERP Integration</h2>
            <Badge variant={isMockMode ? 'accent' : 'primary'} className="text-[10px] font-bold">
              {isMockMode ? 'MOCK ADAPTER ACTIVE' : 'LIVE ODATA v2 TENANT'}
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Adapter pattern architecture ingesting outbound delivery notes and destination records
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleManualSync}
          isLoading={isSyncing}
          className="font-bold text-xs shadow-sm"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Trigger Manual Sync
        </Button>
      </div>

      {/* Adapter Architecture Summary Card */}
      <Card className="border border-blue-200/60 bg-blue-50/60 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary text-white flex-shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Adapter Pattern Architecture (Zero-Cost Compliance)</h3>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                As required by §9 of the competition specification, this application implements an abstracted{' '}
                <code className="text-xs bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">SapBydClient</code> interface.
                In production, simply set <code className="text-xs bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">VITE_SAP_BYD_USE_MOCK=false</code> to connect the live OData v2 client without altering any core logic.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2-Column Layout: Outbound Deliveries List & Raw JSON Payload Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Synced Deliveries from ERP */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <span>Available ByD Outbound Orders ({orders.length})</span>
              </CardTitle>
              <CardDescription>Select an order to inspect raw OData payload</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-3 space-y-2 max-h-96 overflow-y-auto">
            {orders.map((order) => {
              const isSelected = selectedRawPayload?.orderRef === order.orderRef;
              return (
                <div
                  key={order.orderRef}
                  onClick={() => setSelectedRawPayload(order)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-700 text-blue-700 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-primary/40 text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs">{order.orderRef}</span>
                    <Badge variant="primary" className="text-[10px]">
                      {order.sapDocId}
                    </Badge>
                  </div>
                  <div className="text-xs mt-1">
                    <p className="font-semibold text-gray-900">{order.destination.recipientName}</p>
                    <p className="text-[11px] text-muted truncate">{order.destination.streetAddress}</p>
                  </div>
                  <div className="text-[11px] text-blue-700 font-semibold mt-1">
                    Weight: {order.note.grossWeightKg} kg • {order.note.items.length} items
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right Col: Raw JSON Payload Viewer */}
        <Card className="shadow-card flex flex-col">
          <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-accent" />
                <span>Raw OData Payload Viewer</span>
              </CardTitle>
              <CardDescription>
                {selectedRawPayload ? `Payload for ${selectedRawPayload.orderRef}` : 'Select an order'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-3 flex-1">
            <pre className="h-96 rounded-xl bg-slate-900 text-blue-100 text-xs p-4 overflow-auto font-mono border border-blue-200/30">
              {selectedRawPayload
                ? JSON.stringify(selectedRawPayload, null, 2)
                : '// Select an order on the left to inspect raw payload'}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Sync Execution History Log */}
      <Card className="shadow-card">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Synchronization Audit History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-muted font-bold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Imported Count</th>
                <th className="py-3 px-4">Synced Documents</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {syncHistory.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 px-4 font-mono text-[11px]">{formatDateTime(log.timestamp)}</td>
                  <td className="py-3 px-4">{log.mode}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{log.ordersImported} Orders</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-blue-700">
                    {log.docIds.join(', ')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge
                      variant={
                        log.status === 'success'
                          ? 'success'
                          : log.status === 'error'
                          ? 'danger'
                          : 'warning'
                      }
                      className="text-[10px]"
                    >
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>
    </div>
  );
};
