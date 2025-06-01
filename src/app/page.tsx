"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useScroll } from 'framer-motion';
import ScrollCards from '@/components/ScrollCards';
import TypingEffect from '@/components/TypingEffect';
import DotHovers2 from '@/components/DotHovers2';
import ConsumeText from '@/components/ConsumeText';
import { SignedOut, SignIn, SignUp, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

const Page = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const toggleLogin = () => setShowLogin((prev) => !prev);
  const toggleSignup = () => setShowSignup((prev) => !prev);

  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [hasAppeared, setHasAppeared] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [dotsOpacity, setDotsOpacity] = useState(0);
  const [headingOpacity, setHeadingOpacity] = useState(1);
  const [subtitleOpacity, setSubtitleOpacity] = useState(0);
  const [typeSwitch, setTypeSwitch] = useState(false);
  const [textAppear, setTextAppear] = useState(false);
  const [titleAppear, setTitleAppear] = useState(true);
  const [fadeIn, setFadeIn] = useState(true);
  const elementRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn && user?.username) {
      router.push(`/profile/${user.username}`);
    }
  }, [isSignedIn, user, router]);

  const handleMoving = (entries: any) => {
    const [entry] = entries;
    if (entry.intersectionRatio > 0.1) {
      setHasAppeared(true);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(handleMoving, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    });
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [0.1]);

  const handleScroll = () => {
    const position = window.scrollY;
    setScrollPosition(position);
    const dotsTriggerPoint = 12.0;
    const subtitleTriggerPoint = 7.0;
    const subtitleDisappear = 14;
    const switchPoint = 14.0;
    const textPoint = 11;
    const headingDisappear = 400;
    const titleDisappear = 11;
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (scrollPosition / totalHeight) * 100;
    setScrollPercentage(scrollPercentage);

    if (scrollPercentage > titleDisappear) {
      setTitleAppear(false);
      setFadeIn(false);
    } else {
      setTitleAppear(true);
    }

    if (scrollPercentage > dotsTriggerPoint + 3) {
      setDotsOpacity(1);
    } else if (scrollPercentage < dotsTriggerPoint + 3 && scrollPercentage > dotsTriggerPoint) {
      setDotsOpacity((scrollPercentage - dotsTriggerPoint) / 3);
      setHasRevealed(true);
    } else {
      setDotsOpacity(0);
    }

    if (scrollPosition < headingDisappear - 200) {
      setHeadingOpacity(1);
    } else if (scrollPosition > headingDisappear - 200 && scrollPosition < headingDisappear) {
      setHeadingOpacity(1 - (scrollPosition - (headingDisappear - 200)) / 200);
    } else {
      setHeadingOpacity(0);
    }

    if (scrollPercentage > subtitleTriggerPoint + 7) {
      setSubtitleOpacity(1);
    } else if (scrollPercentage > subtitleTriggerPoint && scrollPercentage < subtitleTriggerPoint + 7) {
      setSubtitleOpacity((scrollPercentage - subtitleTriggerPoint) / 7);
    } else {
      setSubtitleOpacity(0);
    }

    if (scrollPercentage > switchPoint) {
      setTypeSwitch(true);
    } else {
      setTypeSwitch(false);
    }

    if (scrollPercentage > textPoint) {
      setTextAppear(true);
    }
  };

  useEffect(() => {
    const handleScrollEvent = () => {
      handleScroll();
    };
    window.addEventListener('scroll', handleScrollEvent);
    return () => {
      window.removeEventListener('scroll', handleScrollEvent);
    };
  }, []);

  const scrollDown = (percentage: number) => {
    const scrollAmount = (document.documentElement.scrollHeight - window.innerHeight) * (percentage / 100);
    window.scrollTo({
      top: scrollAmount,
      left: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="bg-[#232323] text-white">
      {titleAppear && (
        <div
          className="h-[100vh] w-screen mx-auto fixed top-24 lg:top-48 sm:top-36 md:top-36 pt-12 sm:pt-6 flex flex-col items-center z-10"
          style={{
            transform: `scale(${scrollPosition * 0.001 + 1})`,
            opacity: headingOpacity,
          }}
        >
          <div className={`mt-10 px-4 lg:w-4/5 md:w-5/6 mx-auto ${fadeIn ? 'fade-in-heading' : ''}`}> 
            <h1 className="text-6xl font-eina-bold mb-4 text-center mt-20 fade-in-heading">
              Consume what you want, how you want.
            </h1>
            <div className="mt-8 flex justify-center items-center mb-12 text-2xl sm:mb-4">
              <span className="font-eina-bold text-sm md:text-lg lg:text-lg xl:text-2xl 2xl:text-3xl mr-2">No algorithms</span>
              <div className="h-[1em]  border-l border-1 bg-[#888888] md:mx-2"></div>
              <span className="font-eina-bold text-sm md:text-lg lg:text-lg xl:text-2xl 2xl:text-3xl mx-2">No engagement loops</span>
              <div className="h-[1em] border-l border-1 bg-[#888888] md:mx-2"></div>
              <span className="font-eina-bold text-sm md:text-lg lg:text-lg xl:text-2xl 2xl:text-3xl ml-2 mr-3">No feeds</span>
            </div>
          </div>
          <div onClick={() => scrollDown(15)} className={`mt-9 lg:mt-24 md:mt-24 sm:mt-24 ${fadeIn ? 'fade-in-heading' : ''}`}>
            <div className="animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
              </svg>
            </div>
          </div>
        </div>
      )}
      <div className="fixed top-32 w-screen"></div>
      <div className="h-[80vh] lg:h-[50vh] 2xl:h-[40vh] z-0"></div>
      <div>
        <div className="sticky top-28 lg:top-40 flex flex-col">
          <span
            className="overflow-hidden mx-auto lg:mx-0 lg:pl-24 text-left"
            style={{ transform: `scale(${Math.min(scrollPercentage / 14, 1)})`, opacity: dotsOpacity }}
          >
            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-eina flex flex-wrap">
              <span className={`${textAppear ? '' : 'hidden'} pr-2 md:pr-3`}>An 18 year old's </span>
              {textAppear && <TypingEffect text={'remaining time'} speed={40} />}
            </div>
            <div className="text-sm lg:text-xl pt-1 lg:pt-4" style={{ fontFamily: 'EinaRegular' }}>
              *where each dot represents a month
            </div>
            <div className="flex pt-9 lg:pt-14 lg:justify-end md:justify-end md:pr-6 sm:justify-end">
              <div className="mx-auto sm:mx-0">
                <DotHovers2 />
              </div>
            </div>
          </span>
        </div>
        <div className=" h-[45vh] lg:h-[60vh]"></div>
      </div>
      <div className="pt-40 sm:pt-48 md:pt-50 lg:pt-54">
        <ConsumeText />
        <div className="bg-[#232323]">
          <ScrollCards />
        </div>
      </div>
      {(showLogin || showSignup) && (
        <div
          className="backdrop"
          onClick={() => {
            if (showLogin) setShowLogin(false);
            if (showSignup) setShowSignup(false);
          }}
        ></div>
      )}
      <SignedOut>
        {showLogin && (
          <div className="form-container">
            <SignIn />
          </div>
        )}
        {showSignup && (
          <div className="form-container">
            <SignUp />
          </div>
        )}
      </SignedOut>
    </div>
  );
};

export default Page;
