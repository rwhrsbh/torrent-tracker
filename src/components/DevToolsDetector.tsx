'use client';

import { useEffect, useState } from 'react';

export default function DevToolsDetector() {
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {

    let isDetecting = true;

    const detectDevTools = () => {
      if (!isDetecting) return;

      const startTime = performance.now();
      
      // Use debugger statement to measure timing
      debugger;
      
      const endTime = performance.now();
      const timeDiff = endTime - startTime;

      // If time difference is greater than 5ms, dev tools are likely open
      if (timeDiff > 5) {
        setDevToolsOpen(true);
        setShowWarning(true);
        isDetecting = false; // Stop detecting once found
        return;
      }

      // Alternative method: check console
      let devtools = {
        open: false,
        orientation: null
      };

      const threshold = 160;

      setInterval(() => {
        if (!isDetecting) return;

        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          if (!devtools.open) {
            devtools.open = true;
            setDevToolsOpen(true);
            setShowWarning(true);
            isDetecting = false;
          }
        }
      }, 1000);

      // Method using console detection
      let element = new Image();
      element.__defineGetter__('id', function() {
        setDevToolsOpen(true);
        setShowWarning(true);
        isDetecting = false;
      });

      setTimeout(() => {
        if (isDetecting) {
          console.log(element);
          console.clear();
        }
      }, 1000);
    };

    // Start detection after page load
    const timer = setTimeout(() => {
      detectDevTools();
      
      // Continue checking periodically
      const interval = setInterval(() => {
        if (isDetecting && !devToolsOpen) {
          detectDevTools();
        }
      }, 3000);

      return () => {
        clearInterval(interval);
        isDetecting = false;
      };
    }, 2000);

    return () => {
      clearTimeout(timer);
      isDetecting = false;
    };
  }, [devToolsOpen]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-red-900 border border-red-700 p-8 rounded-lg max-w-md w-full mx-4 text-center">
        <h2 className="text-2xl font-bold text-red-300 mb-4">Developer Tools Detected!</h2>
        
        <div className="text-white mb-6 space-y-3">
          <p>Hey there, curious developer!</p>
          <p>I see you're trying to peek under the hood...</p>
          <p>That's not very nice, you know!</p>
          <p>Close those dev tools and browse like a normal person!</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded mb-6">
          <h3 className="font-semibold mb-2 text-yellow-400">⚠️ Warning:</h3>
          <p className="text-sm">
            Using developer tools might interfere with site functionality. 
            Please close dev tools for the best experience.
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowWarning(false);
              window.location.reload();
            }}
            className="btn-premium flex-1"
          >
            Refresh Page
          </button>
          <button
            onClick={() => setShowWarning(false)}
            className="btn-premium-outline flex-1"
          >
            Continue Anyway
          </button>
        </div>
        
        <p className="text-xs text-gray-400 mt-4">
          F12 = Bad | Normal browsing = Good
        </p>
      </div>
    </div>
  );
}