import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/OnboardingStyles/LoginAndSignup.css';
import whiteTransparentLogo from '../../../core-collective/public/whiteTransparentLogo.png';

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

      localStorage.setItem('token', response.data.token);
      
      
      setTimeout(() => {
        navigate('/home');
      }, 100);
      
    } catch (err) {
      console.error('Login error:', err.response?.data);
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="new-login-container">
      <div className="login-background">
        <img src="/loginSignUpFpBackground.jpeg" alt="Login Background" className="background-image" />
      </div>
      <img src={whiteTransparentLogo} alt="VirtualAssist Logo" className="hero-logo" />
      <div className="login-overlay">          
          
        <div className="login-card">         
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

          <button
            type="button"
            className="waitlist-back-btn"
            onClick={() => navigate(-1)}
            style={{position: 'absolute', top: 24, right: 32, zIndex: 1001}}
          >
            <span className="waitlist-back-border"></span>
            <span className="waitlist-back-text">Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
