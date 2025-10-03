import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPageStyles/landing.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleRouteToHome = () => {
    navigate('/login');
  };

  return (
    <div className="downloadapp-bg">
      <div className="downloadapp-title">
        Welcome to Core Collective
      </div>
      <div className="downloadapp-subtitle">
        Your AI-powered assistant for University of Johannesburg
      </div>
      <button className="downloadapp-btn" onClick={handleRouteToHome}>
        Click me to get started
      </button>
    </div>
  );
};

export default LandingPage;