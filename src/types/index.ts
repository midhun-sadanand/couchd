export interface MediaItem {
  id: string;
  title: string;
  medium: string;
  length?: string;
  release_date?: string;
  created_at: string;
  synopsis?: string;
  image?: string;
  url?: string;
  creator?: string;
  status: string;
  notes?: string;
  rating?: number;
  owner_id?: string;
  owner_name?: string;
}

export interface WatchlistData {
  id: string;
  name: string;
  items: MediaItem[];
  owner_id: string;
  owner_name: string;
  is_shared: boolean;
}

export interface User {
  id: string;
  username: string;
  image_url?: string;
  email?: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender: User;
  receiver: User;
}

export interface SearchResult {
  id: string;
  title: string;
  medium: string;
  image?: string;
  url?: string;
  synopsis?: string;
  release_date?: string;
  length?: string;
  creator?: string;
}

export interface HoverState {
  profile: boolean;
  watchlists: boolean;
  friends: boolean;
}

export type MediumType = 'movie' | 'tv' | 'youtube' | 'book' | 'podcast';
export type StatusType = 'to consume' | 'consuming' | 'consumed' | 'dropped' | 'on hold'; 