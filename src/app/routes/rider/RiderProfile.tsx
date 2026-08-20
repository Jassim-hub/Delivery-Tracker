import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { mockStore } from '@/lib/supabase/mock-store';
import { Rider, Rating } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Bike, CheckCircle2, Award, Clock, HelpCircle, Shield } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel';

export const RiderProfile: React.FC = () => {
  const { user } = useAuth();
  const [rider, setRider] = useState<Rider | undefined>(undefined);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [showTutorialAgain, setShowTutorialAgain] = useState(false);

  const loadData = () => {
    if (!user) return;
    const r = mockStore.getRiderById(user.id);
    setRider(r);

    const rts = mockStore.getRatings(user.id);
    setRatings(rts);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = mockStore.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="space-y-5 pb-16 max-w-3xl mx-auto">
      {showTutorialAgain && (
        <OnboardingCarousel
          role="rider"
          userId={user.id}
          forceOpen={true}
          onFinished={() => setShowTutorialAgain(false)}
        />
      )}

      {/* Header Profile Card */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-800 text-white p-6 shadow-purple">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <img
            src={user.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
            alt={user.full_name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-accent shadow-md"
          />
          <div className="flex-1 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-bold">{user.full_name}</h2>
              <Badge variant="accent" className="font-bold text-xs self-center sm:self-auto">
                Verified Rider
              </Badge>
            </div>
            <p className="text-xs text-purple-200">{user.phone || '+256 772 123 456'}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-purple-200">
              <span className="flex items-center gap-1">
                <Bike className="w-3.5 h-3.5 text-accent" />
                {rider?.vehicle_type || 'Yamaha DT 125'} ({rider?.license_plate || 'UFE 234X'})
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl text-center border border-white/20">
            <div className="flex items-center justify-center gap-1 text-accent font-black text-2xl">
              <Star className="w-6 h-6 fill-accent text-accent" />
              <span>{rider?.avg_rating || '5.0'}</span>
            </div>
            <span className="text-[10px] text-purple-200 font-semibold uppercase tracking-wider">
              {ratings.length} Reviews
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4 text-center bg-white shadow-sm border border-gray-100">
          <div className="text-2xl font-black text-primary">{rider?.total_deliveries || 142}</div>
          <div className="text-[11px] font-semibold text-muted uppercase mt-0.5">Total Deliveries</div>
        </Card>
        <Card className="p-4 text-center bg-white shadow-sm border border-gray-100">
          <div className="text-2xl font-black text-emerald-600">98.4%</div>
          <div className="text-[11px] font-semibold text-muted uppercase mt-0.5">On-Time Rate</div>
        </Card>
        <Card className="p-4 text-center bg-white shadow-sm border border-gray-100 col-span-2 sm:col-span-1">
          <div className="text-2xl font-black text-accent">100%</div>
          <div className="text-[11px] font-semibold text-muted uppercase mt-0.5">Handover Compliance</div>
        </Card>
      </div>

      {/* Customer Reviews & Feedback Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-accent" />
          <span>Customer Reviews & Feedback ({ratings.length})</span>
        </h3>

        {ratings.length === 0 ? (
          <Card className="p-6 text-center text-muted">
            <p className="text-xs">No customer ratings yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {ratings.map((rate) => (
              <Card key={rate.id} className="p-4 shadow-sm border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-accent">
                      {[...Array(rate.stars)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-accent" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      {rate.customer?.full_name || 'Verified Customer'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted">{formatDateTime(rate.created_at)}</span>
                </div>

                {rate.comment && (
                  <p className="text-xs text-gray-700 italic">"{rate.comment}"</p>
                )}

                {rate.tags && rate.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {rate.tags.map((tag) => (
                      <Badge key={tag} variant="primary" className="text-[10px] py-0 px-2">
                        ✓ {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* App Guidance & Tutorial Reset */}
      <Card className="p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-gray-900">Rider Onboarding Guide</h4>
            <p className="text-[11px] text-muted">Review delivery lifecycle instructions and procedures</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTutorialAgain(true)}
            className="text-xs font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            Replay Tutorial
          </Button>
        </div>
      </Card>
    </div>
  );
};
