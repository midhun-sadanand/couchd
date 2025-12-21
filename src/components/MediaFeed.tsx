import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { MediaItem } from '@/types';
import { useSupabase } from '@/utils/auth';
import Rating from './Rating';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { Layout as GeistLayout } from '@geist-ui/icons';
import { Responsive, WidthProvider } from 'react-grid-layout';
import NotesInput from './NotesInput';
import { debounce } from 'lodash';
import { Rnd } from 'react-rnd';
import MediaInfoPanel from './MediaInfoPanel';
import { useUpdateMedia, useUpdateMediaRating } from '@/hooks/useMediaMutations';

interface MediaFeedProps {
  userId: string;
  selectedMedia?: MediaItem | null;
  setSelectedMedia?: (item: MediaItem | null) => void;
  username: string;
}

const ResponsiveGridLayout = WidthProvider(Responsive);

const layouts = {
  lg: [
    { i: 'notes', x: 0, y: 0, w: 8, h: 12, minW: 4, minH: 8 },
    { i: 'video', x: 8, y: 0, w: 4, h: 9, minW: 3, minH: 5 }
  ],
  md: [
    { i: 'notes', x: 0, y: 0, w: 8, h: 12, minW: 4, minH: 8 },
    { i: 'video', x: 8, y: 0, w: 4, h: 9, minW: 3, minH: 5 }
  ],
  sm: [
    { i: 'notes', x: 0, y: 0, w: 1, h: 12, minW: 1, minH: 8 },
    { i: 'video', x: 0, y: 12, w: 1, h: 9,  minW: 1, minH: 5 }
  ],
};
const breakpoints = { lg: 1200, md: 996, sm: 768 };
const cols =        { lg: 12,   md: 12,   sm: 1   };

const VIDEO_ASPECT = 16 / 9;
const GRID_SIZE = 20;
const HEADER_HEIGHT = 48;
const VERTICAL_PADDING = 24;
const CONTAINER_PADDING = 24;
const BOTTOM_PADDING = 24; // Minimum distance from bottom of any panel to container edge
const STACK_BREAKPOINT = 1024;   // px – start stacking below this width

const getDefaultLayout = (width: number, height: number = 800) => {
  // Ensure padding on all 4 sides
  const totalHorizontalPadding = CONTAINER_PADDING * 2; // Left and right padding
  const innerWidth = width - totalHorizontalPadding;
  const innerHeight = height - CONTAINER_PADDING * 2;
  const gap = 24;
  
  if (width < STACK_BREAKPOINT) {
    // Mobile: stacked, each panel takes full width with padding on all sides
    const panelWidth = innerWidth;
    return {
      notes: { 
        x: CONTAINER_PADDING, 
        y: CONTAINER_PADDING, 
        width: panelWidth, 
        height: Math.max(innerHeight * 0.4, 260) 
      },
      video: { 
        x: CONTAINER_PADDING, 
        y: Math.max(innerHeight * 0.4, 260) + CONTAINER_PADDING + 20, 
        width: panelWidth, 
        height: Math.max(innerHeight * 0.5, 220) 
      }
    };
  } else {
    // Desktop: side by side with padding on all sides
    const availableWidth = innerWidth - gap;
    const notesWidth = Math.floor(availableWidth * 0.62);
    const videoWidth = availableWidth - notesWidth;
    
    return {
      notes: { 
        x: CONTAINER_PADDING, 
        y: CONTAINER_PADDING, 
        width: Math.max(notesWidth, 380), 
        height: Math.max(innerHeight * 0.7, 340) 
      },
      video: { 
        x: CONTAINER_PADDING + Math.max(notesWidth, 380) + gap, 
        y: CONTAINER_PADDING, 
        width: Math.max(videoWidth, 320), 
        height: Math.max(innerHeight * 0.7, 220) 
      }
    };
  }
};

function snapToGrid(value: number, grid: number) {
  return Math.round(value / grid) * grid;
}

