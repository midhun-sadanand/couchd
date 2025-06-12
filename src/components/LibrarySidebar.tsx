import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from '@geist-ui/icons';
import { useRouter } from 'next/navigation';
import { useCachedProfileData } from '@/hooks/useCachedProfileData';
import { useSignOut } from '@/utils/auth';
import { motion, useAnimation, useMotionValue } from 'framer-motion';

const SIDEBAR_WIDTH = 240;
const COLLAPSED_WIDTH = 56 + 16; // image width (56px) + padding/margin
const SNAP_POINTS = {
  closed: -SIDEBAR_WIDTH,
  collapsed: -(SIDEBAR_WIDTH - COLLAPSED_WIDTH),
  open: 0,
};

interface Watchlist {
  id: string;
  name: string;
  image?: string;
  ownerName: string;
}

interface LibrarySidebarProps {
  watchlists: Watchlist[];
  username: string;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const LibrarySidebar: React.FC<LibrarySidebarProps> = ({ 
  watchlists, 
  username, 
  sidebarOpen, 
  toggleSidebar 
}) => {
  const router = useRouter();
  const { userProfile } = useCachedProfileData();
  const signOut = useSignOut();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('/default-avatar.png');

  // build a motion value and controls
  const x = useMotionValue(sidebarOpen ? SNAP_POINTS.open : SNAP_POINTS.closed);
  const controls = useAnimation();

  // Helper: get current snap state robustly
  const getSnapState = (val: number) => {
    if (Math.abs(val - SNAP_POINTS.open) < 8) return 'open';
    if (Math.abs(val - SNAP_POINTS.collapsed) < 8) return 'collapsed';
    return 'closed';
  };

  // Always sync motion value to parent state when parent changes (open/closed only)
  useEffect(() => {
    const target = sidebarOpen ? SNAP_POINTS.open : SNAP_POINTS.closed;
    controls.start({
      x: target,
      transition: { type: 'spring', stiffness: 200, damping: 30 },
    });
    // Don't set x directly, let framer-motion animate
  }, [sidebarOpen, controls]);

  // drag end → snap to nearest point, then update parent if fully open/closed
  const handleDragEnd = (_e: unknown, info: any) => {
    const currentX = x.get();
    const nearest = Object.values(SNAP_POINTS).reduce((prev, curr) =>
      Math.abs(curr - currentX) < Math.abs(prev - currentX) ? curr : prev
    );
    controls.start({
      x: nearest,
      transition: { type: 'spring', stiffness: 200, damping: 30 },
    });
    const newState = getSnapState(nearest);
    // Only update parent state if fully open or closed
    if (newState === 'open' && !sidebarOpen) toggleSidebar();
    if (newState === 'closed' && sidebarOpen) toggleSidebar();
    // If collapsed, do not update parent state
  };

  // Subtle edge click: always fully open
  const handleEdgeClick = () => {
    controls.start({
      x: SNAP_POINTS.open,
      transition: { type: 'spring', stiffness: 200, damping: 30 },
    });
    if (!sidebarOpen) toggleSidebar();
  };

  useEffect(() => {
    if (userProfile && (userProfile as any)?.avatar_url) {
      const avatarUrlValue = (userProfile as any).avatar_url;
      if (typeof avatarUrlValue === 'string' && avatarUrlValue.startsWith('http')) {
        setAvatarUrl(avatarUrlValue);
      } else if (typeof avatarUrlValue === 'string') {
        // Try to get signed URL if not a direct link
        (async () => {
          try {
            const supabase = (await import('@/utils/auth')).useSupabase().client;
            const { data: { signedUrl }, error } = await supabase.storage.from('images').createSignedUrl(avatarUrlValue, 31536000);
            if (!error && signedUrl) setAvatarUrl(signedUrl);
          } catch {}
        })();
      }
    } else {
      setAvatarUrl('/default-avatar.png');
    }
  }, [userProfile]);

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popoverOpen]);

  // Helper: robust state
  const snap = getSnapState(x.get());
  const isCollapsed = snap === 'collapsed';
  const isOpen = snap === 'open';

  return (
    <div className="relative z-40">
      {/* subtle edge only when fully closed, always render sidebar for drag */}
      {snap === 'closed' && (
        <div
          className="fixed top-14 left-0 h-[calc(100vh-2rem)] w-2 bg-[#181818] hover:bg-[#232323] cursor-pointer z-50 rounded-r-lg transition-colors duration-200"
          style={{ margin: '8px 0 16px 0' }}
          onClick={handleEdgeClick}
        />
      )}
      <motion.div
        className="rounded-lg fixed top-14 left-0 h-[calc(100vh-2rem)] bg-[#181818] p-4 m-2 shadow-lg flex flex-col justify-between mb-4"
        style={{ width: SIDEBAR_WIDTH, x, opacity: snap === 'closed' ? 0 : 1, pointerEvents: snap === 'closed' ? 'none' : 'auto' }}
        animate={controls}
        drag="x"
        dragConstraints={{ left: SNAP_POINTS.closed, right: SNAP_POINTS.open }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        {/* Collapsed state: only show icon and images, nothing else */}
        {isCollapsed ? (
          <div
            className="flex flex-col items-center pt-4 h-full"
            style={{
              width: SIDEBAR_WIDTH,
              position: 'relative',
              left: SIDEBAR_WIDTH - COLLAPSED_WIDTH,
            }}
          >
            {/* Sidebar icon button */}
            <div className="w-full flex justify-end">
              <button onClick={toggleSidebar} className="mb-4 text-white">
                <Sidebar size={28} color="#f6f6f6" />
              </button>
            </div>
            {/* Watchlist images only */}
            <div className="flex flex-col items-center gap-4">
              {watchlists.map(list => (
                <img
                  key={list.id}
                  src={list.image || 'https://via.placeholder.com/150'}
                  alt={list.name}
                  className="w-14 h-14 object-cover rounded"
                  style={{ aspectRatio: '1/1' }}
                />
              ))}
            </div>
          </div>
        ) : (
          // Render full sidebar content for both open and closed (hidden when closed)
          <div style={{ opacity: snap === 'closed' ? 0 : 1, pointerEvents: snap === 'closed' ? 'none' : 'auto', height: '100%' }}>
            {/* Top: header + watchlists */}
            <div>
              <div className="flex justify-between items-center mb-4" style={{ marginTop: '-2px' }}>
                <h2 className="text-xl text-white">Your Library</h2>
                <button onClick={toggleSidebar} className="text-white">
                  <Sidebar size={28} color="#f6f6f6" />
                </button>
              </div>
              <ul>
                {watchlists.map(list => (
                  <li
                    key={list.id}
                    className="cursor-pointer mb-2 flex flex-col items-start text-[#f6f6f6]"
                    onClick={() =>
                      router.push(
                        `/list/${username}/${encodeURIComponent(list.name)}/${list.id}`
                      )
                    }
                  >
                    <div className="flex items-center">
                      <img
                        src={list.image || 'https://via.placeholder.com/150'}
                        alt={list.name}
                        className="w-14 h-14 object-cover rounded mr-2"
                        style={{ aspectRatio: '1/1' }}
                      />
                      <div>
                        <div className="text-lg font-semibold">{list.name}</div>
                        <div className="text-sm text-gray-400">
                          Playlist • {list.ownerName}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* Bottom: divider, profile, sign‐out popover */}
            <div className="w-full mt-2">
              <hr className="border-t border-[#444] my-2" />
              <div
                className="flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[#232323] transition-colors"
                onClick={() => setPopoverOpen(v => !v)}
              >
                <img
                  src={avatarUrl}
                  alt={userProfile?.username || 'Profile'}
                  className="w-10 h-10 rounded-full object-cover border border-[#444]"
                  onError={e => (e.currentTarget.src = '/default-avatar.png')}
                />
                <span className="text-[#f6f6f6] font-semibold text-base truncate max-w-[100px]">
                  {userProfile?.username || ''}
                </span>
              </div>
              {popoverOpen && (
                <div
                  ref={popoverRef}
                  className="absolute left-1/2 -translate-x-1/2 mb-20 bg-[#232323] rounded-lg p-4 z-50 min-w-[180px] flex flex-col items-center animate-fade-in-up shadow-lg"
                  style={{ transition: 'opacity 0.2s', bottom: '90px' }}
                >
                  <button
                    onClick={signOut}
                    className="w-full py-2 px-4 rounded-lg bg-[#363636] text-[#f87171] font-semibold hover:bg-[#232323] hover:text-red-400 transition-colors duration-200 focus:outline-none"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LibrarySidebar; 