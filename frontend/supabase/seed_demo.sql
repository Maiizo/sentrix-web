-- =============================================================================
-- Sentrix: Demo Account Database Seed Script
-- Run this script in the Supabase SQL Editor to seed demo data in the database
-- for the demo account (demo@sentrix.my.id).
-- =============================================================================

DO $$
DECLARE
  demo_user_id uuid;
  demo_email text := 'demo@sentrix.my.id';
  grp_server_id uuid := '11111111-1111-1111-1111-111111111111';
  grp_east_id   uuid := '22222222-2222-2222-2222-222222222222';
  dev_crac01_id uuid := 'aaaaaaaa-1111-1111-1111-111111111111';
  dev_crac02_id uuid := 'aaaaaaaa-2222-2222-2222-222222222222';
  dev_split3f_id uuid := 'bbbbbbbb-1111-1111-1111-111111111111';
  dev_split4f_id uuid := 'bbbbbbbb-2222-2222-2222-222222222222';
BEGIN
  -- 1. Find or create demo user ID from auth.users or public.users
  SELECT id INTO demo_user_id FROM auth.users WHERE email = demo_email LIMIT 1;
  
  IF demo_user_id IS NULL THEN
    SELECT id INTO demo_user_id FROM public.users WHERE email = demo_email LIMIT 1;
  END IF;

  IF demo_user_id IS NULL THEN
    -- Fallback to any first user or generate a dedicated demo uuid
    SELECT id INTO demo_user_id FROM public.users LIMIT 1;
    IF demo_user_id IS NULL THEN
      demo_user_id := '00000000-0000-0000-0000-000000000001';
      INSERT INTO public.users (id, email, name, role)
      VALUES (demo_user_id, demo_email, 'Demo Administrator', 'ADMIN')
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  -- Ensure public.users profile exists
  INSERT INTO public.users (id, email, name, role)
  VALUES (demo_user_id, demo_email, 'Demo Administrator', 'ADMIN')
  ON CONFLICT (id) DO UPDATE SET name = 'Demo Administrator';

  -- 2. Seed Groups for demo user
  INSERT INTO public.groups (id, user_id, name, mesh_id, description)
  VALUES 
    (grp_server_id, demo_user_id, 'Main Server Room', 'A1B2C3D4E5F6', 'Precision AC circuits cooling core server racks'),
    (grp_east_id,   demo_user_id, 'East Wing AC Panel', 'F6E5D4C3B2A1', 'Split-system AC MCBs serving east wing offices')
  ON CONFLICT (id) DO UPDATE 
    SET user_id = EXCLUDED.user_id, name = EXCLUDED.name, mesh_id = EXCLUDED.mesh_id;

  -- 3. Seed Devices
  INSERT INTO public.devices (id, mac_address, pin_code, name, group_id, status, calibration_started_at, calibration_ends_at)
  VALUES
    (dev_crac01_id, '246F28A13C01', '482913', 'CRAC Unit 01 · MCB', grp_server_id, 'ACTIVE', now() - interval '30 days', now() - interval '23 days'),
    (dev_crac02_id, '246F28A13C02', '715204', 'CRAC Unit 02 · MCB', grp_server_id, 'CALIBRATING', now() - interval '2 days', now() + interval '5 days'),
    (dev_split3f_id, '246F28B7910A', '390671', 'Split AC 3F-East · MCB', grp_east_id, 'ACTIVE', now() - interval '21 days', now() - interval '14 days'),
    (dev_split4f_id, '246F28B7910B', '604158', 'Split AC 4F-East · MCB', grp_east_id, 'OFFLINE', now() - interval '21 days', now() - interval '14 days')
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name, group_id = EXCLUDED.group_id, status = EXCLUDED.status;

  -- 4. Seed Alerts
  DELETE FROM public.alerts WHERE device_id IN (dev_crac01_id, dev_split3f_id);

  INSERT INTO public.alerts (id, device_id, "timestamp", actual_value, expected_max, expected_min, severity, is_resolved, user_feedback)
  VALUES
    (gen_random_uuid(), dev_crac01_id, now() - interval '2 hours', 21.4, 16.5, 11.8, 'CRITICAL', false, null),
    (gen_random_uuid(), dev_split3f_id, now() - interval '9 hours', 12.1, 11.0, 7.5, 'WARNING', false, null),
    (gen_random_uuid(), dev_split3f_id, now() - interval '3 days', 5.9, 11.0, 7.5, 'WARNING', true, true);

  -- 5. Seed Telemetry & Prediction Bounds
  DELETE FROM public.telemetry WHERE device_id IN (dev_crac01_id, dev_split3f_id);

  INSERT INTO public.telemetry (device_id, "timestamp", rms_current)
  SELECT 
    dev_crac01_id,
    now() - (n || ' minutes')::interval,
    14.2 + sin(n::double precision / 10.0) * 1.5
  FROM generate_series(0, 120) AS n;

  INSERT INTO public.telemetry (device_id, "timestamp", rms_current)
  SELECT 
    dev_split3f_id,
    now() - (n || ' minutes')::interval,
    9.6 + cos(n::double precision / 15.0) * 1.2
  FROM generate_series(0, 120) AS n;

  RAISE NOTICE 'Demo data successfully seeded for user %', demo_user_id;
END $$;
