-- Add an index on user_id for watchlists to optimize and document querying by user_id
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);

-- Add an index on user_id for friends to optimize and document querying by user_id
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);

-- (Optional) Add a composite index for friends if you often query both user_id and friend_id together
CREATE INDEX IF NOT EXISTS idx_friends_user_id_friend_id ON public.friends(user_id, friend_id);