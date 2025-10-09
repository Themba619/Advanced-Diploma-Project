import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/OnboardingStyles/forgotPwd.css'; // Reusing the same styles
import Logo from '../assets/Logo.png';

function OTP() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [showPasswords, setShowPasswords] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email from navigation state
  const email = location.state?.email;

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Format time display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Password complexity check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/email/reset-password-with-new-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password changed successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to verify OTP and change password');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
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
        setMessage('New OTP sent successfully!');
        setTimeLeft(300); // Reset timer
        setOtp(''); // Clear previous OTP
        setNewPassword(''); // Clear password fields
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  if (!email) {
    return null; // Component will redirect
  }

  return (
    <div className="login-container">
      {/* Left half - Image Placeholder */}
      <div className="image-placeholder">
        <img src={Logo} alt="Logo" className="logo-image" />
      </div>

      {/* Right half - OTP Verification Form */}
      <div className="login-form-container">
        <div className="login-form">
          <h2>Verify OTP & Set New Password</h2>
          <p>We've sent a 6-digit verification code to:</p>
          <p style={{ fontWeight: 'bold', color: '#666', marginBottom: '20px' }}>{email}</p>
          
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={handleOtpChange}
              maxLength="6"
              style={{ 
                textAlign: 'center', 
                fontSize: '18px', 
                letterSpacing: '3px',
                fontWeight: 'bold',
                marginBottom: '15px'
              }}
              required
              disabled={loading}
            />
            
            <div style={{ position: 'relative', marginBottom: '15px' }}>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
                disabled={loading}
              >
                {showPasswords ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            <div style={{ position: 'relative', marginBottom: '15px' }}>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                style={{ paddingRight: '40px' }}
              />
            </div>
            
            <div style={{ fontSize: '12px', color: '#666', textAlign: 'left', marginBottom: '15px' }}>
              Password must be at least 8 characters long and include:
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>One uppercase letter (A-Z)</li>
                <li>One lowercase letter (a-z)</li>
                <li>One number (0-9)</li>
                <li>One special character (@$!%*?&#)</li>
              </ul>
            </div>
            
            {timeLeft > 0 && (
              <p style={{ color: '#666', fontSize: '14px', margin: '10px 0' }}>
                Time remaining: {formatTime(timeLeft)}
              </p>
            )}
            
            {error && <p className="error-message" style={{ color: 'red', fontSize: '14px', margin: '10px 0' }}>{error}</p>}
            {message && <p className="success-message" style={{ color: 'green', fontSize: '14px', margin: '10px 0' }}>{message}</p>}
            
            <button 
              type="submit" 
              className="sign-in-btn"
              disabled={loading || timeLeft === 0}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
          
          <div style={{ marginTop: '20px' }}>
            {timeLeft === 0 ? (
              <button 
                onClick={handleResendOTP}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#646cff',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Resend OTP
              </button>
            ) : (
              <button 
                onClick={handleResendOTP}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#646cff',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Didn't receive OTP? Resend
              </button>
            )}
          </div>
          
          <p className="signup-link">
            Remember your password?{' '}
            <a href="/login" className="signup-link-text">
              Back to Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OTP;