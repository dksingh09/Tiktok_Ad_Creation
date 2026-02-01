// src/components/MusicSelection.jsx - Fixed
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const MusicSelection = ({ objective, onMusicChange, initialOption, error, accessToken }) => {
  const [musicOption, setMusicOption] = useState(initialOption || 'none');
  const [musicId, setMusicId] = useState('');
  const [customMusicFile, setCustomMusicFile] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [musicSuggestions, setMusicSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Memoize loadMusicSuggestions
  const loadMusicSuggestions = useCallback(async () => {
    try {
      const response = await api.searchMusic('', accessToken);
      if (response.success && response.data.music_list) {
        setMusicSuggestions(response.data.music_list.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load music suggestions:', err);
    }
  }, [accessToken]);

  // Update parent when option changes
  useEffect(() => {
    const musicData = {
      musicOption,
      musicId: musicOption === 'existing' ? musicId : '',
      customMusicId: musicOption === 'custom' ? `uploaded_music_${Date.now()}` : ''
    };
    onMusicChange(musicData);
  }, [musicOption, musicId, customMusicFile, onMusicChange]);

  // Load music suggestions
  useEffect(() => {
    if (musicOption === 'existing' && accessToken) {
      loadMusicSuggestions();
    }
  }, [musicOption, accessToken, loadMusicSuggestions]);

  const handleOptionChange = (option) => {
    setMusicOption(option);
    setValidationError(null);
    setShowSuggestions(false);
    
    if (option === 'none' && objective === 'conversions') {
      setValidationError('❌ Music is required for Conversions objective');
    }
  };

  const handleMusicIdChange = async (e) => {
    const id = e.target.value;
    setMusicId(id);
    
    if (id.length >= 5) {
      setIsValidating(true);
      try {
        const validationResult = await api.validateMusicId(id, accessToken);
        
        if (!validationResult.valid && !validationResult.success) {
          setValidationError(validationResult.error || 'Invalid Music ID. Please enter a valid TikTok Music ID.');
        } else {
          setValidationError(null);
          onMusicChange({ musicId: id });
        }
      } catch (err) {
        setValidationError('Failed to validate music. Please try again.');
        console.error('Music validation error:', err);
      } finally {
        setIsValidating(false);
      }
    }
  };

  const handleSelectSuggestion = (music) => {
    setMusicId(music.id);
    setValidationError(null);
    setShowSuggestions(false);
    onMusicChange({ musicId: music.id });
  };

  const handleFileSelect = () => {
    // Simulate file selection
    setUploadProgress(0);
    const file = {
      name: 'custom_music.mp3',
      size: 5242880,
      type: 'audio/mp3'
    };
    setCustomMusicFile(file);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Call API after upload completes
          if (accessToken) {
            api.uploadMusic(file, accessToken)
              .then(result => {
                console.log('Music uploaded:', result);
                if (result.success && result.data.music?.id) {
                  onMusicChange({ musicId: result.data.music.id });
                }
              })
              .catch(err => {
                console.error('Upload failed:', err);
                setValidationError('Music upload failed. Please try again.');
              });
          }
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const isMusicRequired = objective === 'conversions';

  const getMusicStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#34c759';
      case 'PENDING_REVIEW': return '#ff9500';
      case 'REJECTED': return '#ff3b30';
      default: return '#666';
    }
  };

  return (
    <div className="music-selection">
      <h3>🎵 Music Selection</h3>
      
      {(error || validationError) && (
        <div className="music-error">
          ⚠️ {error || validationError}
        </div>
      )}

      <div className="music-options">
        {/* Option A: Existing Music ID */}
        <div className="music-option">
          <label>
            <input
              type="radio"
              name="musicOption"
              value="existing"
              checked={musicOption === 'existing'}
              onChange={() => handleOptionChange('existing')}
            />
            Use Existing Music ID
          </label>
          {musicOption === 'existing' && (
            <div className="music-option-details">
              <div className="music-input-container">
                <input
                  type="text"
                  placeholder="Enter TikTok Music ID (e.g., music_001)"
                  value={musicId}
                  onChange={handleMusicIdChange}
                  onFocus={() => setShowSuggestions(true)}
                  className={validationError ? 'error' : ''}
                />
                <button 
                  type="button"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="suggestions-toggle"
                  style={{
                    marginLeft: '10px',
                    padding: '6px 12px',
                    background: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
                </button>
              </div>
              
              {isValidating && (
                <div className="validating-indicator">
                  <span className="spinner-small" style={{ marginRight: '8px' }}></span>
                  Validating music ID...
                </div>
              )}
              
              {showSuggestions && musicSuggestions.length > 0 && (
                <div className="music-suggestions">
                  <p className="suggestions-title">Available Music Tracks:</p>
                  <div className="suggestions-list">
                    {musicSuggestions.map(music => (
                      <div 
                        key={music.id}
                        className="suggestion-item"
                        onClick={() => handleSelectSuggestion(music)}
                        style={{
                          padding: '10px',
                          margin: '5px 0',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: musicId === music.id ? '#f0f9ff' : 'white',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong>{music.title}</strong>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {music.author} • {Math.floor(music.duration / 60000)}:{((music.duration % 60000) / 1000).toFixed(0).padStart(2, '0')}
                          </div>
                        </div>
                        <span 
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            background: getMusicStatusColor(music.status),
                            color: 'white'
                          }}
                        >
                          {music.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                    🔍 Total {musicSuggestions.length} tracks available in JSON Server
                  </small>
                </div>
              )}
              
              <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                Try: "music_001" (valid) or "music_011" (rejected) 
                <br />
                💡 Click "Show Suggestions" to browse available tracks
              </small>
            </div>
          )}
        </div>

        {/* Option B: Upload Custom Music */}
        <div className="music-option">
          <label>
            <input
              type="radio"
              name="musicOption"
              value="custom"
              checked={musicOption === 'custom'}
              onChange={() => handleOptionChange('custom')}
            />
            Upload Custom Music
          </label>
          {musicOption === 'custom' && (
            <div className="music-option-details">
              <button 
                type="button" 
                onClick={handleFileSelect}
                className="upload-btn"
                disabled={uploadProgress > 0 && uploadProgress < 100}
              >
                {customMusicFile ? 'Change Music File' : 'Select Music File'}
              </button>
              
              {customMusicFile && (
                <div className="upload-info">
                  <div className="file-info">
                    <small><strong>Selected:</strong> {customMusicFile.name}</small>
                    <small><strong>Size:</strong> {(customMusicFile.size / 1024 / 1024).toFixed(2)} MB</small>
                  </div>
                  
                  {uploadProgress < 100 ? (
                    <div className="upload-progress">
                      <div className="progress-container" style={{ 
                        background: '#f0f0f0', 
                        borderRadius: '4px',
                        height: '8px',
                        margin: '8px 0'
                      }}>
                        <div 
                          className="progress-bar" 
                          style={{ 
                            width: `${uploadProgress}%`,
                            height: '100%',
                            background: '#007aff',
                            borderRadius: '4px',
                            transition: 'width 0.3s'
                          }}
                        />
                      </div>
                      <div className="progress-details" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-complete" style={{ 
                      background: '#e8f5e9', 
                      padding: '8px',
                      borderRadius: '4px',
                      marginTop: '8px'
                    }}>
                      <span className="success" style={{ color: '#2e7d32' }}>
                        ✓ Upload complete! File will be reviewed (24-48 hours)
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                Supported formats: MP3, WAV, AAC (max 15MB)
                <br />
                ⚡ Using JSON Server mock API - uploads are simulated
              </small>
            </div>
          )}
        </div>

        {/* Option C: No Music */}
        <div className="music-option">
          <label>
            <input
              type="radio"
              name="musicOption"
              value="none"
              checked={musicOption === 'none'}
              onChange={() => handleOptionChange('none')}
              disabled={isMusicRequired}
            />
            No Music
          </label>
          {musicOption === 'none' && (
            <div className="music-option-details">
              <small className={isMusicRequired ? 'error' : 'muted'}>
                {isMusicRequired 
                  ? '❌ Music is required for Conversions objective. Please select music.' 
                  : '✅ No music will be added to this ad. Suitable for silent or voice-over ads.'}
              </small>
              {!isMusicRequired && (
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '6px',
                  marginTop: '8px'
                }}>
                  <small style={{ color: '#666' }}>
                    💡 <strong>When to use no music:</strong>
                    <ul style={{ margin: '4px 0 0 15px' }}>
                      <li>Voice-over or narration ads</li>
                      <li>Educational/tutorial content</li>
                      <li>ASMR or ambient sound ads</li>
                      <li>When focus is on dialogue</li>
                    </ul>
                  </small>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Music Selection Tips */}
      <div className="music-tips" style={{
        marginTop: '20px',
        padding: '12px',
        background: '#f0f9ff',
        borderRadius: '8px',
        borderLeft: '4px solid #007aff'
      }}>
        <strong>🎯 Music Selection Tips:</strong>
        <ul style={{ 
          margin: '8px 0 0 0', 
          paddingLeft: '20px',
          fontSize: '13px',
          color: '#333'
        }}>
          <li>For <strong>Conversions</strong>: Choose upbeat, engaging music</li>
          <li>For <strong>Traffic</strong>: Music is optional but recommended</li>
          <li>Test multiple tracks to see what resonates with your audience</li>
          <li>Ensure music matches your brand tone and target audience</li>
          <li>Check music rights and usage permissions</li>
        </ul>
      </div>
    </div>
  );
};

export default MusicSelection;