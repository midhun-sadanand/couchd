import classNames from "classnames";
import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tab } from "./useHeaderTabs";

const transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
};

type Props = {
  selectedTabIndex: number;
  tabs: Tab[];
  setSelectedTab: (value: [number, number]) => void;
  fallback?: boolean; // If true, render as plain text (no button)
};

const HeaderTabs: React.FC<Props> = ({ tabs, selectedTabIndex, setSelectedTab, fallback }) => {
  const [buttonRefs, setButtonRefs] = useState<Array<HTMLButtonElement | null>>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const navRect = navRef.current?.getBoundingClientRect();
  const selectedRect = buttonRefs[selectedTabIndex]?.getBoundingClientRect();
  const [hoveredTabIndex, setHoveredTabIndex] = useState<number | null>(null);
  const hoveredRect = buttonRefs[hoveredTabIndex ?? -1]?.getBoundingClientRect();

  return (
    <nav
      ref={navRef}
      className="flex items-center relative"
      onPointerLeave={() => setHoveredTabIndex(null)}
    >
      {tabs.map((item, i) => (
        fallback ? (
          <span
            key={i}
            className={classNames(
              "relative px-4 py-2 z-20 transition-colors text-[#888888] font-eina-bold",
            )}
          >
            {item.label}
          </span>
        ) : (
          <motion.button
            key={i}
            className={classNames(
              "relative px-4 py-2 z-20 transition-colors font-eina-bold",
              {
                "text-[#888888]": selectedTabIndex !== i && hoveredTabIndex !== i,
                "text-white": selectedTabIndex === i || hoveredTabIndex === i,
              }
            )}
            ref={(el) => (buttonRefs[i] = el)}
            onPointerEnter={() => setHoveredTabIndex(i)}
            onClick={item.onClick}
          >
            {item.label}
          </motion.button>
        )
      ))}
      <AnimatePresence>
        {hoveredRect && navRect && !fallback && (
          <motion.div
            key="hover"
            className="absolute z-10 rounded-md bg-[#292929]"
            initial={{
              x: hoveredRect.left - navRect.left,
              y: hoveredRect.top - navRect.top,
              width: hoveredRect.width,
              height: hoveredRect.height,
              opacity: 0,
            }}
            animate={{
              x: hoveredRect.left - navRect.left,
              y: hoveredRect.top - navRect.top,
              width: hoveredRect.width,
              height: hoveredRect.height,
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={transition}
          />
        )}
      </AnimatePresence>
    </nav>
  );
};

export default HeaderTabs; 