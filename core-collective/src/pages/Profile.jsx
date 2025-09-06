import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import '../styles/ProfileStyles/Profiles.css';

const Profile = () => {
  const navigate = useNavigate();

  // State for profile data - will be populated from JWT token
  const [profileData, setProfileData] = useState({
    username: "",
    status: "Available",
    course: "Not specified", // Default values since not in database yet
    year: "Not specified",
    profileImage: ""
  });

  // Load user data from JWT token on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setProfileData(prev => ({
          ...prev,
          username: decoded.fullName || "Unknown User",
          // Keep other fields as they were, since course/year not in database yet
        }));
      } catch (err) {
        console.error("Failed to decode token:", err);
        // If token is invalid, redirect to login
        navigate("/login");
      }
    } else {
      // No token found, redirect to login
      navigate("/login");
    }
  }, [navigate]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [imagePreview, setImagePreview] = useState("");

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      console.log("Image uploaded:", file.name);
      alert("Profile picture updated successfully!");
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = () => {
    if (passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword) {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        alert("Please fill in all password fields or leave them all empty.");
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert("New passwords do not match!");
        return;
      }
    }
    console.log("Profile data saved:", profileData);
    console.log("Password data:", passwordData);
    alert("Profile updated successfully!");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  return (
    <div className="profile-container">
      {/* Title */}
      <h1 className="profile-title">Profile Settings</h1>

      {/* Main Content */}
      <div className="profile-main">
        <div className="profile-card">
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-image-container">
              {imagePreview || profileData.profileImage ? (
                <img 
                  src={imagePreview || profileData.profileImage} 
                  alt="Profile" 
                  className="profile-image"
                />
              ) : (
                <div className="profile-image-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              <label className="image-upload-overlay">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5L15 16.2 19 12l2.8 2.8L15 21.8z"/>
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="image-upload-input"
                />
              </label>
            </div>
            <h2 className="profile-username">{profileData.username}</h2>
          </div>

          {/* Profile Form */}
          <div className="profile-form">
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>
              
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={profileData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Do Not Disturb">Do Not Disturb</option>
                  <option value="Away">Away</option>
                  <option value="In class">In class</option>
                  <option value="Studying">Studying</option>
                </select>
              </div>
            </div>

            {/* Academic Information */}
            <div className="form-section">
              <h3 className="section-title">Academic Information</h3>
              
              <div className="form-group">
                <label className="form-label">Course</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileData.course}
                  onChange={(e) => handleInputChange('course', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Year of Study</label>
                <select
                  className="form-select"
                  value={profileData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
            </div>

            {/* Change Password */}
            <div className="form-section">
              <h3 className="section-title">Change Password</h3>
              
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    className="form-input"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    className="form-input"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    className="form-input"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button className="save-button" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="background-decorations">
        <div className="floating-element floating-element-1"></div>
        <div className="floating-element floating-element-2"></div>
        <div className="floating-element floating-element-3"></div>
      </div>
    </div>
  );
};

export default Profile;