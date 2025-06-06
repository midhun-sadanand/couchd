'use client';

import React from 'react';

export default function ListsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#121212]">
      {children}
    </div>
  );
} 