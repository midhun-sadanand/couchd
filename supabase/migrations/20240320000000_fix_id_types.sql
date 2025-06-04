-- First, list all policies that might be using these columns
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on the affected tables
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN (
            'friends', 
            'friend_requests', 
            'watchlists', 
            'watchlist_ownership', 
            'watchlist_sharing',
            'media_items',
            'profiles'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename
        );
    END LOOP;
END $$;

-- Drop existing foreign key constraints
ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;
ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_user_id_fkey;
ALTER TABLE public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey;
ALTER TABLE public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;
ALTER TABLE public.watchlists DROP CONSTRAINT IF EXISTS watchlists_user_id_fkey;
ALTER TABLE public.watchlist_ownership DROP CONSTRAINT IF EXISTS watchlist_ownership_user_id_fkey;
ALTER TABLE public.watchlist_sharing DROP CONSTRAINT IF EXISTS watchlist_sharing_shared_with_user_id_fkey;
ALTER TABLE public.media_items DROP CONSTRAINT IF EXISTS media_items_watchlist_id_fkey;

-- Change user-related columns to text
ALTER TABLE public.friends 
  ALTER COLUMN user_id TYPE text USING user_id::text,
  ALTER COLUMN friend_id TYPE text USING friend_id::text;

ALTER TABLE public.friend_requests
  ALTER COLUMN sender_id TYPE text USING sender_id::text,
  ALTER COLUMN receiver_id TYPE text USING receiver_id::text;

ALTER TABLE public.watchlists
  ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.watchlist_ownership
  ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.watchlist_sharing
  ALTER COLUMN shared_with_user_id TYPE text USING shared_with_user_id::text;

-- Re-add foreign key constraints
ALTER TABLE public.friends
  ADD CONSTRAINT friends_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.profiles(id),
  ADD CONSTRAINT friends_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.friend_requests
  ADD CONSTRAINT friend_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  ADD CONSTRAINT friend_requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id);

ALTER TABLE public.watchlists
  ADD CONSTRAINT watchlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.watchlist_ownership
  ADD CONSTRAINT watchlist_ownership_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.watchlist_sharing
  ADD CONSTRAINT watchlist_sharing_shared_with_user_id_fkey FOREIGN KEY (shared_with_user_id) REFERENCES public.profiles(id);

ALTER TABLE public.media_items
  ADD CONSTRAINT media_items_watchlist_id_fkey FOREIGN KEY (watchlist_id) REFERENCES public.watchlists(id);

-- Re-create RLS policies
CREATE POLICY "Allow users to manage their own profile"
ON public.profiles
FOR ALL
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Allow users to read any profile"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Allow user to manage their friendships"
ON public.friends
FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Allow users to manage their friend requests"
ON public.friend_requests
FOR ALL
USING (auth.uid()::text = sender_id OR auth.uid()::text = receiver_id)
WITH CHECK (auth.uid()::text = sender_id OR auth.uid()::text = receiver_id);

CREATE POLICY "Allow users to manage their watchlists"
ON public.watchlists
FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Allow users to manage their watchlist ownership"
ON public.watchlist_ownership
FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Allow users to manage their watchlist sharing"
ON public.watchlist_sharing
FOR ALL
USING (auth.uid()::text = shared_with_user_id)
WITH CHECK (auth.uid()::text = shared_with_user_id);

CREATE POLICY "Allow user to manage media in their watchlists"
ON public.media_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.watchlists w
    WHERE w.id = media_items.watchlist_id
    AND w.user_id = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.watchlists w
    WHERE w.id = media_items.watchlist_id
    AND w.user_id = auth.uid()::text
  )
); 