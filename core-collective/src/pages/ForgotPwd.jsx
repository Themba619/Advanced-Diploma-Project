import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/OnboardingStyles/LoginAndSignup.css';
import loginSignUpFpBackground from '../../../core-collective/public/loginSignUpFpBackground.jpeg';
import LogoMark from '../assets/VA-3.png';

function ForgotPwd() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/email/send-password-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('OTP sent successfully! Redirecting to password reset...');
        setTimeout(() => {
          navigate('/otp', { state: { email } });
        }, 2000);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-login-container">
      <div className="login-background">
        <img src={loginSignUpFpBackground} alt="Background" className="background-image" />
      </div>
      <div className="login-overlay">
        <img src={LogoMark} alt="VirtualAssist Logo" className="hero-logo" />
        <div className="login-card">
          <div className="welcome-section">
            <div className="welcome-header">
              <h1 className="welcome-title">
                <span className="welcome-line-1">Reset Your</span>
                <span className="welcome-line-2">Password</span>
              </h1>
            </div>
          </div>

          <p className='fgt-description' style={{ position: 'relative', top: '-80px', left: '20px' }}>
          Please enter your email address to receive an OTP. You'll then be able to set a new password.
          </p>


          <form className="login-form-new" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message" style={{ color: 'green' }}>{message}</div>}

            <div className="input-group">
              <label htmlFor="email" className="input-label">EMAIL</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>

            <div className="form-links">
              <a href="/login" className="signup-link-new">Remembered your password? Sign In</a>
            </div>
          </form>
        </div>
      </div>

      {/* Optional Social Section for consistency */}
      <div className="social-login-section">
        <p className="social-login-text">Sign in with</p>
        <div className="social-icons">
          <div className="social-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <div className="social-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
            </svg>
          </div>
          <div className="social-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </div>
          {/* <button
            type="button"
            className="waitlist-back-btn"
            onClick={() => navigate(-1)}
            style={{position: 'absolute', top: 24, right: 32, zIndex: 1001}}
          >
            <span className="waitlist-back-border"></span>
            <span className="waitlist-back-text">Back</span>
          </button> */}
        </div>
      </div>
    </div>
  );
}

export default ForgotPwd;
