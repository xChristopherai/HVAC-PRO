import React from 'react';
import { cn } from '../../lib/utils';

// Unified Card component matching /appointments style
const UnifiedCard = ({ 
  children, 
  className = "",
  padding = "p-6",
  ...props 
}) => {
  return (
    <div 
      className={cn(
        "bg-white border border-gray-200 rounded-lg shadow-sm",
        padding,
        className
      )}
      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
      {...props}
    >
      {children}
    </div>
  );
};

export default UnifiedCard;