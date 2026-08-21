import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { mockStore } from '@/lib/supabase/mock-store';
import { Delivery, Rating } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RatingModal } from '@/components/rating/RatingModal';
import {
  PackageCheck,
  Star,
  MapPin,
  Clock,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Bike,
  Search,
  Filter,
} from 'lucide-react';
import { formatDateTime, getStatusBadgeProps } from '@/lib/utils';

export const CustomerHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingDelivery, setRatingDelivery] = useState<Delivery | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadData = () => {
      if (!user) return;
      setDeliveries(mockStore.getDeliveries().filter((d) => d.customer_id === user.id));
      setRatings(mockStore.getRatings());
    };
    loadData();
    const unsubscribe = mockStore.subscribe(loadData);
    return () => unsubscribe();
  }, [user?.id]);

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch =
      !search ||
      d.order_reference.toLowerCase().includes(search.toLowerCase()) ||
      d.dropoff_address.toLowerCase().includes(search.toLowerCase()) ||
      d.pickup_address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user) return null;

  return (
    <div className="space-y-4 pb-16 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customer')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-primary p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Tracking</span>
        </button>
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Your Delivery History</h2>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ref or address…"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredDeliveries.length === 0 ? (
          <Card className="p-8 text-center text-muted">
            <PackageCheck className="w-10 h-10 text-primary/30 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">No past orders found.</p>
          </Card>
        ) : (
          filteredDeliveries.map((del) => {
            const rating = ratings.find((r) => r.delivery_id === del.id);
            const badgeProps = getStatusBadgeProps(del.status);

            return (
              <Card key={del.id} className="shadow-sm border border-gray-100 hover:border-primary/30 transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-primary">#{del.order_reference}</span>
                      {del.sap_byd_document_id && (
                        <span className="text-[11px] text-muted ml-2">SAP ByD: {del.sap_byd_document_id}</span>
                      )}
                    </div>
                    <Badge variant={del.status === 'delivered' ? 'success' : 'default'} className="text-[10px]">
                      {badgeProps.label}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-700 space-y-1">
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{del.dropoff_address}</span>
                    </p>
                    <p className="text-[11px] text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Created: {formatDateTime(del.created_at)}</span>
                    </p>
                  </div>

                  {/* Rider Info & Rating */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-800">
                      <Bike className="w-3.5 h-3.5 text-accent" />
                      <span>Rider: <strong>{del.rider?.full_name || 'Unassigned'}</strong></span>
                    </div>

                    {del.status === 'delivered' && (
                      <div>
                        {rating ? (
                          <div className="flex items-center gap-1 text-xs text-accent font-bold">
                            <Star className="w-3.5 h-3.5 fill-accent" />
                            <span>Rated {rating.stars} / 5</span>
                          </div>
                        ) : (
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => setRatingDelivery(del)}
                            className="text-[11px] font-bold py-1 h-7"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Rate Delivery
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {ratingDelivery && (
        <RatingModal
          isOpen={Boolean(ratingDelivery)}
          onClose={() => setRatingDelivery(null)}
          deliveryId={ratingDelivery.id}
          customerId={user.id}
          riderId={ratingDelivery.rider_id || 'b0000000-0000-0000-0000-000000000001'}
          riderName={ratingDelivery.rider?.full_name || 'Yawe Ivan'}
          orderReference={ratingDelivery.order_reference}
          onSubmitted={() => setRatingDelivery(null)}
        />
      )}
    </div>
  );
};
