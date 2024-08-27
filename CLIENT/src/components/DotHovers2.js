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

const DotHovers2 = ({opacity}) => {
    const [selectedScreentime, setSelectedScreentime] = useState(312);
    const [hoveredScreentime, setHoveredScreentime] = useState(0);
    const [hasAppeared, setHasAppeared] = useState(false);
    const elementRef = useRef(null);
  
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
              className="dot sm:w-[6px] sm:h-[6px] md:w-[7px] md:h-[7px] lg:w-[8px] lg:h-[8px] bg-[#666666]"
            ></div>
          );
        }
      });
      return allDots;
    };
  
    return (
      <div className="text-white"
           ref={elementRef}>
        <div className="lg:flex lg:mr-16 md:flex md:mr-16 sm:flex sm:mr-0 xl:flex xl:mr-16 2xl:flex 2xl:mr-16 h-min">
            <div className="h-min w-[18rem] mx-auto lg:w-[19rem] flex flex-wrap">
                {renderAllDots()}
                {numbers.map((value) => (
                <div
                    key={value}
                    onClick={() => handleScreentimeClick(value)}
                    onMouseEnter={() => handleMouseEnter(value)}
                    onMouseLeave={handleMouseLeave}>
                    <div className={`dot w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] md:w-[7px] md:h-[7px] lg:w-[8px] lg:h-[8px] cursor-pointer" ${selectedScreentime >= value ? 'bg-[#a5a4a4]' : ''} 
                                ${hoveredScreentime >= value && selectedScreentime < value ? 'bg-[#666]' : ''}
                                ${selectedScreentime < value && hoveredScreentime < value ? 'bg-white' : ''}
                                ${selectedScreentime >= value && hoveredScreentime <= value && hoveredScreentime !== 0 ? 'bg-[#dddddd]' : ''}`}>
                    </div>
                </div>
                ))}
            </div>
            <div className="w-[18rem] lg:w-[19rem] grid grid-cols-2 pl-1 sm:w-min sm:flex sm:flex-col md:flex md:flex-col lg:flex lg:flex-col xl:flex xl:flex-col 2xl:flex 2xl:flex-col">
              <div className="flex">
                <div className="hidden w-[1.5rem] sm:h-[6.9rem] md:h-[8.9rem] lg:h-[10.5rem] sm:block md:block lg:block xl:block 2xl:block border-t-2 border-b-2 border-r-2 rounded-r-md mb-1"></div>
                <div className="flex flex-col text-left pl-4 pt-5 sm:pt-0">
                    <span className="lg:text-3xl font-bold">531 months</span>
                    <span className="lg:w-[15rem] sm:w-[10rem] flex flex-wrap text-xs md:text-sm lg:text-md xl:text-md 2xl:text-lg leading-tight pt-1"
                          style={{ fontFamily: 'EinaRegular'}}>of sleeping, work, school, driving, cooking, eating, chores, errands, bathroom, and hygiene time</span>
                </div>
              </div>
              <div className="flex">
                  <div className="hidden w-[1.5rem] sm:h-[4.8rem] md:h-[5.8rem] lg:h-[7.3rem] sm:block md:block lg:block xl:block 2xl:block border-t-2 border-b-2 border-r-2 rounded-r-md"></div>
                  <div className="text-left flex flex-col pl-4 pt-5 sm:pt-0">
                      <span className="lg:text-3xl font-bold">{selectedScreentime} months</span>
                      <span className="pt-1 text-xs md:text-sm lg:text-md xl:text-md 2xl:text-lg" 
                            style={{ fontFamily: 'EinaRegular'}}>of screentime</span>
                      <span className="pt-4 sm:pt-2 lg:text-3xl font-bold">{333-selectedScreentime} months</span>
                      <span className="pt-1 text-xs md:text-sm lg:text-md xl:text-md 2xl:text-lg"
                            style={{ fontFamily: 'EinaRegular'}}>of remaining time</span>
                      <div className="flex justify-start pt-4">
                          <span className="hover:bg-[#888] bg-[#999] text-center text-black w-[60px] rounded-md"
                                  onClick={() => handleScreentimeClick(312)}>reset</span>
                      </div>
                  </div>
              </div>
            </div>
        </div>
      </div>
    );
};

export default DotHovers2;