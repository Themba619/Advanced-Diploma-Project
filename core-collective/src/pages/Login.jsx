import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/OnboardingStyles/LoginAndSignup.css';
import Logo from '../assets/Logo.png';

const Login = () => {
  const navigate = useNavigate();

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
          <button type="button" className="sign-in-btn"
            onClick={() => navigate('/*')}
          >
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