import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/OnboardingStyles/ForgotPwd.css'; // Use its own CSS file
import loginSignUpFpBackground from '../../../core-collective/public/loginSignUpFpBackground.jpeg';
import whiteTransparentLogo from '../../../core-collective/public/whiteTransparentLogo.png';

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
    <div className="forgotpwd-outer-wrapper">
      <div className="forgotpwd-main-container">        
        <div className="forgotpwd-overlay"> 
          <img src={whiteTransparentLogo} alt="VirtualAssist Logo" className="forgotpwd-hero-logo" />        
          <div className="forgotpwd-card">         
            <div className="forgotpwd-welcome-section">
              <div className="forgotpwd-welcome-header">
                <h1 className="forgotpwd-welcome-title">
                  <span className="forgotpwd-welcome-line-1">Reset Your</span>
                  <span className="forgotpwd-welcome-line-2">Password</span>
                </h1>
              </div>
            </div>
            
            <form className="forgotpwd-form-new" onSubmit={handleSubmit}>
              {error && <div className="forgotpwd-error-message">{error}</div>}
              {message && <div className="forgotpwd-success-message">{message}</div>}
              
              <p className='forgotpwd-description'>
                Please enter your email address to receive an OTP. You'll then be able to set a new password.
              </p>

              <div className="forgotpwd-input-group">
                <label htmlFor="email" className="forgotpwd-input-label">EMAIL</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="forgotpwd-login-input"
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="forgotpwd-login-button" disabled={loading}>
                {loading ? 'Sending…' : 'Send OTP'}
              </button>

              <div className="forgotpwd-form-links">
                <a href="/login" className="forgotpwd-signup-link-new">Remembered your password? Sign In</a>
              </div>
            </form>

            <button
              type="button"
              className="forgotpwd-waitlist-back-btn"
              onClick={() => navigate(-1)}
            >
              <span className="forgotpwd-waitlist-back-border"></span>
              <span className="forgotpwd-waitlist-back-text">Back</span>
            </button>
          </div>
        </div> 
      </div>
    </div>
  );
};
export default ForgotPwd;