-- ==============================================================================
-- DELIVERY TRACKING PROGRESSIVE WEB APP
-- Migration 01: Initial Schema (Types, Tables, Constraints & Indexes)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE role_enum AS ENUM ('rider', 'customer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status_enum AS ENUM (
        'pending',
        'assigned',
        'accepted',
        'picked_up',
        'in_transit',
        'delivered',
        'failed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE confirmation_source_enum AS ENUM ('customer_app', 'rider_on_behalf');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE thread_type_enum AS ENUM ('admin_rider', 'rider_customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role role_enum NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Riders Table (1:1 with profiles where role = 'rider')
CREATE TABLE IF NOT EXISTS public.riders (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_type TEXT DEFAULT 'Motorcycle',
    license_plate TEXT,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    last_location_at TIMESTAMPTZ,
    avg_rating NUMERIC(2,1) NOT NULL DEFAULT 0.0,
    total_deliveries INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Customers Table (1:1 with profiles where role = 'customer')
CREATE TABLE IF NOT EXISTS public.customers (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    default_address TEXT,
    default_lat DOUBLE PRECISION,
    default_lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Deliveries Table
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_reference TEXT NOT NULL UNIQUE,
    sap_byd_document_id TEXT,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    rider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    pickup_address TEXT NOT NULL,
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lng DOUBLE PRECISION NOT NULL,
    dropoff_address TEXT NOT NULL,
    dropoff_lat DOUBLE PRECISION NOT NULL,
    dropoff_lng DOUBLE PRECISION NOT NULL,
    delivery_notes TEXT,
    status delivery_status_enum NOT NULL DEFAULT 'pending',
    estimated_delivery_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Delivery Status History Table (Audit timeline)
CREATE TABLE IF NOT EXISTS public.delivery_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    status delivery_status_enum NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Delivery Acknowledgements Table (Rider handover acceptance)
CREATE TABLE IF NOT EXISTS public.delivery_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    photo_url TEXT,
    notes TEXT,
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Receipt Confirmations Table ("Received" flow)
CREATE TABLE IF NOT EXISTS public.receipt_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    confirmed_by confirmation_source_enum NOT NULL,
    confirmed_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    recipient_name TEXT,
    signature_url TEXT,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Chat Threads Table
CREATE TABLE IF NOT EXISTS public.chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type thread_type_enum NOT NULL,
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Chat Participants Table
CREATE TABLE IF NOT EXISTS public.chat_participants (
    thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (thread_id, user_id)
);

-- 11. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- 12. Ratings Table
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL UNIQUE REFERENCES public.deliveries(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    rider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
    comment TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL, -- 'assignment', 'message', 'status_change', 'rating_prompt'
    related_delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Onboarding Status Table
CREATE TABLE IF NOT EXISTS public.onboarding_status (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    has_seen_tutorial BOOLEAN NOT NULL DEFAULT FALSE,
    seen_at TIMESTAMPTZ
);

-- 15. Audit Log Table (Admin action accountability)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_customer_id ON public.deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_rider_id ON public.deliveries(rider_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_riders_is_online ON public.riders(is_online);
