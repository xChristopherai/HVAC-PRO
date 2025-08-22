import React from 'react';
import { Search } from 'lucide-react';
import { Input } from './input';
import { cn } from '../../lib/utils';

// Unified SearchBar component matching /appointments style
const SearchBar = ({ 
  placeholder = "Search...", 
  value = "", 
  onChange, 
  className = "",
  loading = false,
  ...props 
}) => {
  return (
    <div className={cn("relative flex-1", className)} {...props}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="pl-10 bg-white border-gray-300 text-gray-900"
        style={{ 
          backgroundColor: '#FFFFFF', 
          borderColor: '#D1D5DB',
          color: '#111827'
        }}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;