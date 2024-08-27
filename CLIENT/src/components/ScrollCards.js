import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import TypingEffect from './TypingEffect';

function FeaturesCard({ title, body }) {
    return (
        <div className="border-t-2 border-[#555] bg-[#232323] text-white">
            <div className="flex justify-start">
                <h2 className="text-3xl font-bold text-[#999]">{title}</h2>
            </div>
            <div className="flex justify-between">
                <div className="flex text-left justify-start w-1/2 mt-9 text-sm md:text-base">{body}</div>
                <span className="h-[30vh] w-1/3 border-2 mt-9">image</span>
            </div>  
        </div>
    );
};

function ScrollCards() {
    const [hasAppeared, setHasAppeared] = useState(false);
    const elementRef = useRef(null);
  
    const handleScroll = (entries) => {
      const [entry] = entries;
      if (entry.intersectionRatio > .1) {
        setHasAppeared(true);
      }
    };
  
    useEffect(() => {
      const observer = new IntersectionObserver(handleScroll, {
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

    return (
        <div className="flex justify-center">
            <div className="w-5/6 pt-12">
              <div className="h-[1vh]" ref={elementRef}></div>
              {hasAppeared && 
                <h2 className="h-[5rem] lg:h-[6rem] sticky top-[8rem] lg:top-[10rem] font-bold z-10 flex justify-between mb-14">
                  <div className="overflow-hidden">
                    <motion.div initial={{translateY: '100%'}}
                                animate={{translateY: '0%' }}
                                transition={{duration: .7, ease: 'easeOut'}}>
                      <svg width="50" height="100" xmlns="http://www.w3.org/2000/svg">
                        <line x1="0" y1="0" x2="50" y2="0" stroke="gray" stroke-width="4"/>
                        <line x1="0" y1="0" x2="0" y2="50" stroke="gray" stroke-width="4"/>
                      </svg> 
                    </motion.div>
                  </div>
                  <div className="flex flex-col justify-end text-5xl lg:text-7xl"><TypingEffect text="Features" speed={90}/></div>
                  <div className="overflow-hidden">
                    <motion.div initial={{translateY: '100%'}}
                                animate={{translateY: '0%'}}
                                transition={{duration: .7, ease: 'easeOut'}}>
                        <svg width="50" height="100" xmlns="http://www.w3.org/2000/svg">
                          <line x1="0" y1="0" x2="50" y2="0" stroke="gray" stroke-width="4"/>
                          <line x1="50" y1="0" x2="50" y2="50" stroke="gray" stroke-width="4"/>
                        </svg>
                    </motion.div>
                  </div>
                </h2>}
                <div className="flex flex-col justify-between gap-y-16">
                  <div className="card1 sticky top-[16rem] lg:top-[20rem] z-20">
                      <FeaturesCard title={'add any medium'} body={'Curate watchlists on your own terms, without suggestions from algorithms or ads designed to exploit your attention and time'}/>
                      <div className="h-[30vh]"></div>
                  </div>
                  <div className="card2 sticky top-[16rem] lg:top-[20rem] pt-[3rem] z-30">
                      <FeaturesCard title={'track consumption'} body={'Find accountability with progress tracking and get extra value from your watches by rating and taking notes to remember and record your thoughts'}/>
                      <div className="h-[30vh]"></div>
                  </div>
                  <div className="card3 sticky top-[16rem] lg:top-[20rem] pt-[6rem] z-40">
                      <FeaturesCard title={'share ideas'} body={'Turn media consumption from an isolating activity into a way to connect with others, utilizing the add friends and share watchlists features'}/>
                      <div className="h-[55vh] bg-[#232323]"></div>
                  </div>
                  <div className="sticky top-[16rem] z-0 h-[80vh]"></div>
                </div>
            </div>
        </div>
    )
}
export default ScrollCards;