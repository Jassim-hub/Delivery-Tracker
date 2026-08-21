import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { mockStore } from '@/lib/supabase/mock-store';
import { Delivery, DeliveryStatus, Rider, DeliveryStatusHistory } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  Package,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  Bike,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { formatDateTime, getStatusBadgeProps } from '@/lib/utils';

export const AdminDeliveries: React.FC = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Detail Modal
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryStatusHistory[]>([]);
  const [reassignRiderId, setReassignRiderId] = useState('');

  // FIX BUG 2: define loadData inside the effect so it always captures the
  // latest closed-over variables and satisfies react-hooks/exhaustive-deps.
  useEffect(() => {
    const loadData = () => {
      setDeliveries(mockStore.getDeliveries());
      setRiders(mockStore.getRiders());
    };
    loadData();
    const unsubscribe = mockStore.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const openDetail = (del: Delivery) => {
    setSelectedDelivery(del);
    const hist = mockStore.getStatusHistory(del.id);
    setDeliveryHistory(hist);
    setReassignRiderId(del.rider_id || '');
  };

  const handleManualReassign = () => {
    if (!selectedDelivery || !reassignRiderId || !user) return;
    mockStore.assignDeliveryToRider(selectedDelivery.id, reassignRiderId, user.id);
    setSelectedDelivery(null);
  };

  const handleCancelDelivery = () => {
    if (!selectedDelivery || !user) return;
    if (window.confirm(`Are you sure you want to cancel order #${selectedDelivery.order_reference}?`)) {
      mockStore.updateDeliveryStatus(selectedDelivery.id, 'cancelled', user.id, 'Cancelled by Admin Dispatcher');
      mockStore.addAuditLog(user.id, 'CANCEL_DELIVERY', 'deliveries', selectedDelivery.id);
      setSelectedDelivery(null);
    }
  };

  // FIX BUG 9: guard against null/undefined full_name before calling .toLowerCase()
  const filteredDeliveries = deliveries.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      d.order_reference.toLowerCase().includes(q) ||
      d.dropoff_address.toLowerCase().includes(q) ||
      (d.customer?.full_name ?? '').toLowerCase().includes(q) ||
      (d.rider?.full_name ?? '').toLowerCase().includes(q) ||
      (d.sap_byd_document_id?.toLowerCase().includes(q) ?? false);

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Delivery Orders Management</h2>
          <p className="text-xs text-muted">Complete dispatch ledger, manual overrides, and audit trails</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="text-xs font-bold py-1">
            Total: {deliveries.length} Records
          </Badge>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, client, address, or SAP ByD doc ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-gray-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl px-3 py-2 bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary text-gray-900 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Deliveries Data Table */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-0">
      <section className="border-r border-sky-900/15 pr-4 bg-white/25 backdrop-blur-md">
      <Card className="shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50/80 text-[11px] uppercase tracking-wider text-muted font-bold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">SAP ByD ID</th>
                <th className="py-3 px-4">Destination Address</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Assigned Rider</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    No delivery orders matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((del) => {
                  const badgeProps = getStatusBadgeProps(del.status);
                  return (
                    <tr key={del.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        #{del.order_reference}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-blue-700">
                        {del.sap_byd_document_id || '--'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate font-medium text-gray-900">{del.dropoff_address}</div>
                      </td>
                      <td className="py-3 px-4">{del.customer?.full_name || '--'}</td>
                      <td className="py-3 px-4">
                        {del.rider ? (
                          <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                            <Bike className="w-3.5 h-3.5 text-accent" />
                            <span>{del.rider.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={del.status === 'delivered' ? 'success' : del.status === 'pending' ? 'warning' : 'primary'}
                          className="text-[10px]"
                        >
                          {badgeProps.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetail(del)}
                          className="text-[11px] py-1 h-7 px-2.5 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-primary" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      </section>
      <section className="pl-4 bg-white/25 backdrop-blur-md" aria-hidden="true" />
      </div>

      {/* Delivery Detail Drawer Modal */}
      {selectedDelivery && (
        <Dialog
          isOpen={Boolean(selectedDelivery)}
          onClose={() => setSelectedDelivery(null)}
          title={`Delivery #${selectedDelivery.order_reference}`}
          description={`Created ${formatDateTime(selectedDelivery.created_at)}`}
          maxWidth="lg"
        >
          <div className="space-y-4 pt-2">
            {/* Status & ERP Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">Status:</span>
                <Badge variant="accent" className="capitalize text-xs font-bold">
                  {selectedDelivery.status.replace('_', ' ')}
                </Badge>
              </div>
              {selectedDelivery.sap_byd_document_id && (
                <span className="text-xs font-mono font-bold text-primary">
                  ERP Document ID: {selectedDelivery.sap_byd_document_id}
                </span>
              )}
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-muted uppercase tracking-wider block mb-1">Pickup Location</span>
                <p className="font-semibold text-gray-900">{selectedDelivery.pickup_address}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-muted uppercase tracking-wider block mb-1">Dropoff Destination</span>
                <p className="font-semibold text-gray-900">{selectedDelivery.dropoff_address}</p>
              </div>
            </div>

            {/* Reassignment / Override Section */}
            <div className="p-3.5 rounded-xl border border-primary/20 bg-surface space-y-2">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-accent" />
                Dispatcher Override & Reassignment
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={reassignRiderId}
                  onChange={(e) => setReassignRiderId(e.target.value)}
                  className="flex-1 text-xs rounded-xl p-2 bg-gray-50 border border-gray-200 text-gray-900 font-medium"
                >
                  <option value="">Select Rider to Assign / Reassign...</option>
                  {riders.map((r) => (
                    <option key={r.user_id} value={r.user_id}>
                      {r.profile?.full_name} ({r.is_online ? 'Online' : 'Offline'}) - ★{r.avg_rating}
                    </option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleManualReassign}
                  disabled={!reassignRiderId}
                  className="font-bold text-xs"
                >
                  Apply Reassignment
                </Button>
              </div>
            </div>

            {/* Timeline History */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Status History Audit Trail</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {deliveryHistory.map((h) => (
                  <div key={h.id} className="p-2.5 rounded-lg bg-gray-50 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-primary capitalize">{h.status.replace('_', ' ')}</span>
                      <p className="text-[11px] text-muted">{h.note}</p>
                    </div>
                    <span className="text-[10px] text-muted font-mono">{formatDateTime(h.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelDelivery}
                className="text-xs font-bold"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Cancel Delivery Order
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDelivery(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
