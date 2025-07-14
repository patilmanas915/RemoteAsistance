import React from 'react';
import { TataTextLogo, TataGroupLogo } from './TataLogo';
import AudioDeviceSelector from './AudioDeviceSelector';

interface TataHeaderProps {
  userName?: string;
  sessionCode?: string;
  copyToClipboard?: (text: string, message: string) => void;
}

export default function TataHeader({ userName, sessionCode, copyToClipboard }: TataHeaderProps) {
  const handleCopySessionCode = () => {
    if (sessionCode) {
      if (copyToClipboard) {
        copyToClipboard(sessionCode, "Session code copied to clipboard!");
      } else {
        navigator.clipboard.writeText(sessionCode);
        alert("Session code copied to clipboard!");
      }
    }
  };

  return (
    <header
      className="flex justify-between items-center px-8 py-4 bg-tata-purple bg-gradient-to-r from-tata-purple-dark via-tata-purple to-tata-purple-lighter border-b border-tata-cyan border-opacity-10"
    >
      <div className="flex-1">
        <TataTextLogo className="w-[170px] lg:w-[196px]" />
      </div>        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            {/* Audio Device Selector */}
            <AudioDeviceSelector />

            {sessionCode && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-tata-purple-dark border border-tata-cyan border-opacity-30">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">Session Code</span>
                  <span className="text-tata-cyan font-mono font-bold">{sessionCode}</span>
                </div>
                <button 
                  onClick={handleCopySessionCode}
                  className="p-1.5 bg-tata-cyan bg-opacity-10 rounded-md hover:bg-opacity-20 transition-colors"
                  title="Copy session code"
                >
                  <svg className="w-4 h-4 text-tata-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            )}
            {userName && (
              <div className="flex items-center">
                <span className="text-tata-cyan font-bold text-base md:text-lg">
                  Hi, {userName}
                </span>
              </div>
            )}
          </div>
          <TataGroupLogo className="w-[100px] h-[50px]" />
        </div>
    </header>
  );
} 