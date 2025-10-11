import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/OnboardingStyles/LoginAndSignup.css';
import BackgroundImage from '../assets/login background.png';
import LogoMark from '../assets/VA-3.png';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email,
        password
      });

      console.log('Login success:', response.data);

      // Store token locally
      localStorage.setItem('token', response.data.token);
      
      // Small delay to ensure token is saved before navigation
      setTimeout(() => {
        // Redirect to home/dashboard
        navigate('/home');
      }, 100);
      
    } catch (err) {
      console.error('Login error:', err.response?.data);
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="new-login-container">
      {/* Background Image */}
      <div className="login-background">
        <img src={BackgroundImage} alt="Login Background" className="background-image" />
      </div>

      {/* Top Navigation */}
      <div className="top-navigation">
        <div className="nav-logo">
          {/* <img src={LogoMark} alt="VirtualAssist" className="nav-logo-img" /> */}
          {/* <span className="nav-logo-text">VIRTUALASSIST</span> */}
        </div>
        {/* <div className="nav-tabs">
          <span className="nav-tab">Option</span>
          <span className="nav-tab active">Login</span>
        </div> */}
      </div>

      {/* Form Overlay */}
      <div className="login-overlay">
          {/* Hero logo positioned in the white space (top-left) */}
          <img src={LogoMark} alt="VirtualAssist Logo" className="hero-logo" />
        <div className="login-card">
          {/* Welcome Text + Inline Logo */}
            <div className="welcome-section">
              <div className="welcome-header">
                <h1 className="welcome-title">
                  <span className="welcome-line-1">Hello there,</span>
                  <span className="welcome-line-2">welcome to VirtualAssist</span>
                </h1>
              </div>
            </div>

          {/* Login Form */}
          <form className="login-form-new" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="input-group">
              <label htmlFor="email" className="input-label">EMAIL</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="login-input"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">PASSWORD</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type="password"
                  placeholder="Set a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="login-input"
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-button">
              LOGIN
            </button>

            <div className="form-links">
              <a href="/signup" className="signup-link-new">Sign up now</a>
              <a href="/forgotPwd" className="forgot-link">Forgot Password?</a>
            </div>
          </form>
        </div>
      </div>

      {/* Social Login Section */}
      {/* <div className="social-login-section">
        <p className="social-login-text">Sign in with</p>
        <div className="social-icons">
          <div className="social-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <div className="social-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
            </svg>
          </div>
          <div className="social-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Login;
