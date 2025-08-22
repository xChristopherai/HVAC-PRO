import React from 'react';
import { cn } from '../../lib/utils';

// Unified StatTile component matching /appointments style
const StatTile = ({ 
  label, 
  value, 
  icon: Icon, 
  color = 'text-blue-600', 
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={cn(
        "bg-white border border-gray-200 rounded-lg shadow-sm p-4",
        className
      )}
      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className={cn("text-2xl font-bold", color)}>{value}</p>
        </div>
        {Icon && (
          <Icon className={cn("w-8 h-8", color)} />
        )}
      </div>
    </div>
  );
};

export default StatTile;