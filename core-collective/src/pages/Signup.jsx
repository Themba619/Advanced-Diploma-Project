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

  const handleSignup = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/register', {
        fullName,
        email,
        password
      });
      console.log('Registration success:', response.data);
      // Navigate to login page or home on success
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err.response?.data);
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="login-container slide-in">
      {/* Left half - Signup Form */}
      <div className="login-form-container">
        <div className="login-form">
          <h2>Sign up for Virtual Assist</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div style={{border: '2px solid red', margin: '10px 0'}}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{width: '100%', padding: '10px', fontSize: '16px'}}
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
          </div>
          <button type="button" className="sign-in-btn" onClick={handleSignup}>
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
