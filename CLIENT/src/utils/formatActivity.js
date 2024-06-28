const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diff = Math.abs(now - activityDate);
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else {
      return `${diffHours}h ago`;
    }
  };
  
  const formatActivity = (activity) => {
    let action;
    if (activity.status === 'to consume') {
      action = 'added';
    } else if (activity.status === 'consumed') {
      action = 'consumed';
    } else {
      action = 'updated';
    }
  
    return `${activity.added_by} ${action} "${activity.title}" to their watchlist "${activity.watchlists.name}" ${formatTimeAgo(activity.created_at)}`;
  };
  
  export { formatTimeAgo, formatActivity };
  