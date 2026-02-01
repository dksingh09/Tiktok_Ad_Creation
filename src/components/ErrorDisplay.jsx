// src/components/ErrorDisplay.jsx
import React from 'react';

const ErrorDisplay = ({ error, onClose }) => {
  if (!error) return null;

  const getErrorTitle = (type) => {
    switch (type) {
      case 'oauth':
        return 'Connection Error';
      case 'validation':
        return 'Validation Error';
      case 'api':
        return 'API Error';
      case 'network':
        return 'Network Error';
      default:
        return 'Error';
    }
  };

  const getErrorIcon = (type) => {
    switch (type) {
      case 'oauth':
        return '🔐';
      case 'validation':
        return '📝';
      case 'api':
        return '🔄';
      case 'network':
        return '📡';
      default:
        return '⚠️';
    }
  };

  return (
    <div className={`error-banner ${error.type || 'error'}`}>
      <div className="error-header">
        <span className="error-icon">{getErrorIcon(error.type)}</span>
        <h3>{getErrorTitle(error.type)}</h3>
        {onClose && (
          <button onClick={onClose} className="error-close">
            ×
          </button>
        )}
      </div>
      
      <p className="error-message">{error.message}</p>
      
      {error.details && (
        <details className="error-details">
          <summary>Technical Details</summary>
          <pre>{typeof error.details === 'string' ? error.details : JSON.stringify(error.details, null, 2)}</pre>
        </details>
      )}
      
      {error.suggestions && (
        <div className="error-suggestions">
          <strong>Suggested actions:</strong>
          <ul>
            {error.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
      
      {error.retryable && (
        <div className="error-actions">
          <button onClick={error.onRetry} className="retry-btn">
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;