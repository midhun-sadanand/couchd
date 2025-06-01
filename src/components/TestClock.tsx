"use client";
import { useEffect, useState } from "react";

export default function TestClock() {
  const [now, setNow] = useState<Date>();

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;
  return <div style={{fontSize: 24, color: 'limegreen', fontFamily: 'monospace'}}>{now.toLocaleTimeString()}</div>;
} 