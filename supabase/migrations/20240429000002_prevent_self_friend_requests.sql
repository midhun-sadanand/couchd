-- Add check constraint to prevent self friend requests
ALTER TABLE public.friend_requests
ADD CONSTRAINT prevent_self_friend_requests
CHECK (sender_id != receiver_id);

-- Add check constraint to prevent self friendships
ALTER TABLE public.friends
ADD CONSTRAINT prevent_self_friendships
CHECK (user_id != friend_id); 