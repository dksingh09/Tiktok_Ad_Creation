// src/utils/validation.js

export const validateAdForm = (formData) => {
  const errors = {};

  // Campaign Name validation
  if (!formData.campaignName.trim()) {
    errors.campaignName = 'Campaign name is required';
  } else if (formData.campaignName.trim().length < 3) {
    errors.campaignName = 'Campaign name must be at least 3 characters';
  }

  // Ad Text validation
  if (!formData.adText.trim()) {
    errors.adText = 'Ad text is required';
  } else if (formData.adText.trim().length > 100) {
    errors.adText = 'Ad text must be 100 characters or less';
  }

  // Music validation based on objective
  if (formData.objective === 'conversions') {
    if (formData.musicOption === 'none') {
      errors.music = 'Music is required for Conversions objective';
    } else if (formData.musicOption === 'existing' && !formData.musicId) {
      errors.music = 'Please enter a Music ID';
    }
  }

  return errors;
};

export const validateMusicIdFormat = (musicId) => {
  // Basic format validation for TikTok music IDs
  if (!musicId) return false;
  
  // TikTok music IDs are typically alphanumeric with underscores
  // Removed unnecessary escape character
  const pattern = /^[a-zA-Z0-9_-]{5,}$/;
  return pattern.test(musicId);
};