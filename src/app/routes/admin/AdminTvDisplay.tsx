import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockStore } from '@/lib/supabase/mock-store';
import { Delivery, Rider } from '@/types';
import {
  Tv,
  Bike,
  Clock,
  Truck,
  CheckCircle2,
  MapPin,
  ArrowLeft,
  Shield,
  Activity,
} from 'lucide-react';
import { formatTimeOnly, formatDateTime } from '@/lib/utils';

export const AdminTvDisplay: React.FC = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const loadData = () => {
    setDeliveries(mockStore.getDeliveries());
    setRiders(mockStore.getRiders());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = mockStore.subscribe(() => {
      loadData();
    });

    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(clockTimer);
    };
  }, []);

  const onlineRiders = riders.filter((r) => r.is_online);
  const inTransitDeliveries = deliveries.filter((d) => ['in_transit', 'picked_up'].includes(d.status));
  const pendingDeliveries = deliveries.filter((d) => d.status === 'pending');
  const deliveredList = deliveries.filter((d) => d.status === 'delivered');

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 select-none flex flex-col justify-between">
      {/* Wallboard Header */}
      <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-2.5 rounded-xl bg-blue-900/40 hover:bg-blue-800 text-blue-100 transition-all"
            title="Exit TV Board"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center font-black text-accent text-lg shadow-sm">
              DT
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide text-white uppercase flex items-center gap-2">
                <span>Fleet Dispatch Wallboard</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-mono">
                  LIVE TELEMETRY
                </span>
              </h1>
              <p className="text-xs text-blue-100 font-mono">
                Kampala Central Logistics Operations Hub • SAP ByD Sync Active
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Clock */}
        <div className="text-right font-mono">
          <div className="text-3xl font-black text-accent tracking-widest">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-xs text-blue-100">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* KPI Stats Ticker */}
      <div className="grid grid-cols-4 gap-4 my-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-blue-800/40 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-blue-100 uppercase">
            <span>Online Riders</span>
            <Bike className="w-5 h-5 text-accent" />
          </div>
          <div className="text-4xl font-black text-white mt-1">
            {onlineRiders.length} <span className="text-sm font-normal text-blue-300">/ {riders.length}</span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-blue-800/40 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-blue-100 uppercase">
            <span>Active In-Transit</span>
            <Truck className="w-5 h-5 text-blue-300" />
          </div>
          <div className="text-4xl font-black text-accent mt-1">{inTransitDeliveries.length}</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-blue-800/40 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-blue-100 uppercase">
            <span>Pending Dispatch</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-4xl font-black text-amber-400 mt-1">{pendingDeliveries.length}</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-blue-800/40 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-blue-100 uppercase">
            <span>Completed Today</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-4xl font-black text-emerald-400 mt-1">{deliveredList.length}</div>
        </div>
      </div>

      {/* Main Wallboard Center: Map + Live Active Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 my-2">
        {/* Large Central Ops Map */}
        <div className="lg:col-span-2 bg-slate-950 rounded-3xl border border-blue-800/40 p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              Real-Time GPS Fleet Radar
            </span>
            <span className="text-xs text-blue-100 font-mono">12s Broadcast Pulse</span>
          </div>

          <div className="relative flex-1 rounded-2xl bg-slate-950 overflow-hidden border border-blue-900/60">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="tvGrid" width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M 6 0 L 0 0 0 6" fill="none" stroke="rgba(29, 78, 216, 0.2)" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#tvGrid)" />

              {/* Kampala Radar Circles */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(245, 166, 35, 0.15)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(245, 166, 35, 0.2)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(245, 166, 35, 0.25)" strokeWidth="0.5" />

              {/* Online Riders with Radar Beacons */}
              {onlineRiders.map((r, i) => (
                <g key={r.user_id} transform={`translate(${30 + i * 22}, ${35 + i * 18})`}>
                  <circle r="6" fill="#F5A623" opacity="0.25" className="animate-ping-slow" />
                  <circle r="3" fill="#F5A623" stroke="#FFFFFF" strokeWidth="0.8" />
                  <text y="-4" fontSize="3" fill="#F5A623" fontWeight="bold" textAnchor="middle">
                    🏍️ {r.profile?.full_name?.split(' ')[0]}
                  </text>
                </g>
              ))}

              {/* Destination Hubs */}
              <g transform="translate(75, 25)">
                <circle r="3" fill="#60A5FA" stroke="#FFFFFF" strokeWidth="0.8" />
                <text y="-4" fontSize="2.8" fill="#DBEAFE" textAnchor="middle">
                  Kololo Hub
                </text>
              </g>
              <g transform="translate(25, 75)">
                <circle r="3" fill="#60A5FA" stroke="#FFFFFF" strokeWidth="0.8" />
                <text y="6" fontSize="2.8" fill="#DBEAFE" textAnchor="middle">
                  Central Hub
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Live Delivery Stream Board */}
        <div className="bg-slate-950 rounded-3xl border border-blue-800/40 p-4 flex flex-col space-y-3">
          <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
            Active Deliveries Board
          </span>

          <div className="space-y-2.5 overflow-y-auto max-h-[440px] pr-1">
            {deliveries.slice(0, 5).map((del) => (
              <div
                key={del.id}
                className="p-3 rounded-2xl bg-slate-900 border border-blue-900/60 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-accent">#{del.order_reference}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      del.status === 'in_transit'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : del.status === 'delivered'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-100 border border-blue-500/30'
                    }`}
                  >
                    {del.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs font-semibold text-white truncate">{del.dropoff_address}</p>

                <div className="flex items-center justify-between text-[11px] text-blue-100 pt-1 border-t border-blue-900/40 font-mono">
                  <span>Rider: {del.rider?.full_name || 'Unassigned'}</span>
                  <span>{formatTimeOnly(del.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="pt-3 border-t border-blue-900/40 flex items-center justify-between text-xs text-blue-100 font-mono">
        <span>Delivery Tracker Pro • Unattended Display Mode</span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          WebSocket Realtime: CONNECTED
        </span>
      </div>
    </div>
  );
};
