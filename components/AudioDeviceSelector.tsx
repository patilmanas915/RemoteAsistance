import React, { useState, useEffect } from 'react';

const AudioDeviceSelector: React.FC = () => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [micActive, setMicActive] = useState(false);

  // Get available audio devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission to access media devices
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const mics = devices.filter(device => device.kind === 'audioinput');
        const speakers = devices.filter(device => device.kind === 'audiooutput');
        
        setAudioDevices(mics);
        setOutputDevices(speakers);
        
        // Set default selected devices if available
        if (mics.length > 0 && !selectedMic) {
          const savedMic = localStorage.getItem('preferredMicDevice');
          setSelectedMic(savedMic || mics[0].deviceId);
        }
        
        if (speakers.length > 0 && !selectedSpeaker) {
          const savedSpeaker = localStorage.getItem('preferredSpeakerDevice');
          setSelectedSpeaker(savedSpeaker || speakers[0].deviceId);
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };

    getDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, []);

  // Function to check if microphone is currently active
  useEffect(() => {
    const checkMicStatus = () => {
      const audioTracks = Array.from(document.querySelectorAll('audio, video'))
        .flatMap(el => el instanceof HTMLMediaElement && el.srcObject ? 
          (el.srcObject as MediaStream)?.getAudioTracks() || [] : []);
        
      setMicActive(audioTracks.some(track => track.enabled));
    };
    
    // Check initially and set up an interval
    checkMicStatus();
    const intervalId = setInterval(checkMicStatus, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Handle device selection
  const handleMicChange = (deviceId: string) => {
    setSelectedMic(deviceId);
    
    // Store the selection in local storage
    localStorage.setItem('preferredMicDevice', deviceId);
    
    // Dispatch custom event for LiveKit integration
    window.dispatchEvent(new CustomEvent('audio-device-change', {
      detail: { type: 'microphone', deviceId }
    }));
  };

  const handleSpeakerChange = (deviceId: string) => {
    setSelectedSpeaker(deviceId);
    
    // Store the selection in local storage
    localStorage.setItem('preferredSpeakerDevice', deviceId);
    
    // Apply the speaker selection to all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if ('setSinkId' in audio) {
        // TypeScript doesn't recognize setSinkId by default
        (audio as any).setSinkId(deviceId).catch((err: any) => {
          console.error('Error setting audio output device:', err);
        });
      }
    });

    // Dispatch custom event for LiveKit integration
    window.dispatchEvent(new CustomEvent('audio-device-change', {
      detail: { type: 'speaker', deviceId }
    }));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDeviceMenu(!showDeviceMenu)}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-colors 
          ${micActive ? 
            'border-tata-cyan border-opacity-70 bg-tata-cyan bg-opacity-10' : 
            'bg-tata-purple border-tata-cyan border-opacity-30 hover:bg-opacity-80'}`}
        aria-label="Audio device settings"
      >
        <svg 
          className={`w-5 h-5 ${micActive ? 'text-tata-cyan' : 'text-gray-400'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span className={`text-sm hidden sm:inline ${micActive ? 'text-tata-cyan' : 'text-gray-400'}`}>
          Audio
          {micActive && <span className="ml-1 animate-pulse">●</span>}
        </span>
      </button>
      
      {showDeviceMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-tata-purple-dark rounded-lg shadow-lg z-50 border border-tata-cyan border-opacity-20 animate-fade-in">
          <div className="p-3 border-b border-tata-cyan border-opacity-20">
            <h3 className="text-white font-medium">Audio Device Settings</h3>
          </div>
          
          {/* Microphone Selection */}
          <div className="p-3 border-b border-tata-cyan border-opacity-20">
            <label className="block text-sm font-medium text-tata-cyan mb-2">
              Microphone Input
            </label>
            <select
              value={selectedMic}
              onChange={(e) => handleMicChange(e.target.value)}
              className="w-full px-3 py-2 bg-tata-purple bg-opacity-50 text-white border border-tata-cyan border-opacity-30 rounded-lg"
            >
              {audioDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                </option>
              ))}
              {audioDevices.length === 0 && (
                <option value="" disabled>No microphones found</option>
              )}
            </select>
          </div>
          
          {/* Speaker Selection */}
          <div className="p-3">
            <label className="block text-sm font-medium text-tata-cyan mb-2">
              Speaker Output
            </label>
            <select
              value={selectedSpeaker}
              onChange={(e) => handleSpeakerChange(e.target.value)}
              className="w-full px-3 py-2 bg-tata-purple bg-opacity-50 text-white border border-tata-cyan border-opacity-30 rounded-lg"
            >
              {outputDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker ${outputDevices.indexOf(device) + 1}`}
                </option>
              ))}
              {outputDevices.length === 0 && (
                <option value="" disabled>No speakers found</option>
              )}
            </select>
            
            {/* Browser compatibility note */}
            <p className="text-xs text-gray-400 mt-2">
              Speaker selection may not work in all browsers
            </p>
          </div>
          
          <div className="p-3 bg-tata-purple-lighter bg-opacity-20 rounded-b-lg flex justify-end">
            <button 
              onClick={() => setShowDeviceMenu(false)}
              className="bg-tata-cyan text-black text-sm font-medium px-3 py-1 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioDeviceSelector;
