-- SQL to update all "Guest" entries in media_items to your username
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rqectbjbsthqwwhpydeq/editor

-- Step 1: Check your current profile username (no email column in profiles table)
SELECT id, username, created_at FROM profiles WHERE username = 'midhun_sadanand' OR username LIKE '%midhun%';

-- Step 2: Update all "Guest" entries to your username
-- IMPORTANT: Replace 'YOUR_USER_ID' with your actual user ID from Step 1
UPDATE media_items 
SET added_by = 'midhun_sadanand' 
WHERE added_by = 'Guest' 
  AND watchlist_id IN (
    SELECT id FROM watchlists WHERE user_id = 'YOUR_USER_ID'
  );

-- Step 3: Verify the update worked
SELECT added_by, COUNT(*) as count 
FROM media_items 
GROUP BY added_by 
ORDER BY count DESC;

-- Alternative: If you want to update ALL "Guest" entries regardless of watchlist:
-- UPDATE media_items SET added_by = 'midhun_sadanand' WHERE added_by = 'Guest';

-- Alternative: If your username in profiles is different (like 'midhun'), use that:
-- UPDATE media_items 
-- SET added_by = (SELECT username FROM profiles WHERE id = 'YOUR_USER_ID')
-- WHERE added_by = 'Guest' 
--   AND watchlist_id IN (SELECT id FROM watchlists WHERE user_id = 'YOUR_USER_ID');

-- BONUS: Add missing columns to profiles table (avatar_url, bio)
-- These columns are needed for EditProfileModal to work properly
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