// Helper to keep the dragged panel in view and expand container
function ensurePanelInViewAndExpand(
  panelRect: { x: number; y: number; w: number; h: number },
  containerRef: React.RefObject<HTMLDivElement>,
  setContainerSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>
) {
  if (!containerRef.current) return;
  const panelBottom = panelRect.y + panelRect.h;
  const container = containerRef.current;
  const containerHeight = container.scrollHeight;
  // If the panel is within 60px of the bottom, expand container
  if (panelBottom > containerHeight - 60) {
    const newHeight = panelBottom + BOTTOM_PADDING;
    setContainerSize(s => ({ ...s, height: newHeight }));
    // Scroll to keep the panel in view
    requestAnimationFrame(() => {
      container.scrollTop = panelBottom - container.clientHeight + 80;
    });
  }
}

const MediaFeed: React.FC<MediaFeedProps> = ({ userId, selectedMedia, setSelectedMedia, username }) => {
  const { client: supabase } = useSupabase();
  // Local state for notes and rating
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [profileNotes, setProfileNotes] = useState('');
  const [profileNotesLoading, setProfileNotesLoading] = useState(false);
  const [profileNotesSaving, setProfileNotesSaving] = useState(false);
  const [mediaNotesSaving, setMediaNotesSaving] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [showYouTube, setShowYouTube] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [notesRect, setNotesRect] = useState({
    x: CONTAINER_PADDING,
    y: CONTAINER_PADDING,
    w: 400,
    h: 300
  });
  const [videoRect, setVideoRect] = useState({
    x: CONTAINER_PADDING,
    y: CONTAINER_PADDING + 320,
    w: 400,
    h: 280
  });

  // Responsive: update layout on resize - use useLayoutEffect for immediate update
  useLayoutEffect(() => {
    function update() {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = Math.max(700, window.innerHeight - 240);
      
      // Update container size
      setContainerSize({ width, height });
      
      // Get responsive layout
      const layout = getDefaultLayout(width, height);
      
      // Update panel positions and sizes
      setNotesRect({
        x: layout.notes.x,
        y: layout.notes.y,
        w: layout.notes.width,
        h: layout.notes.height
      });
      setVideoRect({
        x: layout.video.x,
        y: layout.video.y,
        w: layout.video.width,
        h: layout.video.height
      });
    }
    
    // Run immediately on mount
    update();
    
    // Also run on resize
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Always expand container height to fit panels
  useEffect(() => {
    const notesBottom = notesRect.y + notesRect.h;
    const videoBottom = videoRect.y + videoRect.h;
    const newHeight = Math.max(600, Math.max(notesBottom, videoBottom) + BOTTOM_PADDING);
    setContainerSize(s => ({ ...s, height: newHeight }));
  }, [notesRect, videoRect]);

  // Helper to update container height in real time and auto-scroll if near bottom
  const updateContainerHeightLive = (
    notesRect: { x: number; y: number; width: number; height: number },
    videoRect: { x: number; y: number; width: number; height: number },
    event?: MouseEvent | TouchEvent
  ) => {
    const notesBottom = notesRect.y + notesRect.height;
    const videoBottom = videoRect.y + videoRect.height;
    const newHeight = Math.max(600, Math.max(notesBottom, videoBottom) + BOTTOM_PADDING);
    setContainerSize(s => ({ ...s, height: newHeight }));

    // Auto-scroll if dragging/resizing near the bottom
    if (containerRef.current && event) {
      const containerRect = containerRef.current.getBoundingClientRect();
      let pointerY = 0;
      if ('touches' in event && event.touches.length > 0) {
        pointerY = event.touches[0].clientY;
      } else if ('clientY' in event) {
        pointerY = event.clientY;
      }
      const threshold = 40; // px from bottom
      if (pointerY > containerRect.bottom - threshold) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  };

  // Fetch notes/rating only when selectedMedia changes
  useEffect(() => {
    if (!selectedMedia) return;
    setShowYouTube(false);
    const fetchDetails = async () => {
      const { data, error } = await supabase
        .from('media_items')
        .select('notes, rating')
        .eq('id', selectedMedia.id)
        .single();
      if (!error && data) {
        setNotes(data.notes || '');
        setRating(data.rating || 0);
      } else {
        setNotes('');
        setRating(0);
      }
    };
    fetchDetails();
  }, [selectedMedia, supabase]);

  // Use separate mutation for instant rating updates
  const updateRatingMutation = useUpdateMediaRating();

  // Auto-save rating when it changes (with optimistic update)
  useEffect(() => {
    if (!selectedMedia) return;
    
    const timeoutId = setTimeout(() => {
      updateRatingMutation.mutate({
        itemId: selectedMedia.id,
        rating
      });
    }, 500); // Save 500ms after rating change
    
    return () => clearTimeout(timeoutId);
  }, [rating, selectedMedia]);

  // Use optimistic mutation for media updates
  const updateMediaMutation = useUpdateMedia();

  // Save notes and rating for selected media (onBlur only)
  const saveMediaNotes = async () => {
    if (!selectedMedia) return;
    setMediaNotesSaving(true);
    try {
      await updateMediaMutation.mutateAsync({
        itemId: selectedMedia.id,
        notes,
        rating
      });
    } catch (error) {
      console.error('Error saving media details:', error);
    } finally {
      setMediaNotesSaving(false);
    }
  };

  // Only load profile notes from localStorage ONCE on mount
  useEffect(() => {
    setProfileNotesLoading(true);
    const saved = localStorage.getItem(`profileNotes-${userId}`);
    if (saved !== null) setProfileNotes(saved);
    setProfileNotesLoading(false);
    // eslint-disable-next-line
  }, []);

  // Save user notes (onBlur only)
  const saveProfileNotes = () => {
    setProfileNotesSaving(true);
    localStorage.setItem(`profileNotes-${userId}`, profileNotes);
    setTimeout(() => setProfileNotesSaving(false), 500);
  };

  // State for notes and video pane rects
  const [containerH, setContainerH] = useState(600);

  // Minimize logic
  const [notesMin, setNotesMin] = useState(false);
  const [videoMin, setVideoMin] = useState(false);
  const [savedNotesRect, setSavedNotesRect] = useState(notesRect);
  const [savedVideoRect, setSavedVideoRect] = useState(videoRect);

  // Sync container height in real time
  const syncContainer = (
    n: { x: number; y: number; w: number; h: number },
    v: { x: number; y: number; w: number; h: number }
  ) => {
    const bottom = Math.max(n.y + n.h, v.y + v.h);
    setContainerH(Math.max(600, bottom + VERTICAL_PADDING));
  };

  // Track if we're in mobile layout (dynamic breakpoint)
  const MIN_NOTES_WIDTH = 360;
  const MIN_VIDEO_WIDTH = 400;
  const PANEL_GAP = 24;
  const EXTRA_BUFFER = 20000 - (MIN_NOTES_WIDTH + MIN_VIDEO_WIDTH + PANEL_GAP);  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function updateMobile() {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.clientWidth - CONTAINER_PADDING * 2;
      setIsMobile(availableWidth < STACK_BREAKPOINT);
    }
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  // When one panel is minimized, expand the other to fill space
  useEffect(() => {
    if (isMobile) return; // Skip on mobile

    const layout = getDefaultLayout(containerSize.width, containerSize.height);
    
    if (notesMin && !videoMin) {
      // Video expands to fill full width with proper padding on all sides
      const maxWidth = containerSize.width - CONTAINER_PADDING * 2;
      setVideoRect({
        x: CONTAINER_PADDING,
        y: CONTAINER_PADDING,
        w: Math.max(340, maxWidth),
        h: videoRect.h
      });
    } else if (videoMin && !notesMin) {
      // Notes expands to fill full width with proper padding on all sides
      const maxWidth = containerSize.width - CONTAINER_PADDING * 2;
      setNotesRect({
        x: CONTAINER_PADDING,
        y: CONTAINER_PADDING,
        w: Math.max(340, maxWidth),
        h: notesRect.h
      });
    } else if (!notesMin && !videoMin) {
      // Both visible - side by side, non-overlapping
      setNotesRect(r => ({
        x: layout.notes.x,
        y: layout.notes.y,
        w: layout.notes.width,
        h: r.h
      }));
      setVideoRect(r => ({
        x: layout.video.x,
        y: layout.video.y,
        w: layout.video.width,
        h: r.h
      }));
    }
  }, [notesMin, videoMin, isMobile, containerSize.width, containerSize.height]);

  // YouTube video player logic
  const isYouTube = selectedMedia && selectedMedia.medium && selectedMedia.medium.toLowerCase().includes('youtube');
  let youTubeId = '';
  if (isYouTube && selectedMedia?.url) {
    const match = selectedMedia.url.match(/[?&]v=([^&#]+)/);
    youTubeId = match ? match[1] : '';
  }

  const isMovieOrTV = selectedMedia && !isYouTube;

  // Expand notes panel if no video is shown on desktop
  useEffect(() => {
    if (isMobile || !containerSize.width) return;

    const layout = getDefaultLayout(containerSize.width, containerSize.height);
    if (youTubeId || isMovieOrTV) {
      // Video or Info panel is present: restore default layout
      if (notesRect.w !== layout.notes.width || notesRect.x !== layout.notes.x) {
        setNotesRect(r => ({ ...r, w: layout.notes.width, x: layout.notes.x }));
      }
    }
  }, [youTubeId, isMobile, containerSize.width, containerSize.height]);

  return (
    <div ref={containerRef} className="w-full bg-[#1a1a1a] rounded-lg min-h-screen" style={{ minHeight: containerSize.height, position: 'relative', padding: `${CONTAINER_PADDING}px` }}>
      <div className="rnd-bounds absolute" style={{ pointerEvents: 'none', top: CONTAINER_PADDING, left: CONTAINER_PADDING, right: CONTAINER_PADDING, bottom: CONTAINER_PADDING }} />
      {/* HOME NOTES: Show when no media item is selected */}
      {(!selectedMedia) ? (
        <div 
          className="bg-[#232323] rounded-lg p-6 shadow-lg flex flex-col" 
          style={{ 
            height: 'calc(100vh - 12rem)',
            marginLeft: 0,
            marginRight: 0,
            width: '100%'
          }}
        >
          <div className="flex items-center justify-between mb-2" style={{ height: HEADER_HEIGHT }}>
            <h3 className="text-lg font-semibold text-white">Your Notes</h3>
          </div>
          <div className="flex-1 overflow-auto min-h-[120px]">
            {profileNotesLoading ? (
              <div className="text-gray-400 text-center py-8"></div>
            ) : (
              <NotesInput initialNotes={profileNotes} onChange={setProfileNotes} onBlur={saveProfileNotes} fullHeight />
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: Video above Notes - stacked vertically */}
          {isMobile ? (
            <>
              {/* Video Pane */}
              {!videoMin && selectedMedia && (
                <Rnd
                  bounds=".rnd-bounds"
                  position={{ x: videoRect.x, y: videoRect.y }}
                  size={{ width: videoRect.w, height: videoRect.h }}
                  disableDragging={true}
                  enableResizing={{ bottom: true }}
                  onResize={(e, dir, ref, delta, pos) => {
                    const maxWidth = containerSize.width - CONTAINER_PADDING * 2;
                    setVideoRect(r => ({ ...r, w: Math.min(ref.offsetWidth, maxWidth), h: ref.offsetHeight }));
                  }}
                  onResizeStop={(e, dir, ref, delta, pos) => {
                    const maxWidth = containerSize.width - CONTAINER_PADDING * 2;
                    const vr = { ...videoRect, w: Math.min(videoRect.w, maxWidth), h: snapToGrid(ref.offsetHeight, GRID_SIZE) };
                    setVideoRect(vr);
                    // Auto-position notes below video
                    setNotesRect(n => ({ ...n, y: vr.y + vr.h + 20 }));
                    syncContainer(notesRect, vr);
                  }}
                  minWidth={320}
                  minHeight={HEADER_HEIGHT + VERTICAL_PADDING + 50}
                  maxWidth={containerSize.width - CONTAINER_PADDING * 2}
                  className="absolute"
                  style={{ zIndex: 5 }}
                >
                  <div className="h-full flex flex-col bg-[#232323] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2" style={{ height: HEADER_HEIGHT }}>
                      <h3 className="text-white text-lg font-semibold">{isYouTube ? 'Video' : 'Info'}</h3>
                      <button 
                        onClick={() => setVideoMin(true)} 
                        className="hover:bg-[#2a2a2a] p-1.5 rounded transition-colors"
                        title="Minimize video/info"
                      >
                        <Minimize2 size={18} className="text-gray-400 hover:text-white" />
                      </button>
                    </div>
                    <div className="relative w-full" style={{ height: `calc(100% - ${HEADER_HEIGHT + VERTICAL_PADDING}px)` }}>
                      {isYouTube && youTubeId ? (
                        <div className="absolute inset-0" style={{ aspectRatio: '16/9', width: '100%', height: '100%' }}>
                          <iframe src={`https://www.youtube.com/embed/${youTubeId}`} className="w-full h-full" allowFullScreen />
                        </div>
                      ) : (
                        isMovieOrTV && <MediaInfoPanel mediaItem={selectedMedia} />
                      )}
                    </div>
                  </div>
                </Rnd>
              )}
              {/* Notes Pane */}
              {!notesMin && (
                <Rnd
                  bounds=".rnd-bounds"
                  position={{ x: notesRect.x, y: notesRect.y }}
                  size={{ width: notesRect.w, height: notesRect.h }}
                  disableDragging={true}
                  enableResizing={{ bottom: true }}
                  onResize={(e, dir, ref, delta, pos) => {
                    const maxWidth = containerSize.width - CONTAINER_PADDING * 2;
                    setNotesRect(r => ({ ...r, w: Math.min(ref.offsetWidth, maxWidth), h: ref.offsetHeight }));
                  }}
                  onResizeStop={(e, dir, ref, delta, pos) => {
                    const maxWidth = containerSize.width - CONTAINER_PADDING * 2;
                    const nr = { ...notesRect, w: Math.min(notesRect.w, maxWidth), h: snapToGrid(ref.offsetHeight, GRID_SIZE) };
                    setNotesRect(nr);
                    syncContainer(nr, videoRect);
                  }}
                  minWidth={300}
                  minHeight={200}
                  maxWidth={containerSize.width - CONTAINER_PADDING * 2}
                  className="absolute"
                  style={{ zIndex: 10 }}
                  cancel=".no-drag"
                >
                  <div className="h-full flex flex-col bg-[#232323] rounded-lg p-6 shadow-lg">
                    <div className="flex items-start justify-between mb-2" style={{ minHeight: HEADER_HEIGHT }}>
                      <div className="flex-1 min-w-0 mr-2">
                        <h3 className="text-lg font-semibold text-white truncate" title={selectedMedia.title}>
                          {selectedMedia.title}
                        </h3>
                        {selectedMedia.creator && (
                          <p className="text-sm text-gray-400 truncate" title={selectedMedia.creator}>
                            {selectedMedia.creator}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="no-drag">
                          <Rating rating={rating} onRatingChange={setRating} circleSize={20} circleGap={4} hideValue />
                        </div>
                        <button 
                          onClick={() => setNotesMin(true)} 
                          className="hover:bg-[#2a2a2a] p-1.5 rounded transition-colors"
                          title="Minimize notes"
                        >
                          <Minimize2 size={18} className="text-gray-400 hover:text-white" />
                        </button>
                        <button 
                          onClick={() => setSelectedMedia?.(null)} 
                          className="hover:bg-[#2a2a2a] p-1.5 rounded transition-colors"
                          title="Close"
                        >
                          <X size={18} className="text-gray-400 hover:text-white" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <NotesInput initialNotes={notes} onChange={setNotes} onBlur={saveMediaNotes} fullHeight />
                    </div>
                  </div>
                </Rnd>
              )}
            </>
          ) : (
            <>
              {/* Default order: Notes above Video */}
              {!notesMin && (
                <Rnd
                  bounds=".rnd-bounds"
                  position={{ x: notesRect.x, y: notesRect.y }}
                  size={{ width: notesRect.w, height: notesRect.h }}
                  onDrag={(e, d) => {
                    setNotesRect(r => ({ ...r, x: d.x, y: d.y }));
                  }}
                  onResize={(e, dir, ref, delta, pos) => {
                    const newW = ref.offsetWidth;
                    const newX = pos.x;
                    
                    // If resizing right and would overlap video, push video right
                    if (!videoMin && newX + newW > videoRect.x - 12) {
                      const newVideoX = newX + newW + 24;
                      const maxVideoX = containerSize.width - CONTAINER_PADDING * 2 - videoRect.w;
                      if (newVideoX <= maxVideoX) {
                        setVideoRect(v => ({ ...v, x: newVideoX }));
                      }
                    }
                    
                    setNotesRect({ x: pos.x, y: pos.y, w: newW, h: ref.offsetHeight });
                  }}
                  onDragStop={(e, d) => {
                    const nr = { ...notesRect, x: snapToGrid(d.x, GRID_SIZE), y: snapToGrid(d.y, GRID_SIZE) };
                    
                    // Ensure no overlap after drag
                    if (!videoMin && nr.x + nr.w > videoRect.x - 12) {
                      const newVideoX = nr.x + nr.w + 24;
                      const maxVideoX = containerSize.width - CONTAINER_PADDING * 2 - videoRect.w;
                      if (newVideoX <= maxVideoX) {
                        setVideoRect(v => ({ ...v, x: newVideoX }));
                      }
                    }
                    
                    setNotesRect(nr);
                    syncContainer(nr, videoRect);
                  }}
                  onResizeStop={(e, dir, ref, delta, pos) => {
                    const nr = {
                      x: snapToGrid(pos.x, GRID_SIZE),
                      y: snapToGrid(pos.y, GRID_SIZE),
                      w: snapToGrid(ref.offsetWidth, GRID_SIZE),
                      h: snapToGrid(ref.offsetHeight, GRID_SIZE)
                    };
                    setNotesRect(nr);
                    syncContainer(nr, videoRect);
                  }}
                  minWidth={300}
                  minHeight={200}
                  maxWidth={!videoMin ? containerSize.width - CONTAINER_PADDING * 2 - 344 : containerSize.width - CONTAINER_PADDING * 2}
                  className="absolute"
                  style={{ zIndex: 10 }}
                  cancel=".no-drag"
                >
                  <div className="h-full flex flex-col bg-[#232323] rounded-lg p-6 shadow-lg">
                    <div className="flex items-start justify-between mb-2" style={{ minHeight: HEADER_HEIGHT }}>
                      <div className="flex-1 min-w-0 mr-2">
                        <h3 className="text-lg font-semibold text-white truncate" title={selectedMedia.title}>
                          {selectedMedia.title}
                        </h3>
                        {selectedMedia.creator && (
                          <p className="text-sm text-gray-400 truncate" title={selectedMedia.creator}>
                            {selectedMedia.creator}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="no-drag">
                          <Rating rating={rating} onRatingChange={setRating} circleSize={20} circleGap={4} hideValue />
                        </div>
                        <button 
                          onClick={() => setNotesMin(true)} 
                          className="hover:bg-[#2a2a2a] p-1.5 rounded transition-colors"
                          title="Minimize notes"
                        >
                          <Minimize2 size={18} className="text-gray-400 hover:text-white" />
                        </button>
                        <button 
                          onClick={() => setSelectedMedia?.(null)} 
                          className="hover:bg-[#2a2a2a] p-1.5 rounded transition-colors"
                          title="Close"
                        >
                          <X size={18} className="text-gray-400 hover:text-white" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <NotesInput initialNotes={notes} onChange={setNotes} onBlur={saveMediaNotes} fullHeight />
                    </div>
                  </div>
                </Rnd>
              )}
              {!videoMin && selectedMedia && (
                <Rnd
                  bounds=".rnd-bounds"
                  position={{ x: videoRect.x, y: videoRect.y }}
                  size={{ width: videoRect.w, height: videoRect.h }}
                  onDrag={(e, d) => {
                    setVideoRect(r => ({ ...r, x: d.x, y: d.y }));
                  }}
                  onResize={(e, dir, ref, delta, pos) => {
                    const newW = ref.offsetWidth;
                    const newX = pos.x;
                    
                    // If resizing left and would overlap notes, push notes left
                    if (!notesMin && newX < notesRect.x + notesRect.w + 12) {
                      const newNotesW = Math.max(300, newX - notesRect.x - 24);
                      setNotesRect(n => ({ ...n, w: newNotesW }));
                    }
                    
                    setVideoRect({ x: pos.x, y: pos.y, w: newW, h: ref.offsetHeight });
                  }}
                  onDragStop={(e, d) => {
                    const vr = { ...videoRect, x: snapToGrid(d.x, GRID_SIZE), y: snapToGrid(d.y, GRID_SIZE) };
                    
                    // Ensure no overlap after drag
                    if (!notesMin && vr.x < notesRect.x + notesRect.w + 12) {
                      const newNotesW = Math.max(300, vr.x - notesRect.x - 24);
                      setNotesRect(n => ({ ...n, w: newNotesW }));
                    }
                    
                    setVideoRect(vr);
                    syncContainer(notesRect, vr);
                  }}
                  onResizeStop={(e, dir, ref, delta, pos) => {
                    const vr = {
                      x: snapToGrid(pos.x, GRID_SIZE),
                      y: snapToGrid(pos.y, GRID_SIZE),
                      w: snapToGrid(ref.offsetWidth, GRID_SIZE),
                      h: snapToGrid(ref.offsetHeight, GRID_SIZE)
                    };
                    setVideoRect(vr);
                    syncContainer(notesRect, vr);
                  }}
                  minWidth={320}
                  minHeight={HEADER_HEIGHT + VERTICAL_PADDING + 50}
                  maxWidth={!notesMin ? containerSize.width - CONTAINER_PADDING * 2 - 324 : containerSize.width - CONTAINER_PADDING * 2}
                  className="absolute"
                  style={{ zIndex: notesMin ? 10 : 5 }}
                >
                  <div className="h-full flex flex-col bg-[#232323] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2" style={{ height: HEADER_HEIGHT }}>
                      <h3 className="text-white text-lg font-semibold">{isYouTube ? 'Video' : 'Info'}</h3>
                      <button 
                        onClick={() => setVideoMin(true)} 
                        className="hover:bg-[#2a2a2a] p-1.5 rounded transition-colors"
                        title="Minimize video/info"
                      >
                        <Minimize2 size={18} className="text-gray-400 hover:text-white" />
                      </button>
                    </div>
                    <div className="relative w-full" style={{ height: `calc(100% - ${HEADER_HEIGHT + VERTICAL_PADDING}px)` }}>
                      {isYouTube && youTubeId ? (
                        <div className="absolute inset-0" style={{ aspectRatio: '16/9', width: '100%', height: '100%' }}>
                          <iframe src={`https://www.youtube.com/embed/${youTubeId}`} className="w-full h-full" allowFullScreen />
                        </div>
                      ) : (
                        isMovieOrTV && <MediaInfoPanel mediaItem={selectedMedia} />
                      )}
                    </div>
                  </div>
                </Rnd>
              )}
            </>
          )}
        </>
      )}
      {/* Minimized Panel Indicators */}
      {notesMin && (
        <div className="fixed bottom-4 left-4 bg-[#232323] px-4 py-2 rounded-lg shadow-lg border border-[#444] z-20 flex items-center gap-3">
          <span className="text-white text-sm font-eina">Notes minimized</span>
          <button 
            onClick={() => setNotesMin(false)} 
            className="hover:bg-[#3a3a3a] p-1 rounded transition-colors"
            title="Restore notes"
          >
            <Maximize2 size={16} className="text-gray-400 hover:text-white" />
          </button>
        </div>
      )}
      {videoMin && selectedMedia && (
        <div className="fixed bottom-4 right-4 bg-[#232323] px-4 py-2 rounded-lg shadow-lg border border-[#444] z-20 flex items-center gap-3">
          <span className="text-white text-sm font-eina">{isYouTube ? 'Video' : 'Info'} minimized</span>
          <button 
            onClick={() => setVideoMin(false)} 
            className="hover:bg-[#3a3a3a] p-1 rounded transition-colors"
            title={`Restore ${isYouTube ? 'video' : 'info'}`}
          >
            <Maximize2 size={16} className="text-gray-400 hover:text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaFeed; 