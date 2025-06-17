import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from '@geist-ui/icons';
import { useRouter } from 'next/navigation';
import { useCachedProfileData } from '@/hooks/useCachedProfileData';
import { useSignOut } from '@/utils/auth';

const COLLAPSED_WIDTH = 78; // 75% of 104
const IMAGE_SIZE = 48; // 75% of 64
const PROFILE_SIZE = 48; // 12 * 4 px (w-12 h-12)
const SIDEBAR_MARGIN = 16; // px, for top/bottom margin
const SIDEBAR_RADIUS = 16; // px, for border radius

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (userProfile && (userProfile as any)?.avatar_url) {
      const avatarUrlValue = (userProfile as any).avatar_url;
      if (typeof avatarUrlValue === 'string' && avatarUrlValue.startsWith('http')) {
        setAvatarUrl(avatarUrlValue);
      } else if (typeof avatarUrlValue === 'string') {
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

  return (
    <div className="relative z-40">
      {/* subtle edge only when fully closed */}
      {!sidebarOpen && (
        <div
          className="fixed top-14 left-0 w-2 bg-[#181818] cursor-pointer z-50 rounded-r-lg"
          style={{
            margin: `${SIDEBAR_MARGIN}px 0 ${SIDEBAR_MARGIN}px 0`,
            height: 'calc(100vh - 5.5rem)',
            transition: 'background 0.2s',
          }}
          onClick={toggleSidebar}
        />
      )}
      <div
        className={`fixed top-14 left-0 bg-[#181818] px-3 m-2 shadow-lg flex flex-col mb-4 border border-[#232323] transition-transform duration-300 z-50 ${sidebarOpen ? 'translate-x-[12px]' : '-translate-x-40'}`}
        style={{
          width: COLLAPSED_WIDTH,
          minWidth: COLLAPSED_WIDTH,
          borderRadius: `${SIDEBAR_RADIUS}px`,
          margin: `${SIDEBAR_MARGIN}px 0 ${SIDEBAR_MARGIN}px 0`,
          height: 'calc(100vh - 5.5rem)',
          bottom: 'auto',
          boxSizing: 'border-box',
          pointerEvents: sidebarOpen ? 'auto' : 'none',
          cursor: sidebarOpen ? 'pointer' : 'default',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}
        onClick={e => {
          if ((e.target as HTMLElement).closest('.profile-popover, .watchlist-tooltip')) return;
          toggleSidebar();
        }}
      >
        {/* Watchlist images at the very top */}
        <div className="flex flex-col items-center gap-3" style={{ minHeight: '0', marginTop: 15, paddingTop: 0 }}>
          {watchlists.map(list => (
            <div
              key={list.id}
              className="relative group"
              onMouseEnter={() => setHoveredId(list.id)}
              onMouseLeave={() => { setHoveredId(null); setTooltipPos(null); }}
              onMouseMove={e => {
                if (hoveredId === list.id) {
                  const sidebarRect = (e.currentTarget as HTMLElement).closest('.fixed')?.getBoundingClientRect();
                  setTooltipPos({
                    x: e.clientX - (sidebarRect?.left ?? 0),
                    y: e.clientY - (sidebarRect?.top ?? 0)
                  });
                }
              }}
              style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
            >
              <img
                src={list.image || 'https://via.placeholder.com/150'}
                alt={list.name}
                className="rounded shadow-md border border-[#232323] bg-[#222] cursor-pointer transition-colors duration-150 group-hover:bg-[#181818]"
                style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, objectFit: 'cover', aspectRatio: '1/1' }}
                onClick={e => {
                  e.stopPropagation();
                  router.push(`/list/${username}/${encodeURIComponent(list.name)}/${list.id}`);
                }}
              />
              {/* Tooltip/indicator for watchlist name */}
              {hoveredId === list.id && tooltipPos && (
                <div
                  className="watchlist-tooltip fixed px-3 py-1 bg-[#232323] text-xs text-[#f6f6f6] rounded shadow-lg border border-[#333] whitespace-nowrap z-50 animate-fade-in-up pointer-events-none"
                  style={{
                    left: tooltipPos.x + 12,
                    top: tooltipPos.y + 12,
                    minWidth: '80px',
                    textAlign: 'center',
                    position: 'fixed',
                    transform: 'none',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  {list.name}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {/* Bottom: profile, sign‐out popover, absolutely positioned */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: SIDEBAR_MARGIN, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <hr className="w-12 border-t border-[#333] mb-2" style={{ margin: '0 auto', marginBottom: 5 }} />
          <div
            className="profile-popover flex flex-col items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-[#232323] transition-colors"
            onClick={e => { e.stopPropagation(); setPopoverOpen(v => !v); }}
          >
            <img
              src={avatarUrl}
              alt={userProfile?.username || 'Profile'}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#444] shadow"
              style={{ width: PROFILE_SIZE, height: PROFILE_SIZE }}
              onError={e => (e.currentTarget.src = '/default-avatar.png')}
            />
          </div>
          {popoverOpen && (
            <div
              ref={popoverRef}
              className="absolute left-1/2 -translate-x-1/2 mb-20 bg-[#232323] rounded-lg p-4 z-50 min-w-[180px] flex flex-col items-center animate-fade-in-up shadow-lg"
              style={{ transition: 'opacity 0.2s', bottom: '90px' }}
              onClick={e => e.stopPropagation()}
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
    </div>
  );
};

export default LibrarySidebar; 