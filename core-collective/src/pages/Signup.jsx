import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/OnboardingStyles/LoginAndSignup.css';
import Logo from '../assets/Logo.png';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

const Signup = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validatePassword = (pass) => {
    if (pass.length === 0) {
      setPasswordError('');
      return false;
    }
    
    if (pass.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    
    if (!/[A-Z]/.test(pass)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    
    if (!/[a-z]/.test(pass)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    }
    
    if (!/[0-9]/.test(pass)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    
    if (!/[@$!%*?&]/.test(pass)) {
      setPasswordError('Password must contain at least one special character (@$!%*?&)');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const handleSignup = async () => {
    if (!validatePassword(password)) {
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:3001/api/auth/register', {
        fullName,
        email,
        password
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-left">
          <h1>Welcome!</h1>
          <p>Join us today and explore Virtual Assist</p>
        </div>

        <div className="login-right">
          <div className="login-right-header">
            <h2>Sign Up</h2>
            <p className="subtitle">Create your account</p>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="form-container">
            <div className="input-wrapper">
              <PersonIcon className="input-icon" />
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="input-wrapper">
              <EmailIcon className="input-icon" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-wrapper">
              <LockIcon className="input-icon" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            {passwordError && <p className="error-message" style={{ fontSize: '0.8rem', marginTop: '-10px', marginBottom: '10px' }}>{passwordError}</p>}

            <button 
              className="sign-in-btn" 
              onClick={handleSignup}
              disabled={!!passwordError || password.length === 0}
            >
              SIGN UP
            </button>

            <p className="or-login-with">or sign up with</p>

            <p className="signup-link">
              Already have an account? <a href="/login">Sign In</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;