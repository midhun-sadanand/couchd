-- Drop existing policies
DROP POLICY IF EXISTS "Allow user to manage their friendships" ON public.friends;
DROP POLICY IF EXISTS "Allow users to read friendships where they are the friend" ON public.friends;

-- Create a policy that allows users to manage their own friendships (where they are user_id)
CREATE POLICY "Allow user to manage their friendships"
ON public.friends
FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Create a policy that allows users to read and insert friendships where they are the friend
CREATE POLICY "Allow users to read and insert friendships where they are the friend"
ON public.friends
FOR SELECT
USING (auth.uid()::text = friend_id);

CREATE POLICY "Allow users to insert friendships where they are the friend"
ON public.friends
FOR INSERT
WITH CHECK (auth.uid()::text = friend_id);

-- Create a policy that allows users to delete friendships where they are the friend
CREATE POLICY "Allow users to delete friendships where they are the friend"
ON public.friends
FOR DELETE
USING (auth.uid()::text = friend_id); 