import React, { useState, useEffect } from 'react';

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(timerId);
  }, []);

  return (
    <div>
      <h2 className="text-[#888888]">{time.toLocaleTimeString()}</h2>
    </div>
  );
};

export default Clock;