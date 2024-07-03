import { useQuery } from '@tanstack/react-query';

const fetchSharedUsers = async ({ queryKey }) => {
  const userIds = queryKey[1];
  const response = await fetch('http://localhost:3001/api/get-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch shared users');
  }

  const sharedUsersData = await response.json();
  return sharedUsersData;
};

export const useSharedUsers = (userIds) => {
  return useQuery({
    queryKey: ['sharedUsers', userIds],
    queryFn: fetchSharedUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userIds && userIds.length > 0, // Ensure the query runs only when there are user IDs
  });
};
