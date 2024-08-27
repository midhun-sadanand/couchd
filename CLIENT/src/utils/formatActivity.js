import React from 'react';

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

const truncate = (str, num) => {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
};

const formatActivity = (activity, currentUsername, availableWidth = 500) => {
  let action;
  if (activity.status === 'to consume') {
    action = 'added';
  } else if (activity.status === 'consumed') {
    action = 'consumed';
  } else {
    action = 'updated';
  }

  const username = activity.added_by === currentUsername ? 'You' : activity.added_by;

  // Estimate the length of the time ago text
  const timeAgoText = formatTimeAgo(activity.created_at);
  const timeAgoWidth = timeAgoText.length * 8; // Approximate width of each character

  // Available width for the activity text
  const textAvailableWidth = availableWidth - timeAgoWidth - 100; // Extra padding for other text elements

  // Determine the length to truncate based on available width
  const titleLength = Math.max(Math.floor((textAvailableWidth * 0.6) / 10), 20); // 60% of available width
  const watchlistLength = Math.max(Math.floor((textAvailableWidth * 0.3) / 10), 15); // 30% of available width

  const truncatedTitle = truncate(activity.title, titleLength);
  const truncatedWatchlist = truncate(activity.watchlists.name, watchlistLength);

  return (
    <div className="bg-[#232323] p-2 rounded-lg mb-1">
      <div className="flex justify-between items-center py-1">
        <div className="truncate">
          <span className="font-bold text-[#8899aa]">{username}</span>{' '}
          <span className="text-[#6b7280]">{action} </span>
          <span className="font-bold text-[#f6f6f6]">{`"${truncatedTitle}"`}</span>{' '}
          <span className="text-[#6b7280]">to </span>
          <span className="font-bold text-[#f6f6f6]">{`"${truncatedWatchlist}"`}</span>
        </div>
        <div className="text-[#6b7280] ml-2 whitespace-nowrap">{timeAgoText}</div>
      </div>
      <hr className="border-gray-600" />
    </div>
  );
};

export { formatTimeAgo, formatActivity };
