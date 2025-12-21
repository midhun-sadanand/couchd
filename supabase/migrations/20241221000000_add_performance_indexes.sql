-- Performance optimization indexes for couchd
-- Created: 2024-12-21

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Watchlists table indexes
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_created_at ON watchlists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_created ON watchlists(user_id, created_at DESC);

-- Media items table indexes
CREATE INDEX IF NOT EXISTS idx_media_items_watchlist_id ON media_items(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_media_items_status ON media_items(status);
CREATE INDEX IF NOT EXISTS idx_media_items_added_by ON media_items(added_by);
CREATE INDEX IF NOT EXISTS idx_media_items_created_at ON media_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_items_watchlist_created ON media_items(watchlist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_items_watchlist_status ON media_items(watchlist_id, status);

-- Friends table indexes
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_friend ON friends(user_id, friend_id);

-- Friend requests table indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status ON friend_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_created_at ON friend_requests(created_at DESC);

-- Watchlist ownership indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_ownership_watchlist ON watchlist_ownership(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_ownership_user ON watchlist_ownership(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_ownership_both ON watchlist_ownership(watchlist_id, user_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_media_items_user_watchlist ON media_items(added_by, watchlist_id);

-- Text search indexes for faster LIKE queries
CREATE INDEX IF NOT EXISTS idx_profiles_username_text ON profiles USING gin(to_tsvector('english', username));
CREATE INDEX IF NOT EXISTS idx_media_items_title_text ON media_items USING gin(to_tsvector('english', title));

-- Add comments for documentation
COMMENT ON INDEX idx_profiles_username IS 'Speeds up profile lookups by username';
COMMENT ON INDEX idx_watchlists_user_created IS 'Optimizes user watchlist queries ordered by creation date';
COMMENT ON INDEX idx_media_items_watchlist_created IS 'Optimizes media item queries per watchlist ordered by date';
COMMENT ON INDEX idx_friend_requests_receiver_status IS 'Optimizes pending friend request queries';

