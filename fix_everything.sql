-- =====================================================
-- COMPREHENSIVE FIX SQL FOR COUCHD
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- STEP 1: Add missing columns to profiles table
-- This is required for EditProfileModal to work
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- STEP 2: Check your user ID and current username
SELECT id, username, avatar_url, bio, created_at 
FROM profiles 
WHERE username LIKE '%midhun%' 
ORDER BY created_at DESC;

-- STEP 3: Update your username to 'midhun_sadanand' (if needed)
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual ID from Step 2
-- UPDATE profiles 
-- SET username = 'midhun_sadanand' 
-- WHERE id = 'YOUR_USER_ID_HERE';

-- STEP 4: Fix all "Guest" entries in media_items
-- Option A: Update only items in YOUR watchlists (safer - recommended)
UPDATE media_items 
SET added_by = 'midhun_sadanand' 
WHERE added_by = 'Guest' 
  AND watchlist_id IN (
    SELECT id FROM watchlists 
    WHERE user_id = 'YOUR_USER_ID_HERE'  -- Replace with your ID from Step 2
  );

-- Option B: Update ALL "Guest" entries (if you're the only user)
-- Uncomment this if you want to use it instead of Option A:
-- UPDATE media_items SET added_by = 'midhun_sadanand' WHERE added_by = 'Guest';

-- STEP 5: Verify everything worked
SELECT 'Profiles Check' as check_type, COUNT(*) as count FROM profiles WHERE username = 'midhun_sadanand'
UNION ALL
SELECT 'Guest Items Remaining', COUNT(*) FROM media_items WHERE added_by = 'Guest'
UNION ALL
SELECT 'midhun_sadanand Items', COUNT(*) FROM media_items WHERE added_by = 'midhun_sadanand';

-- STEP 6: View breakdown by added_by
SELECT added_by, COUNT(*) as count 
FROM media_items 
GROUP BY added_by 
ORDER BY count DESC;

