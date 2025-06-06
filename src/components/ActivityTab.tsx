import React, { useRef, useEffect, useState } from 'react';
import useRecentActivity from '../hooks/useRecentActivity';
import { formatActivity } from '../utils/formatActivity';

interface ActivityTabProps {
  username: string;
}

const ActivityTab: React.FC<ActivityTabProps> = ({ username }) => {
  const activities = useRecentActivity();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const updateContainerWidth = () => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  };

  useEffect(() => {
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-[#232323] rounded-md p-2 text-white w-full">
      <h3 className="text-lg text-[#e6e6e6] font-semibold mb-1 text-left">Recent Activity</h3>
      <ul>
        {activities.map((activity, index) => (
          <li key={index} className="mb-1">
            {formatActivity(activity, username, containerWidth)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityTab; 