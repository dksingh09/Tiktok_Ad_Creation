// middleware.js
const fs = require('fs');
const path = require('path');

let db = null;
let dbFilePath = null;

const loadDB = () => {
  if (!db) {
    // Allow overriding DB file for tests via DB_JSON_FILE env var
    dbFilePath = process.env.DB_JSON_FILE || path.resolve(process.cwd(), 'db.json');
    const rawData = fs.readFileSync(dbFilePath, 'utf-8');
    db = JSON.parse(rawData);
  }
  return db;
};

const saveDB = (database) => {
  const targetPath = dbFilePath || path.resolve(process.cwd(), 'db.json');
  fs.writeFileSync(targetPath, JSON.stringify(database, null, 2));
};

const validateAd = (ad) => {
  const errors = [];
  if (!ad.campaignName || typeof ad.campaignName !== 'string' || ad.campaignName.trim().length < 3) {
    errors.push('Campaign name must be at least 3 characters');
  }
  const objective = (ad.objective || '').toLowerCase();
  if (!['traffic', 'conversions'].includes(objective)) {
    errors.push('Objective must be "traffic" or "conversions"');
  }
  if (!ad.adText || typeof ad.adText !== 'string' || ad.adText.trim().length === 0 || ad.adText.trim().length > 100) {
    errors.push('Ad text is required and must be 1-100 characters');
  }
  // Music required for conversions
  if (objective === 'conversions') {
    if (!ad.musicOption || ad.musicOption === 'none') {
      errors.push('Music is required for Conversions objective');
    }
    if (ad.musicOption === 'existing' && !ad.musicId) {
      errors.push('Please provide a musicId when using an existing music option');
    }
  }
  return errors;
};

module.exports = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, req.body || '');
  
  // Remove /api prefix for middleware processing
  let path = req.path;
  if (path.startsWith('/api')) {
    path = path.replace('/api', '');
  }
  
  // Custom endpoint for OAuth token exchange
  if (req.method === 'POST' && path === '/oauth/token') {
    const { code } = req.body;
    
    // Mock token response
    return res.json({
      access_token: `mock_token_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      expires_in: 3600,
      open_id: 'open_id_123456789',
      scope: 'user.info.basic,ads.identity',
      token_type: 'Bearer'
    });
  }

  // Admin endpoint: reset DB from db.initial.json
  if (req.method === 'POST' && path === '/__admin/reset') {
    try {
      const initialPath = process.env.DB_INITIAL_FILE || path.resolve(process.cwd(), 'db.initial.json');
      const initialData = fs.readFileSync(initialPath, 'utf-8');
      fs.writeFileSync(process.env.DB_JSON_FILE || path.resolve(process.cwd(), 'db.json'), initialData);
      // Clear cached db so subsequent calls reload
      db = null;
      return res.json({ success: true, message: 'Database reset to initial state' });
    } catch (err) {
      console.error('Reset DB error:', err);
      return res.status(500).json({ success: false, error: 'Failed to reset database' });
    }
  }
  
  // Custom endpoint to fetch single ad by ad_id
  if (req.method === 'GET' && path.startsWith('/ads/')) {
    const adId = path.split('/').pop();
    const db = loadDB();
    const ad = db.ads.find(a => a.ad_id === adId || String(a.id) === adId);
    if (ad) {
      return res.json({ success: true, data: { ad } });
    }
    return res.status(404).json({ success: false, error: 'Ad not found' });
  }
  
  // Custom endpoint for ad creation
  if (req.method === 'POST' && path === '/ads') {
    const adData = req.body || {};
    
    // Validate
    const validationErrors = validateAd(adData);
    if (validationErrors.length) {
      return res.status(400).json({ success: false, type: 'validation', errors: validationErrors });
    }
    
    // Load database
    const db = loadDB();
    
    // Generate ad ID
    const adId = `ad_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const creativeId = `creative_${adId}`;
    
    const newAd = {
      id: (db.ads && db.ads.length ? db.ads.length + 1 : 1),
      ad_id: adId,
      creative_id: creativeId,
      campaign_name: adData.campaignName,
      objective: (adData.objective || '').toLowerCase(),
      ad_text: adData.adText,
      cta: adData.cta || '',
      music_option: adData.musicOption || 'none',
      music_id: adData.musicId || '',
      status: 'UNDER_REVIEW',
      created_at: new Date().toISOString(),
      estimated_review_time: '24-48 hours',
      advertiser_id: 'adv_789012345',
      user_id: 1
    };
    
    // Ensure arrays exist
    db.ads = db.ads || [];
    db.ads.push(newAd);
    saveDB(db);
    
    return res.json({
      success: true,
      data: {
        creative: {
          creative_id: creativeId,
          ad_id: adId,
          status: 'UNDER_REVIEW',
          review_estimate: '24-48 hours',
          created_at: new Date().toISOString()
        }
      },
      message: 'Ad created successfully'
    });
  }
  
  // Custom endpoint for music validation
  if (req.method === 'GET' && path.startsWith('/music/validate/')) {
    const musicId = path.split('/').pop();
    const db = loadDB();
    
    const music = db.music && db.music.find(m => String(m.id) === String(musicId));
    
    if (music) {
      return res.json({
        valid: music.is_available_for_ads,
        success: true,
        music: music,
        is_accessible: true,
        can_be_used_in_ads: music.is_available_for_ads
      });
    } else {
      return res.json({
        valid: false,
        success: false,
        error: 'Music ID not found'
      });
    }
  }
  
  next();
};

// Additional mock endpoints and routing are handled by json-server and this middleware.
// This middleware implements custom logic for endpoints (e.g., /oauth/token, POST /ads, GET /music/validate/:id) and persists to the project-root `db.json`.