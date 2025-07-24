-- Drop legacy tables
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.profiles;

-- Create unified users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  password_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_customer_id TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Client-only fields
  business_name TEXT,
  establishment_type TEXT,
  location TEXT,
  referral_code TEXT,
  -- Guard-only fields
  gender TEXT,
  dob DATE,
  experience_level TEXT,
  years_experience INT,
  bio TEXT,
  certifications JSONB,
  emergency_contact TEXT,
  availability TEXT
); 