import React, { useRef, useState, useEffect } from 'react';
import { easeIn, easeOut, motion } from 'framer-motion';
import PyramidAnimation from '../components/PyramidAnimation';
import CircleAnimation from '../components/CircleAnimation';
import TypingEffect from './TypingEffect';

const ConsumeText = () => {
    const [hasAppeared, setHasAppeared] = useState(false);
    const [hasAppearedSub1, setHasAppearedSub1] = useState(false);
    const [hasAppearedText1, setHasAppearedText1] = useState(false);
    const [hasAppearedSub2, setHasAppearedSub2] = useState(false);
    const [hasAppearedText2, setHasAppearedText2] = useState(false);
    const [textOneOp, setTextOneOp] = useState(.1);
    const [textTwoOp, setTextTwoOp] = useState(.1);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [scrollPercentage, setScrollPercentage] = useState(0);
    const elementRef = useRef(null);
    const elementRef2 = useRef(null);
    const elementRef3 = useRef(null);
    const elementRef4 = useRef(null);
    const elementRef5 = useRef(null);

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

      // const handleMoving2 = (entries) => {
      //   const [entry] = entries;
      //   if (entry.intersectionRatio > .9) {
      //     setHasAppearedSub1(true);
      //   }
      // };
    
      // useEffect(() => {
      //   const observer = new IntersectionObserver(handleMoving2, {
      //     root: null,
      //     rootMargin: '0px',
      //     threshold: .9,
      //   });
    
    
      //   if (elementRef2.current) {
      //     observer.observe(elementRef2.current);
      //   }
    
      //   return () => {
      //     if (elementRef2.current) {
      //       observer.unobserve(elementRef2.current);
      //     }
      //   };
      // }, [.9]);

      const handleMoving3 = (entries) => {
        const [entry] = entries;
        if (entry.intersectionRatio > .9) {
          setHasAppearedText1(true);
        }
      };
    
    
      useEffect(() => {
        const observer = new IntersectionObserver(handleMoving3, {
          root: null,
          rootMargin: '0px',
          threshold: .9,
        });
    
    
        if (elementRef3.current) {
          observer.observe(elementRef3.current);
        }
    
        return () => {
          if (elementRef3.current) {
            observer.unobserve(elementRef3.current);
          }
        };
      }, [.9]);

      // const handleMoving4 = (entries) => {
      //   const [entry] = entries;
      //   if (entry.intersectionRatio > .9) {
      //     setHasAppearedSub2(true);
      //   }
      // };
    
    
      // useEffect(() => {
      //   const observer = new IntersectionObserver(handleMoving4, {
      //     root: null,
      //     rootMargin: '0px',
      //     threshold: .9,
      //   });
    
    
      //   if (elementRef4.current) {
      //     observer.observe(elementRef4.current);
      //   }
    
      //   return () => {
      //     if (elementRef4.current) {
      //       observer.unobserve(elementRef4.current);
      //     }
      //   };
      // }, [.9]);

      const handleMoving5 = (entries) => {
        const [entry] = entries;
        if (entry.intersectionRatio > .9) {
          setHasAppearedText2(true);
        }
      };
    
      useEffect(() => {
        const observer = new IntersectionObserver(handleMoving5, {
          root: null,
          rootMargin: '0px',
          threshold: .9,
        });
    
    
        if (elementRef5.current) {
          observer.observe(elementRef5.current);
        }
    
        return () => {
          if (elementRef5.current) {
            observer.unobserve(elementRef5.current);
          }
        };
      }, [.9]);


      const handleScroll = () => {
        const position = window.scrollY;
        setScrollPosition(position);
        const textHighlight = 38;
        const easeOutCubic = (t) => (--t) * t * t + 1; 
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercentage = (scrollPosition / totalHeight) * 100;
        setScrollPercentage(scrollPercentage);

        if (scrollPercentage < (textHighlight)) {
            setTextOneOp(easeOutCubic(1));
            setTextTwoOp(easeOutCubic(.1));
          } else if (scrollPercentage > (textHighlight)) {
            setTextOneOp(easeOutCubic(.1));
            setTextTwoOp(easeOutCubic(1));
          }

        console.log("scroll: ", scrollPercentage)
      }

      useEffect(() => {
        const handleScrollEvent = () => {
          handleScroll();
        };
    
        window.addEventListener('scroll', handleScrollEvent);
        return () => {
          window.removeEventListener('scroll', handleScrollEvent);
        };
      }, []);

    return (
        <div>
            <div className=" flex flex-col justify-end">
                <div className="text-left pb-48 font-bold">
                    <h2 className="w-[90%] font-bold lg:w-full mx-auto lg:mx-0 text-5xl md:text-6xl lg:text-7xl xl:text-7xl 2xl:text-8xl lg:px-24"
                        ref={elementRef}>
                        {hasAppeared &&
                        <div className="flex justify-between ">
                          <div className="flex flex-wrap">
                            <div className="pr-3">Consume</div>
                            <TypingEffect text={"consciously"} speed={60} />
                          </div>
                          <motion.div initial={{x: '100%'}}
                                      animate={{x: '0%'}}
                                      transition={{duration: .5, ease: 'easeOut'}}>
                            <svg className="h-2/5 pt-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 4.5-15 15m0 0h11.25m-11.25 0V8.25" />
                            </svg>
                          </motion.div>
                        </div>}
                    </h2>
                    <div className="lg:flex justify-between pt-10 lg:pt-24 w-full"
                        style={{opacity: textOneOp}}>
                        <div className="m-auto flex justify-center">
                            <CircleAnimation />
                        </div>
                        <div className="lg:w-[45%] text-center lg:text-left md:text-left">
                            <div ref={elementRef2}>
                                <div>
                                    <div className="pr-24 overflow-hidden">
                                        <motion.div className="text-3xl italic"
                                                    initial={{y: '100%'}}
                                                    animate={{y:'0%'}}
                                                    transition={{duration: .5, ease: 'easeOut'}}>
                                            Experience media
                                        </motion.div>
                                    </div>
                                    <div className="pr-24">
                                        <motion.div className="text-3xl italic"
                                                    initial={{y: '110%'}}
                                                    animate={{y:'0%'}}
                                                    transition={{duration: .6, ease: 'easeOut'}}>
                                            on your own terms
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col w-2/3 pt-4"
                                  style={{
                                    fontFamily: 'EinaRegular',
                                  }}
                                  ref={elementRef3}>
                                {hasAppearedText1 && 
                                <div>
                                    <div className="overflow-hidden"><motion.div initial={{y: '100%'}}
                                                animate={{y:'0%'}}
                                                transition={{duration: .5, ease: easeIn}}>
                                        Watching media is supposed to be a means to
                                    </motion.div></div>
                                    <div className="overflow-hidden"><motion.div initial={{y: '110%'}}
                                                animate={{y:'0%'}}
                                                transition={{duration: .6, ease: easeIn}}>
                                        an end. But algorithms, autoplay, and endless
                                    </motion.div></div>
                                    <div className="overflow-hidden"><motion.div initial={{y: '120%'}}
                                                animate={{y:'0%'}}
                                                transition={{duration: .7, ease: easeIn}}>
                                        feedback loops take advantage of human
                                    </motion.div></div>
                                    <div className="overflow-hidden"><motion.div initial={{y: '130%'}}
                                                animate={{y:'0%'}}
                                                transition={{duration: .8, ease: easeIn}}>
                                        psychology to treat you as the means.
                                    </motion.div></div>
                                </div>}
                            </div>
                        </div>
                    </div>
                    <div className="lg:flex justify-between pt-24 w-full"
                        style={{opacity: textTwoOp}}>
                        <div className="m-auto flex justify-center">
                            <PyramidAnimation />
                        </div>
                        <div className="lg:w-[45%] text-center lg:text-left md:text-left">
                            <div ref={elementRef4}>
                                <div>
                                    <div className="pr-24 overflow-hidden">
                                        <motion.div className="text-3xl italic"
                                                    initial={{y: '100%'}}
                                                    animate={{y:'0%'}}
                                                    transition={{duration: .5, ease: easeIn}}>
                                            Come back to what
                                        </motion.div>
                                    </div>
                                    <div className="pr-24">
                                        <motion.div className="text-3xl italic"
                                                    initial={{y: '110%'}}
                                                    animate={{y:'0%'}}
                                                    transition={{duration: .6, ease: easeIn}}>
                                            you want, not what
                                        </motion.div>
                                    </div>
                                    <div className="pr-24">
                                        <motion.div className="text-3xl italic"
                                                    initial={{y: '130%'}}
                                                    animate={{y:'0%'}}
                                                    transition={{duration: .7, ease: easeIn}}>
                                            an algorithm wants
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col w-2/3 pt-4"
                                  style={{
                                    fontFamily: 'EinaRegular',
                                  }}
                                  ref={elementRef5}>
                                {hasAppearedText2 && 
                                <div>
                                    <div className="overflow-hidden"><motion.div initial={{y: '100%'}}
                                                animate={{y:'0%'}}
                                                transition={{duration: .5, ease: easeIn}}>
                                        Passive consumption warps your conscious
                                    </motion.div></div>
                                    <div className="overflow-hidden"><motion.div initial={{y: '110%'}}
                                                animate={{y:'0%'}}
                                                transition={{duration: .6, ease: easeIn}}>
                                        experience of the world. Regain the agency to
                                    </motion.div></div>
                                    <div className="overflow-hidden"><motion.div initial={{y: '120%'}}
                                                animate={{y:'0%'}}
                                                transition={{duration: .7, ease: easeIn}}>
                                        actively choose what you consume.
                                    </motion.div></div>
                                </div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConsumeText;