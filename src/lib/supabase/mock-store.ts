import {
  Profile,
  Rider,
  Customer,
  Delivery,
  DeliveryStatus,
  DeliveryStatusHistory,
  DeliveryAcknowledgement,
  ReceiptConfirmation,
  ChatThread,
  ChatMessage,
  Rating,
  AuditLog,
} from '@/types';
import {
  INITIAL_PROFILES,
  INITIAL_RIDERS,
  INITIAL_CUSTOMERS,
  INITIAL_DELIVERIES,
  INITIAL_STATUS_HISTORY,
  INITIAL_CHAT_THREADS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_RATINGS,
} from './mock-data';

const STORAGE_KEYS = {
  PROFILES: 'dt_profiles_v1',
  RIDERS: 'dt_riders_v1',
  CUSTOMERS: 'dt_customers_v1',
  DELIVERIES: 'dt_deliveries_v1',
  HISTORY: 'dt_history_v1',
  THREADS: 'dt_threads_v1',
  MESSAGES: 'dt_messages_v1',
  RATINGS: 'dt_ratings_v1',
  ACKNOWLEDGMENTS: 'dt_acknowledgements_v1',
  CONFIRMATIONS: 'dt_confirmations_v1',
  AUDIT_LOG: 'dt_audit_v1',
  ONBOARDING: 'dt_onboarding_v1',
};

type Listener = () => void;

