-- Add missing fields to profiles table
-- Created: 2024-12-21

-- Add avatar_url and bio columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url) WHERE avatar_url IS NOT NULL;

-- Comment the columns
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user profile picture (signed URL from storage)';
COMMENT ON COLUMN public.profiles.bio IS 'User biography/description';

