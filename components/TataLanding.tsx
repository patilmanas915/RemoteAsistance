import React from 'react';
import TataHeader from './TataHeader';
import TataButton from './TataButton';

interface TataLandingProps {
  userName: string;
  onEnterClick: () => void;
  onUploadClick: () => void;
}

export default function TataLanding({ 
  userName, 
  onEnterClick, 
  onUploadClick 
}: TataLandingProps) {
  return (
    <div className="flex flex-col min-h-screen bg-tata-purple">
      <TataHeader userName={userName} />
      
      <div className="flex flex-col md:flex-row flex-1 p-5 md:p-10 gap-10">
        {/* Left Section */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-tata-cyan font-bold text-lg mb-2">Hi, {userName}</p>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">WELCOME TO TATA TECHVERSE</h1>
          <p className="text-xl font-light text-white mb-8">How would you like to proceed?</p>
          
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <TataButton 
              onClick={onEnterClick}
              fullWidth
            >
              Enter TATA Techverse
            </TataButton>
            
            <TataButton
              onClick={onUploadClick}
              fullWidth
            >
              Upload Media Files
            </TataButton>
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full h-[300px] md:h-[500px] bg-gray-800 flex items-center justify-center">
            <p className="text-gray-400">Hero Image Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
} 