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
  const innerWidth = width - CONTAINER_PADDING * 2;
  const innerHeight = height - CONTAINER_PADDING * 2;
  if (width < STACK_BREAKPOINT) {
    // Mobile: stacked, each panel takes full width, half height
    return {
      notes: { x: CONTAINER_PADDING, y: CONTAINER_PADDING, width: innerWidth, height: Math.max(innerHeight * 0.4, 260) },
      video: { x: CONTAINER_PADDING, y: Math.max(innerHeight * 0.4, 260) + CONTAINER_PADDING + 20, width: innerWidth, height: Math.max(innerHeight * 0.5, 220) }
    };
  } else {
    // Desktop: side by side, both panels larger
    return {
      notes: { x: CONTAINER_PADDING, y: CONTAINER_PADDING, width: Math.max(innerWidth * 0.65, 420), height: Math.max(innerHeight * 0.7, 340) },
      video: { x: CONTAINER_PADDING + Math.max(innerWidth * 0.65, 420) + 24, y: CONTAINER_PADDING, width: Math.max(innerWidth * 0.35 - 24, 340), height: Math.max(innerHeight * 0.7, 220) }
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
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });
  const initialLayout = getDefaultLayout(1200, 800);
  const [notesRect, setNotesRect] = useState({
    x: initialLayout.notes.x,
    y: initialLayout.notes.y,
    w: initialLayout.notes.width,
    h: initialLayout.notes.height
  });
  const [videoRect, setVideoRect] = useState({
    x: initialLayout.video.x,
    y: initialLayout.video.y,
    w: initialLayout.video.width,
    h: initialLayout.video.height
  });

  // Responsive: update layout on resize
  useEffect(() => {
    function update() {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = Math.max(700, window.innerHeight - 240);
      setContainerSize(s => ({ ...s, width, height }));
      // Responsive rearrangement
      const layout = getDefaultLayout(width, height);
      // If switching to mobile, stack vertically
      if (width < STACK_BREAKPOINT) {
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
      } else {
        // Desktop: side by side
        setNotesRect(r => ({
          x: layout.notes.x,
          y: layout.notes.y,
          w: layout.notes.width,
          h: layout.notes.height
        }));
        setVideoRect(r => ({
          x: layout.video.x,
          y: layout.video.y,
          w: layout.video.width,
          h: layout.video.height
        }));
      }
    }
    update();
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

  // Save notes and rating for selected media (onBlur only)
  const saveMediaNotes = async () => {
    if (!selectedMedia) return;
    setMediaNotesSaving(true);
    try {
      const { error } = await supabase
        .from('media_items')
        .update({
          notes,
          rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMedia.id);
      if (error) throw error;
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
    <div ref={containerRef} className="w-full bg-[#1a1a1a] rounded-lg p-6 min-h-screen" style={{ minHeight: containerSize.height, position: 'relative' }}>
      <div className="rnd-bounds absolute inset-0" style={{ pointerEvents: 'none', padding: CONTAINER_PADDING }} />
      {/* HOME NOTES: Show when no media item is selected */}
      {(!selectedMedia) ? (
        <div className="w-full bg-[#232323] rounded-lg p-6 shadow-lg flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
          <div className="flex items-center justify-between mb-2" style={{ height: HEADER_HEIGHT }}>
            <h3 className="text-lg font-semibold text-white">Your Notes</h3>
          </div>
          <div className="flex-1 overflow-auto min-h-[120px]">
            {profileNotesLoading ? (
              <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : (
              <NotesInput initialNotes={profileNotes} onChange={setProfileNotes} onBlur={saveProfileNotes} fullHeight />
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: Video above Notes if YouTube, else default order */}
          {isMobile ? (
            <>
              {/* Video Pane */}
              {!videoMin && selectedMedia && (
                <Rnd
                  bounds=".rnd-bounds"
                  position={{ x: videoRect.x, y: videoRect.y }}
                  size={{ width: videoRect.w, height: videoRect.h }}
                  onDrag={(e, d) => {
                    const vr = { ...videoRect, x: d.x, y: d.y };
                    setVideoRect(vr); syncContainer(notesRect, vr);
                    ensurePanelInViewAndExpand(vr, containerRef, setContainerSize);
                  }}
                  onResize={(e, dir, ref, delta, pos) => {
                    if (isYouTube) {
                      const paneW = ref.offsetWidth;
                      const vidH = paneW / VIDEO_ASPECT;
                      const totalH = vidH + HEADER_HEIGHT + VERTICAL_PADDING;
                      const vr = { x: pos.x, y: pos.y, w: paneW, h: totalH };
                      setVideoRect(vr);
                      syncContainer(notesRect, vr);
                      ensurePanelInViewAndExpand(vr, containerRef, setContainerSize);
                    } else {
                      const vr = { x: pos.x, y: pos.y, w: ref.offsetWidth, h: ref.offsetHeight };
                      setVideoRect(vr);
                      syncContainer(notesRect, vr);
                      ensurePanelInViewAndExpand(vr, containerRef, setContainerSize);
                    }
                  }}
                  onDragStop={(e, d) => {
                    setVideoRect(r => ({ ...r, x: snapToGrid(d.x, GRID_SIZE), y: snapToGrid(d.y, GRID_SIZE) }));
                  }}
                  onResizeStop={(e, dir, ref, delta, pos) => {
                    const paneW = snapToGrid(ref.offsetWidth, GRID_SIZE);
                    let totalH;
                    if (isYouTube) {
                      const vidH = paneW / VIDEO_ASPECT;
                      totalH = snapToGrid(vidH + HEADER_HEIGHT + VERTICAL_PADDING, GRID_SIZE);
                    } else {
                      totalH = snapToGrid(ref.offsetHeight, GRID_SIZE);
                    }
                    setVideoRect(r => ({
                      ...r,
                      x: snapToGrid(pos.x, GRID_SIZE),
                      y: snapToGrid(pos.y, GRID_SIZE),
                      w: paneW,
                      h: totalH
                    }));
                  }}
                  minWidth={320}
                  minHeight={HEADER_HEIGHT + VERTICAL_PADDING + 50}
                  className="absolute"
                  style={{ zIndex: 5 }}
                >
                  <div className="h-full flex flex-col bg-[#232323] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2" style={{ height: HEADER_HEIGHT }}>
                      <h3 className="text-white text-lg font-semibold">{isYouTube ? 'Video' : 'Info'}</h3>
                      <button onClick={() => setVideoMin(true)}><Minimize2 size={18} className="text-gray-400" /></button>
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
                  onDrag={(e, d) => {
                    const nr = { ...notesRect, x: d.x, y: d.y };
                    setNotesRect(nr); syncContainer(nr, videoRect);
                    ensurePanelInViewAndExpand(nr, containerRef, setContainerSize);
                  }}
                  onResize={(e, dir, ref, delta, pos) => {
                    if (isYouTube) {
                      const paneW = ref.offsetWidth;
                      const vidH = paneW / VIDEO_ASPECT;
                      const totalH = vidH + HEADER_HEIGHT + VERTICAL_PADDING;
                      const vr = { x: pos.x, y: pos.y, w: paneW, h: totalH };
                      setVideoRect(vr);
                      syncContainer(notesRect, vr);
                      ensurePanelInViewAndExpand(vr, containerRef, setContainerSize);
                    } else {
                      const vr = { x: pos.x, y: pos.y, w: ref.offsetWidth, h: ref.offsetHeight };
                      setVideoRect(vr);
                      syncContainer(notesRect, vr);
                      ensurePanelInViewAndExpand(vr, containerRef, setContainerSize);
                    }
                  }}
                  onDragStop={(e, d) => {
                    setNotesRect(r => ({ ...r, x: snapToGrid(d.x, GRID_SIZE), y: snapToGrid(d.y, GRID_SIZE) }));
                  }}
                  onResizeStop={(e, dir, ref, delta, pos) => {
                    const paneW = snapToGrid(ref.offsetWidth, GRID_SIZE);
                    let totalH;
                    if (isYouTube) {
                      const vidH = paneW / VIDEO_ASPECT;
                      totalH = snapToGrid(vidH + HEADER_HEIGHT + VERTICAL_PADDING, GRID_SIZE);
                    } else {
                      totalH = snapToGrid(ref.offsetHeight, GRID_SIZE);
                    }
                    setVideoRect(r => ({
                      ...r,
                      x: snapToGrid(pos.x, GRID_SIZE),
                      y: snapToGrid(pos.y, GRID_SIZE),
                      w: paneW,
                      h: totalH
                    }));
                  }}
                  minWidth={300}
                  minHeight={200}
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
                        <button onClick={() => setNotesMin(true)}><Minimize2 size={18} className="text-gray-400" /></button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <NotesInput initialNotes={notes} onChange={setNotes} fullHeight />
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
                    const nr = { ...notesRect, x: d.x, y: d.y };
                    setNotesRect(nr); syncContainer(nr, videoRect);
                    ensurePanelInViewAndExpand(nr, containerRef, setContainerSize);
                  }}
                  onResize={(e, dir, ref, delta, pos) => {
                    if (isYouTube) {
                      const paneW = ref.offsetWidth;
                      const vidH = paneW / VIDEO_ASPECT;
                      const totalH = vidH + HEADER_HEIGHT + VERTICAL_PADDING;
                      const vr = { x: pos.x, y: pos.y, w: paneW, h: totalH };
                      setVideoRect(vr);
                      syncContainer(notesRect, vr);
                      ensurePanelInViewAndExpand(vr, containerRef, setContainerSize);
                    } else {
                      const vr = { x: pos.x, y: pos.y, w: ref.offsetWidth, h: ref.offsetHeight };
                      setVideoRect(vr);
                      syncContainer(notesRect, vr);
                      ensurePanelInViewAndExpand(vr, containerRef, setContainerSize);
                    }
                  }}
                  onDragStop={(e, d) => {
                    setNotesRect(r => ({ ...r, x: snapToGrid(d.x, GRID_SIZE), y: snapToGrid(d.y, GRID_SIZE) }));
                  }}
                  onResizeStop={(e, dir, ref, delta, pos) => {
                    const paneW = snapToGrid(ref.offsetWidth, GRID_SIZE);
                    let totalH;
                    if (isYouTube) {
                      const vidH = paneW / VIDEO_ASPECT;
                      totalH = snapToGrid(vidH + HEADER_HEIGHT + VERTICAL_PADDING, GRID_SIZE);
                    } else {
                      totalH = snapToGrid(ref.offsetHeight, GRID_SIZE);
                    }
                    setVideoRect(r => ({
                      ...r,
                      x: snapToGrid(pos.x, GRID_SIZE),
                      y: snapToGrid(pos.y, GRID_SIZE),
                      w: paneW,
                      h: totalH
                    }));
                  }}
                  minWidth={300}
                  minHeight={200}
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
                        <button onClick={() => setNotesMin(true)}><Minimize2 size={18} className="text-gray-400" /></button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <NotesInput initialNotes={notes} onChange={setNotes} fullHeight />
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
                    const vr = { ...videoRect, x: d.x, y: d.y };
                    setVideoRect(vr); syncContainer(notesRect, vr);
                    ensurePanelInViewAndExpand(vr, containerRef, setContainerSize);
                  }}
                  onResize={(e, dir, ref, delta, pos) => {
                    if (isYouTube) {
                      const paneW = ref.offsetWidth;
                      const vidH = paneW / VIDEO_ASPECT;
                      const totalH = vidH + HEADER_HEIGHT + VERTICAL_PADDING;
                      const vr = { x: pos.x, y: pos.y, w: paneW, h: totalH };
                      setVideoRect(vr);
                      syncContainer(notesRect, vr);
                      ensurePanelInViewAndExpand(vr, containerRef, setContainerSize);
                    } else {
                      const vr = { x: pos.x, y: pos.y, w: ref.offsetWidth, h: ref.offsetHeight };
                      setVideoRect(vr);
                      syncContainer(notesRect, vr);
                      ensurePanelInViewAndExpand(vr, containerRef, setContainerSize);
                    }
                  }}
                  onDragStop={(e, d) => {
                    setVideoRect(r => ({ ...r, x: snapToGrid(d.x, GRID_SIZE), y: snapToGrid(d.y, GRID_SIZE) }));
                  }}
                  onResizeStop={(e, dir, ref, delta, pos) => {
                    const paneW = snapToGrid(ref.offsetWidth, GRID_SIZE);
                    let totalH;
                    if (isYouTube) {
                      const vidH = paneW / VIDEO_ASPECT;
                      totalH = snapToGrid(vidH + HEADER_HEIGHT + VERTICAL_PADDING, GRID_SIZE);
                    } else {
                      totalH = snapToGrid(ref.offsetHeight, GRID_SIZE);
                    }
                    setVideoRect(r => ({
                      ...r,
                      x: snapToGrid(pos.x, GRID_SIZE),
                      y: snapToGrid(pos.y, GRID_SIZE),
                      w: paneW,
                      h: totalH
                    }));
                  }}
                  minWidth={320}
                  minHeight={HEADER_HEIGHT + VERTICAL_PADDING + 50}
                  className="absolute"
                  style={{ zIndex: 5 }}
                >
                  <div className="h-full flex flex-col bg-[#232323] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2" style={{ height: HEADER_HEIGHT }}>
                      <h3 className="text-white text-lg font-semibold">{isYouTube ? 'Video' : 'Info'}</h3>
                      <button onClick={() => setVideoMin(true)}><Minimize2 size={18} className="text-gray-400" /></button>
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
      {/* Floating Layout Button: show if either pane is minimized */}
      {(notesMin || videoMin) && (
        <button
          onClick={() => {
            setNotesMin(false);
            setVideoMin(false);
            syncContainer(
              notesMin ? { ...notesRect, h: 300 } : notesRect,
              videoMin ? { ...videoRect, h: (videoRect.w / VIDEO_ASPECT + HEADER_HEIGHT + VERTICAL_PADDING) } : videoRect
            );
          }}
          className="fixed bottom-4 right-4 bg-[#232323] p-2.5 rounded-full shadow-lg hover:bg-[#333] border border-[#444] z-20 transition ease-in-out"
          title="Show Notes & Video"
        >
          <GeistLayout size={22} color="white" />
        </button>
      )}
    </div>
  );
};

export default MediaFeed; 