import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/OnboardingStyles/LoginAndSignup.css';
import Logo from '../assets/Logo.png';

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

      // Store token locally (optional but common)
      localStorage.setItem('token', response.data.token);

      // Redirect to home/dashboard or wherever you want
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err.response?.data);
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="login-container slide-in">

      

      {/* Left half - Image Placeholder */}
      <div className="image-placeholder">
        <img src={Logo} alt="Logo image" className="logo-image" />
      </div>

      {/* Right half - Login Form */}
      <div className="login-form-container">
        <div className="login-form">
          <h2>Sign in to Virtual Assist</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-options">
            <div>
              <input
                type="checkbox"
                id="rememberMe"
              />
              <label htmlFor="rememberMe">
                Remember me
              </label>
            </div>
            <a href="/forgotPwd">Forgot Password?</a>
          </div>
          <button type="button" className="sign-in-btn" onClick={handleLogin}>
            Sign in
          </button>
          <p className="or-login-with">or login with</p>
          <div className="social-login">
            <button className="social-btn">
              <i className="fab fa-google"></i> Google
            </button>
            <button className="social-btn">
              <i className="fab fa-apple"></i> Apple
            </button>
          </div>
          <p className="signup-link">
            Don't have an account?{' '}
            <a href="/signup" className="signup-link-text">
              Sign Up Now
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
