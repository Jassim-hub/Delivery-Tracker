import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { mockStore } from '@/lib/supabase/mock-store';
import { Delivery, Rider, Profile } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Bike,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Tv,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  MapPin,
  FileText,
  UserCheck,
} from 'lucide-react';
import { formatDateTime, getStatusBadgeProps } from '@/lib/utils';
import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRiderForDispatch, setSelectedRiderForDispatch] = useState<string>('');

  const loadData = () => {
    const dels = mockStore.getDeliveries();
    const rds = mockStore.getRiders();
    setDeliveries(dels);
    setRiders(rds);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = mockStore.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const onlineRiders = riders.filter((r) => r.is_online);
  const pendingDeliveries = deliveries.filter((d) => d.status === 'pending');
  const inTransitDeliveries = deliveries.filter((d) => ['in_transit', 'picked_up'].includes(d.status));
  const deliveredToday = deliveries.filter((d) => d.status === 'delivered');

  const handleQuickAssign = (deliveryId: string, riderId: string) => {
    if (!user || !riderId) return;
    mockStore.assignDeliveryToRider(deliveryId, riderId, user.id);
  };

  return (
    <div className="space-y-6 pb-16">
      {user && <OnboardingCarousel role="admin" userId={user.id} />}

      {/* Header Banner with TV Display Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-orange-200 text-gray-900 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">Dispatch Command Center</h1>
            <Badge variant="accent" className="text-[10px] font-bold py-0.5">
              Live Fleet Ops
            </Badge>
          </div>
          <p className="text-xs text-orange-900 mt-1">
            Real-time telemetry, SAP ByD ERP sync status & fleet routing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="accent"
            size="sm"
            onClick={() => navigate('/admin/tv-display')}
            className="font-bold text-xs shadow-gold hover:scale-105 transition-transform"
          >
            <Tv className="w-4 h-4 mr-1.5" />
            Launch TV Ops Board
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/sap-sync')}
            className="bg-orange-50 border-orange-300 text-orange-900 hover:bg-orange-100 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            SAP ByD Sync
          </Button>
        </div>
      </div>

      {/* 4 Core KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 shadow-card border-l-4 border-l-primary bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Online Fleet</span>
            <Bike className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            {onlineRiders.length} <span className="text-xs font-normal text-muted">/ {riders.length} active</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Ready for dispatch
          </div>
        </Card>

        <Card className="p-5 shadow-card border-l-4 border-l-accent bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Pending Queue</span>
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            {pendingDeliveries.length}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            Awaiting rider assignment
          </div>
        </Card>

        <Card className="p-5 shadow-sm border-l-4 border-l-blue-700 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">In Transit</span>
            <Truck className="w-5 h-5 text-blue-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            {inTransitDeliveries.length}
          </div>
          <div className="text-[11px] text-blue-700 font-semibold mt-1">
            Live GPS telemetry active
          </div>
        </Card>

        <Card className="p-5 shadow-card border-l-4 border-l-emerald-500 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Completed</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            {deliveredToday.length}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            98.5% on-time delivery rate
          </div>
        </Card>
      </div>

      {/* Main Grid: Live Fleet Map & Quick Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-0">
        {/* Left 2 Cols: Live Fleet Status & Map */}
        <aside className="pr-4 space-y-4">
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Live Fleet Operations Map</span>
                </CardTitle>
                <CardDescription>
                  Showing active delivery corridors in Kampala Metro
                </CardDescription>
              </div>
              <Badge variant="primary" className="text-xs">
                {onlineRiders.length} Online Markers
              </Badge>
            </CardHeader>

            {/* Simulated Unified Fleet Map */}
            <div className="relative h-[min(65vh,680px)] min-h-[420px] bg-orange-950 p-4 text-white overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grid */}
                <pattern id="adminGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#adminGrid)" />

                {/* Major routes */}
                <path d="M 10 20 Q 50 40 90 30" fill="none" stroke="rgba(29, 78, 216, 0.5)" strokeWidth="1.5" />
                <path d="M 20 80 Q 50 60 80 90" fill="none" stroke="rgba(29, 78, 216, 0.5)" strokeWidth="1.5" />

                {/* Active Riders on Map */}
                {riders.map((r, i) => {
                  const x = 25 + (i * 25) + Math.sin(i) * 5;
                  const y = 30 + (i * 20) + Math.cos(i) * 5;
                  return (
                    <g key={r.user_id} transform={`translate(${x}, ${y})`}>
                      <circle r="4" fill={r.is_online ? '#F5A623' : '#6B6B7A'} opacity="0.3" className="animate-ping" />
                      <circle r="2.5" fill={r.is_online ? '#F5A623' : '#6B6B7A'} stroke="#FFFFFF" strokeWidth="0.6" />
                      <text y="-3.5" fontSize="2.8" fill="#F5A623" fontWeight="bold" textAnchor="middle">
                        🏍️ {r.profile?.full_name?.split(' ')[0]} ({r.is_online ? 'Online' : 'Off'})
                      </text>
                    </g>
                  );
                })}

                {/* Deliveries on Map */}
                {deliveries.slice(0, 3).map((d, i) => (
                  <g key={d.id} transform={`translate(${30 + i * 28}, ${45 + i * 15})`}>
                    <circle r="3" fill="#60A5FA" opacity="0.4" />
                    <circle r="1.8" fill="#60A5FA" stroke="#FFFFFF" strokeWidth="0.5" />
                    <text y="4" fontSize="2.4" fill="#DBEAFE" textAnchor="middle">
                      📦 #{d.order_reference.slice(-4)}
                    </text>
                  </g>
                ))}
              </svg>

              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px] text-gray-300 font-mono">
                Fleet GPS Refresh: Active (Throttled 12s / 25m)
              </div>
            </div>
          </Card>
        </aside>

        {/* Right Col: Quick Dispatch Queue */}
        <main className="border-r border-sky-900/15 px-4 space-y-4 bg-white/20 backdrop-blur-sm">
          <Card className="shadow-card">
            <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Quick Dispatch Queue
                </CardTitle>
                <CardDescription>Assign pending orders to available riders</CardDescription>
              </div>
              <Badge variant="warning" className="text-xs font-bold">
                {pendingDeliveries.length} Pending
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {pendingDeliveries.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-gray-700">All orders dispatched!</p>
                  <p className="text-[11px]">No orders currently waiting in queue.</p>
                </div>
              ) : (
                pendingDeliveries.map((del) => (
                  <div
                    key={del.id}
                    className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:border-primary/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-primary">#{del.order_reference}</span>
                      <span className="text-[10px] text-muted">{formatDateTime(del.created_at)}</span>
                    </div>

                    <div className="text-xs text-gray-700">
                      <p className="font-semibold text-gray-900 truncate">Dropoff: {del.dropoff_address}</p>
                      <p className="text-[11px] text-muted truncate">Client: {del.customer?.full_name}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <select
                        value={selectedRiderForDispatch}
                        onChange={(e) => setSelectedRiderForDispatch(e.target.value)}
                        className="flex-1 text-xs rounded-lg p-1.5 bg-white border border-gray-300 focus:outline-none focus:border-primary"
                      >
                        <option value="">Select Rider...</option>
                        {onlineRiders.map((r) => (
                          <option key={r.user_id} value={r.user_id}>
                            {r.profile?.full_name} (★{r.avg_rating})
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!selectedRiderForDispatch}
                        onClick={() => {
                          handleQuickAssign(del.id, selectedRiderForDispatch);
                          setSelectedRiderForDispatch('');
                        }}
                        className="text-xs font-bold px-3 py-1.5 h-8"
                      >
                        Dispatch
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </main>
        <aside className="hidden" aria-hidden="true" />
      </div>
    </div>
  );
};
