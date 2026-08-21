import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { mockStore } from '@/lib/supabase/mock-store';
import { Delivery, ChatThread } from '@/types';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Card } from '@/components/ui/card';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerChat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeDelivery, setActiveDelivery] = useState<Delivery | undefined>(undefined);
  const [chatThread, setChatThread] = useState<ChatThread | null>(null);

  const loadData = () => {
    if (!user) return;
    const all = mockStore.getDeliveries().filter((d) => d.customer_id === user.id);
    // Prefer in-progress statuses over delivered
    const inProgressStatuses = ['assigned', 'accepted', 'picked_up', 'in_transit'];
    const active = all.find((d) => inProgressStatuses.includes(d.status)) ?? all.find((d) => d.status === 'delivered');
    setActiveDelivery(active);

    if (active && active.rider_id) {
      const thread = mockStore.getOrCreateChatThread('rider_customer', active.id, active.rider_id, user.id);
      setChatThread(thread);
    }
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
    <div className="space-y-4 pb-12 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customer')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-primary p-1.5 rounded-lg hover:bg-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tracking</span>
        </button>
      </div>

      {chatThread && activeDelivery ? (
        <ChatWindow
          threadId={chatThread.id}
          currentUser={user}
          recipientName={activeDelivery.rider?.full_name || 'Delivery Rider'}
          recipientRole="rider"
          deliveryReference={activeDelivery.order_reference}
        />
      ) : (
        <Card className="p-8 text-center text-muted">
          <MessageSquare className="w-10 h-10 text-primary/30 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-900">No Active Rider Chat</h3>
          <p className="text-xs text-muted mt-1">
            Once a delivery is assigned to a rider, your direct communication channel will appear here.
          </p>
        </Card>
      )}
    </div>
  );
};
