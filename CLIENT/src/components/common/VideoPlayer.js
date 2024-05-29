import React from 'react';

const VideoPlayer = ({ url, title }) => {
  return (
    <iframe
      width="100%"
      height="200"
      src={`https://www.youtube.com/embed/${url.split('v=')[1]}`}
      title={title}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>
  );
};

export default React.memo(VideoPlayer, (prevProps, nextProps) => prevProps.url === nextProps.url);
