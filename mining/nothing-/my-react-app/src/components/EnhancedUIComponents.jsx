import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <motion.div
        className={`${sizes[size]} border-4 border-blue-200 border-t-blue-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </div>
  );
};

// Toast Notification Component
export const Toast = ({ message, type = 'info', onClose }) => {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg`}
    >
      {message}
    </motion.div>
  );
};

// Progress Bar Component
export const ProgressBar = ({ progress, label }) => (
  <div className="w-full">
    {label && <p className="text-sm text-gray-600 mb-1">{label}</p>}
    <div className="w-full bg-gray-200 rounded-full h-2">
      <motion.div
        className="bg-blue-600 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
    <p className="text-xs text-gray-500 mt-1">{progress}%</p>
  </div>
);

// Skeleton Loader Component
export const SkeletonLoader = ({ lines = 3 }) => (
  <div className="animate-pulse space-y-3">
    {[...Array(lines)].map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded w-full" />
    ))}
  </div>
);

// Empty State Component
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    {icon && <div className="text-6xl mb-4">{icon}</div>}
    <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
    {description && <p className="text-gray-500 mb-4">{description}</p>}
    {action && action}
  </div>
);

// Tooltip Component
export const Tooltip = ({ children, content, position = 'top' }) => {
  const [show, setShow] = useState(false);
  
  const positions = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute ${positions[position]} bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Card with Hover Effect
export const AnimatedCard = ({ children, className = '' }) => (
  <motion.div
    whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
    transition={{ duration: 0.2 }}
    className={`bg-white rounded-lg shadow p-6 ${className}`}
  >
    {children}
  </motion.div>
);

// Button with Loading State
export const LoadingButton = ({ loading, children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`px-4 py-2 rounded-lg font-medium transition-all ${
      loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
    } text-white ${className}`}
  >
    {loading ? (
      <span className="flex items-center">
        <motion.div
          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        Loading...
      </span>
    ) : children}
  </button>
);

// Fade In Animation Wrapper
export const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

// Slide In Animation Wrapper
export const SlideIn = ({ children, direction = 'left' }) => {
  const directions = {
    left: { x: -100 },
    right: { x: 100 },
    up: { y: -100 },
    down: { y: 100 }
  };

  return (
    <motion.div
      initial={{ ...directions[direction], opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

export default {
  LoadingSpinner,
  Toast,
  ProgressBar,
  SkeletonLoader,
  EmptyState,
  Tooltip,
  AnimatedCard,
  LoadingButton,
  FadeIn,
  SlideIn
};
