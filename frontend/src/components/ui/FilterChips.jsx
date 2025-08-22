import React from 'react';
import { Button } from './button';
import { cn } from '../../lib/utils';

// Unified FilterChips component matching /appointments style
const FilterChips = ({ 
  options = [], 
  value, 
  onChange, 
  className = "",
  ...props 
}) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} {...props}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            "transition-colors",
            value === option.value 
              ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" 
              : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
          )}
          style={value === option.value ? {
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            borderColor: '#2563EB'
          } : {
            backgroundColor: '#FFFFFF',
            color: '#374151',
            borderColor: '#D1D5DB'
          }}
        >
          {option.label}
          {option.count !== undefined && (
            <span className={cn(
              "ml-2 px-1.5 py-0.5 text-xs rounded-full",
              value === option.value 
                ? "bg-blue-700 text-blue-100" 
                : "bg-gray-100 text-gray-600"
            )}>
              {option.count}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
};

export default FilterChips;