// src/components/MockOAuthDialog.jsx
import React, { useState, useEffect } from 'react';

const MockOAuthDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [oauthState, setOauthState] = useState('');
  const [step, setStep] = useState(1);
  const [selectedAccount, setSelectedAccount] = useState('personal');
  const [scopes, setScopes] = useState({
    'user.info.basic': true,
    'ads.identity': true,
    'ads.management': false
  });

  useEffect(() => {
    const handleOAuthStart = (event) => {
      setOauthState(event.detail.state);
      setIsOpen(true);
      setStep(1);
    };

    window.addEventListener('mock-oauth-start', handleOAuthStart);
    return () => {
      window.removeEventListener('mock-oauth-start', handleOAuthStart);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Simulate user cancel
    window.location.href = `${window.location.origin}/?error=user_cancelled&state=${oauthState}`;
  };

  const handleAuthorize = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Generate mock authorization code
      const mockCode = `mock_code_${Date.now()}`;
      
      // Close dialog
      setIsOpen(false);
      
      // Redirect with code
      const redirectUri = `${window.location.origin}/oauth/callback?code=${mockCode}&state=${oauthState}`;
      window.location.href = redirectUri;
    }
  };

  const toggleScope = (scope) => {
    setScopes(prev => ({
      ...prev,
      [scope]: !prev[scope]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="mock-oauth-dialog-overlay">
      <div className="mock-oauth-dialog">
        <div className="dialog-header">
          <div className="tiktok-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000000">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
              <path d="M15.6 8.8H12.8V16H11.2V8.8H8.4V7.2H15.6V8.8Z" fill="white"/>
            </svg>
            <span>TikTok</span>
          </div>
          <button onClick={handleClose} className="close-btn">×</button>
        </div>

        <div className="dialog-content">
          {step === 1 ? (
            <>
              <h3>Connect TikTok Ads Account</h3>
              <p className="app-name">Demo Ads App wants to access your TikTok account</p>
              
              <div className="account-selection">
                <p className="section-title">Select Account</p>
                <div className="account-options">
                  <label className="account-option">
                    <input
                      type="radio"
                      name="account"
                      value="personal"
                      checked={selectedAccount === 'personal'}
                      onChange={() => setSelectedAccount('personal')}
                    />
                    <div className="account-info">
                      <div className="account-avatar">👤</div>
                      <div>
                        <div className="account-name">Personal Account</div>
                        <div className="account-detail">@demouser</div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="account-option">
                    <input
                      type="radio"
                      name="account"
                      value="business"
                      checked={selectedAccount === 'business'}
                      onChange={() => setSelectedAccount('business')}
                    />
                    <div className="account-info">
                      <div className="account-avatar">🏢</div>
                      <div>
                        <div className="account-name">Business Account</div>
                        <div className="account-detail">My Brand Store</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="scope-selection">
                <p className="section-title">This app will receive:</p>
                <div className="scope-list">
                  <label className="scope-item">
                    <input
                      type="checkbox"
                      checked={scopes['user.info.basic']}
                      onChange={() => toggleScope('user.info.basic')}
                      disabled
                    />
                    <div className="scope-info">
                      <div className="scope-name">Basic user information</div>
                      <div className="scope-desc">Your profile picture and display name</div>
                    </div>
                  </label>
                  
                  <label className="scope-item">
                    <input
                      type="checkbox"
                      checked={scopes['ads.identity']}
                      onChange={() => toggleScope('ads.identity')}
                      disabled
                    />
                    <div className="scope-info">
                      <div className="scope-name">Ads account access</div>
                      <div className="scope-desc">View and manage your ad accounts</div>
                    </div>
                  </label>
                  
                  <label className="scope-item">
                    <input
                      type="checkbox"
                      checked={scopes['ads.management']}
                      onChange={() => toggleScope('ads.management')}
                    />
                    <div className="scope-info">
                      <div className="scope-name">Ad management</div>
                      <div className="scope-desc">Create and edit ads (optional)</div>
                    </div>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3>Confirm Permissions</h3>
              <div className="confirmation-info">
                <div className="permission-summary">
                  <p>✅ Basic user information</p>
                  <p>✅ Ads account access</p>
                  <p>{scopes['ads.management'] ? '✅' : '❌'} Ad management</p>
                </div>
                
                <div className="security-note">
                  <p>🔒 Your data is secure</p>
                  <small>This is a demo app. In production, you would be redirected to real TikTok OAuth.</small>
                </div>
              </div>
            </>
          )}

          <div className="dialog-footer">
            <button onClick={handleClose} className="btn-cancel">
              Cancel
            </button>
            <button onClick={handleAuthorize} className="btn-authorize">
              {step === 1 ? 'Continue' : 'Authorize'}
            </button>
          </div>
          
          <div className="demo-note">
            <small>🔧 This is a mock OAuth dialog for demonstration purposes.</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockOAuthDialog;