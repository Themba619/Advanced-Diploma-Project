import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPageStyles/landing.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleRouteToHome = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    
    if (token) {
      // User is logged in, route to home
      navigate('/home');
    } else {
      // User is not logged in, route to login page
      navigate('/login');
    }
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
        Click me to route to home btn
      </button>
    </div>
  );
};

export default LandingPage;