import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/OnboardingStyles/LoginAndSignup.css';
import Logo from '../assets/Logo.png';

const Signup = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
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

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)');
      setIsLoading(false);
      return;
    }

    try {
      // Use the correct endpoint path - note it's under /api/private/register
      const response = await axios.post('http://localhost:3001/api/private/register', {
        fullName,
        email,
        password
      });
      
      console.log('Registration success:', response.data);
      
      // Store user ID for verification
      setUserId(response.data.user.id);
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
      
      setError(''); // Clear any previous errors
      alert('Verification code has been resent to your email.');
    } catch (err) {
      console.error('Resend verification error:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // If verification is sent, show verification form
  if (verificationSent) {
    return (
      <div className="login-container slide-in">
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
        
        <div className="image-placeholder">
          <img src={Logo} alt="Logo image" className="logo-image" />
        </div>
      </div>
    );
  }

  // Regular signup form
  return (
    <div className="login-container slide-in">
      {/* Left half - Signup Form */}
      <div className="login-form-container">
        <div className="login-form">
          <h2>Sign up for Core Collective</h2>
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          
          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
              Must contain uppercase, lowercase, number, and special character (@$!%*?&#)
            </small>
          </div>
          
          <button 
            type="button" 
            className="sign-in-btn" 
            onClick={handleSignup}
            disabled={isLoading || !fullName || !email || !password}
          >
            {isLoading ? 'Creating Account...' : 'Sign up'}
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