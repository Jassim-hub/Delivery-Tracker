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

// ---------------------------------------------------------------------------
// RawRider: the shape stored in localStorage — no joined `profile` field.
// ---------------------------------------------------------------------------
type RawRider = Omit<Rider, 'profile'>;

class MockDataStore {
  private listeners = new Set<Listener>();
  private broadcastChannel: BroadcastChannel | null = null;

  // -------------------------------------------------------------------------
  // FIX INEFFICIENCY 1: in-memory caches — avoids redundant JSON.parse calls.
  // Each cache is invalidated (set to null) whenever the corresponding key is
  // written, so reads always see the latest data without repeated parsing.
  // -------------------------------------------------------------------------
  private _profilesCache: Profile[] | null = null;
  private _rawRidersCache: RawRider[] | null = null;
  private _deliveriesCache: Delivery[] | null = null;
  private _messagesCache: ChatMessage[] | null = null;
  private _threadsCache: ChatThread[] | null = null;
  private _ratingsCache: Rating[] | null = null;
  private _historyCache: DeliveryStatusHistory[] | null = null;

  constructor() {
    this.initializeData();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('delivery_tracker_sync');
        this.broadcastChannel.onmessage = () => {
          // Remote tab wrote something — invalidate all caches.
          this.invalidateAllCaches();
          this.notifyLocal();
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment', e);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Cache helpers
  // -------------------------------------------------------------------------
  private invalidateAllCaches() {
    this._profilesCache = null;
    this._rawRidersCache = null;
    this._deliveriesCache = null;
    this._messagesCache = null;
    this._threadsCache = null;
    this._ratingsCache = null;
    this._historyCache = null;
  }

  private initializeData() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return;
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      // FIX SECURITY: strip passwords before persisting to localStorage
      const safeProfiles = INITIAL_PROFILES.map(({ password: _pw, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(safeProfiles));
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
    this.invalidateAllCaches();
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
    this.invalidateAllCaches();
    this.notifyLocal();
    try {
      this.broadcastChannel?.postMessage('update');
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------------------
  // Profiles
  // -------------------------------------------------------------------------
  public getProfiles(): Profile[] {
    if (this._profilesCache) return this._profilesCache;
    try {
      this._profilesCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
      return this._profilesCache!;
    } catch {
      this._profilesCache = INITIAL_PROFILES;
      return this._profilesCache;
    }
  }

  public getProfileById(id: string): Profile | undefined {
    return this.getProfiles().find((p) => p.id === id);
  }

  // SEC-3 / STRUCT-1 FIX: public write helpers so AuthContext and other callers
  // never touch localStorage keys or cache fields directly.
  public addProfile(profile: Profile): void {
    const profiles = this.getProfiles();
    profiles.push(profile);
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    this._profilesCache = null;
    this.emitChange();
  }

  public addRawRider(raw: Omit<Rider, 'profile'>): void {
    const riders = this.getRawRiders();
    riders.push(raw);
    this.saveRawRiders(riders);
    this.emitChange();
  }

  public addCustomer(customer: Customer): void {
    try {
      const customers: Customer[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
      customers.push(customer);
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      this.emitChange();
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------------------
  // FIX BUG 1: Raw riders — always read/write the un-joined shape from storage.
  // -------------------------------------------------------------------------
  private getRawRiders(): RawRider[] {
    if (this._rawRidersCache) return this._rawRidersCache;
    try {
      this._rawRidersCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.RIDERS) || '[]');
      return this._rawRidersCache!;
    } catch {
      return INITIAL_RIDERS as RawRider[];
    }
  }

  private saveRawRiders(raw: RawRider[]): void {
    this._rawRidersCache = raw;
    localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(raw));
  }

  // Public joined getter — safe to call from UI.
  public getRiders(): Rider[] {
    const raw = this.getRawRiders();
    const profiles = this.getProfiles();
    return raw.map((r) => ({
      ...r,
      profile: profiles.find((p) => p.id === r.user_id),
    }));
  }

  public getRiderById(userId: string): Rider | undefined {
    return this.getRiders().find((r) => r.user_id === userId);
  }

  // FIX BUG 1: operate on raw riders, not joined objects.
  public setRiderOnlineStatus(userId: string, isOnline: boolean): void {
    const raw = this.getRawRiders();
    const updated = raw.map((r) =>
      r.user_id === userId ? { ...r, is_online: isOnline, updated_at: new Date().toISOString() } : r
    );
    this.saveRawRiders(updated);
    this.emitChange();
  }

  // FIX BUG 1: operate on raw riders, not joined objects.
  public updateRiderLocation(userId: string, lat: number, lng: number): void {
    const raw = this.getRawRiders();
    const updated = raw.map((r) =>
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
    this.saveRawRiders(updated);
    this.emitChange();
  }

  // -------------------------------------------------------------------------
  // Deliveries
  // -------------------------------------------------------------------------
  public getDeliveries(): Delivery[] {
    if (this._deliveriesCache) return this._deliveriesCache;
    try {
      const deliveries: Delivery[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DELIVERIES) || '[]');
      const profiles = this.getProfiles();
      const riders = this.getRiders();

      this._deliveriesCache = deliveries.map((d) => {
        const custProfile = profiles.find((p) => p.id === d.customer_id);
        const riderProfile = d.rider_id ? profiles.find((p) => p.id === d.rider_id) : undefined;
        const riderInfo = d.rider_id ? riders.find((r) => r.user_id === d.rider_id) : undefined;

        return {
          ...d,
          customer: custProfile,
          rider: riderProfile ? { ...riderProfile, rider_info: riderInfo } : undefined,
        };
      });
      return this._deliveriesCache;
    } catch {
      return INITIAL_DELIVERIES;
    }
  }

  public getDeliveryById(id: string): Delivery | undefined {
    return this.getDeliveries().find((d) => d.id === id);
  }

  private saveRawDeliveries(deliveries: Delivery[]): void {
    // Strip joined fields before persisting
    const raw = deliveries.map(({ customer: _c, rider: _r, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(raw));
    this._deliveriesCache = null;
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

      if (status === 'pending') {
        // Decline or return to queue: clear assignment
        patch.rider_id = undefined;
        patch.assigned_at = undefined;
      } else {
        if (status === 'assigned' && !d.assigned_at) patch.assigned_at = now;
        if (status === 'accepted' && !d.accepted_at) patch.accepted_at = now;
        if (status === 'picked_up' && !d.picked_up_at) patch.picked_up_at = now;
        if (status === 'delivered' && !d.delivered_at) patch.delivered_at = now;
      }

      return { ...d, ...patch };
    });

    this.saveRawDeliveries(updated);

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

    this.saveRawDeliveries(updated);
    this.addStatusHistory(deliveryId, 'assigned', adminId, `Manually assigned to rider ${rider?.full_name || riderId}`);

    // Create/activate chat thread between rider and customer
    const delivery = updated.find((d) => d.id === deliveryId);
    this.getOrCreateChatThread('rider_customer', deliveryId, riderId, delivery?.customer_id || '');

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
    this.saveRawDeliveries(deliveries);
    this.addStatusHistory(newDelivery.id, newDelivery.status, newDelivery.customer_id, 'Delivery created');
    this.emitChange();
    return newDelivery;
  }

  // -------------------------------------------------------------------------
  // Handover Acknowledgement
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Receipt Confirmations
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Status History
  // -------------------------------------------------------------------------
  public getStatusHistory(deliveryId?: string): DeliveryStatusHistory[] {
    if (!this._historyCache) {
      try {
        const history: DeliveryStatusHistory[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
        const profiles = this.getProfiles();
        this._historyCache = history.map((h) => ({
          ...h,
          changer: profiles.find((p) => p.id === h.changed_by),
        }));
      } catch {
        this._historyCache = INITIAL_STATUS_HISTORY;
      }
    }
    return deliveryId
      ? this._historyCache!.filter((h) => h.delivery_id === deliveryId)
      : this._historyCache!;
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
      this._historyCache = null;
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------------------
  // Chat Threads & Messages
  // -------------------------------------------------------------------------
  public getChatThreads(userId?: string): ChatThread[] {
    if (!this._threadsCache) {
      try {
        const threads: ChatThread[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.THREADS) || '[]');
        const messages = this.getChatMessages();
        const deliveries = this.getDeliveries();

        this._threadsCache = threads.map((t) => {
          const threadMsgs = messages.filter((m) => m.thread_id === t.id);
          const lastMessage = threadMsgs[threadMsgs.length - 1];
          const delivery = t.delivery_id ? deliveries.find((d) => d.id === t.delivery_id) : undefined;
          return { ...t, last_message: lastMessage, delivery };
        });
      } catch {
        this._threadsCache = INITIAL_CHAT_THREADS;
      }
    }

    return this._threadsCache!
      .map((t) => ({
        ...t,
        // Compute unread count per-caller so it's not baked into the cache
        unread_count: userId
          ? this.getChatMessages(t.id).filter((m) => m.sender_id !== userId && !m.read_at).length
          : 0,
      }))
      .filter((t) => {
        if (!userId) return true;
        if (t.delivery) {
          return t.delivery.customer_id === userId || t.delivery.rider_id === userId || this.getProfileById(userId)?.role === 'admin';
        }
        return true;
      });
  }

  public getChatMessages(threadId?: string): ChatMessage[] {
    if (!this._messagesCache) {
      try {
        const messages: ChatMessage[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
        const profiles = this.getProfiles();
        this._messagesCache = messages.map((m) => ({
          ...m,
          sender: profiles.find((p) => p.id === m.sender_id),
        }));
      } catch {
        this._messagesCache = INITIAL_CHAT_MESSAGES;
      }
    }
    return threadId
      ? this._messagesCache!.filter((m) => m.thread_id === threadId)
      : this._messagesCache!;
  }

  // FIX BUG 3: admin_rider threads are now keyed by (type, userAId, userBId)
  // so each rider/admin pair gets their own unique channel.
  public getOrCreateChatThread(
    type: 'admin_rider' | 'rider_customer',
    deliveryId: string | null,
    userAId: string,
    userBId: string
  ): ChatThread {
    const threads: ChatThread[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.THREADS) || '[]');
    let existing: ChatThread | undefined;

    if (type === 'rider_customer') {
      existing = threads.find((t) => t.type === 'rider_customer' && t.delivery_id === deliveryId);
    } else {
      // admin_rider: match both participants regardless of order
      existing = threads.find(
        (t) =>
          t.type === 'admin_rider' &&
          t.participant_a === userAId &&
          t.participant_b === userBId ||
          t.type === 'admin_rider' &&
          t.participant_a === userBId &&
          t.participant_b === userAId
      );
    }

    if (!existing) {
      existing = {
        id: `th-${Date.now()}`,
        type,
        delivery_id: deliveryId,
        participant_a: userAId,
        participant_b: userBId,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      threads.push(existing);
      localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
      this._threadsCache = null;
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
    this._messagesCache = null;
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
      this._messagesCache = null;
      this.emitChange();
    }
  }

  // -------------------------------------------------------------------------
  // Ratings
  // -------------------------------------------------------------------------
  public getRatings(riderId?: string): Rating[] {
    if (!this._ratingsCache) {
      try {
        const ratings: Rating[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATINGS) || '[]');
        const profiles = this.getProfiles();
        this._ratingsCache = ratings.map((r) => ({
          ...r,
          customer: profiles.find((p) => p.id === r.customer_id),
        }));
      } catch {
        this._ratingsCache = INITIAL_RATINGS;
      }
    }
    return riderId ? this._ratingsCache!.filter((r) => r.rider_id === riderId) : this._ratingsCache!;
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
    this._ratingsCache = null;

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

    // Always operate on the raw (un-joined) riders array
    const raw = this.getRawRiders();
    const updated = raw.map((r) =>
      r.user_id === riderId
        ? {
            ...r,
            avg_rating: avg || r.avg_rating,
            total_deliveries: deliveries.length,
            updated_at: new Date().toISOString(),
          }
        : r
    );
    this.saveRawRiders(updated);
  }

  // -------------------------------------------------------------------------
  // Onboarding Status
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Audit Log
  // -------------------------------------------------------------------------
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
