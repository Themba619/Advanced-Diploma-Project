import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/OnboardingStyles/OTPPage.css';

export default function OTPPage() {
  const [otp, setOtp] = useState(Array(4).fill(""));
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const handleChange = (value, index) => {
    if (value.length === 1) {   // ✅ accept ANY character
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move focus to next input automatically
      if (index < otp.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = () => {
    alert(`Entered OTP: ${otp.join("")}`);
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <h2>Verify Your Identity</h2>
        <p>Enter the 6-character code sent to your email or phone</p>

        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>

        <button className="verify-btn" onClick={handleSubmit}>
          Verify
        </button>

        <p className="resend">
          Didn’t receive the code? <span>Resend</span>
        </p>

        <button
          className="back-btn"
          onClick={() => navigate("/ForgotPwd")}
        >
          Back to Forgot Password
        </button>
      </div>
    </div>
  );
}
