import React from 'react';

interface DemoModeNoticeProps {
  variant?: 'info' | 'warning';
  showDetails?: boolean;
}

export default function DemoModeNotice({ 
  variant = 'info',
  showDetails = false 
}: DemoModeNoticeProps) {
  // Different styles based on variant
  const bgColor = variant === 'warning' 
    ? 'bg-amber-600 bg-opacity-20 border-amber-600' 
    : 'bg-tata-cyan bg-opacity-10 border-tata-cyan';
  
  const textColor = variant === 'warning'
    ? 'text-amber-400'
    : 'text-tata-cyan';

  return (
    <div className={`p-4 rounded-lg ${bgColor} border border-opacity-30`}>
      <h3 className={`${textColor} font-bold mb-2`}>Demo Mode</h3>
      <p className="text-white text-sm mb-3">
        This is a demo deployment. The backend services are not yet deployed, so the WebSocket 
        connections will fail. You can still explore the UI and see how the app will look.
      </p>
      
      {showDetails && (
        <>
          <p className="text-white text-sm mb-2">
            The app requires these backend services to work fully:
          </p>
          <ul className="text-white text-sm list-disc pl-5 space-y-1">
            <li>A LiveKit server running on secure WebSockets (WSS)</li>
            <li>A backend server for screen mirroring on secure WebSockets (WSS)</li>
            <li>Environment variables configured in Vercel for the WebSocket URLs</li>
          </ul>
          
          <div className="mt-4">
            <a 
              href="/DEPLOYMENT.md" 
              target="_blank"
              className={`${textColor} underline hover:text-opacity-80 text-sm`}
            >
              View deployment instructions →
            </a>
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to determine if we're in demo mode
export const isInDemoMode = () => {
  // Always return false since backend is now deployed
  return false;
}; 