import React from 'react';

const LoadingSpinner = ({ size = '24' }) => {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-amber-500"></div>
    </div>
  );
};

export default LoadingSpinner;
