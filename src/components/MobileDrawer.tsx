"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@geist-ui/icons';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side: 'left' | 'right';
  children: React.ReactNode;
  title?: string;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  side,
  children,
  title,
}) => {
  // Prevent body scroll when drawer is open
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

  const variants = {
    open: { x: 0 },
    closed: { x: side === 'left' ? '-100%' : '100%' },
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
            className="fixed inset-0 bg-black bg-opacity-60 z-[60]"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={variants}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed top-0 ${side === 'left' ? 'left-0' : 'right-0'} h-full w-[85vw] max-w-[360px] bg-[#181818] shadow-2xl z-[70] flex flex-col`}
            style={{
              paddingTop: 'max(env(safe-area-inset-top), 0px)',
              paddingBottom: 'max(env(safe-area-inset-bottom), 56px)',
            }}
          >
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

export default MobileDrawer;

