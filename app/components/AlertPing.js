'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

const logAudioState = (message, data = '') => {
  // Audio logging disabled for production
};

// Check if running on mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export default function AlertPing({ isActive = false, onClick, tableNumbers = [] }) {
  const [audioContext, setAudioContext] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const audioSourceRef = useRef(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showEnableSound, setShowEnableSound] = useState(false);
  const audioFile = '/alertping.wav';
  const interactionRef = useRef(false);

  // Initialize audio context on first user interaction
  const initAudio = () => {
    if (interactionRef.current) {
      logAudioState('Audio already initialized');
      return;
    }
    interactionRef.current = true;
    
    logAudioState('Initializing audio...');
    
    // Always use HTML5 Audio for simplicity
    logAudioState('Using HTML5 Audio');
    setAudioBuffer('html5');
    setHasInteracted(true);
    
    // Hide the enable sound prompt if it's showing
    setShowEnableSound(false);
    
    // Play a silent audio to unlock audio for the session
    unlockAudio();
  };
  
  // Function to unlock audio by playing a silent sound
  const unlockAudio = () => {
    try {
      // Create a silent audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start();
      
      // Stop after a very short time
      setTimeout(() => {
        oscillator.stop();
        ctx.close();
      }, 100);
      
      logAudioState('Audio unlocked');
    } catch (error) {
      logAudioState('Error unlocking audio:', error);
    }
  };
  
  // HTML5 Audio player with loop
  const playHtml5Audio = () => {
    try {
      const audio = new Audio(audioFile);
      audio.volume = 0.3; // Adjust volume as needed
      audio.loop = true; // Enable looping
      
      // Play and handle any errors
      audio.play().catch(error => {
        logAudioState('Error playing HTML5 audio:', error);
      });
      
      return audio;
    } catch (error) {
      logAudioState('HTML5 Audio creation failed:', error);
      return null;
    }
  };

  // Show enable sound prompt on first load
  useEffect(() => {
    if (!hasInteracted) {
      setShowEnableSound(true);
    }
  }, []);
  
  // Handle enable sound button click
  const handleEnableSound = (e) => {
    e.stopPropagation();
    initAudio();
    setShowEnableSound(false);
    
    // Try to play a test sound
    const testAudio = new Audio(audioFile);
    testAudio.volume = 0.3; // Low volume for test
    testAudio.play().catch(() => {});
    
    // Store in localStorage that user has enabled sound
    localStorage.setItem('soundEnabled', 'true');
    
    // Hide the enable sound prompt
    setShowEnableSound(false);
    
   
    // Play the test sound
    testAudio.play().catch(() => {});
    
    // Stop the test sound after 3 seconds (3000ms)
    const TEST_SOUND_DURATION = 500; // 1 second
    
    setTimeout(() => {
      testAudio.pause();
      testAudio.currentTime = 0;
    }, TEST_SOUND_DURATION);
    
    toast.success('Sound enabled!');
  };
  
  // Play sound when there's a new order
  useEffect(() => {
    if (!isActive || tableNumbers.length === 0) return;
    
    logAudioState('New order detected, playing sound...', { 
      hasInteracted, 
      audioBuffer: audioBuffer ? (audioBuffer === 'html5' ? 'html5' : 'web-audio') : 'none',
      isMobile: isMobile()
    });
    
    // If user hasn't interacted yet, show the prompt
    if (!hasInteracted) {
      logAudioState('Waiting for user interaction...');
      setShowEnableSound(true);
      return;
    }
    
    // Play the sound in a loop
    const audio = playHtml5Audio();
    
    // Cleanup function to stop the audio when component unmounts or when order is acknowledged
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.loop = false; // Disable looping when stopping
      }
    };
  }, [isActive, tableNumbers.length, hasInteracted, audioBuffer]);

  // Handle click on the alert ping
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
    // The cleanup in the useEffect will handle stopping the audio
  };

  const handleInteraction = (e) => {
    // Initialize audio on first interaction
    if (!hasInteracted) {
      initAudio();
    }
    
    e.preventDefault();
    e.stopPropagation();
    // Stop any currently playing sound
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    handleClick(e);
  };

  return (
    <div className="relative inline-flex items-center gap-2" aria-live="polite">
      {/* Enable Sound Prompt */}
      {showEnableSound && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-lg font-bold mb-2">Enable Sound Notifications</h3>
              <p className="text-gray-600 mb-4">
                Tap the button below to enable sound notifications for new orders.
              </p>
              <button
                onClick={handleEnableSound}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
              >
                Enable Sound
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isActive && tableNumbers.length > 0 && (
        <div className="flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full text-xs font-medium text-amber-800">
          {tableNumbers.map((table, index) => (
            <span key={index} className="inline-flex items-center">
              {table}
              {index < tableNumbers.length - 1 && ','}
            </span>
          ))}
        </div>
      )}
      <button 
        onClick={handleInteraction}
        onTouchEnd={handleInteraction}
        className="relative flex h-6 w-6 items-center justify-center focus:outline-none touch-manipulation"
        aria-label="New order notification"
      >
        {isActive && (
          <span 
            className="absolute inline-flex h-4 w-4 rounded-full bg-red-500 opacity-75"
            style={{
              animation: isActive ? 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none',
              pointerEvents: 'none'
            }}
          />
        )}
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
        {isActive && tableNumbers.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {tableNumbers.length}
          </span>
        )}
      </button>
      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}