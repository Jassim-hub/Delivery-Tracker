import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { mockStore } from '@/lib/supabase/mock-store';
import { useToast } from '@/components/ui/Toast';
import { Delivery, Rider } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bike,
  Power,
  MapPin,
  Clock,
  Package,
  ArrowRight,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Navigation,
  MessageSquare,
  Star,
  FileText,
} from 'lucide-react';
import { formatDistance, formatDateTime, getStatusBadgeProps } from '@/lib/utils';
import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel';

export const RiderDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [riderInfo, setRiderInfo] = useState<Rider | undefined>(undefined);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    // Bug 4 fix: fetch logic lives inside the effect so it always has a fresh
    // reference to `user` — no stale closure possible.
    const fetchRiderData = () => {
      if (!user) return;
      const info = mockStore.getRiderById(user.id);
      setRiderInfo(info);
      const allDeliveries = mockStore.getDeliveries();
      setDeliveries(allDeliveries);
    };

    fetchRiderData();
    const unsubscribe = mockStore.subscribe(fetchRiderData);
    return () => unsubscribe();
  }, [user?.id]);

  const toggleOnline = () => {
    if (!user || !riderInfo) return;
    setIsUpdatingStatus(true);
    const newStatus = !riderInfo.is_online;
    mockStore.setRiderOnlineStatus(user.id, newStatus);
    setIsUpdatingStatus(false);
  };

  // Find active delivery currently in progress for this rider
  const activeDelivery = deliveries.find(
    (d) => d.rider_id === user?.id && ['accepted', 'picked_up', 'in_transit'].includes(d.status)
  );

  // Deliveries assigned to this rider waiting acceptance
  const assignedDeliveries = deliveries.filter(
    (d) => d.rider_id === user?.id && d.status === 'assigned'
  );

  // Open queue pending deliveries
  const openQueueDeliveries = deliveries.filter(
    (d) => d.status === 'pending'
  );

  const handleAcceptDelivery = (deliveryId: string) => {
    if (!user) return;
    const del = deliveries.find((d) => d.id === deliveryId);
    mockStore.updateDeliveryStatus(deliveryId, 'accepted', user.id, 'Accepted by rider');
    toast(`Accepted order ${del?.order_reference ?? ''} — navigate to pickup ✓`);
    navigate(`/rider/active/${deliveryId}`);
  };

  const handleDeclineDelivery = (deliveryId: string) => {
    if (!user) return;
    const del = deliveries.find((d) => d.id === deliveryId);
    mockStore.updateDeliveryStatus(deliveryId, 'pending', user.id, 'Declined by rider, returned to dispatch queue');
    toast(`Order ${del?.order_reference ?? ''} returned to queue`, 'info');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)_240px] gap-x-0 gap-y-5 pb-28 sm:pb-12">
      <aside className="border-r border-sky-900/15 pr-4 bg-white/25 backdrop-blur-md min-h-full">
        {user && <OnboardingCarousel role="rider" userId={user.id} />}
      </aside>

      <main className="pl-4 md:pl-6 md:border-r border-sky-900/15">

      {/* Active Delivery Alert Banner (If in progress) */}
      {activeDelivery && (
        <Card className="border-2 border-orange-300 bg-orange-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-accent animate-ping" />
                  <Badge variant="accent" className="font-bold text-xs uppercase">
                    Active Delivery In Progress
                  </Badge>
                  <span className="text-xs font-mono font-bold text-gray-700">
                    #{activeDelivery.order_reference}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Dropoff: {activeDelivery.dropoff_address}</span>
                </h3>
                <p className="text-xs text-muted">
                  Recipient: <span className="font-semibold text-gray-800">{activeDelivery.customer?.full_name}</span> ({activeDelivery.customer?.phone})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => navigate(`/rider/active/${activeDelivery.id}`)}
                  className="font-bold text-xs w-full md:w-auto"
                >
                  <Navigation className="w-4 h-4 mr-1.5" />
                  Open Live Route & Action
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Deliveries Waiting Acceptance */}
      {assignedDeliveries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-accent" />
              <span>Direct Assignments Waiting Acceptance ({assignedDeliveries.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedDeliveries.map((del) => (
              <Card key={del.id} className="border border-primary/20 shadow-card hover:border-primary transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary font-mono">{del.order_reference}</span>
                    <Badge variant="primary" className="text-[10px]">Direct Assignment</Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-gray-900 mt-1">
                    {del.pickup_address}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-700 min-w-[50px]">Dropoff:</span>
                      <span className="text-gray-900">{del.dropoff_address}</span>
                    </div>
                    {del.delivery_notes && (
                      <div className="flex items-start gap-2 text-muted">
                        <span className="font-semibold min-w-[50px]">Note:</span>
                        <span>{del.delivery_notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAcceptDelivery(del.id)}
                      className="flex-1 font-bold text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Accept Order
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeclineDelivery(del.id)}
                      className="text-xs text-red-700 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Open Dispatch Queue (Available Deliveries) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Available Open Queue ({openQueueDeliveries.length})</span>
          </h3>
          <span className="text-xs text-muted">Available for pickup</span>
        </div>

        {openQueueDeliveries.length === 0 ? (
          <Card className="p-8 text-center text-muted">
            <Package className="w-10 h-10 text-primary/30 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">No open deliveries in queue right now.</p>
            <p className="text-[11px]">New orders synced from SAP ByD will appear here in real time.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openQueueDeliveries.map((del) => (
              <Card key={del.id} className="border border-gray-200 shadow-sm hover:shadow-card transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-primary">{del.order_reference}</span>
                    <Badge variant="warning" className="text-[10px]">Open Queue</Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-gray-900 mt-1">
                    {del.pickup_address}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-0">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong className="text-gray-700">To:</strong> {del.dropoff_address}</p>
                    {del.sap_byd_document_id && (
                      <p className="text-[11px] text-muted flex items-center gap-1">
                        <FileText className="w-3 h-3 text-blue-700" />
                        <span>SAP ByD: {del.sap_byd_document_id}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAcceptDelivery(del.id)}
                      className="w-full font-bold text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Claim & Accept Delivery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-md border-t border-gray-200 p-2 pb-safe-bottom sm:hidden flex items-center justify-around">
        <button
          onClick={() => navigate('/rider')}
          className="flex flex-col items-center gap-0.5 text-primary text-[10px] font-bold"
        >
          <Bike className="w-5 h-5" />
          <span>Queue</span>
        </button>
        {activeDelivery && (
          <button
            onClick={() => navigate(`/rider/active/${activeDelivery.id}`)}
            className="flex flex-col items-center gap-0.5 text-accent text-[10px] font-bold"
          >
            <Navigation className="w-5 h-5" />
            <span>Active</span>
          </button>
        )}
        <button
          onClick={() => navigate('/rider/chat')}
          className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-primary text-[10px] font-medium"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => navigate('/rider/profile')}
          className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-primary text-[10px] font-medium"
        >
          <Star className="w-5 h-5" />
          <span>Ratings</span>
        </button>
      </div>
      </main>
      <aside className="hidden md:block bg-white/25 backdrop-blur-md pl-4">
        {/* Rider Status Bar Card */}
        <div className="rounded-2xl bg-orange-200 text-gray-900 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                  alt={user?.full_name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white/40 shadow-sm"
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-primary ${
                    riderInfo?.is_online ? 'bg-emerald-400' : 'bg-gray-400'
                  }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{user?.full_name}</h2>
                  <Badge variant="accent" className="text-[10px] py-0 px-2 font-bold">
                    ★ {riderInfo?.avg_rating || '5.0'}
                  </Badge>
                </div>
                <p className="text-xs text-orange-900 mt-0.5">
                  {riderInfo?.vehicle_type || 'Motorcycle'} • Plate: {riderInfo?.license_plate || 'UFE 234X'}
                </p>
                <p className="text-[11px] text-orange-900">
                  Completed Deliveries: <span className="font-bold text-gray-900">{riderInfo?.total_deliveries || 0}</span>
                </p>
              </div>
            </div>

            {/* Online / Offline Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleOnline}
                disabled={isUpdatingStatus}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 ${
                  riderInfo?.is_online
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/30'
                    : 'bg-orange-50 hover:bg-orange-100 text-orange-900'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{riderInfo?.is_online ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
