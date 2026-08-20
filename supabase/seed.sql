-- ==============================================================================
-- DELIVERY TRACKING PROGRESSIVE WEB APP
-- Seed Script: Demo Profiles, Deliveries, Chat, and History
-- ==============================================================================

-- 1. Profiles & Role Seed
-- Admin
INSERT INTO public.profiles (id, full_name, phone, role, avatar_url)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Admin Dispatcher (HQ)', '+256700112233', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- Riders
INSERT INTO public.profiles (id, full_name, phone, role, avatar_url)
VALUES 
    ('r0000000-0000-0000-0000-000000000001', 'John Mukasa', '+256772123456', 'rider', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
    ('r0000000-0000-0000-0000-000000000002', 'Sarah Nabukeera', '+256782987654', 'rider', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
    ('r0000000-0000-0000-0000-000000000003', 'David Ochieng', '+256701456789', 'rider', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- Customers
INSERT INTO public.profiles (id, full_name, phone, role, avatar_url)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'Grace Tumusiime', '+256750334455', 'customer', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'),
    ('c0000000-0000-0000-0000-000000000002', 'Michael Kato', '+256775667788', 'customer', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150'),
    ('c0000000-0000-0000-0000-000000000003', 'Brenda Akello', '+256702889900', 'customer', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- 2. Riders Fleet Info
INSERT INTO public.riders (user_id, vehicle_type, license_plate, is_online, current_lat, current_lng, last_location_at, avg_rating, total_deliveries)
VALUES
    ('r0000000-0000-0000-0000-000000000001', 'Yamaha DT 125', 'UFE 234X', true, 0.3182, 32.5811, NOW(), 4.9, 142),
    ('r0000000-0000-0000-0000-000000000002', 'TVS Apache RTR', 'UGL 882P', true, 0.3340, 32.6020, NOW(), 4.8, 98),
    ('r0000000-0000-0000-0000-000000000003', 'Bajaj Boxer 150', 'UHG 519T', false, 0.2990, 32.5580, NOW() - INTERVAL '2 hours', 4.7, 65)
ON CONFLICT (user_id) DO UPDATE SET is_online = EXCLUDED.is_online, current_lat = EXCLUDED.current_lat, current_lng = EXCLUDED.current_lng;

-- 3. Customers Defaults
INSERT INTO public.customers (user_id, default_address, default_lat, default_lng)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Plot 14 Acacia Avenue, Kololo, Kampala', 0.3312, 32.5875),
    ('c0000000-0000-0000-0000-000000000002', 'Block 24, Naguru Hill Drive, Kampala', 0.3450, 32.6050),
    ('c0000000-0000-0000-0000-000000000003', 'Plot 8 Kampala Road, Central Business District', 0.3138, 32.5815)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Deliveries Seed
-- Delivery 1: In Transit (Active Tracking demo for Grace Tumusiime & John Mukasa)
INSERT INTO public.deliveries (
    id, order_reference, sap_byd_document_id, customer_id, rider_id,
    pickup_address, pickup_lat, pickup_lng,
    dropoff_address, dropoff_lat, dropoff_lng,
    delivery_notes, status, estimated_delivery_at,
    assigned_at, accepted_at, picked_up_at
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'ORD-2026-8801',
    'SAP-OD-90214',
    'c0000000-0000-0000-0000-000000000001',
    'r0000000-0000-0000-0000-000000000001',
    'Industrial Area Logistics Hub, 7th Street, Kampala', 0.3150, 32.5980,
    'Plot 14 Acacia Avenue, Kololo, Kampala', 0.3312, 32.5875,
    'Fragile medical supplies. Call on arrival at main security gate.',
    'in_transit',
    NOW() + INTERVAL '18 minutes',
    NOW() - INTERVAL '40 minutes',
    NOW() - INTERVAL '35 minutes',
    NOW() - INTERVAL '20 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Delivery 2: Pending (Available for dispatch / Rider queue demo)
INSERT INTO public.deliveries (
    id, order_reference, sap_byd_document_id, customer_id, rider_id,
    pickup_address, pickup_lat, pickup_lng,
    dropoff_address, dropoff_lat, dropoff_lng,
    delivery_notes, status, estimated_delivery_at
) VALUES (
    'd0000000-0000-0000-0000-000000000002',
    'ORD-2026-8802',
    'SAP-OD-90215',
    'c0000000-0000-0000-0000-000000000002',
    NULL,
    'Nakawa Business Park, Warehouse B', 0.3310, 32.6180,
    'Block 24, Naguru Hill Drive, Kampala', 0.3450, 32.6050,
    'Client requested contactless dropoff at reception desk.',
    'pending',
    NOW() + INTERVAL '55 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Delivery 3: Assigned & Accepted (Ready for Handover acknowledgement)
INSERT INTO public.deliveries (
    id, order_reference, sap_byd_document_id, customer_id, rider_id,
    pickup_address, pickup_lat, pickup_lng,
    dropoff_address, dropoff_lat, dropoff_lng,
    delivery_notes, status, estimated_delivery_at,
    assigned_at, accepted_at
) VALUES (
    'd0000000-0000-0000-0000-000000000003',
    'ORD-2026-8803',
    'SAP-OD-90218',
    'c0000000-0000-0000-0000-000000000003',
    'r0000000-0000-0000-0000-000000000002',
    'Garden City Mall Depot, Yusuf Lule Rd', 0.3200, 32.5890,
    'Plot 8 Kampala Road, Central Business District', 0.3138, 32.5815,
    'Legal documents envelope. Verify recipient identity before handover.',
    'accepted',
    NOW() + INTERVAL '35 minutes',
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '10 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Delivery 4: Delivered & Unrated (Ready for Customer rating prompt demo)
INSERT INTO public.deliveries (
    id, order_reference, sap_byd_document_id, customer_id, rider_id,
    pickup_address, pickup_lat, pickup_lng,
    dropoff_address, dropoff_lat, dropoff_lng,
    delivery_notes, status, estimated_delivery_at,
    assigned_at, accepted_at, picked_up_at, delivered_at
) VALUES (
    'd0000000-0000-0000-0000-000000000004',
    'ORD-2026-8799',
    'SAP-OD-90199',
    'c0000000-0000-0000-0000-000000000001',
    'r0000000-0000-0000-0000-000000000001',
    'Industrial Area Logistics Hub, 7th Street, Kampala', 0.3150, 32.5980,
    'Plot 14 Acacia Avenue, Kololo, Kampala', 0.3312, 32.5875,
    'Urgent replacement parts.',
    'delivered',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '2 hours 50 mins',
    NOW() - INTERVAL '2 hours 20 mins',
    NOW() - INTERVAL '1 hour 15 mins'
) ON CONFLICT (id) DO NOTHING;

-- 5. Delivery Acknowledgement for Delivery 1
INSERT INTO public.delivery_acknowledgements (
    id, delivery_id, rider_id, photo_url, notes, acknowledged_at
) VALUES (
    'ack00000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'r0000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300',
    'Package sealed, barcode intact.',
    NOW() - INTERVAL '20 minutes'
) ON CONFLICT (id) DO NOTHING;

-- 6. Receipt Confirmation for Delivery 4
INSERT INTO public.receipt_confirmations (
    id, delivery_id, confirmed_by, confirmed_by_user_id, recipient_name, confirmed_at
) VALUES (
    'rc000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000004',
    'customer_app',
    'c0000000-0000-0000-0000-000000000001',
    'Grace Tumusiime',
    NOW() - INTERVAL '1 hour 15 mins'
) ON CONFLICT (id) DO NOTHING;

-- 7. Chat Threads & Messages
-- Active Thread between Rider John Mukasa & Customer Grace Tumusiime
INSERT INTO public.chat_threads (id, type, delivery_id, is_active)
VALUES (
    'th000000-0000-0000-0000-000000000001',
    'rider_customer',
    'd0000000-0000-0000-0000-000000000001',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.chat_participants (thread_id, user_id)
VALUES 
    ('th000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001'),
    ('th000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (thread_id, user_id) DO NOTHING;

INSERT INTO public.chat_messages (id, thread_id, sender_id, content, created_at)
VALUES
    ('m0000000-0000-0000-0000-000000000001', 'th000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'Hello Grace! I have picked up your order and I am en route now.', NOW() - INTERVAL '15 minutes'),
    ('m0000000-0000-0000-0000-000000000002', 'th000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Thank you John! Please notify security at Gate B when you arrive.', NOW() - INTERVAL '12 minutes'),
    ('m0000000-0000-0000-0000-000000000003', 'th000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'Understood, will do so. About 10 mins away.', NOW() - INTERVAL '5 minutes')
ON CONFLICT (id) DO NOTHING;

-- Admin & Rider Thread
INSERT INTO public.chat_threads (id, type, delivery_id, is_active)
VALUES (
    'th000000-0000-0000-0000-000000000002',
    'admin_rider',
    NULL,
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.chat_participants (thread_id, user_id)
VALUES 
    ('th000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
    ('th000000-0000-0000-0000-000000000002', 'r0000000-0000-0000-0000-000000000001')
ON CONFLICT (thread_id, user_id) DO NOTHING;

INSERT INTO public.chat_messages (id, thread_id, sender_id, content, created_at)
VALUES
    ('m0000000-0000-0000-0000-000000000004', 'th000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'John, please note road works near Jinja Rd roundabout. Use Lugogo bypass if congested.', NOW() - INTERVAL '45 minutes'),
    ('m0000000-0000-0000-0000-000000000005', 'th000000-0000-0000-0000-000000000002', 'r0000000-0000-0000-0000-000000000001', 'Got it, taking the Kololo bypass now. Thanks HQ.', NOW() - INTERVAL '38 minutes')
ON CONFLICT (id) DO NOTHING;
