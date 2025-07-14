'use client';

import React, { useEffect, useState, useRef } from 'react';
import { LocalAudioTrack } from 'livekit-client';
import {
  LiveKitRoom,
  useParticipants,
  useRoomContext,
  useTracks,
  VideoTrack,
} from '@livekit/components-react';
import {
  RoomEvent,
  RemoteTrack,
  TrackPublication,
  Participant,
  Track,
} from 'livekit-client';
import TataHeader from '@/components/TataHeader';
import TataThemeProvider from '@/components/TataThemeProvider';
import TataSpinner from '@/components/TataSpinner';

// At the top of your file, add these type definitions
interface FullscreenDocument extends Document {
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

// Annotation types - matching your original JavaScript structure
interface Position {
  x: number;
  y: number;
  z: number;
}

interface Rotation {
  x: number;
  y: number;
  z: number;
}

interface Scale {
  x: number;
  y: number;
  z: number;
}

interface Annotation {
  id: string;
  type: string;
  pos: Position;
  rot: Rotation;
  scale: Scale;
}

interface AnnotationControllerState {
  annotations: { [key: string]: Annotation };
  editing: string | null;
  lastEditing: string | null;
  editMode: 'position' | 'rotation' | 'scale';
  keys: { [key: string]: boolean };
  lastSent: {
    pos: Position;
    rot: Rotation;
    scale: Scale;
  };
}


// Add this at the top of the file, after the imports
const getWebSocketUrl = () => {
  return {
    livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    annotationUrl: process.env.NEXT_PUBLIC_ANNOTATION_WS_URL || "ws://13.234.48.111:8081"
  };
};

// Generate random session code
function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate annotation ID - matching your original function
function generateAnnotationId(): string {
  return 'AN-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// Generate room code - matching your original function
// function generateCode(): string {
//   const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
//   return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
// }

// Annotation Controller Component - matches your original HTML interface
function AnnotationController({ 
  roomCode, 
  socket, 
  annotationState, 
  setAnnotationState
}: {
  roomCode: string;
  socket: WebSocket | null;
  annotationState: AnnotationControllerState;
  setAnnotationState: React.Dispatch<React.SetStateAction<AnnotationControllerState>>;
}) {
  const [uploadType, setUploadType] = useState('pdf');
  const [uploadResult, setUploadResult] = useState('');
  const [isUploading, setIsUploading] = useState(false); // Add loading state

  // Send message through WebSocket
  const send = (msg: unknown) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msg));
  }
};

  // Set edit mode - using global variable
  const setMode = (mode: 'position' | 'rotation' | 'scale') => {
    editMode = mode;
    // Also update React state for UI highlighting
    setAnnotationState(prev => ({
      ...prev,
      editMode: mode
    }));
  };

  // Move function - matching original main.js logic exactly
  const move = (key: string) => {
    if (!editing) return;
    let changed = false;
    
    if (editMode === 'position') {
      if (key === 'w') { pos.y += sensitivity; changed = true; }
      if (key === 's') { pos.y -= sensitivity; changed = true; }
      if (key === 'a') { pos.x -= sensitivity; changed = true; }
      if (key === 'd') { pos.x += sensitivity; changed = true; }
      if (changed) {
        annotations[editing].pos = { ...pos };
        // Also update React state to keep UI in sync
        setAnnotationState(prev => ({
          ...prev,
          annotations: {
            ...prev.annotations,
            [editing!]: {
              ...prev.annotations[editing!],
              pos: { ...pos }
            }
          }
        }));
      }
    } else if (editMode === 'rotation') {
      if (key === 'w') { rot.x += sensitivity * 10; changed = true; }
      if (key === 's') { rot.x -= sensitivity * 10; changed = true; }
      if (key === 'a') { rot.y -= sensitivity * 10; changed = true; }
      if (key === 'd') { rot.y += sensitivity * 10; changed = true; }
      if (changed) {
        annotations[editing].rot = { ...rot };
        // Also update React state to keep UI in sync
        setAnnotationState(prev => ({
          ...prev,
          annotations: {
            ...prev.annotations,
            [editing!]: {
              ...prev.annotations[editing!],
              rot: { ...rot }
            }
          }
        }));
      }
    } else if (editMode === 'scale') {
      if (key === 'w') { scale.y += sensitivity; changed = true; }
      if (key === 's') { scale.y -= sensitivity; changed = true; }
      if (key === 'a') { scale.x -= sensitivity; changed = true; }
      if (key === 'd') { scale.x += sensitivity; changed = true; }
      if (changed) {
        annotations[editing].scale = { ...scale };
        // Also update React state to keep UI in sync
        setAnnotationState(prev => ({
          ...prev,
          annotations: {
            ...prev.annotations,
            [editing!]: {
              ...prev.annotations[editing!],
              scale: { ...scale }
            }
          }
        }));
      }
    }
    
    if (changed) sendUpdate();
  };

  // Helper function to send WebSocket updates
  const sendUpdate = () => {
    if (!annotationState.editing || !socket) return;
    
    const annotation = annotationState.annotations[annotationState.editing];
    if (!annotation) return;

    // Calculate delta from lastSent values
    const posDelta = {
      x: annotation.pos.x - annotationState.lastSent.pos.x,
      y: annotation.pos.y - annotationState.lastSent.pos.y,
      z: annotation.pos.z - annotationState.lastSent.pos.z
    };
    const rotDelta = {
      x: annotation.rot.x - annotationState.lastSent.rot.x,
      y: annotation.rot.y - annotationState.lastSent.rot.y,
      z: annotation.rot.z - annotationState.lastSent.rot.z
    };
    const scaleDelta = {
      x: annotation.scale.x - annotationState.lastSent.scale.x,
      y: annotation.scale.y - annotationState.lastSent.scale.y,
      z: annotation.scale.z - annotationState.lastSent.scale.z
    };

    // Helper to check if object has nonzero value
    const hasNonZero = (obj: Position | Rotation | Scale) => {
      return Object.values(obj).some(v => Math.abs(v) > 1e-6);
    };

    // Only send if at least one value is non-zero
    if (hasNonZero(posDelta) || hasNonZero(rotDelta) || hasNonZero(scaleDelta)) {
      const msg = {
        command: "update",
        annotationId: annotationState.editing,
        position: posDelta,
        rotation: rotDelta,
        scale: scaleDelta
      };
      
      socket.send(JSON.stringify(msg));

      // Update lastSent to new values
      setAnnotationState(prev => ({
        ...prev,
        lastSent: {
          pos: { ...annotation.pos },
          rot: { ...annotation.rot },
          scale: { ...annotation.scale }
        }
      }));
    }
  };

  // Create new annotation - matching your original function
  const sendCreate = () => {
    // Reset global variables to zero for new annotation
    pos = { x: 0, y: 0, z: 0 };
    rot = { x: 0, y: 0, z: 0 };
    scale = { x: 1, y: 1, z: 1 };
    lastSent = { pos: { ...pos }, rot: { ...rot }, scale: { ...scale } };

    const id = generateAnnotationId();
    const type = (document.getElementById('shapeSelector') as HTMLSelectElement)?.value || 'Circle';
    
    // Update global variables
    editing = id;
    // lastEditing removed
    annotations[id] = { id, pos: { ...pos }, rot: { ...rot }, scale: { ...scale }, type };
    
    const msg = {
      command: 'create',
      type,
      annotationId: id,
      position: { ...pos },
      rotation: { ...rot },
      scale: { ...scale }
    };

    setAnnotationState(prev => ({
      ...prev,
      annotations: { ...prev.annotations, [id]: { id, type, pos, rot, scale } },
      editing: id,
      lastEditing: id,
      lastSent
    }));

    send(msg);
  };

  // Start editing annotation - matching your original function
  const startEdit = (id: string) => {
    if (annotationState.editing && annotationState.editing !== id) {
      send({ command: 'deselect', annotationId: annotationState.editing });
    }
    
    const ann = annotationState.annotations[id];
    if (ann) {
      // Update global variables to match the annotation
      editing = id;
      // lastEditing removed
      pos = { ...ann.pos };
      rot = { ...ann.rot };
      scale = { ...ann.scale };
      lastSent = {
        pos: { ...ann.pos },
        rot: { ...ann.rot },
        scale: { ...ann.scale }
      };
      // Also store in global annotations object
      annotations[id] = { id, pos: { ...ann.pos }, rot: { ...ann.rot }, scale: { ...ann.scale }, type: ann.type };
      
      setAnnotationState(prev => ({
        ...prev,
        editing: id,
        lastEditing: id,
        lastSent: {
          pos: { ...ann.pos },
          rot: { ...ann.rot },
          scale: { ...ann.scale }
        }
      }));

      send({ command: 'select', annotationId: id });
    }
  };

  // Delete annotation - matching your original function
  const sendDelete = (id: string) => {
    if (annotationState.editing === id) {
      send({ command: 'deselect', annotationId: id });
      setAnnotationState(prev => ({
        ...prev,
        editing: null,
        lastEditing: null
      }));
    }
    
    const msg = { command: 'delete', annotationId: id };
    send(msg);
    
    setAnnotationState(prev => {
      const newAnnotations = { ...prev.annotations };
      delete newAnnotations[id];
      return { ...prev, annotations: newAnnotations };
    });
  };

  // --- Upload logic using Cloudinary for images/videos, backend for PDFs ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadResult('⏳ Uploading...');

    // All types (image, video, pdf) use Cloudinary and send to socket only
    try {
      const CLOUDINARY_CLOUD_NAME = 'dzunasedh';
      const UPLOAD_PRESET = 'kyc_unsigned';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
     const resourceType = uploadType === 'pdf' ? 'raw' : uploadType;
      const folder = `justvr/${roomCode}/` + (uploadType === 'image' ? 'images' : uploadType === 'video' ? 'videos' : 'pdfs');formData.append('folder', folder);
      formData.append('tags', `room_${roomCode},${uploadType},justvr`);
      const cloudinaryURL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
      const response = await fetch(cloudinaryURL, { method: 'POST', body: formData });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Cloudinary error response:', errorText);
        throw new Error(`Cloudinary upload failed: ${response.status}`);
      }
      const cloudinaryData = await response.json();
      if (cloudinaryData.error) throw new Error(`Cloudinary error: ${cloudinaryData.error.message}`);
      const fileUrl = cloudinaryData.secure_url;
      // Send to annotation WebSocket
      if (socket && socket.readyState === WebSocket.OPEN) {
        const fileMessage = {
          type: 'file',
          fileType: uploadType,
          url: fileUrl,
          timestamp: new Date().toISOString(),
          roomCode: roomCode
        };
        socket.send(JSON.stringify(fileMessage));
        console.log('📤 File info sent via WebSocket:', fileMessage);
      }
      // Display success UI
      setUploadResult(`${uploadType === 'image' ? '🖼️ Image' : uploadType === 'video' ? '🎞️ Video' : '📄 PDF'} uploaded successfully!`);
    } catch (err: unknown) {
      setUploadResult(`❌ Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      form.reset();
    }
  };

  return (
    <div className="bg-tata-purple-dark bg-opacity-95 backdrop-blur-sm rounded-xl p-6 border border-tata-cyan border-opacity-30 max-w-sm w-full">
      <h2 className="text-xl font-bold text-white mb-4 text-center">Annotation Controller</h2>
      
      {/* Room Code Display */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-tata-cyan mb-1">Room Code (Shared):</label>
        <input 
          type="text" 
          value={roomCode} 
          readOnly 
          className="w-full px-3 py-2 bg-tata-purple bg-opacity-50 text-white border border-tata-cyan border-opacity-30 rounded-lg"
        />
        <p className="text-xs text-gray-400 mt-1">This code is shared between LiveKit and annotations</p>
      </div>

      {/* Shape Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-tata-cyan mb-1">Choose Shape:</label>
        <select 
          id="shapeSelector"
          className="w-full px-3 py-2 bg-tata-purple bg-opacity-50 text-white border border-tata-cyan border-opacity-30 rounded-lg"
        >
          <option>Circle</option>
          <option>Square</option>
          <option>Arrow</option>
          <option>Triangle</option>
        </select>
      </div>

      {/* Create Button */}
      <button 
        onClick={sendCreate}
        className="w-full bg-tata-cyan hover:bg-opacity-90 text-black font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
      >
        Create Annotation
      </button>

      {/* Mode Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button 
          onClick={() => setMode('position')}
          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            editMode === 'position' 
              ? 'bg-tata-cyan text-black' 
              : 'bg-tata-purple bg-opacity-50 text-tata-cyan border border-tata-cyan border-opacity-30'
          }`}
        >
          Position
        </button>
        <button 
          onClick={() => setMode('rotation')}
          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            editMode === 'rotation' 
              ? 'bg-tata-cyan text-black' 
              : 'bg-tata-purple bg-opacity-50 text-tata-cyan border border-tata-cyan border-opacity-30'
          }`}
        >
          Rotation
        </button>
        <button 
          onClick={() => setMode('scale')}
          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            editMode === 'scale' 
              ? 'bg-tata-cyan text-black' 
              : 'bg-tata-purple bg-opacity-50 text-tata-cyan border border-tata-cyan border-opacity-30'
          }`}
        >
          Scale
        </button>
      </div>

      {/* Mobile Controls */}
      <div className="mb-4">
        <p className="text-sm text-tata-cyan mb-2">Mobile Controls:</p>
        <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
          <div></div>
          <button 
            onClick={() => move('w')}
            className="w-8 h-8 bg-tata-purple bg-opacity-50 text-tata-cyan border border-tata-cyan border-opacity-30 rounded flex items-center justify-center hover:bg-opacity-70 transition-colors"
          >
            ↑
          </button>
          <div></div>
          <button 
            onClick={() => move('a')}
            className="w-8 h-8 bg-tata-purple bg-opacity-50 text-tata-cyan border border-tata-cyan border-opacity-30 rounded flex items-center justify-center hover:bg-opacity-70 transition-colors"
          >
            ←
          </button>
          <button 
            onClick={() => move('s')}
            className="w-8 h-8 bg-tata-purple bg-opacity-50 text-tata-cyan border border-tata-cyan border-opacity-30 rounded flex items-center justify-center hover:bg-opacity-70 transition-colors"
          >
            ↓
          </button>
          <button 
            onClick={() => move('d')}
            className="w-8 h-8 bg-tata-purple bg-opacity-50 text-tata-cyan border border-tata-cyan border-opacity-30 rounded flex items-center justify-center hover:bg-opacity-70 transition-colors"
          >
            →
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Desktop: Shift + WASD keys, Shift + Mouse wheel for Z-axis<br/>
          Mouse wheel behavior: Position=Z-move, Rotation=Z-rotate, Scale=Z-scale
        </p>
        <p className="text-xs text-tata-cyan mt-1 text-center">
          💡 Hold Shift key while using WASD or mouse wheel to move annotations
        </p>
      </div>

      {/* Sensitivity Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-tata-cyan mb-1">Sensitivity:</label>
        <input 
          type="range" 
          min="0.01" 
          max="0.2" 
          step="0.01" 
          value={sensitivity}
          onChange={(e) => {
            sensitivity = parseFloat(e.target.value); // Update global variable
            // Force re-render by updating React state
            setAnnotationState(prev => ({ ...prev, editMode: prev.editMode }));
          }}
          className="w-full accent-tata-cyan"
        />
        <span className="text-xs text-gray-400">{sensitivity}</span>
      </div>

      {/* Annotation List */}
      <div className="mb-4 bg-tata-purple bg-opacity-30 rounded-lg p-3 border border-tata-cyan border-opacity-20">
        <h4 className="text-sm font-medium text-tata-cyan mb-2">Annotations</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {Object.values(annotationState.annotations).map((annotation) => (
            <div 
              key={annotation.id}
              className={`flex items-center justify-between p-2 rounded text-xs ${
                annotationState.editing === annotation.id 
                  ? 'bg-tata-cyan bg-opacity-20 border border-tata-cyan border-opacity-50' 
                  : 'bg-tata-purple bg-opacity-50'
              }`}
            >
              <span className="text-white">{annotation.id}</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => startEdit(annotation.id)}
                  className="px-2 py-1 bg-tata-cyan bg-opacity-20 text-tata-cyan rounded text-xs hover:bg-opacity-30"
                >
                  Edit
                </button>
                <button 
                  onClick={() => sendDelete(annotation.id)}
                  className="px-2 py-1 bg-red-500 bg-opacity-20 text-red-400 rounded text-xs hover:bg-opacity-30"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-tata-purple bg-opacity-30 rounded-lg p-3 border border-tata-cyan border-opacity-20">
        <h3 className="text-sm font-medium text-tata-cyan mb-2">Upload Reference Material</h3>
        <form onSubmit={handleUpload} className="space-y-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Type:</label>
            <select 
              value={uploadType} 
              onChange={(e) => setUploadType(e.target.value)}
              disabled={isUploading}
              className="w-full px-2 py-1 bg-tata-purple bg-opacity-50 text-white border border-tata-cyan border-opacity-30 rounded text-xs disabled:opacity-50"
            >
              <option value="pdf">PDF</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
          <input 
            type="file" 
            name="file" 
            required 
            disabled={isUploading}
            className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-tata-cyan file:text-black disabled:opacity-50"
            accept={uploadType === 'pdf' ? '.pdf' : uploadType === 'image' ? 'image/*' : 'video/*'}
          />
          <button 
            type="submit"
            disabled={isUploading}
            className="w-full bg-tata-cyan bg-opacity-20 hover:bg-opacity-30 text-tata-cyan py-1 px-2 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? '⏳ Uploading...' : 'Upload'}
          </button>
        </form>
        {uploadResult && (
          <div className={`mt-2 text-xs ${uploadResult.includes('❌') ? 'text-red-400' : 'text-tata-cyan'}`}>
            {uploadResult}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple toast notification component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-tata-cyan text-tata-purple-dark py-2 px-4 rounded-lg shadow-lg animate-fade-in flex items-center gap-2 z-50">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="font-medium">{message}</span>
    </div>
  );
}

// Add this after the Toast component
function ConnectionError({ message, sessionCode }: { message: string; sessionCode?: string }) {
  return (
    <div className="fixed inset-0 bg-tata-purple-dark bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="tata-card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 text-tata-cyan">
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Connection Error</h2>
        <p className="text-gray-300 mb-6">{message}</p>
        
        {/* AWS-specific troubleshooting info */}
        <div className="mb-6 bg-tata-purple bg-opacity-50 p-4 rounded-lg text-left">
          <p className="text-sm text-white font-medium mb-2">Troubleshooting AWS Server Connection:</p>
          <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
            <li>Check if the AWS EC2 instance (3.7.175.158) is running</li>
            <li>Verify that security groups allow WebSocket traffic on port 7880</li>
            <li>Ensure inbound rules allow traffic from your client IP</li>
            <li>If using HTTPS frontend, the backend must use WSS (secure WebSockets)</li>
          </ul>
        </div>
        
        {sessionCode && (
          <div className="mb-6 bg-tata-purple bg-opacity-50 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Your Session Code</p>
            <p className="text-xl font-mono font-bold text-tata-cyan">{sessionCode}</p>
            <p className="text-sm text-gray-400 mt-2">Keep this code to try again later</p>
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-tata-cyan hover:bg-opacity-90 text-black font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function JoinPage() {
  const [token, setToken] = useState<string | null>(null);
  const [identity, setIdentity] = useState<string>('');
  const [showIdentityInput, setShowIdentityInput] = useState<boolean>(true);
  const [sessionCode, setSessionCode] = useState<string>('');
  const [mounted, setMounted] = useState<boolean>(false);
  const [showJoinToast, setShowJoinToast] = useState(false);
  const [joinToastMessage, setJoinToastMessage] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Fix hydration error by generating session code only on client
  useEffect(() => {
    setSessionCode(generateSessionCode());
    setMounted(true);
  }, []);

  const handleIdentitySubmit = () => {
    if (identity.trim()) {
      setShowIdentityInput(false);
    }
  };

  const copyJoinCode = () => {
    navigator.clipboard.writeText(sessionCode);
    setJoinToastMessage("Session code copied to clipboard!");
    setShowJoinToast(true);
  };

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/generate-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomName: sessionCode,
            identity: identity,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch token');
        }

        const data = await response.json();
        console.log(data.token)
        setToken(data.token);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };

    if (!showIdentityInput && identity && sessionCode) {
      fetchToken();
    }
  }, [showIdentityInput, identity, sessionCode]);

  if (!mounted) {
    return (
      <TataThemeProvider>
        <div className="min-h-screen bg-tata-purple bg-[radial-gradient(ellipse_at_top_right,_var(--tata-purple-lighter),transparent_70%),radial-gradient(ellipse_at_bottom_left,_var(--tata-purple-dark),transparent_70%)] flex flex-col">
          <TataHeader />
          
          <div className="flex-1 flex items-center justify-center">
            <TataSpinner size="lg" />
          </div>
        </div>
      </TataThemeProvider>
    );
  }

  if (showIdentityInput) {
    return (
      <TataThemeProvider>
        <div className="min-h-screen bg-tata-purple bg-[radial-gradient(ellipse_at_top_right,_var(--tata-purple-lighter),transparent_70%),radial-gradient(ellipse_at_bottom_left,_var(--tata-purple-dark),transparent_70%)] flex flex-col">
          <TataHeader 
            sessionCode={sessionCode} 
            copyToClipboard={(text, message) => {
              navigator.clipboard.writeText(text);
              setJoinToastMessage(message);
              setShowJoinToast(true);
            }} 
          />
          
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="tata-card p-8 w-full max-w-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-tata-cyan bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-tata-cyan border-opacity-30">
                  <svg className="w-8 h-8 text-tata-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Join Session</h1>
                <p className="text-tata-cyan">Enter your name to continue</p>
              </div>

              <div className="mb-6">
                <div className="bg-tata-purple bg-opacity-50 rounded-lg p-4 text-center border border-tata-cyan border-opacity-10 flex flex-col items-center">
                  <p className="text-sm text-gray-300 mb-1">Session Code</p>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-mono font-bold text-tata-cyan">{sessionCode}</p>
                    <button 
                      onClick={copyJoinCode}
                      className="p-1.5 bg-tata-cyan bg-opacity-10 rounded-md hover:bg-opacity-20 transition-colors"
                      title="Copy session code"
                    >
                      <svg className="w-5 h-5 text-tata-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Share this code with others to join this session</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-tata-cyan mb-2">Your Name</label>
                  <input
                    type="text"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 bg-tata-purple bg-opacity-50 text-white border border-tata-cyan border-opacity-30 rounded-lg focus:ring-2 focus:ring-tata-cyan focus:border-tata-cyan"
                    onKeyPress={(e) => e.key === 'Enter' && handleIdentitySubmit()}
                  />
                </div>
                <button
                  onClick={handleIdentitySubmit}
                  disabled={!identity.trim()}
                  className="w-full bg-tata-cyan hover:bg-opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
          
          {showJoinToast && <Toast message={joinToastMessage} onClose={() => setShowJoinToast(false)} />}
        </div>
      </TataThemeProvider>
    );
  }

  if (!token) {
    return (
      <TataThemeProvider>
        <div className="min-h-screen bg-tata-purple bg-[radial-gradient(ellipse_at_top_right,_var(--tata-purple-lighter),transparent_70%),radial-gradient(ellipse_at_bottom_left,_var(--tata-purple-dark),transparent_70%)] flex flex-col">
          <TataHeader sessionCode={sessionCode} copyToClipboard={(text, message) => {
            navigator.clipboard.writeText(text);
            setJoinToastMessage(message);
            setShowJoinToast(true);
          }} />
          
          <div className="flex-1 flex items-center justify-center">
            <div className="tata-card p-8 text-center w-full max-w-md">
              <TataSpinner className="mx-auto mb-4" />
              <p className="text-tata-cyan">Connecting to room...</p>
            </div>
          </div>
          
          {showJoinToast && <Toast message={joinToastMessage} onClose={() => setShowJoinToast(false)} />}
        </div>
      </TataThemeProvider>
    );
  }

  return (
    <TataThemeProvider>
      {connectionError ? (
        <ConnectionError message={connectionError} sessionCode={sessionCode} />
      ) : (
        <LiveKitRoom
          token={token}
          serverUrl={getWebSocketUrl().livekitUrl}
          connect
          audio={{
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }}
          video={false}
          onError={(error) => {
            console.error("LiveKit connection error:", error);
            
            if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
              setConnectionError(
                "Mixed Content Error: You're accessing this app via HTTPS but trying to connect to an insecure WebSocket endpoint. " +
                "Please make sure the LiveKit server at 3.7.175.158:7880 is configured with SSL/TLS."
              );
            } else {
              setConnectionError(
                "Failed to connect to the LiveKit server at 3.7.175.158:7880. " +
                "Please verify the server is running and accessible."
              );
            }
          }}
        >
          <RoomContent identity={identity} sessionCode={sessionCode} />
          <RoomEventHandler />
        </LiveKitRoom>
      )}
    </TataThemeProvider>
  );
}

function RoomContent({ identity, sessionCode }: { identity: string, sessionCode: string }) {
  const participants = useParticipants(); // used in JSX below
  const room = useRoomContext(); // used in useEffect and audio logic
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Shared annotation state between AnnotationController and ScreenMirror
  const [annotationState, setAnnotationState] = useState<AnnotationControllerState>({
    annotations: {},
    editing: null,
    lastEditing: null,
    editMode: 'position',
    keys: {},
    lastSent: {
      pos: { x: 0, y: 0, z: 0 },
      rot: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    }
  });

  
  // Handle audio device changes
  useEffect(() => {
    // Function to apply stored device preferences when room is connected
    const applyAudioPreferences = async () => {
      try {
        const preferredMic = localStorage.getItem('preferredMicDevice');
        if (preferredMic) {
          await room.switchActiveDevice('audioinput', preferredMic);
          console.log('Applied preferred microphone:', preferredMic);
        }
      } catch (err: unknown) {
        console.error('Error applying audio device preferences:', err);
      }
    };
    
    if (room.state === 'connected') {
      applyAudioPreferences();
    }
    
    // Listen for room connection to apply preferences
    const handleConnected = () => {
      applyAudioPreferences();
    };
    
    // Listen for audio device changes from AudioDeviceSelector
   const handleAudioDeviceChange = async (event: Event) => {
      try {
        // Cast to CustomEvent and check for detail
        const customEvent = event as CustomEvent<{ type: string; deviceId: string }>;
        if (customEvent.detail?.type === 'microphone') {
          await room.switchActiveDevice('audioinput', customEvent.detail.deviceId);
          console.log('Switched to microphone:', customEvent.detail.deviceId);
        }
      } catch (err) {
        console.error('Error switching audio device:', err);
      }
    };
    
    room.on(RoomEvent.Connected, handleConnected);
    window.addEventListener('audio-device-change', handleAudioDeviceChange);
    
    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      window.removeEventListener('audio-device-change', handleAudioDeviceChange);
    };
  }, [room]);
  
  // Shared annotation WebSocket ref
  const annotationSocketRef = useRef<WebSocket | null>(null);
  // Use the same sessionCode for annotations instead of generating a separate one
  const annotationRoomCode = sessionCode;
  
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(message);
    setShowToast(true);
  };

  // --- Audio Source Switch Logic ---
  const [audioSource, setAudioSource] = useState<'mic' | 'tab'>('mic');
  const [isSharingTabAudio, setIsSharingTabAudio] = useState(false);
  const tabAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const micTrackRef = useRef<LocalAudioTrack | null>(null);

  // When switching to mic, unpublish tab audio and re-enable mic
  useEffect(() => {
    if (audioSource === 'mic' && isSharingTabAudio) {
      stopTabAudio();
    }
    // If switching to tab, start tab audio
    if (audioSource === 'tab' && !isSharingTabAudio) {
      shareTabAudio();
    }
    // eslint-disable-next-line
  }, [audioSource]);

  // Modified shareTabAudio to unpublish mic
  const shareTabAudio = async () => {
    try {
      // Unpublish mic if present
      if (micTrackRef.current) {
        await room.localParticipant.unpublishTrack(micTrackRef.current);
        micTrackRef.current.stop();
        micTrackRef.current = null;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        setToastMessage('No audio track found in the selected tab.');
        setShowToast(true);
        stream.getVideoTracks().forEach(track => track.stop());
        return;
      }
      stream.getVideoTracks().forEach(track => track.stop());
      const { LocalAudioTrack } = await import('livekit-client');
      const localAudioTrack = new LocalAudioTrack(audioTracks[0]);
      tabAudioTrackRef.current = localAudioTrack;
      await room.localParticipant.publishTrack(localAudioTrack);
      setIsSharingTabAudio(true);
      setToastMessage('Tab audio is now being shared!');
      setShowToast(true);
    } catch (err) {
      console.error('Error capturing tab audio:', err);
      setToastMessage('Failed to capture tab audio. Make sure to select a tab/window with audio and allow sharing.');
      setShowToast(true);
      setAudioSource('mic');
    }
  };

  // Stop tab audio and re-enable mic
  const stopTabAudio = async () => {
    if (tabAudioTrackRef.current) {
      await room.localParticipant.unpublishTrack(tabAudioTrackRef.current);
      tabAudioTrackRef.current.stop();
      tabAudioTrackRef.current = null;
      setIsSharingTabAudio(false);
      setToastMessage('Tab audio sharing stopped.');
      setShowToast(true);
    }
    // Re-enable mic
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const { LocalAudioTrack } = await import('livekit-client');
        const localAudioTrack = new LocalAudioTrack(audioTracks[0]);
        micTrackRef.current = localAudioTrack;
        await room.localParticipant.publishTrack(localAudioTrack);
      }
    } catch (err) {
      console.error('Error enabling mic:', err);
    }
  };

  return (
    <div className="min-h-screen bg-tata-purple bg-[radial-gradient(ellipse_at_top_right,_var(--tata-purple-lighter),transparent_70%),radial-gradient(ellipse_at_bottom_left,_var(--tata-purple-dark),transparent_70%)] flex flex-col">
      <TataHeader 
        userName={identity} 
        sessionCode={sessionCode}
        copyToClipboard={copyToClipboard}
      />
      {/* Mobile-only session code display */}
      <div className="sm:hidden flex justify-center py-2 px-4">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-tata-purple-dark border border-tata-cyan border-opacity-30">
          <div>
            <span className="text-gray-400 text-xs block">Session Code</span>
            <span className="text-tata-cyan font-mono font-bold">{sessionCode}</span>
          </div>
          <button 
            onClick={() => copyToClipboard(sessionCode, "Session code copied to clipboard!")}
            className="p-1.5 bg-tata-cyan bg-opacity-10 rounded-md hover:bg-opacity-20 transition-colors"
            title="Copy session code"
          >
            <svg className="w-4 h-4 text-tata-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col xl:flex-row p-2 lg:p-4 gap-4 max-w-[2000px] mx-auto w-full">
        {/* Annotation Controller - Left sidebar on desktop, top on mobile */}
        <div className="xl:w-1/4 order-1 xl:order-1 max-h-[40vh] xl:max-h-none overflow-auto xl:overflow-visible">
          <AnnotationController 
            roomCode={annotationRoomCode}
            socket={annotationSocketRef.current}
            annotationState={annotationState}
            setAnnotationState={setAnnotationState}
        
          />
        </div>
        
        {/* Main screen area - center, larger */}
        <div className="flex-1 xl:w-2/4 order-2 xl:order-2 min-h-[50vh] xl:min-h-0">
          {/* --- Audio Source Switch --- */}
          <div className="mb-4 flex gap-4 items-center">
            <label className="text-tata-cyan font-medium">Audio Source:</label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="audioSource"
                value="mic"
                checked={audioSource === 'mic'}
                onChange={() => setAudioSource('mic')}
              />
              <span className="text-white">Microphone</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="audioSource"
                value="tab"
                checked={audioSource === 'tab'}
                onChange={() => setAudioSource('tab')}
              />
              <span className="text-white">Tab Audio</span>
            </label>
          </div>
          {/* --- Tab Audio Share Button (hidden if using switch) --- */}
          {/*
          <div className="mb-4 flex gap-2">
            {!isSharingTabAudio ? (
              <button
                onClick={shareTabAudio}
                className="bg-tata-cyan text-black font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
                title="Share tab audio: You will be prompted to pick a tab/window. Choose one with audio and allow sharing."
              >
                Share Tab Audio
              </button>
            ) : (
              <button
                onClick={stopTabAudio}
                className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Stop Tab Audio
              </button>
            )}
          </div>
          */}
          <LiveKitScreenShare 
            sessionCode={sessionCode} 
            copyToClipboard={copyToClipboard}
            annotationState={annotationState}
            setAnnotationState={setAnnotationState}
            annotationSocketRef={annotationSocketRef}
            annotationRoomCode={annotationRoomCode}
          />
        </div>
        
        {/* Participants - Right sidebar on desktop, bottom on mobile */}
        <div className="xl:w-1/4 order-3 xl:order-3 max-h-[25vh] xl:max-h-none overflow-auto xl:overflow-visible">
          <MobileOptimizedParticipants participants={participants} />
        </div>
      </div>

      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}
    </div>
  );
}

