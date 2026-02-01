// src/services/api.js
import jsonServerApi from './jsonServerApi';

// Unified API interface
export const api = {
  // Authentication
  oauthExchange: jsonServerApi.mockOAuthExchange,
  validateToken: jsonServerApi.mockValidateToken,
  refreshToken: () => Promise.resolve({
    access_token: `refreshed_${Date.now()}`,
    expires_in: 3600
  }),
  
  // User & Accounts
  getUserInfo: (openId) => jsonServerApi.getUserInfo(openId),
  getAdvertiserAccounts: (token) => jsonServerApi.getAdvertiserAccounts(),
  
  // Music
  searchMusic: (query, token) => jsonServerApi.searchMusic(query, token),
  validateMusicId: (musicId, token) => jsonServerApi.validateMusicId(musicId, token),
  uploadMusic: (fileInfo, token) => jsonServerApi.uploadMusic(fileInfo, token),
  
  // Ads
  createAdCreative: (token, adData) => jsonServerApi.submitAdCreative(token, adData),
  submitAdCreative: (token, adData) => jsonServerApi.submitAdCreative(token, adData),
  getAdStatus: () => Promise.resolve({
    success: true,
    data: { status: 'UNDER_REVIEW' }
  }),
  
  // Utilities
  getOAuthUrl: () => '#',
  
  // Mock functions for components that use old names
  mockCreateAdCreative: jsonServerApi.submitAdCreative,
  mockValidateMusicId: jsonServerApi.validateMusicId,
  mockUploadMusic: jsonServerApi.uploadMusic
};

export default api;