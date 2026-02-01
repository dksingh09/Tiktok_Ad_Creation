// src/components/OAuthButton.jsx
import React, { useState } from 'react';

const OAuthButton = () => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    
    // Dispatch custom event to trigger mock OAuth dialog
    const state = Math.random().toString(36).substring(7);
    window.dispatchEvent(new CustomEvent('mock-oauth-start', { 
      detail: { state } 
    }));
    
    // Simulate OAuth completion after delay
    setTimeout(() => {
      const mockCode = `mock_code_${Date.now()}`;
      
      // Simulate callback
      const callbackUrl = `/oauth/callback?code=${mockCode}&state=${state}`;
      window.location.href = callbackUrl;
      
      setIsConnecting(false);
    }, 1500);
  };

  return (
    <div className="oauth-container">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="oauth-btn"
      >
        {isConnecting ? (
          <>
            <span className="spinner-small"></span>
            Connecting to TikTok...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#000000"/>
              <path d="M15.6 8.8H12.8V16H11.2V8.8H8.4V7.2H15.6V8.8Z" fill="#ffffff"/>
            </svg>
            Connect TikTok Ads Account
          </>
        )}
      </button>
      
      <div className="oauth-info">
        <p className="oauth-note">
          <small>
            🔐 You'll see a mock TikTok OAuth dialog. No real TikTok account needed.
          </small>
        </p>
      </div>
    </div>
  );
};

export default OAuthButton;