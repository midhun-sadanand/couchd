"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@/utils/auth';
import { useSupabaseClient } from '@/utils/auth';
import WatchlistWidget from './WatchlistWidget';
import AddWatchlistModal from './AddWatchlistModal';
import { Plus } from '@geist-ui/icons';

interface WatchlistListProps {
  userId?: string;
  isFriendSidebarOpen?: boolean;
  isLibrarySidebarOpen?: boolean;
}

const WatchlistList: React.FC<WatchlistListProps> = ({ userId, isFriendSidebarOpen = false, isLibrarySidebarOpen = false }) => {
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabaseClient();
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [availableWidth, setAvailableWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [tab, setTab] = useState<'all' | 'created' | 'shared'>('all');
  const [sharedWatchlists, setSharedWatchlists] = useState<any[]>([]);
  const [createdWatchlists, setCreatedWatchlists] = useState<any[]>([]);

  useEffect(() => {
    const updateAvailableWidth = () => {
      const librarySidebarWidth = isLibrarySidebarOpen ? 240 : 0;
      const friendSidebarWidth = isFriendSidebarOpen ? 320 : 0;
      setAvailableWidth(window.innerWidth - librarySidebarWidth - friendSidebarWidth);
    };
    updateAvailableWidth();
    window.addEventListener('resize', updateAvailableWidth);
    return () => window.removeEventListener('resize', updateAvailableWidth);
  }, [isFriendSidebarOpen, isLibrarySidebarOpen]);

  // Fetch created and shared watchlists
  useEffect(() => {
    const fetchWatchlists = async () => {
      setLoading(true);
      setError(null);
      try {
        const uid = userId || user?.id;
        if (!uid) return;
        console.log('Fetching watchlists for user:', uid);
        
        // Query ALL rows from watchlist_sharing
        console.log('Executing watchlist_sharing query for ALL rows...');
        const { data: allSharingRows, error: allSharingError } = await supabase
          .from('watchlist_sharing')
          .select('*');
        
        if (allSharingError) {
          console.error('Error checking ALL watchlist_sharing rows:', allSharingError);
          console.error('Error details:', {
            message: allSharingError.message,
            details: allSharingError.details,
            hint: allSharingError.hint,
            code: allSharingError.code
          });
        } else {
          console.log('ALL watchlist_sharing rows:', allSharingRows);
          console.log('Total number of sharing rows:', allSharingRows?.length || 0);
          if (allSharingRows) {
            console.log('All sharing rows details:', allSharingRows.map((row: { id: string; shared_with_user_id: string; watchlist_id: string }) => ({
              id: row.id,
              shared_with_user_id: row.shared_with_user_id,
              watchlist_id: row.watchlist_id
            })));
          }
        }

        // Now check for our specific user
        console.log('\nNow checking for specific user:', uid);
        const { data: sharingCheck, error: sharingCheckError } = await supabase
          .from('watchlist_sharing')  
          .select('*')
          .eq('shared_with_user_id', uid);
        
        if (sharingCheckError) {
          console.error('Error checking watchlist_sharing:', sharingCheckError);
          console.error('Error details:', {
            message: sharingCheckError.message,
            details: sharingCheckError.details,
            hint: sharingCheckError.hint,
            code: sharingCheckError.code
          });
        } else {
          console.log('Direct watchlist_sharing check:', sharingCheck);
          console.log('Number of sharing rows found:', sharingCheck?.length || 0);
          if (sharingCheck) {
            console.log('Sharing rows details:', sharingCheck.map((row: { id: string; shared_with_user_id: string; watchlist_id: string }) => ({
              id: row.id,
              shared_with_user_id: row.shared_with_user_id,
              watchlist_id: row.watchlist_id
            })));
          }
        }

        // If we have sharing rows, get the watchlists
        let sharedWatchlists: any[] = [];
        if (sharingCheck && sharingCheck.length > 0) {
          const watchlistIds = sharingCheck.map((row: { watchlist_id: string }) => row.watchlist_id);
          console.log('Watchlist IDs from sharing table:', watchlistIds);
          
          // First, let's check if these watchlists exist at all
          console.log('Checking if watchlists exist...');
          const { data: watchlistsCheck, error: watchlistsCheckError } = await supabase
            .from('watchlists')
            .select('id')
            .in('id', watchlistIds);
          
          if (watchlistsCheckError) {
            console.error('Error checking watchlists existence:', watchlistsCheckError);
          } else {
            console.log('Found watchlists:', watchlistsCheck);
          }

          console.log('Executing watchlists query...');
          const { data: watchlistsData, error: watchlistsError } = await supabase
            .from('watchlists')
            .select(`
              id,
              name,
              description,
              to_consume_count,
              consuming_count,
              consumed_count,
              tags,
              user_id,
              profiles!inner (
                username
              ),
              image
            `)
            .in('id', watchlistIds);

          if (watchlistsError) {
            console.error('Error fetching watchlists:', watchlistsError);
            console.error('Error details:', {
              message: watchlistsError.message,
              details: watchlistsError.details,
              hint: watchlistsError.hint,
              code: watchlistsError.code
            });
          } else {
            console.log('Raw watchlists data:', watchlistsData);
            console.log('Number of watchlists found:', watchlistsData?.length || 0);
            
            if (watchlistsData) {
              sharedWatchlists = watchlistsData.map((wl: any) => {
                console.log('Processing watchlist:', wl);
                return {
                  ...wl,
                  ownerUsername: wl.profiles?.username,
                  isShared: true
                };
              });
              console.log('Transformed shared watchlists:', sharedWatchlists);
            }
          }
        }

        // Created by you
        const { data: created, error: createdError } = await supabase
          .from('watchlists')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false });
        if (createdError) throw createdError;
        console.log('Created watchlists:', created);

        // Parse tags for each watchlist
        const parseTags = (wl: any) => {
          let tags: string[] = [];
          if (wl.tags) {
            try {
              tags = Array.isArray(wl.tags) ? wl.tags : JSON.parse(wl.tags);
            } catch {
              if (typeof wl.tags === 'string') {
                tags = wl.tags.split(',').map((t: string) => t.trim());
              } else {
                tags = [];
              }
            }
          }
          return { ...wl, tags };
        };

        const createdParsed = (created || []).map(parseTags);
        const sharedParsed = (sharedWatchlists || []).map(parseTags);
        
        setCreatedWatchlists(createdParsed);
        setSharedWatchlists(sharedParsed);
        
        // Set tag options
        const allTags = new Set<string>();
        [...createdParsed, ...sharedParsed].forEach(wl => (wl.tags || []).forEach((tag: string) => allTags.add(tag)));
        setOptions([...allTags].map(tag => ({ label: tag, value: tag })));
      } catch (err: any) {
        console.error('Error in fetchWatchlists:', err);
        setError(err.message || 'Failed to load watchlists');
      } finally {
        setLoading(false);
      }
    };
    if ((userId || user) && supabase) fetchWatchlists();
  }, [userId, user, supabase]);

  // Responsive grid columns
  const calculateGridCols = (width: number) => {
    if (width >= 1200) return 4;
    if (width >= 960) return 3;
    if (width >= 720) return 2;
    return 1;
  };
  const gridCols = calculateGridCols(availableWidth);

  // Tab selector UI
  const tabButton = (label: string, value: 'all' | 'created' | 'shared') => (
    <button
      className={`px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 ${tab === value ? 'bg-[#232323] text-[#e6e6e6] border-b-2 border-[#e6e6e6]' : 'bg-[#181818] text-gray-400'}`}
      onClick={() => setTab(value)}
    >
      {label}
    </button>
  );

  let displayWatchlists: any[] = [];
  if (tab === 'all') {
    // Deduplicate by id
    const all = [...createdWatchlists, ...sharedWatchlists];
    const seen = new Set();
    displayWatchlists = all.filter(wl => {
      if (seen.has(wl.id)) return false;
      seen.add(wl.id);
      return true;
    });
  } else if (tab === 'created') {
    displayWatchlists = createdWatchlists;
  } else if (tab === 'shared') {
    displayWatchlists = sharedWatchlists;
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#e6e6e6] bg-[#232323]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#e6e6e6] mb-4"></div>
        <span>Loading your watchlists...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!user && !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#e6e6e6]">
        You must be logged in to view your watchlists.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#232323]" style={{ padding: '0 16px' }}>
      <h1 className="text-6xl my-10 text-[#e6e6e6] font-bold text-center">
        Your Watchlists
      </h1>
      {/* Tab Selector */}
      <div className="flex space-x-2 mb-8">
        {tabButton('All', 'all')}
        {tabButton('Created by You', 'created')}
        {tabButton('Shared with You', 'shared')}
      </div>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          width: '100%',
          maxWidth: '1200px',
          justifyContent: 'center',
          justifyItems: 'center',
        }}
      >
        {displayWatchlists.length === 0 ? (
          <div className="col-span-full text-gray-400 text-xl text-center mt-20">
            {tab === 'created' && 'You have not created any watchlists yet.'}
            {tab === 'shared' && 'No watchlists have been shared with you yet.'}
            {tab === 'all' && 'No watchlists to display.'}
            <br />
            Click the <span className="inline-block align-middle"><Plus color="#e6e6e6" /></span> button below to create one!
          </div>
        ) : (
          displayWatchlists.map((list: any) => (
            <WatchlistWidget
              key={list.id}
              watchlistId={list.id}
              username={list.isShared ? list.ownerUsername : (user?.username || user?.email || '')}
              listName={list.name}
              description={list.description}
              unwatchedCount={list.to_consume_count}
              watchingCount={list.consuming_count}
              watchedCount={list.consumed_count}
              tags={list.tags || []}
              image={list.image || ''}
              deleteWatchlist={() => {}} // Implement as needed
            />
          ))
        )}
      </div>
      {/* Floating Add Button */}
      <button
        className="plus-button fixed bottom-8 right-8 bg-[#232323] rounded-full shadow-lg p-4 hover:bg-[#333] transition"
        onClick={() => setShowModal(true)}
        style={{ zIndex: 50 }}
        aria-label="Add Watchlist"
      >
        <Plus color="#e6e6e6" size={32} />
      </button>
      <AddWatchlistModal
        user={user}
        visible={showModal}
        onClose={() => setShowModal(false)}
        options={options}
        setOptions={setOptions}
        setWatchlists={setWatchlists}
        watchlists={displayWatchlists}
      />
    </div>
  );
};

export default WatchlistList; 