import React from 'react';
import useRecentActivity from '../utils/useRecentActivity';
import { formatActivity } from '../utils/formatActivity';

const RecentActivity = () => {
  const activities = useRecentActivity();

  return (
    <div className="bg-[#0a0a0d] p-4 text-white">
      <h2 className="text-2xl mb-4">Recent Activity</h2>
      <ul>
        {activities.map((activity, index) => (
          <li key={index} className="mb-2">
            {formatActivity(activity)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity;
