-- ==============================================================================
-- DELIVERY TRACKING PROGRESSIVE WEB APP
-- Migration 02: Row Level Security (RLS) Policies
-- ==============================================================================

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. Profiles Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. Riders Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "riders_select_authenticated" ON public.riders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "riders_update_own_or_admin" ON public.riders
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "riders_insert_own_or_admin" ON public.riders
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. Customers Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "customers_select_own_or_admin_or_rider" ON public.customers
    FOR SELECT TO authenticated USING (
        auth.uid() = user_id OR public.is_admin() OR EXISTS (
            SELECT 1 FROM public.deliveries
            WHERE customer_id = customers.user_id AND rider_id = auth.uid()
        )
    );

CREATE POLICY "customers_update_own_or_admin" ON public.customers
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "customers_insert_own" ON public.customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. Deliveries Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "deliveries_select_scoped" ON public.deliveries
    FOR SELECT USING (
        public.is_admin() OR
        customer_id = auth.uid() OR
        rider_id = auth.uid() OR
        (status = 'pending')
    );

CREATE POLICY "deliveries_insert_admin_only" ON public.deliveries
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "deliveries_update_rider_or_admin" ON public.deliveries
    FOR UPDATE USING (
        public.is_admin() OR
        rider_id = auth.uid() OR
        (status = 'pending' AND rider_id IS NULL)
    );

-- ------------------------------------------------------------------------------
-- 5. Delivery Status History Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "status_history_select_scoped" ON public.delivery_status_history
    FOR SELECT USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.deliveries d
            WHERE d.id = delivery_id AND (d.customer_id = auth.uid() OR d.rider_id = auth.uid())
        )
    );

CREATE POLICY "status_history_insert_rider_or_admin" ON public.delivery_status_history
    FOR INSERT WITH CHECK (
        public.is_admin() OR changed_by = auth.uid()
    );

-- ------------------------------------------------------------------------------
-- 6. Delivery Acknowledgements Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "acknowledgements_select_scoped" ON public.delivery_acknowledgements
    FOR SELECT USING (
        public.is_admin() OR rider_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.deliveries d
            WHERE d.id = delivery_id AND d.customer_id = auth.uid()
        )
    );

CREATE POLICY "acknowledgements_insert_rider_or_admin" ON public.delivery_acknowledgements
    FOR INSERT WITH CHECK (
        public.is_admin() OR rider_id = auth.uid()
    );

-- ------------------------------------------------------------------------------
-- 7. Receipt Confirmations Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "receipt_confirmations_select_scoped" ON public.receipt_confirmations
    FOR SELECT USING (
        public.is_admin() OR confirmed_by_user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.deliveries d
            WHERE d.id = delivery_id AND (d.customer_id = auth.uid() OR d.rider_id = auth.uid())
        )
    );

CREATE POLICY "receipt_confirmations_insert_authorized" ON public.receipt_confirmations
    FOR INSERT WITH CHECK (
        public.is_admin() OR confirmed_by_user_id = auth.uid()
    );

-- ------------------------------------------------------------------------------
-- 8. Chat Threads & Participants Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "chat_threads_select_participants" ON public.chat_threads
    FOR SELECT USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.thread_id = id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "chat_participants_select_members" ON public.chat_participants
    FOR SELECT USING (
        public.is_admin() OR user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.chat_participants cp2
            WHERE cp2.thread_id = thread_id AND cp2.user_id = auth.uid()
        )
    );

CREATE POLICY "chat_participants_insert_authorized" ON public.chat_participants
    FOR INSERT WITH CHECK (
        public.is_admin() OR user_id = auth.uid()
    );

-- ------------------------------------------------------------------------------
-- 9. Chat Messages Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "chat_messages_select_thread_members" ON public.chat_messages
    FOR SELECT USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.thread_id = chat_messages.thread_id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "chat_messages_insert_sender" ON public.chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.thread_id = chat_messages.thread_id AND cp.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 10. Ratings Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "ratings_select_all_authenticated" ON public.ratings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ratings_insert_customer_only" ON public.ratings
    FOR INSERT WITH CHECK (
        customer_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.deliveries d
            WHERE d.id = delivery_id AND d.customer_id = auth.uid() AND d.status = 'delivered'
        )
    );

-- ------------------------------------------------------------------------------
-- 11. Notifications Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_admin_or_system" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 12. Onboarding Status Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "onboarding_select_own" ON public.onboarding_status
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "onboarding_upsert_own" ON public.onboarding_status
    FOR ALL USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 13. Audit Log Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "audit_log_select_admin" ON public.audit_log
    FOR SELECT USING (public.is_admin());

CREATE POLICY "audit_log_insert_admin" ON public.audit_log
    FOR INSERT WITH CHECK (public.is_admin() OR actor_id = auth.uid());
