import React, { useRef, useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useScroll, motion } from 'framer-motion';
import ScrollCards from '../components/ScrollCards';
import TypingEffect from '../components/TypingEffect';
import Footer from '../components/common/Footer';
import DotHovers2 from '../components/DotHovers2';
import ConsumeText from '../components/ConsumeText';
import Logo from '../components/common/Logo'


const LandingPage = () => {
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


  const handleMoving = (entries) => {
    const [entry] = entries;
    if (entry.intersectionRatio > .1) {
      setHasAppeared(true);
    }
  };


  useEffect(() => {
    const observer = new IntersectionObserver(handleMoving, {
      root: null,
      rootMargin: '0px',
      threshold: .1,
    });


    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [.1]);


  const handleScroll = () => {
    const position = window.scrollY;
    setScrollPosition(position);
    const dotsTriggerPoint = 12.00;
    const subtitleTriggerPoint = 7.00;
    const subtitleDisappear = 14;
    const switchPoint = 14.00;
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

    if (scrollPercentage > (dotsTriggerPoint + 3)) {
      setDotsOpacity(1);
    } else if (scrollPercentage < (dotsTriggerPoint + 3) && scrollPercentage > dotsTriggerPoint) {
      setDotsOpacity((scrollPercentage - dotsTriggerPoint) / 3);
      setHasRevealed(true);
    } else {
      setDotsOpacity(0);
    }

    if (scrollPosition < (headingDisappear - 200)) {
      setHeadingOpacity(1);
    } else if (scrollPosition > (headingDisappear - 200) && scrollPosition < headingDisappear) {
      setHeadingOpacity(1 - ((scrollPosition - (headingDisappear - 200)) / 200));
    } else {
      setHeadingOpacity(0);
    }


    if (scrollPercentage > (subtitleTriggerPoint + 7)) {
      setSubtitleOpacity(1);
    } else if (scrollPercentage > subtitleTriggerPoint && scrollPercentage < (subtitleTriggerPoint + 7)) {
      setSubtitleOpacity((scrollPercentage - subtitleTriggerPoint) / 7);
    } else {setSubtitleOpacity(0);}

    if (scrollPercentage > switchPoint) {
      setTypeSwitch(true);
    } else {
      setTypeSwitch(false);
    }

    if (scrollPercentage > textPoint) {
      setTextAppear(true);
    }

    console.log("scroll: ", scrollPercentage, "dots: ", dotsOpacity);

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

  const handleClick = () => {
    console.log('i have been clicked');
  }

  const scrollDown = (percentage) => {
    // Calculate the number of pixels to scroll based on the percentage
    const scrollAmount = (document.documentElement.scrollHeight - window.innerHeight) * (percentage / 100);
    window.scrollTo({
      top: scrollAmount,
      left: 0,
      behavior: 'smooth' // for smooth scrolling
    });
  };

    return (
        <div className="bg-[#232323] text-white">
          {titleAppear && 
          <div className="h-[100vh] w-screen mx-auto fixed top-24 lg:top-48 sm:top-36 md:top-36 pt-12 sm:pt-6 flex flex-col items-center z-10"
              style={{
                transform: `scale(${(scrollPosition * .001) + 1})`,
                opacity: headingOpacity
              }}>
              <div className={`mt-10 px-4 lg:w-4/5 md:w-5/6 mx-auto ${fadeIn ? 'fade-in-heading' : ''}`}>
                  <h1 className="text-5xl mx-12 lg:mx-6 md:mx-4 xl:mx-3 2xl:mx-3 sm:text-5xl md:text-6xl lg:text-7xl xl:text-7xl 2xl:text-8xl font-bold text-center">
                    Consume what you want, how you want
                  </h1>
                  <div className="mt-8 flex justify-center items-center mb-12 text-2xl sm:mb-4">
                      <span className="text-sm md:text-lg lg:text-lg xl:text-2xl 2xl:text-3xl mr-2">No algorithms</span>
                      <div className="h-[1em]  border-l border-1 bg-[#888888] md:mx-2"></div>
                      <span className="text-sm md:text-lg lg:text-lg xl:text-2xl 2xl:text-3xl mx-2">No engagement loops</span>
                      <div className="h-[1em] border-l border-1 bg-[#888888] md:mx-2"></div>
                      <span className="text-sm md:text-lg lg:text-lg xl:text-2xl 2xl:text-3xl ml-2 mr-3">No feeds</span>
                  </div>
              </div>
              <div onClick={() => scrollDown(15)} className={`mt-9 lg:mt-24 md:mt-24 sm:mt-24 ${fadeIn ? 'fade-in-heading' : ''}`}>
                  <div className="animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                    </svg>
                  </div>
              </div>
          </div>}
          <div className="fixed top-32 w-screen">
          </div>
          <div className="h-[80vh] lg:h-[50vh] 2xl:h-[40vh] z-0"></div>
          <div>
            <div className="sticky top-28 lg:top-40 flex flex-col">
                <span className="overflow-hidden mx-auto lg:mx-0 lg:pl-24 text-left"
                      style={{transform: `scale(${Math.min((scrollPercentage) / 14 , 1)})`, opacity: dotsOpacity}}>
                        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold flex flex-wrap">
                          <span className={`${textAppear ? "" : "hidden" } pr-2 md:pr-3`}>An 18 year old's </span>
                          {textAppear && <TypingEffect text={"remaining time"} speed={40} />}
                        </div>
                      <div className="text-sm lg:text-xl pt-1 lg:pt-4"
                           style={{ fontFamily: 'EinaRegular' }}>*where each dot represents a month</div>
                      <div className="flex pt-9 lg:pt-14 lg:justify-end md:justify-end md:pr-6 sm:justify-end">
                        <div className="mx-auto sm:mx-0">
                          <DotHovers2 />
                        </div>
                      </div>
                </span>
            </div>
            <div className=" h-[45vh] lg:h-[60vh]"></div>
          </div>
          {/* <div className="flex lg:justify-end lg:pr-6 md:justify-end md:pr-6 sm:justify-end sm:pr-6">
            <div className="pt-12 lg:pt-9 mx-auto lg:mx-0 md:mx-0 sm:mx-0"
                style={{opacity: dotsOpacity}}>
              <DotHovers2/>
            </div>
          </div> */}
          <div className="pt-40 sm:pt-48 md:pt-50 lg:pt-54">
            <ConsumeText />
            <div className="bg-[#232323]">
              <ScrollCards />
            </div>
          </div>
        </div>
    )
};

export default LandingPage;
