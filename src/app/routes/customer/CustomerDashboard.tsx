import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { mockStore } from '@/lib/supabase/mock-store';
import { Delivery, Rider } from '@/types';
import { DeliveryTrackingMap } from '@/components/map/DeliveryTrackingMap';
import { StatusStepper } from '@/components/deliveries/StatusStepper';
import { RatingModal } from '@/components/rating/RatingModal';
import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Bike,
  FileText,
  History,
  HelpCircle,
  X,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import confetti from 'canvas-confetti';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | undefined>(undefined);
  const [riderInfo, setRiderInfo] = useState<Rider | undefined>(undefined);

  // Rating Modal state
  const [ratingDelivery, setRatingDelivery] = useState<Delivery | null>(null);
  const [showTutorialAgain, setShowTutorialAgain] = useState(false);
  const [tutorialSlideIndex, setTutorialSlideIndex] = useState(0);

  const customerTutorialSlides = [
    {
      title: 'Real-Time Delivery Tracking',
      description:
        'Watch your rider approach in real time on an interactive live map with precise ETA countdowns and visual status progression.',
      badge: 'Live Tracking',
      icon: MapPin,
    },
    {
      title: 'Direct Rider Communication',
      description:
        'Send instant messages or click-to-call your assigned rider directly through the encrypted communication channel.',
      badge: 'Instant Chat',
      icon: MessageSquare,
    },
    {
      title: 'One-Tap "Received" & Rating',
      description:
        'Confirm package delivery with one tap once your rider arrives, and rate your delivery experience with quick tag feedback.',
      badge: 'Receipt & Rating',
      icon: Sparkles,
    },
  ] as const;

  const currentTutorialSlide = customerTutorialSlides[tutorialSlideIndex];
  const CurrentTutorialIcon = currentTutorialSlide.icon;

  const loadData = () => {
    if (!user) return;
    const all = mockStore.getDeliveries().filter((d) => d.customer_id === user.id);
    setDeliveries(all);

    // Active in-transit or assigned delivery
    const active = all.find((d) => ['pending', 'assigned', 'accepted', 'picked_up', 'in_transit'].includes(d.status));
    setActiveDelivery(active);

    if (active?.rider_id) {
      const r = mockStore.getRiderById(active.rider_id);
      setRiderInfo(r);
    }

    // Check for recently completed delivery needing rating
    const unrated = all.find((d) => d.status === 'delivered' && !mockStore.getRatingForDelivery(d.id));
    if (unrated && !ratingDelivery && !sessionStorage.getItem(`dt_rating_prompted_${unrated.id}`)) {
      sessionStorage.setItem(`dt_rating_prompted_${unrated.id}`, 'true');
      setRatingDelivery(unrated);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = mockStore.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [user?.id]);

  const handleConfirmReceived = () => {
    if (!activeDelivery || !user) return;

    mockStore.confirmReceipt(
      activeDelivery.id,
      'customer_app',
      user.id,
      user.full_name
    );

    try {
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    // Trigger rating modal immediately
    setRatingDelivery(activeDelivery);
  };

  // Location for live map
  const riderLocation = {
    lat: riderInfo?.current_lat || 0.3235,
    lng: riderInfo?.current_lng || 32.5855,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)_240px] gap-0 space-y-5 pb-16 max-w-3xl md:max-w-7xl mx-auto">
      <aside className="border-r border-sky-900/15 pr-4 bg-white/25 backdrop-blur-md min-h-full">
        {user && <OnboardingCarousel role="customer" userId={user.id} />}
      </aside>
      <main className="pl-4 md:pl-6 md:border-r border-sky-900/15">
      {/* Customer Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Track Deliveries</h2>
          <p className="text-xs text-muted">Real-time GPS visibility for {user?.full_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTutorialSlideIndex(0);
              setShowTutorialAgain(true);
            }}
            className="text-xs font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1 text-primary" />
            Tutorial
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/customer/history')}
            className="text-xs font-bold"
          >
            <History className="w-3.5 h-3.5 mr-1" />
            Order History
          </Button>
        </div>
      </div>

      {/* Active Delivery Section */}
      {activeDelivery ? (
        <div className="space-y-4 animate-fade-in">
          {/* Status Stepper */}
          <Card className="p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
              <span className="text-xs font-mono font-bold text-primary">
                Order #{activeDelivery.order_reference}
              </span>
              <Badge variant="accent" className="text-[10px] uppercase font-bold">
                {activeDelivery.status.replace('_', ' ')}
              </Badge>
            </div>
            <StatusStepper currentStatus={activeDelivery.status} />
          </Card>

          {/* Real-Time Live Map */}
          <DeliveryTrackingMap
            riderLocation={riderLocation}
            pickupLocation={{
              lat: activeDelivery.pickup_lat,
              lng: activeDelivery.pickup_lng,
              address: activeDelivery.pickup_address,
            }}
            dropoffLocation={{
              lat: activeDelivery.dropoff_lat,
              lng: activeDelivery.dropoff_lng,
              address: activeDelivery.dropoff_address,
            }}
            riderName={activeDelivery.rider?.full_name || 'Delivery Partner'}
            status={activeDelivery.status}
            height="340px"
          />

          {/* Rider & Communication Card */}
          <Card className="shadow-card border border-primary/10">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {activeDelivery.rider?.full_name?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {activeDelivery.rider?.full_name || 'Assigning nearest rider...'}
                    </h3>
                    <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                      <Bike className="w-3.5 h-3.5 text-accent" />
                      <span>{riderInfo?.vehicle_type || 'Motorcycle Dispatch'} ({riderInfo?.license_plate || 'UFE 234X'})</span>
                    </p>
                  </div>
                </div>

                {/* Call & Chat Action Buttons */}
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${activeDelivery.rider?.phone || '+256772123456'}`}
                    className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all active:scale-95"
                    title="Call Rider"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/customer/chat')}
                    className="font-bold text-xs"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Chat
                  </Button>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-700 space-y-1.5">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-900">Delivering to:</span> {activeDelivery.dropoff_address}
                  </div>
                </div>
                {activeDelivery.delivery_notes && (
                  <div className="p-2.5 rounded-lg bg-gray-50 text-[11px] text-gray-600">
                    <strong>Note:</strong> {activeDelivery.delivery_notes}
                  </div>
                )}
              </div>

              {/* One-Tap "Received" Action */}
              {['in_transit', 'picked_up'].includes(activeDelivery.status) && (
                <div className="pt-2">
                  <Button
                    variant="accent"
                    onClick={handleConfirmReceived}
                    className="w-full font-bold text-sm py-3.5 shadow-gold animate-bounce"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    I Have Received My Package ("Received")
                  </Button>
                  <p className="text-[10px] text-center text-muted mt-1.5">
                    Tap to confirm delivery receipt and close the active delivery tracking.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* No active deliveries in progress */
        <Card className="p-10 text-center space-y-3 bg-white shadow-card">
          <Package className="w-12 h-12 text-primary/30 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">No Deliveries Currently In Transit</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            When you place an order in SAP ByD or dispatch assigns an outbound shipment, it will track here live.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/customer/history')}>
              View Past Completed Deliveries
            </Button>
          </div>
        </Card>
      )}

      {/* Rating Prompt Modal */}
      {ratingDelivery && (
        <RatingModal
          isOpen={Boolean(ratingDelivery)}
          onClose={() => setRatingDelivery(null)}
          deliveryId={ratingDelivery.id}
          customerId={user?.id || ''}
          riderId={ratingDelivery.rider_id || 'b0000000-0000-0000-0000-000000000001'}
          riderName={ratingDelivery.rider?.full_name || 'John Mukasa'}
          orderReference={ratingDelivery.order_reference}
          onSubmitted={() => setRatingDelivery(null)}
        />
      )}
      </main>
      <aside className="hidden md:block bg-white/25 backdrop-blur-md pl-4">
        {showTutorialAgain ? (
          <div className="sticky top-20">
            <Card className="border border-white/40 bg-white/35 backdrop-blur-xl shadow-card animate-fade-in">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="primary" className="text-[10px] uppercase font-bold">{currentTutorialSlide.badge}</Badge>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTutorialAgain(false);
                      setTutorialSlideIndex(0);
                    }}
                    className="p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-white/60 transition-colors"
                    aria-label="Close tutorial"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-primary ring-2 ring-blue-100/60">
                  <CurrentTutorialIcon className="w-5 h-5" />
                </div>

                <div className="space-y-1.5 min-h-[88px]">
                  <h3 className="text-sm font-bold text-gray-900">{currentTutorialSlide.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {currentTutorialSlide.description}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-1">
                  {customerTutorialSlides.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === tutorialSlideIndex ? 'w-5 bg-primary' : 'w-1.5 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowTutorialAgain(false);
                      setTutorialSlideIndex(0);
                    }}
                    className="text-[11px] text-muted"
                  >
                    Skip Tutorial
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={tutorialSlideIndex === 0}
                      onClick={() => setTutorialSlideIndex((prev) => Math.max(0, prev - 1))}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (tutorialSlideIndex === customerTutorialSlides.length - 1) {
                          setShowTutorialAgain(false);
                          setTutorialSlideIndex(0);
                          return;
                        }
                        setTutorialSlideIndex((prev) => Math.min(customerTutorialSlides.length - 1, prev + 1));
                      }}
                      className="text-[11px] font-bold"
                    >
                      {tutorialSlideIndex === customerTutorialSlides.length - 1 ? (
                        'Get Started'
                      ) : (
                        <>
                          <span>Next</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div aria-hidden="true" />
        )}
      </aside>
    </div>
  );
};
