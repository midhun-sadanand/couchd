import React from 'react';

const VideoPlayer = ({ url, title }) => {
  return (
    <div className="video-wrapper">
      <iframe
        className="video-iframe"
        src={`https://www.youtube.com/embed/${url.split('v=')[1]}`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default VideoPlayer;
