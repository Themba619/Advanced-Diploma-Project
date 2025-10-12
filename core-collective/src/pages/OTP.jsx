import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/OnboardingStyles/LoginAndSignup.css';
import loginSignUpFpBackground from '../../../core-collective/public/loginSignUpFpBackground.jpeg';
import LogoMark from '../assets/VA-3.png';

function OTP() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  // No password eye toggle to keep UI consistent with Login/Signup
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email from navigation state
  const email = location.state?.email;

  // Redirect if no email provided
  useEffect(() => {
    if (!email) navigate('/forgotPwd');
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
    <div className="new-login-container otp-page">
      {/* Background Image */}
      <div className="login-background">
        <img src={loginSignUpFpBackground} alt="Background" className="background-image" />
      </div>

      {/* Foreground Overlay */}
      <div className="login-overlay">
        {/* Hero logo in the white space */}
        <img src={LogoMark} alt="VirtualAssist Logo" className="hero-logo" />

        <div className="login-card">
          <div className="welcome-section">
            <div className="welcome-header">
              <h1 className="welcome-title">
                <span className="welcome-line-1">Verify OTP &</span>
                <span className="welcome-line-2">Set New Password</span>
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', bottom: '80px' }}>
  <p style={{ color: '#666', marginLeft: 20 }}>
    We've sent a 6-digit verification code to:
  </p>
  <p style={{ fontWeight: 'bold', color: '#666', position: 'relative', right: 110 }}>
    {email}
  </p>
</div>

          <form style={{ position: 'relative', bottom: '50px' }}  className="login-form-new" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="otp" className="input-label">ENTER 6-DIGIT OTP</label>
              <input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                className="login-input"
                required
                disabled={loading}
                style={{ textAlign: 'center', letterSpacing: '2px', fontWeight: '600' }}
              />
            </div>

            <div className="input-group">
              <label htmlFor="newPassword" className="input-label">NEW PASSWORD</label>
              <input
                id="newPassword"
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="login-input"
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword" className="input-label">CONFIRM NEW PASSWORD</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="login-input"
                required
                disabled={loading}
              />
            </div>

            <div style={{ fontSize: '12px', color: '#666', textAlign: 'left', marginTop: '6px', marginBottom: '12px' }}>
              Password must be at least 8 characters long and include uppercase, lowercase, number, and special character (@$!%*?&#).
            </div>

            {timeLeft > 0 && (
              <p style={{ color: '#666', fontSize: '14px', margin: '10px 0' }}>
                Time remaining: {formatTime(timeLeft)}
              </p>
            )}

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message" style={{ color: 'green' }}>{message}</div>}

            <button type="submit" className="login-button" disabled={loading || timeLeft === 0}>
              {loading ? 'Changing Password…' : 'Change Password'}
            </button>

            <div className="form-links">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: '#0d1b55', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer', position: 'relative', bottom: '10px' }}  
              >
                {timeLeft === 0 ? 'Resend OTP' : "Didn't receive OTP? Resend"}
              </button>
              <a style={{ backgroundColor:'#e97c46', borderRadius: '20px', position: 'relative', bottom: '680px', right: '800px', padding: '12px 12px', color: '#FFFFFF', textDecoration: 'none' }} href="/login" className="backToLogin">Back to Login</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default OTP;