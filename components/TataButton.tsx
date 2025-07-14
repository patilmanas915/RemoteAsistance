import React, { ReactNode } from 'react';

interface TataButtonProps {
  children: ReactNode;
  onClick: () => void;
  fullWidth?: boolean;
  className?: string;
}

export default function TataButton({ 
  children, 
  onClick, 
  fullWidth = false,
  className = ''
}: TataButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-5 py-4
        bg-tata-cyan 
        text-black
        font-medium
        border-none
        cursor-pointer
        hover:bg-opacity-90
        transition-all
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
} 