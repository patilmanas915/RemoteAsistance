import React from 'react';

interface TataSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function TataSpinner({ size = 'md', className = '' }: TataSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 rounded-full border-2 border-tata-cyan border-opacity-20"></div>
      <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-tata-cyan animate-spin"></div>
    </div>
  );
} 