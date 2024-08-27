import React, { useState, useRef, useEffect } from 'react';
import TypingEffect from './TypingEffect';

const activities = [
  {name: 'sleeping', months: 288 },
  {name: 'work and school', months: 126 },
  {name: 'driving', months: 18 },
  {name: 'cooking and eating', months: 36 },
  {name: 'chores and errands', months: 36 },
  {name: 'bathroom and hygiene', months: 27 },
];

const DotHovers = () => {
    const [selectedScreentime, setSelectedScreentime] = useState(312);
    const [hoveredScreentime, setHoveredScreentime] = useState(0);
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

    const remainingMonths = (
      activities.reduce((acc, activity) => {
        acc[activity.name] = activity.months;
        return acc;
      }, {})
    );

    const numbers = [];
    
    for (let i = 1; i <= 333; i++) {
      numbers.push(i);
    }
  
    const handleScreentimeClick = (value) => {
      setSelectedScreentime(value);
    };
  
    const handleMouseEnter = (value) => {
      setHoveredScreentime(value);
    };
  
    const handleMouseLeave = () => {
      setHoveredScreentime(0);
    };

    const renderAllDots = () => {
      const allDots = [];
      activities.forEach(activity => {
        for (let i = 0; i < remainingMonths[activity.name]; i++) {
          allDots.push(
            <div
              key={`${activity.name}-${i}`}
              className="dot bg-[#232323]"
            ></div>
          );
        }
      });
      return allDots;
    };
  
    return (
      <div className="text-white">
        <div className="mb-6 flex flex-col">
          <div className="mr-24">
            <div className="text-3xl flex justify-end"
                 ref={elementRef}>
              <span className="text-right pt-1" >An 18 year old's remaining time in months</span>
              {/*{hasAppeared &&
              <span className=""><TypingEffect text={" time in months"} speed={60} lineHeight={"2.5rem"} /></span>}*/}
            </div>
            <div className="text-right">assuming a 90 year lifespan</div>
          </div>
        </div>
        <div className="flex justify-end text-white mr-24 text-sm">
          <div className="pt-9 text-right flex flex-col translate-x-8">
              <span className="pb-1">sleeping: 288 months</span>
              <span className="pb-1">work and school: 126 months</span>
              <span className="pb-1">driving: 18 months</span>
              <span className="pb-1">cooking and eating: 36 months</span>
              <span className="pb-1">chores and errands: 36 months</span>
              <span className="pb-6 mb-20">bathroom and hygiene: 27 months</span>
              <span>screentime: {selectedScreentime} months</span>
              <span>remaining time: {333-selectedScreentime} months</span>
              <div className="flex justify-end pt-4">
                <span className="hover:bg-[#888] bg-[#999] text-center text-black w-[60px] rounded-md"
                        onClick={() => handleScreentimeClick(312)}>reset</span>
              </div>
          </div>
          <div className="z-20 flex flex-col justify-start w-[4.5rem] overflow-hidden mr-1">
              <svg width="100" height="250" viewBox="0 0 100 250" xmlns="http://www.w3.org/2000/svg">
                <g id="square-bracket" fill="none" stroke="black" stroke-width="3" transform="translate(30, -8)">
                  <path d="M 50,10 H 20 V 245 H 50" />
                </g>
              </svg>
              <svg width="100" height="160" viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg">
                <g id="square-bracket" fill="none" stroke="black" stroke-width="3" transform="translate(30, -9)">
                  <path d="M 50,10 H 20 V 152 H 50" />
                </g>
              </svg>
          </div>
          <div className="flex flex-wrap w-[410px] h-[400px] z-10">
            {renderAllDots()}
            {numbers.map((value) => (
              <div
                key={value}
                onClick={() => handleScreentimeClick(value)}
                onMouseEnter={() => handleMouseEnter(value)}
                onMouseLeave={handleMouseLeave}>
                <div className={`dot ${selectedScreentime >= value ? 'bg-[#bbb]' : ''} 
                            ${hoveredScreentime >= value && selectedScreentime < value ? 'bg-[#888]' : ''}
                            ${selectedScreentime < value && hoveredScreentime < value ? 'bg-white' : ''}
                            ${selectedScreentime >= value && hoveredScreentime <= value && hoveredScreentime !== 0 ? 'bg-[#888]' : ''}`}>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  export default DotHovers;