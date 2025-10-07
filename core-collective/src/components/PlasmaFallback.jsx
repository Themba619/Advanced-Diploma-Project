import React from 'react';
import './PlasmaFallback.css';

const PlasmaFallback = ({ 
  color = '#ff6b35',
  speed = 1,
  opacity = 0.8 
}) => {
  return (
    <div className="plasma-fallback">
      <div className="plasma-wave plasma-wave-1"></div>
      <div className="plasma-wave plasma-wave-2"></div>
      <div className="plasma-wave plasma-wave-3"></div>
      <div className="plasma-wave plasma-wave-4"></div>
      <div className="plasma-wave plasma-wave-5"></div>
      <div className="plasma-wave plasma-wave-6"></div>
    </div>
  );
};

export default PlasmaFallback;