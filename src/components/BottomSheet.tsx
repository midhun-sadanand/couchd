"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from '@geist-ui/icons';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  fullScreen?: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  fullScreen = false,
}) => {
  const constraintsRef = useRef(null);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    // Close if dragged down more than 100px
    if (info.offset.y > 100) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-60 z-[80]"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={constraintsRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 bg-[#181818] shadow-2xl z-[90] flex flex-col"
            style={{
              maxHeight: fullScreen ? '100vh' : '90vh',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
                <h2 className="text-lg font-eina-bold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors focus:outline-none"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <X size={24} color="#888888" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;

