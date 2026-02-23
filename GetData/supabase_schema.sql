-- Supabase schema for electricity pricing data
-- Run this in the Supabase SQL Editor

-- Table: providers
CREATE TABLE providers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  adjustment_factor numeric,
  created_at timestamptz DEFAULT now()
);

-- Table: plans
CREATE TABLE plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  tariff_type text NOT NULL CHECK (tariff_type IN (
    'Σταθερό Τιμολόγιο',
    'Κυμαινόμενο Τιμολόγιο',
    'Ειδικό Τιμολόγιο',
    'Δυναμικό Τιμολόγιο'
  )),
  price_per_kwh numeric,
  monthly_fee_eur numeric,
  social_tariff boolean DEFAULT true NOT NULL,
  source text DEFAULT 'energycost.gr',
  scraped_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, plan_name)
);

-- Indexes
CREATE INDEX idx_plans_provider ON plans(provider_id);
CREATE INDEX idx_plans_tariff_type ON plans(tariff_type);
CREATE INDEX idx_plans_price ON plans(price_per_kwh) WHERE price_per_kwh IS NOT NULL;

-- Row Level Security (read-only for frontend)
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read providers" ON providers FOR SELECT USING (true);
CREATE POLICY "Public read plans" ON plans FOR SELECT USING (true);
