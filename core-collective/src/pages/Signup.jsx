import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/OnboardingStyles/LoginAndSignup.css';
import loginSignUpFpBackground from '../../../core-collective/public/loginSignUpFpBackground.jpeg';
import LogoTransbarentBlueOrange from '../../.../../../core-collective/public/LogoTransbarentBlueOrange.png';

const Signup = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [userId, setUserId] = useState('');

  const handleSignup = async () => {
    setIsLoading(true);
    setError('');

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)');
      setIsLoading(false);
      return;
    }

    try {      
      const response = await axios.post('http://localhost:3001/api/private/register', {
        fullName,
        email,
        password
      });
      
  console.log('Registration success:', response.data);
      
  setUserId(response.data?.user?.id ?? response.data?.userId);
      setVerificationSent(true);
    } catch (err) {
      console.error('Registration error:', err.response?.data);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3001/api/verify/verify-email', {
        userId,
        code: verificationCode
      });

      console.log('Email verification success:', response.data);
      navigate('/login', { 
        state: { message: 'Email verified successfully! Please login.' } 
      });
    } catch (err) {
      console.error('Verification error:', err.response?.data);
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:3001/api/verify/resend-verification', {
        email,
        userId
      });
      
      setError('');
      alert('Verification code has been resent to your email.');
    } catch (err) {
      console.error('Resend verification error:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="login-container slide-in">
        <img src={LogoTransbarentBlueOrange} alt="VirtualAssist Logo" className="hero-logo" />
             

       
        <div className="login-form-container">
          <div className="login-form">
            <h2>Verify Your Email</h2>
            <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
              We've sent a 6-digit verification code to <strong>{email}</strong>
            </p>
            
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            
            <div>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '18px' }}
                required
              />
            </div>
            
            <button 
              type="button" 
              className="sign-in-btn" 
              onClick={handleVerification}
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
            
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
              Didn't receive the code?{' '}
              <button 
                onClick={resendVerificationCode}
                disabled={isLoading}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#007bff', 
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Resend Code
              </button>
            </p>
            
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
              <button 
                onClick={() => {
                  setVerificationSent(false);
                  setError('');
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#666', 
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Back to Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="new-login-container">     
      <div className="login-background">
        <img src={loginSignUpFpBackground} alt="Background" className="background-image" />
      </div>

      

      {/* Foreground */}
      <div className="login-overlay">
    
        <img src={LogoTransbarentBlueOrange} alt="VirtualAssist Logo" className="hero-logo" />

        <div className="login-card">
          {/* Heading */}
          <div className="welcome-section">
            <div className="welcome-header">
              <h1 className="welcome-title">
                <span className="welcome-line-1">Create your</span>
                <span className="welcome-line-2">VirtualAssist account</span>
              </h1>
            </div>
          </div>

          {/* Signup Form (same look as Login) */}
          <form className="signup-form-new" onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
            {error && <div className="error-message">{error}</div>}

            <div className="input-group">
              <label htmlFor="username" className="input-label">USERNAME</label>
              <input
                id="username"
                type="text"
                placeholder="Choose a unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="fullName" className="input-label">FULL NAME</label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="login-input"
                required
              />
            </div>

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
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  required
                />
              </div>
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '6px' }}>
                Must contain uppercase, lowercase, number, and special character (@$!%*?&#)
              </small>
            </div>

            <button type="submit" className="login-button" disabled={isLoading || !fullName || !email || !password || !username}>
              {isLoading ? 'Creating...' : 'SIGN UP'}
            </button>

            <div className="form-links">
              <a href="/login" className="signup-link-new">Already have an account? Sign in</a>
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

export default Signup;