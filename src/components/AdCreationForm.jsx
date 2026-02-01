// src/components/AdCreationForm.jsx - UPDATED FOR JSON SERVER
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MusicSelection from './MusicSelection';
import { validateAdForm } from '../utils/validation';
import api from '../services/api';

const AdCreationForm = ({ accessToken }) => {
  const [formData, setFormData] = useState({
    campaignName: '',
    objective: 'traffic',
    adText: '',
    cta: 'Learn More',
    musicOption: 'none',
    musicId: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdAdId, setCreatedAdId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const successRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleMusicChange = (musicData) => {
    setFormData(prev => ({
      ...prev,
      ...musicData
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    setCreatedAdId(null);

    // Validate form
    const validationErrors = validateAdForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Call JSON Server API
      const result = await api.submitAdCreative(accessToken, formData);
      
      if (result.success) {
        setSubmitSuccess(true);
        if (result.data?.creative?.ad_id) {
          const adId = result.data.creative.ad_id;
          setCreatedAdId(adId);
          // show toast and auto-redirect to details page
          setShowToast(true);
          setTimeout(() => {
            navigate(`/ads/${adId}`);
          }, 700);
        }
        
        // Reset form
        setFormData({
          campaignName: '',
          objective: 'traffic',
          adText: '',
          cta: 'Learn More',
          musicOption: 'none',
          musicId: ''
        });
        setErrors({});
      } else {
        throw new Error(result.message || 'Failed to create ad');
      }
    } catch (err) {
      console.error('Ad creation error:', err);
      
      let userMessage;
      let retryable = true;
      
      if (err.message.includes('invalid_token') || err.message.includes('401') || err.message.includes('unauthorized')) {
        userMessage = 'Your session has expired. Please reconnect your TikTok account.';
      } else if (err.message.includes('permission') || err.message.includes('forbidden')) {
        userMessage = 'You do not have permission to create ads. Please check your TikTok Ads permissions.';
        retryable = false;
      } else if (err.message.includes('music_id') || err.message.includes('invalid_music')) {
        userMessage = 'Invalid music ID. Please select a valid music track.';
      } else if (err.message.includes('geo_restricted')) {
        userMessage = 'This feature is not available in your region.';
        retryable = false;
      } else if (err.message.includes('rate_limit')) {
        userMessage = 'Too many requests. Please try again in a few minutes.';
      } else if (err.message.includes('music_restricted')) {
        userMessage = 'This music cannot be used in ads. Please select different music.';
      } else if (err.message.includes('policy_violation')) {
        userMessage = 'Ad content violates TikTok advertising policies.';
      } else {
        userMessage = 'Failed to create ad. Please try again.';
      }
      
      setSubmitError({
        message: userMessage,
        details: err.message,
        retryable
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSubmitError(null);
    handleSubmit(new Event('submit'));
  };

  // focus success banner when it appears and auto-hide toast after navigation is attempted
  useEffect(() => {
    if (submitSuccess && successRef.current) {
      successRef.current.focus();
    }
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(t);
    }
  }, [submitSuccess, showToast]);

  const handleViewAd = () => {
    if (createdAdId) {
      // Navigate to ad details page
      navigate(`/ads/${createdAdId}`);
    }
  };

  return (
    <div className="ad-creation-form">
      <h2>Create New Ad Creative</h2>
      
      {submitSuccess && (
        <div className="success-banner" ref={successRef} tabIndex={-1} aria-live="polite">
          <h3>✓ Ad Created Successfully!</h3>
          <p>Your ad creative has been submitted and is pending review.</p>
          <p>Estimated review time: 24-48 hours</p>
          
          {createdAdId && (
            <div className="ad-created-info">
              <p><strong>Ad ID:</strong> {createdAdId}</p>
              <button 
                onClick={handleViewAd}
                className="view-ad-btn"
              >
                View Ad Details
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="toast-success" role="status" aria-live="assertive">
          <div className="toast-content">
            <span className="spinner-small"></span>
            <div>
              <div><strong>Ad created</strong></div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>Redirecting to ad details...</div>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <div className="error-banner">
          <h3>⚠️ {submitError.message}</h3>
          {submitError.details && (
            <details>
              <summary>Technical Details</summary>
              <code>{submitError.details}</code>
            </details>
          )}
          <div className="error-actions">
            <button onClick={() => setSubmitError(null)}>Dismiss</button>
            {submitError.retryable && (
              <button onClick={handleRetry} className="retry-btn">
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="campaignName">
            Campaign Name *
            {errors.campaignName && (
              <span className="error-text"> - {errors.campaignName}</span>
            )}
          </label>
          <input
            type="text"
            id="campaignName"
            name="campaignName"
            value={formData.campaignName}
            onChange={handleChange}
            placeholder="Enter campaign name (e.g., Summer Sale 2024)"
            className={errors.campaignName ? 'error' : ''}
          />
          <small>Create a unique name for your campaign</small>
        </div>

        <div className="form-group">
          <label htmlFor="objective">Objective *</label>
          <select
            id="objective"
            name="objective"
            value={formData.objective}
            onChange={handleChange}
          >
            <option value="traffic">Traffic (Drive visitors to your website)</option>
            <option value="conversions">Conversions (Get purchases, sign-ups, etc.)</option>
          </select>
          <small>
            {formData.objective === 'conversions' 
              ? '🎵 Music is required for Conversions objective' 
              : '🎵 Music is optional for Traffic objective'}
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="adText">
            Ad Text *
            {errors.adText && (
              <span className="error-text"> - {errors.adText}</span>
            )}
          </label>
          <textarea
            id="adText"
            name="adText"
            value={formData.adText}
            onChange={handleChange}
            placeholder="Enter your ad text (max 100 characters)
Example: Get 50% off on all summer collections! Limited time offer. Shop now and save big."
            maxLength="100"
            rows="3"
            className={errors.adText ? 'error' : ''}
          />
          <div className="char-counter">
            {formData.adText.length}/100 characters
            {formData.adText.length > 80 && (
              <span style={{ color: '#ff9500', marginLeft: '10px' }}>
                ⚠️ Getting long
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="cta">Call to Action *</label>
          <select
            id="cta"
            name="cta"
            value={formData.cta}
            onChange={handleChange}
          >
            <option value="Learn More">Learn More</option>
            <option value="Shop Now">Shop Now</option>
            <option value="Sign Up">Sign Up</option>
            <option value="Download">Download</option>
            <option value="Watch More">Watch More</option>
            <option value="Contact Us">Contact Us</option>
            <option value="Book Now">Book Now</option>
          </select>
          <small>What action do you want users to take?</small>
        </div>

        <MusicSelection
          objective={formData.objective}
          onMusicChange={handleMusicChange}
          initialOption={formData.musicOption}
          error={errors.music}
          accessToken={accessToken}
        />

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-btn"
          >
            {isSubmitting ? (
              <>
                <span className="spinner-small"></span>
                Creating Ad...
              </>
            ) : (
              'Create Ad Creative'
            )}
          </button>
          <p className="form-note">
            <small>
              ⚡ Using JSON Server mock API. Ad will be saved to db.json
            </small>
          </p>
        </div>
      </form>
    </div>
  );
};

export default AdCreationForm;