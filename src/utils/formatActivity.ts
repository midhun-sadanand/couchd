interface Activity {
  title: string;
  status: string;
  created_at: string;
  added_by: string;
  watchlist_id: string;
  watchlists: {
    name: string;
  };
}

export const formatActivity = (activity: Activity, username: string, containerWidth: number): string => {
  const { title, status, created_at, added_by, watchlists } = activity;
  const date = new Date(created_at).toLocaleDateString();
  const time = new Date(created_at).toLocaleTimeString();
  const watchlistName = watchlists ? watchlists.name : 'Unknown Watchlist';
  const isCurrentUser = added_by === username;

  return `${isCurrentUser ? 'You' : added_by} ${status} ${title} in ${watchlistName} on ${date} at ${time}`;
}; 