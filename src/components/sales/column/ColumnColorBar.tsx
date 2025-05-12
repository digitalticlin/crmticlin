
import React from 'react';

interface ColumnColorBarProps {
  color: string;
}

export const ColumnColorBar = ({ color }: ColumnColorBarProps) => {
  return (
    <div 
      className="h-2 w-full" 
      style={{ backgroundColor: color }}
    />
  );
};
