-- GoRV.ai Database Schema
-- Run this in Supabase SQL Editor

-- RV Park Owners
CREATE TABLE IF NOT EXISTS gorv_parks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL UNIQUE,
  owner_user_id UUID REFERENCES auth.users(id),
  venmo_username TEXT,
  address TEXT,
  timezone TEXT DEFAULT 'America/Chicago',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual Pedestals at a Park
CREATE TABLE IF NOT EXISTS gorv_pedestals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id UUID REFERENCES gorv_parks(id) ON DELETE CASCADE,
  pedestal_number INTEGER NOT NULL,
  amp_rating INTEGER DEFAULT 30 CHECK (amp_rating IN (30, 50)),
  has_water BOOLEAN DEFAULT true,
  water_device_id TEXT,
  electric_device_id TEXT,
  price_day_cents INTEGER DEFAULT 3500,
  price_week_cents INTEGER DEFAULT 20000,
  price_month_cents INTEGER DEFAULT 65000,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(park_id, pedestal_number)
);

-- Active / Historical Stay Sessions
CREATE TABLE IF NOT EXISTS gorv_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedestal_id UUID REFERENCES gorv_pedestals(id) ON DELETE CASCADE,
  park_id UUID REFERENCES gorv_parks(id) ON DELETE CASCADE,
  guest_email TEXT,
  guest_phone TEXT,
  guest_name TEXT,
  duration TEXT NOT NULL CHECK (duration IN ('day', 'week', 'month')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'venmo',
  payment_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'extended')),
  water_on BOOLEAN DEFAULT false,
  electric_on BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transaction Ledger
CREATE TABLE IF NOT EXISTS gorv_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES gorv_sessions(id) ON DELETE CASCADE,
  park_id UUID REFERENCES gorv_parks(id) ON DELETE CASCADE,
  gross_amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  net_to_owner_cents INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'venmo',
  payment_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- IoT Command Log (for debugging and audit)
CREATE TABLE IF NOT EXISTS gorv_iot_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedestal_id UUID REFERENCES gorv_pedestals(id) ON DELETE CASCADE,
  session_id UUID REFERENCES gorv_sessions(id),
  command TEXT NOT NULL CHECK (command IN ('activate', 'deactivate')),
  device_type TEXT NOT NULL CHECK (device_type IN ('water', 'electric', 'both')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'confirmed', 'failed')),
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gorv_pedestals_park ON gorv_pedestals(park_id);
CREATE INDEX IF NOT EXISTS idx_gorv_pedestals_status ON gorv_pedestals(status);
CREATE INDEX IF NOT EXISTS idx_gorv_sessions_pedestal ON gorv_sessions(pedestal_id);
CREATE INDEX IF NOT EXISTS idx_gorv_sessions_park ON gorv_sessions(park_id);
CREATE INDEX IF NOT EXISTS idx_gorv_sessions_status ON gorv_sessions(status);
CREATE INDEX IF NOT EXISTS idx_gorv_sessions_end_time ON gorv_sessions(end_time) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_gorv_transactions_park ON gorv_transactions(park_id);
CREATE INDEX IF NOT EXISTS idx_gorv_transactions_session ON gorv_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_gorv_parks_owner ON gorv_parks(owner_user_id);

-- RLS Policies
ALTER TABLE gorv_parks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gorv_pedestals ENABLE ROW LEVEL SECURITY;
ALTER TABLE gorv_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gorv_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gorv_iot_commands ENABLE ROW LEVEL SECURITY;

-- Public read for pedestals (guests need to see pricing via QR)
CREATE POLICY "Public can read pedestals" ON gorv_pedestals
  FOR SELECT USING (true);

CREATE POLICY "Public can read parks" ON gorv_parks
  FOR SELECT USING (true);

-- Public can create sessions (guests creating a booking)
CREATE POLICY "Public can create sessions" ON gorv_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read own session" ON gorv_sessions
  FOR SELECT USING (true);

-- Park owners can manage their own data
CREATE POLICY "Owners manage their parks" ON gorv_parks
  FOR ALL USING (owner_user_id = auth.uid());

CREATE POLICY "Owners manage their pedestals" ON gorv_pedestals
  FOR ALL USING (park_id IN (SELECT id FROM gorv_parks WHERE owner_user_id = auth.uid()));

CREATE POLICY "Owners manage their sessions" ON gorv_sessions
  FOR ALL USING (park_id IN (SELECT id FROM gorv_parks WHERE owner_user_id = auth.uid()));

CREATE POLICY "Owners view their transactions" ON gorv_transactions
  FOR SELECT USING (park_id IN (SELECT id FROM gorv_parks WHERE owner_user_id = auth.uid()));

CREATE POLICY "Service role full access to iot_commands" ON gorv_iot_commands
  FOR ALL USING (true);

-- Seed data: Demo park + pedestals
INSERT INTO gorv_parks (id, name, owner_name, owner_email, venmo_username, address, timezone)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'West Texas RV Ranch',
  'Cody McMurray',
  'cody@westtexasai.com',
  'CodyMcMurray',
  '123 Ranch Road, Midland, TX 79701',
  'America/Chicago'
) ON CONFLICT (owner_email) DO NOTHING;

-- Seed 6 pedestals
INSERT INTO gorv_pedestals (park_id, pedestal_number, amp_rating, has_water, price_day_cents, price_week_cents, price_month_cents)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 1, 30, true, 3500, 20000, 65000),
  ('a0000000-0000-0000-0000-000000000001', 2, 30, true, 3500, 20000, 65000),
  ('a0000000-0000-0000-0000-000000000001', 3, 50, true, 4500, 25000, 80000),
  ('a0000000-0000-0000-0000-000000000001', 4, 50, true, 4500, 25000, 80000),
  ('a0000000-0000-0000-0000-000000000001', 5, 30, true, 3500, 20000, 65000),
  ('a0000000-0000-0000-0000-000000000001', 6, 30, false, 3000, 17000, 55000)
ON CONFLICT (park_id, pedestal_number) DO NOTHING;
