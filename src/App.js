// src/App.js - Fixed
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import OAuthButton from './components/OAuthButton';
import AdCreationForm from './components/AdCreationForm';
import AdDetails from './components/AdDetails';
import ErrorDisplay from './components/ErrorDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import MockOAuthDialog from './components/MockOAuthDialog';
import { useTikTokAuth } from './hooks/useTikTokAuth';
import './App.css';

function App() {
  const {
    isAuthenticated,
    isLoading,
    error,
    clearError,
    accessToken,
    userInfo,
    adAccounts,
    handleOAuthCallback,
    logout
  } = useTikTokAuth();

  const [showMockDialog, setShowMockDialog] = useState(false);
  const [oauthState, setOauthState] = useState('');

  useEffect(() => {
    const handleOAuthStart = (event) => {
      setOauthState(event.detail.state);
      setShowMockDialog(true);
    };

    window.addEventListener('mock-oauth-start', handleOAuthStart);
    return () => window.removeEventListener('mock-oauth-start', handleOAuthStart);
  }, []);

  const handleMockAuthorize = () => {
    setShowMockDialog(false);
    const mockCode = `mock_code_${Date.now()}`;
    handleOAuthCallback({ code: mockCode, state: oauthState });
  };

  const handleMockCancel = () => {
    setShowMockDialog(false);
    handleOAuthCallback({ error: 'user_cancelled', state: oauthState });
  };

  if (isLoading) {
    return <LoadingSpinner message="Initializing..." />;
  }

  return (
    <Router>
      <div className="app">
        {showMockDialog && (
          <MockOAuthDialog 
            onAuthorize={handleMockAuthorize}
            onCancel={handleMockCancel}
          />
        )}
        
        <header className="app-header">
          <h1>TikTok Ads Creation Flow</h1>
          {isAuthenticated ? (
            <div className="header-right">
              {userInfo && (
                <div className="user-greeting">
                  {userInfo.avatar_url && (
                    <img 
                      src={userInfo.avatar_url} 
                      alt={userInfo.display_name}
                      className="header-avatar"
                    />
                  )}
                  <span>Hi, {userInfo.display_name}</span>
                </div>
              )}
              <button onClick={logout} className="logout-btn">
                Disconnect
              </button>
            </div>
          ) : (
            <div className="demo-badge">
              🔧 Demo Mode
            </div>
          )}
        </header>

        <main className="app-main">
          <ErrorDisplay error={error} onClose={clearError} />
          
          {isAuthenticated && userInfo && (
            <div className="user-info-card">
              {userInfo.avatar_url && (
                <img 
                  src={userInfo.avatar_url} 
                  alt={userInfo.display_name}
                  className="user-avatar"
                />
              )}
              <div className="user-details">
                <h4>{userInfo.display_name}</h4>
                <p>{userInfo.email || 'demo@tiktokads.com'}</p>
              </div>
            </div>
          )}
          
          {isAuthenticated && adAccounts && adAccounts.length > 0 && (
            <div className="ad-accounts-section">
              <h3>Connected Ad Accounts</h3>
              <div className="ad-accounts-grid">
                {adAccounts.map(account => (
                  <div key={account.advertiser_id} className="ad-account-card">
                    <div className="ad-account-header">
                      <div className="account-name">{account.advertiser_name}</div>
                      <span className="account-status">{account.status}</span>
                    </div>
                    <div className="account-details">
                      <span>Balance: <span className="account-balance">{account.currency} {account.balance?.toLocaleString() || '0'}</span></span>
                      <span>{account.timezone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Routes>
            <Route path="/" element={
              !isAuthenticated ? (
                <div className="auth-section">
                  <h2>Connect Your TikTok Ads Account</h2>
                  <p className="demo-description">
                    This is a <strong>demo application</strong> that simulates TikTok Ads API integration.
                    Since TikTok API access is restricted in some regions, we're using a mock backend.
                  </p>
                  
                  <div className="demo-features">
                    <h4>Demo Features:</h4>
                    <ul>
                      <li>✅ Mock OAuth authentication flow</li>
                      <li>✅ Simulated TikTok Ads API responses</li>
                      <li>✅ Realistic error scenarios</li>
                      <li>✅ Complete ad creation workflow</li>
                      <li>✅ Music selection with validation</li>
                    </ul>
                  </div>
                  
                  <div className="auth-action">
                    <OAuthButton />
                    <p className="auth-note">
                      <small>
                        Clicking will show a mock TikTok OAuth dialog. No real TikTok account required.
                      </small>
                    </p>
                  </div>
                </div>
              ) : (
                <AdCreationForm accessToken={accessToken} />
              )
            } />
            <Route path="/oauth/callback" element={
              <OAuthCallback handleCallback={handleOAuthCallback} />
            } />
            <Route path="/ads/:id" element={
              <AdDetails />
            } />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <div className="footer-content">
            <p>
              <strong>⚠️ Demo Application</strong> - This is a mock implementation for demonstration purposes.
              Real TikTok API integration would require developer account approval.
            </p>
            <div className="footer-links">
              <a href="https://developers.tiktok.com/" target="_blank" rel="noopener noreferrer">
                TikTok Developer Portal
              </a>
              <a href="https://ads.tiktok.com/" target="_blank" rel="noopener noreferrer">
                TikTok Ads Manager
              </a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

function OAuthCallback({ handleCallback }) {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const state = params.get('state');
    
    if (error) {
      handleCallback({ error, state });
      navigate('/');
    } else if (code) {
      handleCallback({ code, state });
      navigate('/');
    } else {
      navigate('/');
    }
  }, [handleCallback, navigate]);

  return <LoadingSpinner message="Connecting to TikTok..." />;
}

export default App;