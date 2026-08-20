export type Role = 'rider' | 'customer' | 'admin';

export type DeliveryStatus = 
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export type ConfirmationSource = 'customer_app' | 'rider_on_behalf';

export type ThreadType = 'admin_rider' | 'rider_customer';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rider {
  user_id: string;
  vehicle_type: string | null;
  license_plate: string | null;
  is_online: boolean;
  current_lat: number | null;
  current_lng: number | null;
  last_location_at: string | null;
  avg_rating: number;
  total_deliveries: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Customer {
  user_id: string;
  default_address: string | null;
  default_lat: number | null;
  default_lng: number | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Delivery {
  id: string;
  order_reference: string;
  sap_byd_document_id: string | null;
  customer_id: string;
  rider_id: string | null;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  delivery_notes: string | null;
  status: DeliveryStatus;
  estimated_delivery_at: string | null;
  assigned_at: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  customer?: Profile;
  rider?: Profile & { rider_info?: Rider };
}

export interface DeliveryStatusHistory {
  id: string;
  delivery_id: string;
  status: DeliveryStatus;
  changed_by: string;
  note: string | null;
  created_at: string;
  changer?: Profile;
}

export interface DeliveryAcknowledgement {
  id: string;
  delivery_id: string;
  rider_id: string;
  photo_url: string | null;
  notes: string | null;
  acknowledged_at: string;
}

export interface ReceiptConfirmation {
  id: string;
  delivery_id: string;
  confirmed_by: ConfirmationSource;
  confirmed_by_user_id: string;
  recipient_name: string | null;
  signature_url: string | null;
  confirmed_at: string;
}

export interface ChatThread {
  id: string;
  type: ThreadType;
  delivery_id: string | null;
  is_active: boolean;
  created_at: string;
  participants?: Profile[];
  last_message?: ChatMessage;
  unread_count?: number;
  delivery?: Delivery;
}

export interface ChatParticipant {
  thread_id: string;
  user_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  sender?: Profile;
}

export interface Rating {
  id: string;
  delivery_id: string;
  customer_id: string;
  rider_id: string;
  stars: number;
  comment: string | null;
  tags: string[] | null;
  created_at: string;
  customer?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'assignment' | 'message' | 'status_change' | 'rating_prompt';
  related_delivery_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface OnboardingStatus {
  user_id: string;
  has_seen_tutorial: boolean;
  seen_at: string | null;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  target_table: string;
  target_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
  actor?: Profile;
}
