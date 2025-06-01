"use client";

import React, { useEffect, useState } from 'react';

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const Clock = ({ className = '' }) => {
  const [now, setNow] = useState<Date>();

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null; // nothing during SSR → no mismatch

  return (
    <div className={`text-[#888888] text-sm font-mono tabular-nums font-eina-bold ${className}`}>
      {formatTime(now)}
    </div>
  );
};

export default Clock; 