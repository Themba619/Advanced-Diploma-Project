import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/OnboardingStyles/forgotPwd.css';
import Logo from '../assets/Logo.png'; // Adjust the path as needed

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
        // Navigate to OTP page with email as state
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
    <div className="login-container">
      {/* Left half - Image Placeholder */}
      <div className="image-placeholder">
        <img src={Logo} alt="Logo" className="logo-image" />
      </div>

      {/* Right half - Forgot Password Form */}
      <div className="login-form-container">
        <div className="login-form">
          <h2>Reset Your Password</h2>
          <p>Please enter your email address to receive an OTP. You'll then be able to set a new password.</p>
          
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            
            {error && <p className="error-message" style={{ color: 'red', fontSize: '14px', margin: '10px 0' }}>{error}</p>}
            {message && <p className="success-message" style={{ color: 'green', fontSize: '14px', margin: '10px 0' }}>{message}</p>}
            
            <button 
              type="submit" 
              className="sign-in-btn"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
          
          <p className="signup-link">
            Remembered your password?{' '}
            <a href="/login" className="signup-link-text">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPwd;
