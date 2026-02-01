// src/services/jsonServerApi.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Mock functions for development
export const mockOAuthExchange = async (code) => {
  try {
    const response = await api.post('/oauth/token', { code });
    return response.data;
  } catch (error) {
    console.error('OAuth error:', error);
    // Return mock data if server is down
    return {
      access_token: `mock_token_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      expires_in: 3600,
      open_id: 'open_id_123456789',
      scope: 'user.info.basic,ads.identity',
      token_type: 'Bearer'
    };
  }
};

export const mockValidateToken = async (token) => {
  return token && token.startsWith('mock_token_');
};

export const validateMusicId = async (musicId, accessToken) => {
  try {
    const response = await api.get(`/music/validate/${musicId}`);
    return response.data;
  } catch (error) {
    console.error('Music validation error:', error);
    
    // Fallback to direct music endpoint
    try {
      const response = await api.get(`/music/${musicId}`);
      const music = response.data;
      return {
        valid: music.is_available_for_ads || false,
        success: true,
        music: music,
        is_accessible: true,
        can_be_used_in_ads: music.is_available_for_ads || false
      };
    } catch (secondError) {
      // Mock validation as fallback
      if (musicId === 'music_001' || musicId === 'music_002' || musicId === 'music_003') {
        return {
          valid: true,
          success: true,
          music: {
            id: musicId,
            title: `Mock Track ${musicId}`,
            author: 'Mock Artist',
            status: 'APPROVED',
            is_available_for_ads: true
          },
          is_accessible: true,
          can_be_used_in_ads: true
        };
      }
      if (musicId === 'music_011') {
        return {
          valid: false,
          success: false,
          error: 'This music track is not approved for ads'
        };
      }
      return {
        valid: false,
        success: false,
        error: 'Music ID not found'
      };
    }
  }
};

export const submitAdCreative = async (accessToken, adData) => {
  try {
    const response = await api.post('/ads', adData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Ad creation error:', error);
    
    // Try without /api prefix
    try {
      const response = await axios.post('http://localhost:3001/ads', adData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (secondError) {
      // Mock response as final fallback
      const adId = `ad_${Date.now()}`;
      return {
        success: true,
        data: {
          creative: {
            creative_id: `creative_${adId}`,
            ad_id: adId,
            status: 'UNDER_REVIEW',
            review_estimate: '24-48 hours',
            created_at: new Date().toISOString()
          }
        },
        message: 'Ad created successfully (fallback mock)'
      };
    }
  }
};

export const getAdById = async (adId) => {
  try {
    const response = await api.get(`/ads/${adId}`);
    return response.data;
  } catch (error) {
    console.error('Get ad by id error:', error);
    try {
      const response = await axios.get(`http://localhost:3001/ads/${adId}`);
      return response.data;
    } catch (secondError) {
      return { success: false, error: 'Ad not found' };
    }
  }
};

export const getAdvertiserAccounts = async (accessToken) => {
  try {
    const response = await api.get('/advertisers', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return {
      success: true,
      data: {
        list: Array.isArray(response.data) ? response.data : [response.data]
      }
    };
  } catch (error) {
    console.error('Get advertisers error:', error);
    
    // Try without /api prefix
    try {
      const response = await axios.get('http://localhost:3001/advertisers', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return {
        success: true,
        data: {
          list: Array.isArray(response.data) ? response.data : [response.data]
        }
      };
    } catch (secondError) {
      // Mock response
      return {
        success: true,
        data: {
          list: [
            {
              advertiser_id: 'adv_789012345',
              advertiser_name: 'Mock Brand Store',
              currency: 'USD',
              balance: 1000,
              status: 'ACTIVE'
            }
          ]
        }
      };
    }
  }
};

export const getUserInfo = async (openId, accessToken) => {
  try {
    const response = await api.get(`/users?open_id=${openId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    let user = null;
    if (Array.isArray(response.data) && response.data.length > 0) {
      user = response.data[0];
    } else if (response.data && !Array.isArray(response.data)) {
      user = response.data;
    }
    
    if (user) {
      return {
        success: true,
        data: {
          user: user
        }
      };
    }
  } catch (error) {
    console.error('Get user info error:', error);
  }
  
  // Return mock user
  return {
    success: true,
    data: {
      user: {
        open_id: openId || 'open_id_123456789',
        display_name: 'Dharmende Singh',
        avatar_url: 'https://ui-avatars.com/api/?name=Dharmende+Singh&background=ff0050&color=fff',
        email: 'demo@tiktokads.com'
      }
    }
  };
};

export const searchMusic = async (query, accessToken) => {
  try {
    const response = await api.get('/music', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    let musicList = Array.isArray(response.data) ? response.data : [];
    
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase();
      musicList = musicList.filter(music =>
        music.title.toLowerCase().includes(searchTerm) ||
        music.author.toLowerCase().includes(searchTerm) ||
        (music.genre && music.genre.toLowerCase().includes(searchTerm))
      );
    }
    
    return {
      success: true,
      data: {
        music_list: musicList.slice(0, 10)
      }
    };
  } catch (error) {
    console.error('Search music error:', error);
    return {
      success: true,
      data: {
        music_list: []
      }
    };
  }
};

export const uploadMusic = async (fileInfo, accessToken) => {
  // Simulate upload
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const musicId = `uploaded_${Date.now()}`;
  
  return {
    success: true,
    data: {
      music: {
        id: musicId,
        title: fileInfo.name || 'Custom Music',
        author: 'Your Brand',
        status: 'PENDING_REVIEW',
        is_available_for_ads: false
      },
      message: 'Music uploaded successfully and is pending review'
    }
  };
};

// Alias for backward compatibility
export const mockCreateAdCreative = submitAdCreative;
export const mockValidateMusicId = validateMusicId;
export const mockUploadMusic = uploadMusic;

export default {
  mockOAuthExchange,
  mockValidateToken,
  validateMusicId,
  submitAdCreative,
  getAdvertiserAccounts,
  getUserInfo,
  searchMusic,
  uploadMusic,
  mockCreateAdCreative,
  mockValidateMusicId,
  mockUploadMusic,
  api
};