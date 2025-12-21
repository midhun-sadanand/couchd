"use client";

import React, { useEffect } from 'react';
import { useUser } from '@/utils/auth';
import { useRouter } from 'next/navigation';

const Page = () => {
  const { user, loading } = useUser();
  const router = useRouter();

  // Redirect authenticated users to their profile
  useEffect(() => {
    if (user) {
      router.push(`/profile/${user.email || user.id}`);
    }
  }, [user, router]);

  if (loading) {
    return <div></div>;
  }

  return (
    <div className="bg-[#232323] text-white min-h-screen flex items-center justify-center">
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="fade-in-heading">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-eina-bold mb-8 text-center">
            Consume what you want, how you want.
          </h1>
          <div className="flex flex-wrap justify-center items-center gap-4 text-lg sm:text-xl md:text-2xl lg:text-3xl">
            <span className="font-eina-bold">No algorithms</span>
            <div className="h-[1em] border-l border-1 bg-[#888888]"></div>
            <span className="font-eina-bold">No engagement loops</span>
            <div className="h-[1em] border-l border-1 bg-[#888888]"></div>
            <span className="font-eina-bold">No feeds</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
