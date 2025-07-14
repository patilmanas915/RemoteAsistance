import React, { useEffect, ReactNode } from 'react';

interface TataThemeProviderProps {
  children: ReactNode;
}

export default function TataThemeProvider({ children }: TataThemeProviderProps) {
  useEffect(() => {
    // Apply Tata theme to the entire document body
    document.body.style.backgroundColor = "#2F0B33"; // Dark purple background
    document.body.style.margin = "0";
    document.body.style.color = "#FFFFFF"; // White text
    document.body.style.fontFamily = "Arial, sans-serif";
    
    // Clean up function to reset styles when component unmounts
    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
      document.body.style.fontFamily = "";
      document.body.style.margin = "";
    };
  }, []);

  return (
    <div className="min-h-screen bg-tata-purple text-tata-white">
      {children}
    </div>
  );
} 