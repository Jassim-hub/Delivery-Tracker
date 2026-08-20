import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { mockStore } from '@/lib/supabase/mock-store';
import { Delivery, DeliveryStatus } from '@/types';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useGpsBroadcast } from '@/hooks/useGpsBroadcast';
import { DeliveryTrackingMap } from '@/components/map/DeliveryTrackingMap';
import { StatusStepper } from '@/components/deliveries/StatusStepper';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  PhoneCall,
  MessageSquare,
  Navigation,
  CheckCircle2,
  PackageCheck,
  Camera,
  PenTool,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowLeft,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { generateGoogleMapsNavigationUrl } from '@/lib/maps/geo-utils';
import { formatDateTime } from '@/lib/utils';
import confetti from 'canvas-confetti';

export const RiderActiveDelivery: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [delivery, setDelivery] = useState<Delivery | undefined>(undefined);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showOnBehalfModal, setShowOnBehalfModal] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [hasSignature, setHasSignature] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const fetchDelivery = () => {
    if (!id) return;
    const found = mockStore.getDeliveryById(id);
    setDelivery(found);
  };

  useEffect(() => {
    fetchDelivery();
    const unsubscribe = mockStore.subscribe(() => {
      fetchDelivery();
    });
    return () => unsubscribe();
  }, [id]);

  // GPS tracking & broadcast
  const { location: currentLocation } = useGeolocation({
    targetDestination: delivery
      ? { lat: delivery.dropoff_lat, lng: delivery.dropoff_lng }
      : null,
  });

  const { lastBroadcastAt } = useGpsBroadcast(
    user?.id || null,
    currentLocation,
    true
  );

  // Status transitions
  const handleMoveToInTransit = () => {
    if (!delivery || !user) return;
    mockStore.updateDeliveryStatus(delivery.id, 'in_transit', user.id, 'Rider departed with package');
  };

  const handleCompleteHandoverAck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery || !user) return;

    mockStore.addAcknowledgement(
      delivery.id,
      user.id,
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
      handoverNotes || 'Package inspected, barcodes scanned and intact.'
    );

    setShowHandoverModal(false);
  };

  // Canvas Signature functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4B2586';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirmOnBehalf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery || !user || !recipientName.trim()) return;

    const signatureDataUrl = canvasRef.current?.toDataURL('image/png') || null;

    mockStore.confirmReceipt(
      delivery.id,
      'rider_on_behalf',
      user.id,
      recipientName.trim(),
      signatureDataUrl || undefined
    );

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    setShowOnBehalfModal(false);
    navigate('/rider');
  };

  if (!delivery) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-semibold text-gray-700">Delivery not found or no longer active.</p>
        <Button variant="primary" onClick={() => navigate('/rider')}>
          Return to Queue
        </Button>
      </div>
    );
  }

  const googleMapsUrl = generateGoogleMapsNavigationUrl(
    delivery.dropoff_lat,
    delivery.dropoff_lng,
    delivery.dropoff_address
  );

  return (
    <div className="space-y-4 pb-16 max-w-3xl mx-auto">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/rider')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-primary p-1.5 rounded-lg hover:bg-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Queue</span>
        </button>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="font-mono text-xs">
            {delivery.order_reference}
          </Badge>
          {delivery.sap_byd_document_id && (
            <Badge variant="outline" className="text-[10px] text-purple-700 border-purple-200">
              SAP ByD: {delivery.sap_byd_document_id}
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Status Stepper */}
      <Card className="p-4 shadow-sm">
        <StatusStepper currentStatus={delivery.status} />
      </Card>

      {/* Interactive GPS Route Map */}
      <DeliveryTrackingMap
        riderLocation={currentLocation}
        pickupLocation={{
          lat: delivery.pickup_lat,
          lng: delivery.pickup_lng,
          address: delivery.pickup_address,
        }}
        dropoffLocation={{
          lat: delivery.dropoff_lat,
          lng: delivery.dropoff_lng,
          address: delivery.dropoff_address,
        }}
        riderName={user?.full_name || 'Rider'}
        status={delivery.status}
        height="320px"
      />

      {/* Live GPS Broadcast Status Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-100 text-[11px] text-primary">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">Live GPS Broadcast Active</span>
        </div>
        <span className="text-muted">
          Last sync: {lastBroadcastAt ? formatDateTime(lastBroadcastAt.toISOString()) : 'Broadcasting now'}
        </span>
      </div>

      {/* Destination & Contact Card */}
      <Card className="shadow-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Destination Address</span>
              <h3 className="text-sm font-bold text-gray-900 mt-0.5 flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{delivery.dropoff_address}</span>
              </h3>
            </div>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent text-xs font-bold py-2 px-3 shadow-gold flex-shrink-0"
            >
              <Navigation className="w-3.5 h-3.5 mr-1" />
              Turn-by-Turn Nav
            </a>
          </div>

          {/* Recipient Details & Click-to-Call Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-muted uppercase">Customer / Recipient</div>
                <div className="text-xs font-bold text-gray-900">{delivery.customer?.full_name || 'Customer'}</div>
                <div className="text-[11px] text-gray-600">{delivery.customer?.phone || '+256 750 334 455'}</div>
              </div>
              <a
                href={`tel:${delivery.customer?.phone || '+256750334455'}`}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all active:scale-95"
                title="Call Customer Directly"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-muted uppercase">Central Dispatch HQ</div>
                <div className="text-xs font-bold text-gray-900">Operations Control</div>
                <div className="text-[11px] text-gray-600">+256 700 112 233</div>
              </div>
              <a
                href="tel:+256700112233"
                className="p-2.5 rounded-xl bg-primary hover:bg-primary-700 text-white shadow-sm transition-all active:scale-95"
                title="Call Dispatch"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Delivery Special Notes */}
          {delivery.delivery_notes && (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
              <span className="font-bold flex items-center gap-1 mb-0.5">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                Delivery Instructions:
              </span>
              <p className="text-[11px] leading-relaxed">{delivery.delivery_notes}</p>
            </div>
          )}

          {/* Chat Shortcut */}
          <div className="pt-2 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/rider/chat')}
              className="w-full text-xs font-bold text-primary border-primary/30 hover:bg-primary/5"
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Open Live Chat with Customer & Dispatch
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Progression Controller Bar */}
      <Card className="border-2 border-primary/20 bg-surface shadow-card">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Required Action Step</span>
            <Badge variant="accent" className="capitalize text-xs font-bold">
              Current: {delivery.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Step 1: Handover Acknowledgement (Required before moving to Picked Up / In Transit) */}
          {delivery.status === 'accepted' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-700 leading-relaxed">
                You have accepted this order. Upon reaching the pickup warehouse, inspect the package and submit handover acknowledgement.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowHandoverModal(true)}
                className="w-full font-bold text-sm py-3"
              >
                <PackageCheck className="w-4 h-4 mr-2" />
                Acknowledge Package Handover (Proof of Pickup)
              </Button>
            </div>
          )}

          {/* Step 2: Depart to In Transit */}
          {delivery.status === 'picked_up' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-700 leading-relaxed">
                Handover acknowledged! Tap below once you mount your vehicle to notify customer you are en route.
              </p>
              <Button
                variant="accent"
                onClick={handleMoveToInTransit}
                className="w-full font-bold text-sm py-3 shadow-gold"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Depart for Dropoff (Start In-Transit)
              </Button>
            </div>
          )}

          {/* Step 3: Complete Delivery (On-Behalf Confirmation Option) */}
          {delivery.status === 'in_transit' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-700 leading-relaxed">
                You are en route. Once at destination, customer can tap "Received" on their phone, or you can record signature on their behalf below.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowOnBehalfModal(true)}
                className="w-full font-bold text-sm py-3 shadow-purple"
              >
                <PenTool className="w-4 h-4 mr-2 text-accent" />
                Confirm Receipt on Customer's Behalf (Signature)
              </Button>
            </div>
          )}

          {delivery.status === 'delivered' && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-900">Delivery Completed Successfully!</h4>
              <p className="text-xs text-emerald-700">Receipt record generated and synced back to SAP ByD.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/rider')} className="mt-2 text-xs">
                Back to Queue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal 1: Handover Acknowledgement */}
      <Dialog
        isOpen={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
        title="Package Handover Acknowledgement"
        description="Verify parcel barcodes and physical condition before departing pickup depot."
        maxWidth="md"
      >
        <form onSubmit={handleCompleteHandoverAck} className="space-y-4 pt-2">
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0" />
            <p className="text-xs text-purple-900 font-medium">
              "I confirm I have physically received and inspected this package in sound condition for delivery."
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Handover Inspection Notes (Optional)
            </label>
            <input
              type="text"
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              placeholder="e.g. Package sealed, cold-chain temperature box verified."
              className="w-full text-xs rounded-xl p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary text-gray-900"
            />
          </div>

          <div className="p-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 flex flex-col items-center justify-center text-center">
            <Camera className="w-6 h-6 text-primary mb-1" />
            <span className="text-xs font-bold text-gray-800">Proof-of-Pickup Photo</span>
            <span className="text-[10px] text-muted">Simulation: Verified automatically via Supabase Storage</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowHandoverModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Confirm Handover & Advance
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Confirm on Customer's Behalf (Digital Signature Canvas) */}
      <Dialog
        isOpen={showOnBehalfModal}
        onClose={() => setShowOnBehalfModal(false)}
        title="Confirm Receipt on Customer's Behalf"
        description="For deliveries where the customer does not have the app installed."
        maxWidth="md"
      >
        <form onSubmit={handleConfirmOnBehalf} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Recipient Full Name *
            </label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Grace Tumusiime or Security Officer"
              className="w-full text-xs rounded-xl p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary text-gray-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Digital Recipient Signature
              </label>
              <button
                type="button"
                onClick={clearSignature}
                className="text-[11px] text-brand-danger hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            </div>

            {/* Signature Canvas */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden touch-none relative">
              <canvas
                ref={canvasRef}
                width={380}
                height={140}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[140px] cursor-crosshair bg-white"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted text-xs">
                  Sign with finger or stylus here
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowOnBehalfModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="sm"
              disabled={!recipientName.trim()}
              className="font-bold text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Complete & Sign Off Delivery
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
