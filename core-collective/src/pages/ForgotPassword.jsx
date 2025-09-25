import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/OnboardingStyles/forgotPwd.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Please enter valid email address.');
      setIsError(true);
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setMessage('A password reset link has been sent to your email.');
      setIsError(false);
      setIsSubmitting(false);
      setEmail('');
    }, 1000);
  };

  return (
    <div className="container">
      <h2>Forgot Password</h2>
      <p>Enter your email address to receive a password reset link.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="reset-email">Email</label>
          <input
            type="email"
            id="reset-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={isSubmitting}
            aria-label="Email address for password reset"
          />
        </div>
        {message && (
          <div className={`message ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
       <button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <span className="spinner"></span> Sending...
    </>
  ) : (
    'Send Reset Link'
  )}
</button>
      </form>
      <Link to="/" className="link">Back to Sign In</Link>
    </div>
  );
  
}

export default ForgotPassword;