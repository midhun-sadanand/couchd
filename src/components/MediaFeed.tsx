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

const getDefaultLayout = (width: number) => {
  const innerWidth = width - CONTAINER_PADDING * 2;
  if (width < 768) {
    // Mobile: stacked
    return {
      notes: { x: CONTAINER_PADDING, y: CONTAINER_PADDING, width: innerWidth, height: 300 },
      video: { x: CONTAINER_PADDING, y: 320 + CONTAINER_PADDING, width: innerWidth, height: innerWidth / VIDEO_ASPECT + HEADER_HEIGHT + VERTICAL_PADDING }
    };
  } else {
    // Desktop: side by side
    return {
      notes: { x: CONTAINER_PADDING, y: CONTAINER_PADDING, width: Math.max(innerWidth * 0.6, 300), height: 400 },
      video: { x: CONTAINER_PADDING + Math.max(innerWidth * 0.6, 300) + 20, y: CONTAINER_PADDING, width: Math.max(innerWidth * 0.4 - 40, 320), height: Math.max((innerWidth * 0.4 - 40) / VIDEO_ASPECT + HEADER_HEIGHT + VERTICAL_PADDING, 200) }
    };
  }
};

function snapToGrid(value: number, grid: number) {
  return Math.round(value / grid) * grid;
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
  const [layout, setLayout] = useState(() => getDefaultLayout(1200));

  // Responsive: update layout on resize
  useEffect(() => {
    function update() {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      setContainerSize(s => ({ ...s, width }));
      setLayout(getDefaultLayout(width));
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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

  // YouTube video player logic
  const isYouTube = selectedMedia && selectedMedia.medium && selectedMedia.medium.toLowerCase().includes('youtube');
  let youTubeId = '';
  if (isYouTube && selectedMedia?.url) {
    const match = selectedMedia.url.match(/[?&]v=([^&#]+)/);
    youTubeId = match ? match[1] : '';
  }

  // State for notes and video pane rects
  const [notesRect, setNotesRect] = useState({ x: 24, y: 24, w: 400, h: 300 });
  const [videoRect, setVideoRect] = useState({
    x: 444, y: 24,
    w: 320,
    h: 320 / VIDEO_ASPECT + HEADER_HEIGHT + VERTICAL_PADDING
  });
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

  return (
    <div ref={containerRef} className="w-full bg-[#1a1a1a] rounded-lg p-6" style={{ minHeight: containerSize.height, position: 'relative' }}>
      <div className="rnd-bounds absolute inset-0" style={{ pointerEvents: 'none', padding: CONTAINER_PADDING }} />
      {/* Notes Pane */}
      {!notesMin && (
        <Rnd
          bounds=".rnd-bounds"
          position={{ x: notesRect.x, y: notesRect.y }}
          size={{ width: notesRect.w, height: notesRect.h }}
          onDrag={(e, d) => {
            const nr = { ...notesRect, x: d.x, y: d.y };
            setNotesRect(nr); syncContainer(nr, videoRect);
          }}
          onResize={(e, dir, ref, delta, pos) => {
            const nr = {
              x: pos.x,
              y: pos.y,
              w: ref.offsetWidth,
              h: ref.offsetHeight
            };
            setNotesRect(nr); syncContainer(nr, videoRect);
          }}
          onDragStop={(e, d) => {
            setNotesRect(r => ({ ...r, x: snapToGrid(d.x, GRID_SIZE), y: snapToGrid(d.y, GRID_SIZE) }));
          }}
          onResizeStop={(e, dir, ref, delta, pos) => {
            setNotesRect(r => ({
              ...r,
              x: snapToGrid(pos.x, GRID_SIZE),
              y: snapToGrid(pos.y, GRID_SIZE),
              w: snapToGrid(ref.offsetWidth, GRID_SIZE),
              h: snapToGrid(ref.offsetHeight, GRID_SIZE)
            }));
          }}
          minWidth={300}
          minHeight={200}
          className="absolute"
        >
          <div className="h-full flex flex-col bg-[#232323] rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2" style={{ height: HEADER_HEIGHT }}>
              <h3 className="text-lg font-semibold text-white">{username}’s Notes</h3>
              <button onClick={() => setNotesMin(true)}><Minimize2 size={18} className="text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-auto">
              <NotesInput initialNotes={notes} onChange={setNotes} />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Your Rating</h3>
              <Rating rating={rating} onRatingChange={setRating} />
            </div>
          </div>
        </Rnd>
      )}
      {/* Video Pane */}
      {!videoMin && youTubeId && (
        <Rnd
          bounds=".rnd-bounds"
          position={{ x: videoRect.x, y: videoRect.y }}
          size={{ width: videoRect.w, height: videoRect.h }}
          onDrag={(e, d) => {
            const vr = { ...videoRect, x: d.x, y: d.y };
            setVideoRect(vr); syncContainer(notesRect, vr);
          }}
          onResize={(e, dir, ref, delta, pos) => {
            const paneW = ref.offsetWidth;
            const vidH = paneW / VIDEO_ASPECT;
            const totalH = vidH + HEADER_HEIGHT + VERTICAL_PADDING;
            const vr = { x: pos.x, y: pos.y, w: paneW, h: totalH };
            setVideoRect(vr); syncContainer(notesRect, vr);
          }}
          onDragStop={(e, d) => {
            setVideoRect(r => ({ ...r, x: snapToGrid(d.x, GRID_SIZE), y: snapToGrid(d.y, GRID_SIZE) }));
          }}
          onResizeStop={(e, dir, ref, delta, pos) => {
            const paneW = snapToGrid(ref.offsetWidth, GRID_SIZE);
            const vidH = paneW / VIDEO_ASPECT;
            const totalH = snapToGrid(vidH + HEADER_HEIGHT + VERTICAL_PADDING, GRID_SIZE);
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
        >
          <div className="h-full flex flex-col bg-[#232323] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2" style={{ height: HEADER_HEIGHT }}>
              <h3 className="text-white text-lg font-semibold">Video</h3>
              <button onClick={() => setVideoMin(true)}><Minimize2 size={18} className="text-gray-400" /></button>
            </div>
            <div className="relative w-full" style={{ height: `calc(100% - ${HEADER_HEIGHT + VERTICAL_PADDING}px)` }}>
              <div className="absolute inset-0" style={{ aspectRatio: '16/9', width: '100%', height: '100%' }}>
                <iframe src={`https://www.youtube.com/embed/${youTubeId}`} className="w-full h-full" allowFullScreen />
              </div>
            </div>
          </div>
        </Rnd>
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