function RoomEventHandler() {
  const room = useRoomContext();

  useEffect(() => {
    const handleTrackSubscribed = (
      track: RemoteTrack,
      publication: TrackPublication,
      participant: Participant
    ) => {
      if (track.kind === Track.Kind.Audio) {
        const audioElement = track.attach();
        audioElement.play();
        console.log('🔊 Audio track attached from', participant.identity);
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    };
  }, [room]);

  return null;
}

// New component that's optimized for both mobile and desktop
function MobileOptimizedParticipants({ participants }: { participants: Participant[] }) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="tata-card h-full flex flex-col">
      <div 
        className="tata-card-header flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 tata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-white">Participants</h2>
          <span className="bg-tata-cyan bg-opacity-20 text-tata-cyan text-xs font-medium px-2 py-1 rounded-full">
            {participants.length}
          </span>
        </div>
        
        {/* Toggle icon - only visible on mobile */}
        <svg className="w-5 h-5 text-white lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d={expanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
          />
        </svg>
      </div>

      <div className={`p-4 flex-1 overflow-y-auto ${!expanded ? 'hidden lg:block' : ''}`}>
        <div className="space-y-2">
          {participants.length === 0 ? (
            <p className="text-gray-400 text-sm">No participants connected</p>
          ) : (
            participants.map((p) => (
              <div 
                key={p.sid} 
                className="flex items-center space-x-3 p-3 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(117, 224, 228, 0.1) 0%, rgba(63, 28, 66, 0.8) 100%)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
                  border: '1px solid rgba(117, 224, 228, 0.15)'
                }}
              >
                <div className="w-8 h-8 bg-tata-cyan bg-opacity-20 rounded-full flex items-center justify-center border border-tata-cyan border-opacity-30">
                  <span className="text-tata-cyan font-medium text-sm">
                    {p.identity.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-white">{p.identity}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Global variables for annotation editing - matching main.js exactly
let pos: Position = { x: 0, y: 0, z: 0 };
let scale: Scale = { x: 1, y: 1, z: 1 };
let rot: Rotation = { x: 0, y: 0, z: 0 };
const keys: { [key: string]: boolean } = {};
const annotations: Record<string, Annotation> = {};
let editing: string | null = null;
let editMode: 'position' | 'rotation' | 'scale' = 'position';
let sensitivity = 0.05;

// Track last sent values for delta calculation
let lastSent: { pos: Position; rot: Rotation; scale: Scale } = {
  pos: { x: 0, y: 0, z: 0 },
  rot: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 }
};
// Removed unused variable lastEditing

function LiveKitScreenShare({ 
  sessionCode, 
  copyToClipboard,
  annotationState,
  setAnnotationState,
  annotationSocketRef,
  annotationRoomCode
}: { 
  sessionCode: string; 
  copyToClipboard: (text: string, message: string) => void;
  annotationState: AnnotationControllerState;
  setAnnotationState: React.Dispatch<React.SetStateAction<AnnotationControllerState>>;
  annotationSocketRef: React.MutableRefObject<WebSocket | null>;
  annotationRoomCode: string;
}) {
  const room = useRoomContext();
  const participants = useParticipants();
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get screen share tracks from all participants
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);
  
  // Find the active screen share track
  const activeScreenShare = screenShareTracks.find(track => track.publication.isSubscribed);

  // Annotation WebSocket connection - matching your original logic
  useEffect(() => {
    if (!annotationRoomCode) return;

    const annotationWs = new WebSocket(getWebSocketUrl().annotationUrl);
    annotationSocketRef.current = annotationWs;

    annotationWs.onopen = () => {
      console.log("✅ Annotation WebSocket connection established!");
      console.log("Sending room code:", annotationRoomCode);
      // Send the exact message format from your original main.js
      annotationWs.send(JSON.stringify({ 
        client: "web", 
        annotationRoomCode: annotationRoomCode 
      }));
    };

    annotationWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received annotation message:", data);
        
        // Handle incoming annotation messages from other clients
        if (data.command === 'create') {
          setAnnotationState(prev => ({
            ...prev,
            annotations: {
              ...prev.annotations,
              [data.annotationId]: {
                id: data.annotationId,
                type: data.type,
                pos: data.position,
                rot: data.rotation,
                scale: data.scale
              }
            }
          }));
        } else if (data.command === 'update') {
          setAnnotationState(prev => {
            const existing = prev.annotations[data.annotationId];
            if (existing) {
              return {
                ...prev,
                annotations: {
                  ...prev.annotations,
                  [data.annotationId]: {
                    ...existing,
                    pos: {
                      x: existing.pos.x + data.position.x,
                      y: existing.pos.y + data.position.y,
                      z: existing.pos.z + data.position.z
                    },
                    rot: {
                      x: existing.rot.x + data.rotation.x,
                      y: existing.rot.y + data.rotation.y,
                      z: existing.rot.z + data.rotation.z
                    },
                    scale: {
                      x: existing.scale.x + data.scale.x,
                      y: existing.scale.y + data.scale.y,
                      z: existing.scale.z + data.scale.z
                    }
                  }
                }
              };
            }
            return prev;
          });
        } else if (data.command === 'delete') {
          setAnnotationState(prev => {
            const newAnnotations = { ...prev.annotations };
            delete newAnnotations[data.annotationId];
            return { ...prev, annotations: newAnnotations };
          });
        }
      } catch (error) {
        console.error("Error parsing annotation message:", error);
      }
    };

    annotationWs.onclose = () => {
      console.log("Annotation WebSocket closed");
    };

    annotationWs.onerror = (error) => {
      console.error("Annotation WebSocket error:", error);
    };

    return () => {
      if (annotationWs.readyState === WebSocket.OPEN) {
        annotationWs.close();
      }
    };
  }, [annotationRoomCode]);

  // Helper function to check if object has nonzero value - matching your original
  const hasNonZero = (obj: Position | Rotation | Scale) => {
    return Object.values(obj).some(v => Math.abs(v) > 1e-6);
  };

  // Send update function - matching original main.js logic exactly
  const sendUpdate = () => {
    if (!editing || !annotationSocketRef.current) return;

    // Calculate delta
    const posDelta = {
      x: pos.x - lastSent.pos.x,
      y: pos.y - lastSent.pos.y,
      z: pos.z - lastSent.pos.z
    };
    const rotDelta = {
      x: rot.x - lastSent.rot.x,
      y: rot.y - lastSent.rot.y,
      z: rot.z - lastSent.rot.z
    };
    const scaleDelta = {
      x: scale.x - lastSent.scale.x,
      y: scale.y - lastSent.scale.y,
      z: scale.z - lastSent.scale.z
    };

    // Only send if at least one value is non-zero
    if (hasNonZero(posDelta) || hasNonZero(rotDelta) || hasNonZero(scaleDelta)) {
      const msg = {
        command: "update",
        annotationId: editing,
        position: posDelta,
        rotation: rotDelta,
        scale: scaleDelta
      };
      
      annotationSocketRef.current.send(JSON.stringify(msg));

      // Update lastSent to new values
      lastSent = {
        pos: { ...pos },
        rot: { ...rot },
        scale: { ...scale }
      };
    }
  };

  // Handle key movements - matching original main.js logic exactly
  const handleKey = (key: string) => {
    if (!editing) return;
    let changed = false;
    
    if (editMode === 'position') {
      if (key === 'w') { pos.y += sensitivity; changed = true; }
      if (key === 's') { pos.y -= sensitivity; changed = true; }
      if (key === 'a') { pos.x -= sensitivity; changed = true; }
      if (key === 'd') { pos.x += sensitivity; changed = true; }
      if (changed) {
        annotations[editing].pos = { ...pos };
        // Also update React state to keep UI in sync
        setAnnotationState(prev => ({
          ...prev,
          annotations: {
            ...prev.annotations,
            [editing!]: {
              ...prev.annotations[editing!],
              pos: { ...pos }
            }
          }
        }));
      }
    } else if (editMode === 'rotation') {
      if (key === 'w') { rot.x += sensitivity * 10; changed = true; }
      if (key === 's') { rot.x -= sensitivity * 10; changed = true; }
      if (key === 'a') { rot.y -= sensitivity * 10; changed = true; }
      if (key === 'd') { rot.y += sensitivity * 10; changed = true; }
      if (changed) {
        annotations[editing].rot = { ...rot };
        // Also update React state to keep UI in sync
        setAnnotationState(prev => ({
          ...prev,
          annotations: {
            ...prev.annotations,
            [editing!]: {
              ...prev.annotations[editing!],
              rot: { ...rot }
            }
          }
        }));
      }
    } else if (editMode === 'scale') {
      if (key === 'w') { scale.y += sensitivity; changed = true; }
      if (key === 's') { scale.y -= sensitivity; changed = true; }
      if (key === 'a') { scale.x -= sensitivity; changed = true; }
      if (key === 'd') { scale.x += sensitivity; changed = true; }
      if (changed) {
        annotations[editing].scale = { ...scale };
        // Also update React state to keep UI in sync
        setAnnotationState(prev => ({
          ...prev,
          annotations: {
            ...prev.annotations,
            [editing!]: {
              ...prev.annotations[editing!],
              scale: { ...scale }
            }
          }
        }));
      }
    }
    
    if (changed) sendUpdate();
  };

  // Keyboard event handlers - require Shift+WASD and Shift+mousewheel for movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'escape') {
        if (editing && annotationSocketRef.current) {
          annotationSocketRef.current.send(JSON.stringify({
            command: "deselect",
            annotationId: editing
          }));
        }
        editing = null; // Update global variable
        setAnnotationState(prev => ({ ...prev, editing: null })); // Update React state
        return;
      }
      
      // Track all keys directly (matching main.js)
      keys[key] = true;
      keys['shift'] = e.shiftKey; // Track shift key state
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys[key] = false;
      keys['shift'] = e.shiftKey; // Update shift key state
    };

    const handleWheel = (e: WheelEvent) => {
      // Handle wheel events when annotation is being edited (require Shift)
      if (!editing || !e.shiftKey) return;
      
      e.preventDefault(); // Prevent page scroll when moving annotation
      
      let changed = false;
      
      if (editMode === 'position') {
        // Z-axis movement for position mode
        pos.z += e.deltaY * 0.01;
        annotations[editing].pos = { ...pos };
        
        // Also update React state to keep UI in sync
        setAnnotationState(prev => ({
          ...prev,
          annotations: {
            ...prev.annotations,
            [editing!]: {
              ...prev.annotations[editing!],
              pos: { ...pos }
            }
          }
        }));
        changed = true;
      } else if (editMode === 'rotation') {
        // Z-axis rotation for rotation mode
        rot.z += e.deltaY * 0.1;
        annotations[editing].rot = { ...rot };
        
        // Also update React state to keep UI in sync
        setAnnotationState(prev => ({
          ...prev,
          annotations: {
            ...prev.annotations,
            [editing!]: {
              ...prev.annotations[editing!],
              rot: { ...rot }
            }
          }
        }));
        changed = true;
      } else if (editMode === 'scale') {
        // Z-axis scale for scale mode
        scale.z += e.deltaY * 0.01;
        // Ensure scale doesn't go negative
        if (scale.z < 0.1) scale.z = 0.1;
        annotations[editing].scale = { ...scale };
        
        // Also update React state to keep UI in sync
        setAnnotationState(prev => ({
          ...prev,
          annotations: {
            ...prev.annotations,
            [editing!]: {
              ...prev.annotations[editing!],
              scale: { ...scale }
            }
          }
        }));
        changed = true;
      }
      
      if (changed) sendUpdate();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('wheel', handleWheel);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [annotationState.editing]);

  // Continuous key handling - require Shift+WASD for movement
  useEffect(() => {
    const interval = setInterval(() => {
      if (!editing || !keys['shift']) return; // Only move if Shift is held
      
      ['w', 'a', 's', 'd'].forEach(k => {
        if (keys[k]) {
          handleKey(k);
        }
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Function to check if fullscreen is supported
  const isFullscreenSupported = () => {
    const doc = document as FullscreenDocument;
    return doc.fullscreenEnabled || 
      doc.webkitFullscreenEnabled || 
      doc.mozFullScreenEnabled || 
      doc.msFullscreenEnabled;
  };

  // Function to handle browser's native fullscreen API
  const requestFullscreen = (element: HTMLElement) => {
    const fsElement = element as FullscreenElement;
    if (fsElement.requestFullscreen) {
      fsElement.requestFullscreen();
    } else if (fsElement.webkitRequestFullscreen) {
      fsElement.webkitRequestFullscreen();
    } else if (fsElement.mozRequestFullScreen) {
      fsElement.mozRequestFullScreen();
    } else if (fsElement.msRequestFullscreen) {
      fsElement.msRequestFullscreen();
    }
  };

  // Function to exit fullscreen
  const exitFullscreen = () => {
    const doc = document as FullscreenDocument;
    if (doc.exitFullscreen) {
      doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    }
  };

  // Handle toggling fullscreen
  const toggleFullscreen = () => {
    if (isFullscreen) {
      if (document.fullscreenElement) {
        exitFullscreen();
      }
      setIsFullscreen(false);
    } else {
      if (isFullscreenSupported() && fullscreenContainerRef.current) {
        requestFullscreen(fullscreenContainerRef.current);
      }
      setIsFullscreen(true);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as FullscreenDocument;
      const isCurrentlyFullscreen = !!doc.fullscreenElement || 
        !!doc.webkitFullscreenElement || 
        !!doc.mozFullScreenElement || 
        !!doc.msFullscreenElement;
      if (!isCurrentlyFullscreen && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Handle keyboard shortcuts for fullscreen
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // 'F' key for fullscreen toggle
      if (event.key === 'f' || event.key === 'F') {
        // Only toggle if target is not an input element to avoid conflicts when typing
        if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
          toggleFullscreen();
          event.preventDefault();
        }
      }
      // Escape key to exit fullscreen
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen]);

  // Fullscreen view component
  const FullscreenView = (
    <div 
      ref={fullscreenContainerRef}
      className="fixed inset-0 z-50 bg-tata-purple-dark flex flex-col animate-fade-in"
      style={{ 
        backgroundColor: 'rgba(30, 7, 31, 0.98)'
      }}
    >
      <div className="flex justify-between items-center p-4 bg-tata-purple-lighter border-b border-tata-cyan border-opacity-20">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 tata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-white">Screen Share (Fullscreen)</h2>
        </div>
        <div className="flex items-center space-x-4">
          {/* Session code display in fullscreen */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-tata-purple border border-tata-cyan border-opacity-30">
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs">Session Code</span>
              <span className="text-tata-cyan font-mono font-bold">{sessionCode}</span>
            </div>
            <button 
              onClick={() => copyToClipboard(sessionCode, "Session code copied to clipboard!")}
              className="p-1.5 bg-tata-cyan bg-opacity-10 rounded-md hover:bg-opacity-20 transition-colors"
              title="Copy session code"
            >
              <svg className="w-4 h-4 text-tata-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
          <button 
            onClick={toggleFullscreen}
            className="flex items-center space-x-1 bg-tata-purple px-3 py-1.5 rounded-lg border border-tata-cyan border-opacity-30 hover:bg-opacity-80 transition-colors relative group"
            title="Exit fullscreen (F)"
          >
            <svg className="w-5 h-5 tata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-tata-cyan text-sm">Exit Fullscreen</span>
            <span className="absolute -top-2 -right-2 bg-tata-cyan text-tata-purple-dark text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center opacity-90 transform scale-0 group-hover:scale-100 transition-transform">
              F
            </span>
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        {activeScreenShare ? (
          <VideoTrack
            trackRef={activeScreenShare}
            className="max-w-full max-h-full object-contain animate-fade-in cursor-pointer"
            style={{ 
              height: 'auto',
              width: 'auto',
              maxHeight: 'calc(100vh - 80px)'
            }}
            onDoubleClick={toggleFullscreen}
          />
        ) : (
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-tata-cyan opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">No Screen Share</h3>
            <p className="text-gray-400">Waiting for someone to share their screen...</p>
          </div>
        )}
      </div>
      <div className="p-2 text-center text-sm text-gray-400">
        Press ESC or F to exit fullscreen mode • Annotation Room: {annotationRoomCode}
      </div>
    </div>
  );

  // If in fullscreen mode, return fullscreen view
  if (isFullscreen) {
    return FullscreenView;
  }

  // Regular view
  return (
    <div className="tata-card h-full flex flex-col">
      <div className="tata-card-header flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 tata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-white">Screen Share</h2>
          {activeScreenShare && (
            <span className="bg-green-500 bg-opacity-20 text-green-400 text-xs font-medium px-2 py-1 rounded-full">
              Live
            </span>
          )}
        </div>
        <div className="flex items-center">
          <button 
            onClick={toggleFullscreen}
            className="flex items-center space-x-1 bg-tata-purple px-3 py-1.5 rounded-lg border border-tata-cyan border-opacity-30 hover:bg-opacity-80 transition-colors hover:scale-105 relative group"
            title="View in fullscreen mode (Press F)"
            aria-label="Toggle fullscreen"
          >
            <svg className="w-4 h-4 tata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
            <span className="text-tata-cyan text-sm">Fullscreen</span>
            <span className="absolute -top-2 -right-2 bg-tata-cyan text-tata-purple-dark text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center opacity-90 transform scale-0 group-hover:scale-100 transition-transform">
              F
            </span>
          </button>
        </div>
      </div>

      <div 
        className="bg-tata-purple-dark flex-1 flex items-center justify-center overflow-hidden border-t border-tata-cyan border-opacity-10 relative"
      >
        {activeScreenShare ? (
          <VideoTrack
            trackRef={activeScreenShare}
            className="max-w-full max-h-full w-auto h-auto object-contain cursor-pointer"
            style={{ 
              width: 'auto',
              height: 'auto',
              maxHeight: '100%',
              maxWidth: '100%'
            }}
            onDoubleClick={toggleFullscreen}
          />
        ) : (
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-tata-cyan opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">No Screen Share</h3>
            <p className="text-gray-400 mb-4">Waiting for someone to share their screen...</p>
            <p className="text-xs text-gray-500">
              Screen sharing is now powered by LiveKit
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-2 right-2 text-gray-400 text-xs opacity-70">
          <div>Press F for fullscreen or double-click screen</div>
          <div>⚠️ Shift + WASD to move annotations (when selected)</div>
          <div>⚠️ Shift + Mouse wheel for Z-axis (position/rotation/scale)</div>
          <div>Annotation Room: {annotationRoomCode}</div>
        </div>
      </div>
    </div>
  );
}