class MockDataStore {
  private listeners: Set<Listener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.initializeData();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('delivery_tracker_sync');
        this.broadcastChannel.onmessage = () => {
          this.notifyLocal();
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment', e);
      }
    }
  }

  private initializeData() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return;
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RIDERS)) {
      localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(INITIAL_RIDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DELIVERIES)) {
      localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(INITIAL_DELIVERIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(INITIAL_STATUS_HISTORY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.THREADS)) {
      localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(INITIAL_CHAT_THREADS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_CHAT_MESSAGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RATINGS)) {
      localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(INITIAL_RATINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACKNOWLEDGMENTS)) {
      localStorage.setItem(STORAGE_KEYS.ACKNOWLEDGMENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONFIRMATIONS)) {
      localStorage.setItem(STORAGE_KEYS.CONFIRMATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOG)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ONBOARDING)) {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify({}));
    }
  }

  public resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.RIDERS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.DELIVERIES);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.THREADS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.RATINGS);
    localStorage.removeItem(STORAGE_KEYS.ACKNOWLEDGMENTS);
    localStorage.removeItem(STORAGE_KEYS.CONFIRMATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOG);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING);
    this.initializeData();
    this.emitChange();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyLocal() {
    this.listeners.forEach((fn) => fn());
  }

  private emitChange() {
    this.notifyLocal();
    try {
      this.broadcastChannel?.postMessage('update');
    } catch {
      // ignore
    }
  }

  // --- Profiles ---
  public getProfiles(): Profile[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
    } catch {
      return INITIAL_PROFILES;
    }
  }

  public getProfileById(id: string): Profile | undefined {
    return this.getProfiles().find((p) => p.id === id);
  }

  // --- Riders ---
  public getRiders(): Rider[] {
    try {
      const riders: Rider[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RIDERS) || '[]');
      const profiles = this.getProfiles();
      return riders.map((r) => ({
        ...r,
        profile: profiles.find((p) => p.id === r.user_id),
      }));
    } catch {
      return INITIAL_RIDERS;
    }
  }

  public getRiderById(userId: string): Rider | undefined {
    return this.getRiders().find((r) => r.user_id === userId);
  }

  public setRiderOnlineStatus(userId: string, isOnline: boolean): void {
    const riders = this.getRiders();
    const updated = riders.map((r) => (r.user_id === userId ? { ...r, is_online: isOnline, updated_at: new Date().toISOString() } : r));
    localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(updated));
    this.emitChange();
  }

  public updateRiderLocation(userId: string, lat: number, lng: number): void {
    const riders = this.getRiders();
    const updated = riders.map((r) =>
      r.user_id === userId
        ? {
            ...r,
            current_lat: lat,
            current_lng: lng,
            last_location_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : r
    );
    localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(updated));
    this.emitChange();
  }

  // --- Deliveries ---
  public getDeliveries(): Delivery[] {
    try {
      const deliveries: Delivery[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DELIVERIES) || '[]');
      const profiles = this.getProfiles();
      const riders = this.getRiders();

      return deliveries.map((d) => {
        const custProfile = profiles.find((p) => p.id === d.customer_id);
        const riderProfile = d.rider_id ? profiles.find((p) => p.id === d.rider_id) : undefined;
        const riderInfo = d.rider_id ? riders.find((r) => r.user_id === d.rider_id) : undefined;

        return {
          ...d,
          customer: custProfile,
          rider: riderProfile ? { ...riderProfile, rider_info: riderInfo } : undefined,
        };
      });
    } catch {
      return INITIAL_DELIVERIES;
    }
  }

  public getDeliveryById(id: string): Delivery | undefined {
    return this.getDeliveries().find((d) => d.id === id);
  }

  public updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    changedById: string,
    note?: string
  ): void {
    const deliveries = this.getDeliveries();
    const now = new Date().toISOString();

    const updated = deliveries.map((d) => {
      if (d.id !== deliveryId) return d;

      const patch: Partial<Delivery> = {
        status,
        updated_at: now,
      };

      if (status === 'assigned' && !d.assigned_at) patch.assigned_at = now;
      if (status === 'accepted' && !d.accepted_at) patch.accepted_at = now;
      if (status === 'picked_up' && !d.picked_up_at) patch.picked_up_at = now;
      if (status === 'delivered' && !d.delivered_at) patch.delivered_at = now;

      return { ...d, ...patch };
    });

    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(updated));

    // Record in history
    this.addStatusHistory(deliveryId, status, changedById, note || `Status updated to ${status}`);

    // If marked delivered, recalculate rider total deliveries
    const target = updated.find((d) => d.id === deliveryId);
    if (status === 'delivered' && target?.rider_id) {
      this.recalculateRiderStats(target.rider_id);
    }

    this.emitChange();
  }

  public assignDeliveryToRider(deliveryId: string, riderId: string, adminId: string): void {
    const deliveries = this.getDeliveries();
    const now = new Date().toISOString();
    const rider = this.getProfileById(riderId);

    const updated = deliveries.map((d) => {
      if (d.id !== deliveryId) return d;
      return {
        ...d,
        rider_id: riderId,
        status: 'assigned' as DeliveryStatus,
        assigned_at: now,
        updated_at: now,
      };
    });

    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(updated));
    this.addStatusHistory(deliveryId, 'assigned', adminId, `Manually assigned to rider ${rider?.full_name || riderId}`);
    
    // Create/activate chat thread between rider and customer
    this.getOrCreateChatThread('rider_customer', deliveryId, riderId, updated.find(d => d.id === deliveryId)?.customer_id || '');

    // Record audit log
    this.addAuditLog(adminId, 'ASSIGN_DELIVERY', 'deliveries', deliveryId, { rider_id: riderId });

    this.emitChange();
  }

  public addDelivery(delivery: Partial<Delivery>): Delivery {
    const deliveries = this.getDeliveries();
    const newDelivery: Delivery = {
      id: delivery.id || `d0000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
      order_reference: delivery.order_reference || `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      sap_byd_document_id: delivery.sap_byd_document_id || null,
      customer_id: delivery.customer_id || INITIAL_PROFILES.find(p => p.role === 'customer')?.id || '',
      rider_id: delivery.rider_id || null,
      pickup_address: delivery.pickup_address || 'Kampala Central Warehouse',
      pickup_lat: delivery.pickup_lat || 0.3150,
      pickup_lng: delivery.pickup_lng || 32.5980,
      dropoff_address: delivery.dropoff_address || 'Kololo Residential Area, Kampala',
      dropoff_lat: delivery.dropoff_lat || 0.3312,
      dropoff_lng: delivery.dropoff_lng || 32.5875,
      delivery_notes: delivery.delivery_notes || null,
      status: delivery.status || 'pending',
      estimated_delivery_at: delivery.estimated_delivery_at || new Date(Date.now() + 45 * 60000).toISOString(),
      assigned_at: delivery.assigned_at || null,
      accepted_at: delivery.accepted_at || null,
      picked_up_at: delivery.picked_up_at || null,
      delivered_at: delivery.delivered_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    deliveries.unshift(newDelivery);
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
    this.addStatusHistory(newDelivery.id, newDelivery.status, newDelivery.customer_id, 'Delivery created');
    this.emitChange();
    return newDelivery;
  }

  // --- Handover Acknowledgement ---
  public addAcknowledgement(deliveryId: string, riderId: string, photoUrl?: string, notes?: string): void {
    try {
      const acks: DeliveryAcknowledgement[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACKNOWLEDGMENTS) || '[]');
      const newAck: DeliveryAcknowledgement = {
        id: `ack-${Date.now()}`,
        delivery_id: deliveryId,
        rider_id: riderId,
        photo_url: photoUrl || null,
        notes: notes || null,
        acknowledged_at: new Date().toISOString(),
      };
      acks.push(newAck);
      localStorage.setItem(STORAGE_KEYS.ACKNOWLEDGMENTS, JSON.stringify(acks));
      this.updateDeliveryStatus(deliveryId, 'picked_up', riderId, 'Handover acknowledged by rider');
    } catch {
      // ignore
    }
  }

  public getAcknowledgement(deliveryId: string): DeliveryAcknowledgement | undefined {
    try {
      const acks: DeliveryAcknowledgement[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACKNOWLEDGMENTS) || '[]');
      return acks.find((a) => a.delivery_id === deliveryId);
    } catch {
      return undefined;
    }
  }

  // --- Receipt Confirmations ---
  public confirmReceipt(
    deliveryId: string,
    source: 'customer_app' | 'rider_on_behalf',
    confirmedByUserId: string,
    recipientName?: string,
    signatureUrl?: string
  ): void {
    try {
      const confs: ReceiptConfirmation[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIRMATIONS) || '[]');
      const newConf: ReceiptConfirmation = {
        id: `rc-${Date.now()}`,
        delivery_id: deliveryId,
        confirmed_by: source,
        confirmed_by_user_id: confirmedByUserId,
        recipient_name: recipientName || null,
        signature_url: signatureUrl || null,
        confirmed_at: new Date().toISOString(),
      };
      confs.push(newConf);
      localStorage.setItem(STORAGE_KEYS.CONFIRMATIONS, JSON.stringify(confs));
      this.updateDeliveryStatus(
        deliveryId,
        'delivered',
        confirmedByUserId,
        source === 'customer_app' ? 'Confirmed by customer app' : `Confirmed on customer behalf by rider (${recipientName || 'Recipient'})`
      );
    } catch {
      // ignore
    }
  }

  public getReceiptConfirmation(deliveryId: string): ReceiptConfirmation | undefined {
    try {
      const confs: ReceiptConfirmation[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIRMATIONS) || '[]');
      return confs.find((c) => c.delivery_id === deliveryId);
    } catch {
      return undefined;
    }
  }

  // --- Status History ---
  public getStatusHistory(deliveryId?: string): DeliveryStatusHistory[] {
    try {
      const history: DeliveryStatusHistory[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
      const profiles = this.getProfiles();
      const mapped = history.map((h) => ({
        ...h,
        changer: profiles.find((p) => p.id === h.changed_by),
      }));
      return deliveryId ? mapped.filter((h) => h.delivery_id === deliveryId) : mapped;
    } catch {
      return INITIAL_STATUS_HISTORY;
    }
  }

  private addStatusHistory(deliveryId: string, status: DeliveryStatus, changedBy: string, note?: string): void {
    try {
      const history: DeliveryStatusHistory[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
      history.push({
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        delivery_id: deliveryId,
        status,
        changed_by: changedBy,
        note: note || null,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }

  // --- Chat Threads & Messages ---
  public getChatThreads(userId?: string): ChatThread[] {
    try {
      const threads: ChatThread[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.THREADS) || '[]');
      const messages = this.getChatMessages();
      const deliveries = this.getDeliveries();

      return threads
        .map((t) => {
          const threadMsgs = messages.filter((m) => m.thread_id === t.id);
          const lastMessage = threadMsgs[threadMsgs.length - 1];
          const unreadCount = userId ? threadMsgs.filter((m) => m.sender_id !== userId && !m.read_at).length : 0;
          const delivery = t.delivery_id ? deliveries.find((d) => d.id === t.delivery_id) : undefined;

          return {
            ...t,
            last_message: lastMessage,
            unread_count: unreadCount,
            delivery,
          };
        })
        .filter((t) => {
          if (!userId) return true;
          // Filter scoped to user if applicable
          if (t.delivery) {
            return t.delivery.customer_id === userId || t.delivery.rider_id === userId || this.getProfileById(userId)?.role === 'admin';
          }
          return true;
        });
    } catch {
      return INITIAL_CHAT_THREADS;
    }
  }

  public getChatMessages(threadId?: string): ChatMessage[] {
    try {
      const messages: ChatMessage[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
      const profiles = this.getProfiles();
      const mapped = messages.map((m) => ({
        ...m,
        sender: profiles.find((p) => p.id === m.sender_id),
      }));
      return threadId ? mapped.filter((m) => m.thread_id === threadId) : mapped;
    } catch {
      return INITIAL_CHAT_MESSAGES;
    }
  }

  public getOrCreateChatThread(type: 'admin_rider' | 'rider_customer', deliveryId: string | null, userAId: string, userBId: string): ChatThread {
    const threads: ChatThread[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.THREADS) || '[]');
    let existing = threads.find((t) => {
      if (type === 'rider_customer') {
        return t.type === 'rider_customer' && t.delivery_id === deliveryId;
      }
      return t.type === 'admin_rider';
    });

    if (!existing) {
      existing = {
        id: `th-${Date.now()}`,
        type,
        delivery_id: deliveryId,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      threads.push(existing);
      localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
      this.emitChange();
    }
    return existing;
  }

  public sendChatMessage(threadId: string, senderId: string, content: string): ChatMessage {
    const messages: ChatMessage[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      thread_id: threadId,
      sender_id: senderId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      read_at: null,
      sender: this.getProfileById(senderId),
    };

    messages.push(newMsg);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    this.emitChange();
    return newMsg;
  }

  public markThreadMessagesAsRead(threadId: string, readerUserId: string): void {
    const messages: ChatMessage[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    let changed = false;

    const updated = messages.map((m) => {
      if (m.thread_id === threadId && m.sender_id !== readerUserId && !m.read_at) {
        changed = true;
        return { ...m, read_at: new Date().toISOString() };
      }
      return m;
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updated));
      this.emitChange();
    }
  }

  // --- Ratings ---
  public getRatings(riderId?: string): Rating[] {
    try {
      const ratings: Rating[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATINGS) || '[]');
      const profiles = this.getProfiles();
      const mapped = ratings.map((r) => ({
        ...r,
        customer: profiles.find((p) => p.id === r.customer_id),
      }));
      return riderId ? mapped.filter((r) => r.rider_id === riderId) : mapped;
    } catch {
      return INITIAL_RATINGS;
    }
  }

  public getRatingForDelivery(deliveryId: string): Rating | undefined {
    return this.getRatings().find((r) => r.delivery_id === deliveryId);
  }

  public addRating(deliveryId: string, customerId: string, riderId: string, stars: number, comment?: string, tags?: string[]): Rating {
    const ratings: Rating[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATINGS) || '[]');
    const newRating: Rating = {
      id: `rate-${Date.now()}`,
      delivery_id: deliveryId,
      customer_id: customerId,
      rider_id: riderId,
      stars: Math.max(1, Math.min(5, stars)),
      comment: comment || null,
      tags: tags || [],
      created_at: new Date().toISOString(),
      customer: this.getProfileById(customerId),
    };

    ratings.unshift(newRating);
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));

    // Recalculate rider statistics
    this.recalculateRiderStats(riderId);
    this.emitChange();
    return newRating;
  }

  private recalculateRiderStats(riderId: string): void {
    const ratings = this.getRatings(riderId);
    const deliveries = this.getDeliveries().filter((d) => d.rider_id === riderId && d.status === 'delivered');

    let avg = 0;
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, curr) => acc + curr.stars, 0);
      avg = Math.round((sum / ratings.length) * 10) / 10;
    }

    // Bug 10 fix: read from the RAW riders store (no joined profile), update,
    // and write back so we never bake the joined `profile` field into storage.
    const rawRiders = JSON.parse(localStorage.getItem(STORAGE_KEYS.RIDERS) || '[]');
    const updated = rawRiders.map((r: Rider) =>
      r.user_id === riderId
        ? {
            ...r,
            avg_rating: avg || r.avg_rating,
            total_deliveries: deliveries.length,
            updated_at: new Date().toISOString(),
          }
        : r
    );
    localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(updated));
  }

  // --- Onboarding Status ---
  public hasSeenOnboarding(userId: string): boolean {
    try {
      const statusMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.ONBOARDING) || '{}');
      return !!statusMap[userId];
    } catch {
      return false;
    }
  }

  public setSeenOnboarding(userId: string, seen: boolean): void {
    try {
      const statusMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.ONBOARDING) || '{}');
      statusMap[userId] = seen;
      localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(statusMap));
      this.emitChange();
    } catch {
      // ignore
    }
  }

  // --- Audit Log ---
  public getAuditLogs(): AuditLog[] {
    try {
      const logs: AuditLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOG) || '[]');
      const profiles = this.getProfiles();
      return logs.map((l) => ({
        ...l,
        actor: profiles.find((p) => p.id === l.actor_id),
      }));
    } catch {
      return [];
    }
  }

  public addAuditLog(actorId: string, action: string, targetTable: string, targetId: string, details?: any): void {
    try {
      const logs: AuditLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOG) || '[]');
      logs.unshift({
        id: `aud-${Date.now()}`,
        actor_id: actorId,
        action,
        target_table: targetTable,
        target_id: targetId,
        details: details || null,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(logs));
    } catch {
      // ignore
    }
  }
}

export const mockStore = new MockDataStore();
