import React from 'react';
import '../styles/OnboardingStyles/forgotPwd.css';
import Logo from '../assets/Logo.png'; // Adjust the path as needed

function ForgotPwd() {
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
          <p>Please enter your email address to receive a password reset link.</p>
          <input
            type="email"
            placeholder="Email"
            required
          />
          <button type="button" className="sign-in-btn">
            Send Reset Link
          </button>
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
