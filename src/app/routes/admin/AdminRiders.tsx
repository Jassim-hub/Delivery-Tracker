import React, { useState, useEffect } from 'react';
import { mockStore } from '@/lib/supabase/mock-store';
import { Rider } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bike, Star, CheckCircle2, Power, PhoneCall, Shield } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export const AdminRiders: React.FC = () => {
  const [riders, setRiders] = useState<Rider[]>([]);

  const loadData = () => {
    setRiders(mockStore.getRiders());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = mockStore.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleToggleOnline = (userId: string, currentStatus: boolean) => {
    mockStore.setRiderOnlineStatus(userId, !currentStatus);
  };

  return (
    <div className="space-y-5 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rider Fleet Management</h2>
          <p className="text-xs text-muted">Active couriers, live online state, vehicle specs, and performance ratings</p>
        </div>
        <Badge variant="primary" className="text-xs font-bold py-1">
          {riders.filter((r) => r.is_online).length} of {riders.length} Online
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {riders.map((rider) => (
          <Card key={rider.user_id} className="shadow-card border border-gray-100 hover:border-primary/30 transition-all">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={rider.profile?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                    alt={rider.profile?.full_name}
                    className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{rider.profile?.full_name}</h3>
                    <p className="text-xs text-muted">{rider.profile?.phone}</p>
                  </div>
                </div>

                <Badge
                  variant={rider.is_online ? 'success' : 'default'}
                  className="text-[10px] font-bold uppercase"
                >
                  {rider.is_online ? '● Online' : 'Offline'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-muted uppercase font-bold block">Rating</span>
                  <div className="flex items-center gap-1 font-bold text-accent">
                    <Star className="w-3.5 h-3.5 fill-accent" />
                    <span>{rider.avg_rating} / 5.0</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase font-bold block">Deliveries</span>
                  <span className="font-bold text-gray-900">{rider.total_deliveries} Done</span>
                </div>
              </div>

              <div className="text-xs text-gray-700 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-primary" />
                  <span>{rider.vehicle_type || 'Motorcycle'} • Plate: <strong>{rider.license_plate || 'UFE 234X'}</strong></span>
                </div>
                <div className="text-[11px] text-muted">
                  Last GPS ping: {rider.last_location_at ? formatDateTime(rider.last_location_at) : 'Active now'}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Button
                  variant={rider.is_online ? 'outline' : 'success'}
                  size="sm"
                  onClick={() => handleToggleOnline(rider.user_id, rider.is_online)}
                  className="text-xs font-bold py-1 h-8"
                >
                  <Power className="w-3 h-3 mr-1" />
                  {rider.is_online ? 'Set Offline' : 'Set Online'}
                </Button>

                <a
                  href={`tel:${rider.profile?.phone || '+256772123456'}`}
                  className="btn-primary text-xs font-semibold py-1.5 px-3 h-8"
                >
                  <PhoneCall className="w-3.5 h-3.5 mr-1" />
                  Call
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
