// src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ message, size = 'medium' }) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  return (
    <div className="loading-spinner">
      <div className={`spinner ${sizeClasses[size]}`}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;