'use client';

import { useEffect, useState } from 'react';

export default function AdBlockDetector() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const detectAdBlock = () => {
      // Create a fake ad element
      const ad = document.createElement('div');
      ad.innerHTML = '&nbsp;';
      ad.className = 'adsbox ad-banner advertisement ads banner-ad';
      ad.style.position = 'absolute';
      ad.style.left = '-9999px';
      ad.style.height = '1px';
      ad.style.width = '1px';
      
      document.body.appendChild(ad);
      
      // Check if the element is hidden by adblock
      setTimeout(() => {
        const isBlocked = ad.offsetHeight === 0 || 
                         ad.offsetWidth === 0 || 
                         window.getComputedStyle(ad).display === 'none' ||
                         window.getComputedStyle(ad).visibility === 'hidden';
        
        if (isBlocked) {
          setAdBlockDetected(true);
          setShowWarning(true);
        }
        
        document.body.removeChild(ad);
      }, 100);
    };

    // Run detection after component mounts
    const timer = setTimeout(detectAdBlock, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-red-900 border border-red-700 p-8 rounded-lg max-w-md w-full mx-4 text-center">
        <h2 className="text-2xl font-bold text-red-300 mb-4">AdBlock Detected!</h2>
        
        <div className="text-white mb-6 space-y-3">
          <p>Listen here, you might regret this decision!</p>
          <p>You're seriously going to leave me without any income?</p>
          <p>This site costs money to run, and ads help keep it free for everyone.</p>
          <p>Don't be that person who takes everything for free without giving back!</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded mb-6">
          <h3 className="font-semibold mb-2">How to disable AdBlock:</h3>
          <ol className="text-sm text-left space-y-1">
            <li>1. Click the AdBlock icon in your browser</li>
            <li>2. Select "Pause on this site" or "Disable on this domain"</li>
            <li>3. Refresh the page</li>
          </ol>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="btn-premium flex-1"
          >
            I Disabled AdBlock
          </button>
          <button
            onClick={() => setShowWarning(false)}
            className="btn-premium-outline flex-1"
          >
            Continue Anyway
          </button>
        </div>
        
        <p className="text-xs text-gray-400 mt-4">
          Your choice affects the future of this site
        </p>
      </div>
    </div>
  );
}