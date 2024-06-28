import { useEffect, useState, useContext } from 'react';
import { SupabaseContext } from '../utils/auth';

const useRecentActivity = () => {
  const { client: supabase } = useContext(SupabaseContext);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      const { data, error } = await supabase
        .from('media_items')
        .select('title, status, created_at, added_by, watchlist_id, watchlists(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent activity:', error);
      } else {
        setActivities(data);
      }
    };

    fetchRecentActivity();
  }, [supabase]);

  return activities;
};

export default useRecentActivity;
