import React from 'react';
import { cn } from '../../lib/utils';

// Unified StatTile component - Force Appointments Style
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
        "unified-stat-tile",
        className
      )}
      style={{ 
        backgroundColor: '#FFFFFF', 
        borderColor: '#E5E7EB',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        padding: '1rem'
      }}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: '#6B7280' }}>{label}</p>
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