import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { mockStore } from '@/lib/supabase/mock-store';
import { ChatThread, Delivery } from '@/types';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, Shield, UserCheck, Bike } from 'lucide-react';

export const RiderChat: React.FC = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');

  const loadData = () => {
    if (!user) return;
    const allThreads = mockStore.getChatThreads(user.id);
    setThreads(allThreads);

    const dels = mockStore.getDeliveries().filter(
      (d) => d.rider_id === user.id && ['assigned', 'accepted', 'picked_up', 'in_transit'].includes(d.status)
    );
    setActiveDeliveries(dels);

    if (!selectedThreadId && allThreads.length > 0) {
      setSelectedThreadId(allThreads[0].id);
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

  // Find admin thread (persistent)
  const adminThread = mockStore.getOrCreateChatThread('admin_rider', null, user.id, 'a0000000-0000-0000-0000-000000000001');

  // Customer thread for currently active delivery (if any)
  const currentDelivery = activeDeliveries[0];
  const customerThread = currentDelivery
    ? mockStore.getOrCreateChatThread('rider_customer', currentDelivery.id, user.id, currentDelivery.customer_id)
    : null;

  return (
    <div className="space-y-4 pb-12 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Communication Center</h2>
          <p className="text-xs text-muted">Role-scoped live encrypted channels with customers & dispatch</p>
        </div>
      </div>

      <Tabs defaultValue="customer" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="customer" className="flex items-center gap-1.5 py-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Active Customer {currentDelivery ? `(#${currentDelivery.order_reference})` : ''}</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-1.5 py-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <span>Dispatch Control HQ</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Customer Chat */}
        <TabsContent value="customer">
          {customerThread && currentDelivery ? (
            <ChatWindow
              threadId={customerThread.id}
              currentUser={user}
              recipientName={currentDelivery.customer?.full_name || 'Customer'}
              recipientRole="customer"
              deliveryReference={currentDelivery.order_reference}
            />
          ) : (
            <Card className="p-8 text-center text-muted">
              <MessageSquare className="w-10 h-10 text-primary/30 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">No active delivery customer chat.</p>
              <p className="text-[11px] text-muted">
                Accept a delivery from your queue to automatically initiate a live customer thread.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Admin Dispatch Chat */}
        <TabsContent value="admin">
          <ChatWindow
            threadId={adminThread.id}
            currentUser={user}
            recipientName="Central Dispatch HQ"
            recipientRole="admin"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
