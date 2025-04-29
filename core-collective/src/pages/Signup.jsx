import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/OnboardingStyles/LoginAndSignup.css';
import Logo from '../assets/Logo.png';

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container slide-in">
      {/* Left half - Signup Form */}
      <div className="login-form-container">
        <div className="login-form">
          <h2>Sign up for Virtual Assist</h2>
          <div>
            <input
              type="text"
              placeholder="Full Name"
              required
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              required
            />
          </div>
          <button type="button" className="sign-in-btn"
            onClick={() => navigate('/')}
          >
            Sign up
          </button>
          <p className="or-login-with">or sign up with</p>
          <div className="social-login">
            <button className="social-btn">
              <i className="fab fa-google"></i> Google
            </button>
            <button className="social-btn">
              <i className="fab fa-apple"></i> Apple
            </button>
          </div>
          <p className="signup-link">
            Already have an account?{' '}
            <a href="/login" className="signup-link-text">
              Sign in
            </a>
          </p>
        </div>
      </div>
      {/* Right half - Image Placeholder */}
      <div className="image-placeholder">
        <img src={Logo} alt="Logo image" className="logo-image" />
      </div>
    </div>
  );
};

export default Signup;