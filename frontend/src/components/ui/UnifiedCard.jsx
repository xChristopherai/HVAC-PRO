import React from 'react';
import { cn } from '../../lib/utils';

// Unified Card component - Force Appointments Style
const UnifiedCard = ({ 
  children, 
  className = "",
  padding = "p-6",
  ...props 
}) => {
  return (
    <div 
      className={cn(
        "unified-card",
        padding,
        className
      )}
      style={{ 
        backgroundColor: '#FFFFFF', 
        borderColor: '#E5E7EB',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default UnifiedCard;