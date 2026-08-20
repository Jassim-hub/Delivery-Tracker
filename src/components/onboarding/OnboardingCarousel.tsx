import React, { useState, useEffect } from 'react';
import { Role } from '@/types';
import { mockStore } from '@/lib/supabase/mock-store';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Bike,
  MapPin,
  MessageSquare,
  PackageCheck,
  Shield,
  Sparkles,
  Smartphone,
  BarChart3,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface OnboardingCarouselProps {
  role: Role;
  userId: string;
  forceOpen?: boolean;
  onFinished?: () => void;
}

interface Slide {
  title: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  color: string;
}

const RIDER_SLIDES: Slide[] = [
  {
    title: 'Accept & Queue Deliveries',
    description: 'Toggle your online status to receive new order assignments. Review pickup details, notes, and accept orders with one tap.',
    icon: Bike,
    badge: 'Step 1: Dispatch Queue',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    title: 'Handover Acknowledgement',
    description: 'Inspect parcels before pickup and acknowledge handover with optional proof-of-pickup verification.',
    icon: PackageCheck,
    badge: 'Step 2: Pickup Verification',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'Live GPS Navigation & Chat',
    description: 'Broadcast live GPS with smart bandwidth throttling, open Google Maps turn-by-turn navigation, and chat with customers.',
    icon: MapPin,
    badge: 'Step 3: Route & Communication',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    title: 'On-Behalf Confirmation',
    description: 'When delivering to customers without the app, capture their recipient name and digital signature directly on your screen.',
    icon: CheckCircle,
    badge: 'Step 4: Proof of Delivery',
    color: 'bg-blue-100 text-blue-700',
  },
];

const CUSTOMER_SLIDES: Slide[] = [
  {
    title: 'Real-Time Delivery Tracking',
    description: 'Watch your rider approach in real time on an interactive live map with precise ETA countdowns and visual status progression.',
    icon: MapPin,
    badge: 'Live Tracking',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    title: 'Direct Rider Communication',
    description: 'Send instant messages or click-to-call your assigned rider directly through the encrypted communication channel.',
    icon: MessageSquare,
    badge: 'Instant Chat',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'One-Tap "Received" & Rating',
    description: 'Confirm package delivery with one tap once your rider arrives, and rate your delivery experience with quick tag feedback.',
    icon: Sparkles,
    badge: 'Receipt & Rating',
    color: 'bg-emerald-100 text-emerald-700',
  },
];

const ADMIN_SLIDES: Slide[] = [
  {
    title: 'Live Fleet Ops Map',
    description: 'Monitor all online riders, active deliveries, and real-time transit telemetry on a unified operations map.',
    icon: Shield,
    badge: 'Fleet Command',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    title: 'SAP ByD ERP Integration',
    description: 'Seamlessly ingest delivery notes and destination addresses via the swappable SAP Business ByDesign OData adapter.',
    icon: Smartphone,
    badge: 'ERP Synchronization',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    title: 'TV Display & Ops Board',
    description: 'Switch to the dedicated high-contrast TV Ops Board mode (/admin/tv-display) designed for unattended warehouse wall displays.',
    icon: BarChart3,
    badge: 'Wallboard Mode',
    color: 'bg-amber-100 text-amber-700',
  },
];

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  role,
  userId,
  forceOpen = false,
  onFinished,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentSlideIndex(0);
      return;
    }

    const hasSeen = mockStore.hasSeenOnboarding(userId);
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, [userId, forceOpen]);

  const slides = role === 'rider' ? RIDER_SLIDES : role === 'customer' ? CUSTOMER_SLIDES : ADMIN_SLIDES;

  const handleClose = () => {
    mockStore.setSeenOnboarding(userId, true);
    setIsOpen(false);
    onFinished?.();
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const currentSlide = slides[currentSlideIndex];
  const IconComponent = currentSlide.icon;

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} maxWidth="sm" showCloseButton={true}>
      <div className="flex flex-col items-center text-center p-2">
        {/* Step Badge */}
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full mb-4 ${currentSlide.color}`}>
          {currentSlide.badge}
        </span>

        {/* Animated Slide Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-blue-700 shadow-sm ring-4 ring-blue-100/50">
          <IconComponent className="w-8 h-8 text-primary animate-pulse" />
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
          {currentSlide.title}
        </h3>
        <p className="text-xs text-muted leading-relaxed px-2 mb-6">
          {currentSlide.description}
        </p>

        {/* Slide Progress Dots */}
        <div className="flex items-center gap-1.5 mb-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlideIndex ? 'w-6 bg-primary' : 'w-2 bg-gray-200 hover:bg-gray-300'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="w-full flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-xs text-muted hover:text-gray-900"
          >
            Skip Tutorial
          </Button>

          <div className="flex items-center gap-2">
            {currentSlideIndex > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={handlePrev} aria-label="Previous slide">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleNext}
              className="font-bold text-xs"
            >
              {currentSlideIndex === slides.length - 1 ? (
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
      </div>
    </Dialog>
  );
};
