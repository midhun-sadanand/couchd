-- Drop existing foreign key constraints that reference profiles.id
ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;
ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_user_id_fkey;
ALTER TABLE public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey;
ALTER TABLE public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;
ALTER TABLE public.watchlists DROP CONSTRAINT IF EXISTS watchlists_user_id_fkey;
ALTER TABLE public.watchlist_ownership DROP CONSTRAINT IF EXISTS watchlist_ownership_user_id_fkey;
ALTER TABLE public.watchlist_sharing DROP CONSTRAINT IF EXISTS watchlist_sharing_shared_with_user_id_fkey;

-- Drop RLS policies that depend on profiles.id
DROP POLICY IF EXISTS "Allow users to manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow user to manage their friendships" ON public.friends;
DROP POLICY IF EXISTS "Allow users to manage their friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Allow users to manage their watchlists" ON public.watchlists;

-- Change profiles.id to text type
ALTER TABLE public.profiles 
  ALTER COLUMN id TYPE text USING id::text;

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