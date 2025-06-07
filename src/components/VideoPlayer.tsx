import React from 'react';

interface VideoPlayerProps {
  url: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title }) => {
  // Extract YouTube video ID from URL
  let videoId = '';
  try {
    const match = url.match(/[?&]v=([^&#]+)/);
    videoId = match ? match[1] : url;
  } catch {
    videoId = url;
  }
  return (
    <div className="video-wrapper">
      <iframe
        className="video-iframe w-full aspect-video rounded"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default VideoPlayer; 