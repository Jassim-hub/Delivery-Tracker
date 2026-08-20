-- ==============================================================================
-- DELIVERY TRACKING PROGRESSIVE WEB APP
-- Migration 03: Functions, Triggers & Automated Calculations
-- ==============================================================================

-- 1. Function & Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_riders_updated_at
    BEFORE UPDATE ON public.riders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_deliveries_updated_at
    BEFORE UPDATE ON public.deliveries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Function & Trigger to automatically recalculate rider rating & total deliveries
CREATE OR REPLACE FUNCTION public.recalculate_rider_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_rider_id UUID;
    v_avg NUMERIC(2,1);
    v_count INT;
BEGIN
    v_rider_id := NEW.rider_id;

    -- Calculate average rating
    SELECT COALESCE(ROUND(AVG(stars)::numeric, 1), 0.0)
    INTO v_avg
    FROM public.ratings
    WHERE rider_id = v_rider_id;

    -- Calculate total completed deliveries
    SELECT COUNT(*)
    INTO v_count
    FROM public.deliveries
    WHERE rider_id = v_rider_id AND status = 'delivered';

    -- Update riders table
    UPDATE public.riders
    SET avg_rating = v_avg,
        total_deliveries = v_count,
        updated_at = NOW()
    WHERE user_id = v_rider_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_ratings_after_insert
    AFTER INSERT OR UPDATE ON public.ratings
    FOR EACH ROW EXECUTE FUNCTION public.recalculate_rider_rating();

-- 3. Function & Trigger to log delivery status changes automatically
CREATE OR REPLACE FUNCTION public.log_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.delivery_status_history (
            delivery_id,
            status,
            changed_by,
            note
        ) VALUES (
            NEW.id,
            NEW.status,
            COALESCE(auth.uid(), NEW.rider_id, NEW.customer_id),
            'Status transitioned to ' || NEW.status::text
        );
        
        -- Update milestone timestamps
        IF NEW.status = 'assigned' AND NEW.assigned_at IS NULL THEN
            NEW.assigned_at := NOW();
        ELSIF NEW.status = 'accepted' AND NEW.accepted_at IS NULL THEN
            NEW.accepted_at := NOW();
        ELSIF NEW.status = 'picked_up' AND NEW.picked_up_at IS NULL THEN
            NEW.picked_up_at := NOW();
        ELSIF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN
            NEW.delivered_at := NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_deliveries_status_change
    BEFORE UPDATE ON public.deliveries
    FOR EACH ROW EXECUTE FUNCTION public.log_delivery_status_change();
