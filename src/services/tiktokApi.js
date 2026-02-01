// src/services/tiktokApi.js
import api from './api';

export const oauthExchange = (code) => api.oauthExchange(code);
export const validateToken = (token) => api.validateToken(token);
export const refreshToken = (...args) => api.refreshToken(...args);
export const getUserInfo = (openId, token) => api.getUserInfo(openId, token);
export const getAdvertiserAccounts = (token) => api.getAdvertiserAccounts(token);
export const searchMusic = (query, token) => api.searchMusic(query, token);
export const validateMusicId = (musicId, token) => api.validateMusicId(musicId, token);
export const uploadMusic = (fileInfo, token) => api.uploadMusic(fileInfo, token);
export const createAdCreative = (token, adData) => api.createAdCreative(token, adData);
export const getAdStatus = (token, adId) => api.getAdStatus(token, adId);

export default {
  oauthExchange,
  validateToken,
  refreshToken,
  getUserInfo,
  getAdvertiserAccounts,
  searchMusic,
  validateMusicId,
  uploadMusic,
  createAdCreative,
  getAdStatus
};
