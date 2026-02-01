// src/hooks/useTikTokAuth.js - Fixed
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useTikTokAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [adAccounts, setAdAccounts] = useState([]);

  // Memoize checkExistingToken
  const checkExistingToken = useCallback(async () => {
    const token = localStorage.getItem('tiktok_access_token');
    
    if (token) {
      try {
        const isValid = await api.validateToken(token);
        if (isValid) {
          setAccessToken(token);
          setIsAuthenticated(true);
          
          // Load user info
          const openId = localStorage.getItem('tiktok_open_id');
          if (openId) {
            try {
              const userResponse = await api.getUserInfo(openId, token);
              if (userResponse.success) {
                setUserInfo(userResponse.data.user);
              }
            } catch (err) {
              console.warn('Could not fetch user info:', err);
            }
          }
          
          // Load ad accounts
          try {
            const accountsResponse = await api.getAdvertiserAccounts(token);
            if (accountsResponse.success) {
              setAdAccounts(accountsResponse.data.list || []);
            }
          } catch (err) {
            console.warn('Could not fetch ad accounts:', err);
          }
        } else {
          clearStorage();
        }
      } catch (err) {
        console.error('Token validation error:', err);
        clearStorage();
      }
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkExistingToken();
  }, [checkExistingToken]);

  const clearStorage = () => {
    localStorage.removeItem('tiktok_access_token');
    localStorage.removeItem('tiktok_refresh_token');
    localStorage.removeItem('tiktok_open_id');
    setAccessToken(null);
    setIsAuthenticated(false);
    setUserInfo(null);
    setAdAccounts([]);
  };

  const initiateOAuth = useCallback(() => {
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('oauth_state', state);
    
    // For JSON Server mock, we'll use custom event
    window.dispatchEvent(new CustomEvent('mock-oauth-start', { detail: { state } }));
  }, []);

  const handleOAuthCallback = useCallback(async (params) => {
    setIsLoading(true);
    setError(null);

    try {
      const { code, error: oauthError } = params;
      
      // Check for OAuth errors
      if (oauthError) {
        throw new Error(`OAuth Error: ${oauthError}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Exchange code for token
      const tokenData = await api.oauthExchange(code);
      
      if (!tokenData.access_token) {
        throw new Error('No access token received');
      }

      // Store tokens
      localStorage.setItem('tiktok_access_token', tokenData.access_token);
      localStorage.setItem('tiktok_refresh_token', tokenData.refresh_token || '');
      localStorage.setItem('tiktok_open_id', tokenData.open_id || '');
      
      // Set state
      setAccessToken(tokenData.access_token);
      setIsAuthenticated(true);
      
      // Get user info
      try {
        const userResponse = await api.getUserInfo(tokenData.open_id, tokenData.access_token);
        if (userResponse.success) {
          setUserInfo(userResponse.data.user);
        }
      } catch (userErr) {
        console.warn('Could not fetch user info:', userErr);
      }
      
      // Get ad accounts
      try {
        const accountsResponse = await api.getAdvertiserAccounts(tokenData.access_token);
        if (accountsResponse.success) {
          setAdAccounts(accountsResponse.data.list || []);
        }
      } catch (accountsErr) {
        console.warn('Could not fetch ad accounts:', accountsErr);
      }
      
    } catch (err) {
      console.error('OAuth callback error:', err);
      
      // User-friendly error messages
      let userMessage = 'Failed to connect. Please try again.';
      let errorType = 'oauth';
      
      if (err.message.includes('invalid_client')) {
        userMessage = 'Invalid app credentials.';
        errorType = 'auth';
      } else if (err.message.includes('invalid_token')) {
        userMessage = 'Your session has expired. Please reconnect.';
        errorType = 'auth';
      }
      
      setError({
        type: errorType,
        message: userMessage,
        details: err.message,
        retryable: true,
      });
      
      clearStorage();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearStorage();
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      const userResponse = await api.getUserInfo(
        localStorage.getItem('tiktok_open_id'),
        accessToken
      );
      if (userResponse.success) {
        setUserInfo(userResponse.data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  }, [accessToken]);

  return {
    isAuthenticated,
    isLoading,
    error,
    accessToken,
    userInfo,
    adAccounts,
    initiateOAuth,
    handleOAuthCallback,
    logout,
    clearError,
    refreshUserData,
  };
};