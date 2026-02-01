// src/components/AdDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const AdDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchAd = async () => {
      setLoading(true);
      setError(null);
      const maxAttempts = 6;
      const delayMs = 500;

      for (let attempt = 0; attempt < maxAttempts && mounted; attempt++) {
        try {
          const res = await fetch(`/api/ads/${id}`);
          if (!res.ok) {
            // keep trying for 404s (delay and retry)
            if (attempt < maxAttempts - 1) {
              setError('Waiting for ad to be available...');
              await new Promise(r => setTimeout(r, delayMs));
              continue;
            }
            throw new Error(`Failed to fetch ad: ${res.status}`);
          }

          const body = await res.json();
          if (mounted) {
            if (body.success && body.data && body.data.ad) {
              setAd(body.data.ad);
              setError(null);
              break;
            } else if (body && body.ad) {
              setAd(body.ad);
              setError(null);
              break;
            } else {
              if (attempt < maxAttempts - 1) {
                setError('Waiting for ad to be available...');
                await new Promise(r => setTimeout(r, delayMs));
                continue;
              }
              throw new Error('Ad not found');
            }
          }
        } catch (err) {
          if (mounted) {
            if (attempt < maxAttempts - 1) {
              setError('Network error, retrying...');
              await new Promise(r => setTimeout(r, delayMs));
              continue;
            }
            setError(err.message || 'Failed to load ad');
          }
        }
      }

      if (mounted) setLoading(false);
    };

    fetchAd();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading ad details..." />;
  if (error) return (
    <div className="ad-details error-banner">
      <h3>⚠️ {error}</h3>
      <button onClick={() => navigate(-1)} className="retry-btn">Go Back</button>
    </div>
  );

  if (!ad) return null;

  return (
    <div className="ad-details">
      <div className="success-banner">
        <h3>✓ Ad Created Successfully!</h3>
        <p>Your ad creative has been submitted and is pending review.</p>
        <p><strong>Estimated review time:</strong> {ad.estimated_review_time || '24-48 hours'}</p>
        <div className="ad-created-info">
          <p><strong>Ad ID:</strong> {ad.ad_id}</p>
          <p><strong>Creative ID:</strong> {ad.creative_id}</p>
          <p><strong>Campaign:</strong> {ad.campaign_name}</p>
          <p><strong>Objective:</strong> {ad.objective}</p>
          <p><strong>Ad Text:</strong> {ad.ad_text}</p>
          <p><strong>CTA:</strong> {ad.cta}</p>
          {ad.music_option && <p><strong>Music Option:</strong> {ad.music_option} {ad.music_id ? `(${ad.music_id})` : ''}</p>}
        </div>

        <div className="ad-actions" style={{ marginTop: '16px' }}>
          <button onClick={() => navigate('/')} className="submit-btn">Create Another Ad</button>
          <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="view-ad-btn">Copy Link</button>
        </div>
      </div>

      <details style={{ marginTop: '12px' }}>
        <summary>Raw ad data</summary>
        <pre style={{ maxHeight: '200px', overflow: 'auto' }}>{JSON.stringify(ad, null, 2)}</pre>
      </details>
    </div>
  );
};

export default AdDetails;
