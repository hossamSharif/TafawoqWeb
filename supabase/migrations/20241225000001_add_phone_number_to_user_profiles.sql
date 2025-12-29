-- Migration: Add phone number support to user profiles for Google OAuth
-- Created: 2024-12-25
-- Description: Adds phone_number, phone_verified, auth_provider, and profile_completed columns

-- Add phone number columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN phone_number TEXT,
ADD COLUMN phone_verified BOOLEAN DEFAULT false,
ADD COLUMN auth_provider TEXT DEFAULT 'email',
ADD COLUMN profile_completed BOOLEAN DEFAULT true;

-- Create index for phone number lookups
CREATE INDEX idx_user_profiles_phone_number
ON public.user_profiles(phone_number)
WHERE phone_number IS NOT NULL;

-- Add unique constraint for phone numbers
ALTER TABLE public.user_profiles
ADD CONSTRAINT unique_phone_number UNIQUE (phone_number);

-- Add check constraint for Saudi phone number format (966 + 5 + 8 digits)
ALTER TABLE public.user_profiles
ADD CONSTRAINT check_saudi_phone_format
CHECK (
  phone_number IS NULL OR
  phone_number ~ '^966[5][0-9]{8}$'
);

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.phone_number IS 'User phone number in E.164 format without + (e.g., 966501234567). Saudi mobile numbers only.';
COMMENT ON COLUMN public.user_profiles.phone_verified IS 'Whether the phone number has been verified via SMS OTP (Phase 2 feature). Auto-verified in Phase 1.';
COMMENT ON COLUMN public.user_profiles.auth_provider IS 'Authentication provider used: email (email/password), google (Google OAuth)';
COMMENT ON COLUMN public.user_profiles.profile_completed IS 'Whether user has completed all required profile fields. False for users needing phone number.';

-- Mark existing email users as needing phone completion
-- This ensures existing users will be prompted to add their phone on next login
UPDATE public.user_profiles
SET profile_completed = false
WHERE phone_number IS NULL;
