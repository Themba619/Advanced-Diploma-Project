import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import '../styles/ProfileStyles/Profiles.css';

const Profile = () => {
  const navigate = useNavigate();

  // State for profile data
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    status: "Available",
    course: "Not specified", // Default values since not in database yet
    year: "Not specified",
    profileImage: ""
  });

  // State for loading user data
  const [userLoading, setUserLoading] = useState(true);

  // Load user data from backend on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Verify token and get user data
        const response = await fetch("http://localhost:3001/api/auth/profile", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token is invalid, redirect to login
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();
        setProfileData(prev => ({
          ...prev,
          fullName: userData.fullName || "",
          email: userData.email || "",
        }));

        // Fetch user's complete profile data
        await fetchUserProfileData(token);

      } catch (err) {
        console.error("Failed to fetch user data:", err);
        // If there's an error, try to decode the token as fallback
        try {
          const decoded = jwtDecode(token);
          setProfileData(prev => ({
            ...prev,
            fullName: decoded.fullName || "Unknown User",
            email: decoded.email || "",
          }));
          // Try to fetch profile data even with fallback data
          await fetchUserProfileData(token);
        } catch (decodeErr) {
          console.error("Failed to decode token:", decodeErr);
          navigate("/login");
        }
      } finally {
        setUserLoading(false);
      }
    };

    const fetchUserProfileData = async (token) => {
      try {
        const profileResponse = await fetch("http://localhost:3001/api/profile-image", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.profileData) {
            const data = profileData.profileData;
            setProfileData(prev => ({
              ...prev,
              profileImage: data.imageUrl ? `http://localhost:3001${data.imageUrl}` : "",
              course: data.course || "Not specified",
              year: data.year || "Not specified",
              status: data.status || "Available"
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
        // Don't show error to user, just continue with defaults
      }
    };

    fetchUserData();
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [imagePreview, setImagePreview] = useState("");
  const [activeTab, setActiveTab] = useState("personal"); // New state for tab navigation
  const [imageUploading, setImageUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("Please select an image file");
        return;
      }

      try {
        setImageUploading(true);
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('profileImage', file);

        const token = localStorage.getItem("token");
        if (!token) {
          alert("Please log in again");
          navigate("/login");
          return;
        }

        const response = await fetch("http://localhost:3001/api/profile-image/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to upload image");
        }

        // Update the profile image URL
        setProfileData(prev => ({
          ...prev,
          profileImage: `http://localhost:3001${data.imageUrl}`
        }));

        // Set preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);

        alert("Profile picture updated successfully!");
        
      } catch (error) {
        console.error("Error uploading image:", error);
        alert(error.message || "Failed to upload profile picture");
      } finally {
        setImageUploading(false);
      }
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    const fields = [
      profileData.fullName,
      profileData.email,
      profileData.course,
      profileData.year,
      profileData.status,
      profileData.profileImage
    ];
    const filledFields = fields.filter(field => {
      if (!field) return false;
      if (field === "Not specified") return false;
      if (field === "Available") return true; // Status of "Available" counts as filled
      return true;
    }).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  // Handle preview popup
  const handlePreview = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  // Get status color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case "Available": return "#10b981";
      case "Busy": return "#f59e0b";
      case "Do Not Disturb": return "#ef4444";
      case "Away": return "#6b7280";
      case "In class": return "#8b5cf6";
      case "Studying": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    // Clear error and success messages when user starts typing
    if (error || success) {
      setError("");
      setSuccess("");
    }
    
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

  const handleSave = async () => {
    setError("");
    setSuccess("");
    
    // Check if password fields are filled
    const hasPasswordData = passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword;
    
    if (hasPasswordData) {
      // Validate password fields
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setError("Please fill in all password fields or leave them all empty.");
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("New passwords do not match!");
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError("New password must be at least 8 characters long.");
        return;
      }

      // Password complexity check
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(passwordData.newPassword)) {
        setError("New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).");
        return;
      }

      try {
        setLoading(true);
        
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          navigate("/login");
          return;
        }

        const response = await fetch("http://localhost:3001/api/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to change password");
        }

        setSuccess("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });

      } catch (err) {
        console.error("Password change error:", err);
        setError(err.message || "Failed to change password. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      // Save profile data (course, year, status) to server
      try {
        setLoading(true);
        
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          navigate("/login");
          return;
        }

        const response = await fetch("http://localhost:3001/api/profile-image/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            course: profileData.course,
            year: profileData.year,
            status: profileData.status
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to save profile data");
        }

        setSuccess("Profile updated successfully!");
        console.log("Profile data saved:", data.profileData);

      } catch (err) {
        console.error("Profile save error:", err);
        setError(err.message || "Failed to save profile data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="profile-container">
      {/* Header with logo and title */}
      <div className="profile-header-bar">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">👨‍🎓</div>
            <h1 className="app-title">JJ Student Hub</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-main">
        {/* Left Sidebar */}
        <div className="profile-sidebar">
          <div className="sidebar-card">
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
            </div>
            
            <h2 className="profile-name">{profileData.fullName || "Sarah Johnson"}</h2>
            <p className="profile-course">{profileData.course !== "Not specified" ? profileData.course : "Computer Science"}</p>
            
            {/* Progress Bar */}
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${calculateProfileCompletion()}%` }}
                ></div>
              </div>
              <p className="progress-text">Profile {calculateProfileCompletion()}% completed</p>
            </div>
            
            {/* Upload Button */}
            <label className={`upload-button ${imageUploading ? 'uploading' : ''}`}>
              {imageUploading ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="spinning">
                    <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                  </svg>
                  Upload Profile Picture
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="image-upload-input"
                disabled={imageUploading}
              />
            </label>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="profile-content">
          <h2 className="content-title">Personal Info</h2>
          
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Info
            </button>
            <button 
              className={`tab-button ${activeTab === 'academic' ? 'active' : ''}`}
              onClick={() => setActiveTab('academic')}
            >
              Academic Details
            </button>
          </div>

          {/* Show loading state while fetching user data */}
          {userLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Loading profile...</p>
            </div>
          ) : (
            <div className="profile-form">
              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <div className="tab-content">
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="Sarah Johnson"
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        value={profileData.email}
                        disabled
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                        placeholder="sarah.johnson@example.com"
                      />
                    </div>
                  </div>
                  
                  {/* Change Password Section */}
                  <div className="password-section">
                    <h3 className="section-title">Change Password</h3>
                    
                    {/* Error and Success Messages */}
                    {error && (
                      <div className="alert alert-error" style={{
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '14px'
                      }}>
                        {error}
                      </div>
                    )}
                    
                    {success && (
                      <div className="alert alert-success" style={{
                        backgroundColor: '#dcfce7',
                        border: '1px solid #bbf7d0',
                        color: '#16a34a',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '14px'
                      }}>
                        {success}
                      </div>
                    )}
                    
                    <div className="form-field">
                      <label className="form-label">Current password</label>
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

                    <div className="form-field">
                      <label className="form-label">New password</label>
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

                    <div className="form-field">
                      <label className="form-label">Confirm new password</label>
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
                </div>
              )}

              {/* Academic Details Tab */}
              {activeTab === 'academic' && (
                <div className="tab-content">
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Course</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileData.course}
                        onChange={(e) => handleInputChange('course', e.target.value)}
                        placeholder="Computer Science"
                      />
                    </div>
                    <div className="form-field">
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
                  
                  <div className="form-field">
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
              )}

              {/* Action Buttons */}
              <div className="form-actions">
                <button className="preview-button" onClick={handlePreview}>Preview</button>
                <button 
                  className="save-button" 
                  onClick={handleSave}
                  disabled={loading}
                  style={{
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Preview Modal */}
      {showPreview && (
        <div className="preview-modal-overlay" onClick={closePreview}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="preview-header">
              <h3 className="preview-title">Profile Preview</h3>
              <button className="preview-close" onClick={closePreview}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Profile Card Preview */}
            <div className="preview-card">
              <div className="preview-profile-section">
                <div className="preview-image-container">
                  {imagePreview || profileData.profileImage ? (
                    <img 
                      src={imagePreview || profileData.profileImage} 
                      alt="Profile Preview" 
                      className="preview-profile-image"
                    />
                  ) : (
                    <div className="preview-profile-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="preview-info">
                  <h4 className="preview-name">{profileData.fullName || "Unknown User"}</h4>
                  <p className="preview-email">{profileData.email}</p>
                  
                  <div className="preview-status">
                    <div 
                      className="status-indicator" 
                      style={{ backgroundColor: getStatusColor(profileData.status) }}
                    ></div>
                    <span className="status-text">{profileData.status}</span>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="preview-academic">
                <h5 className="preview-section-title">Academic Information</h5>
                <div className="preview-academic-grid">
                  <div className="preview-field">
                    <span className="preview-label">Course</span>
                    <span className="preview-value">{profileData.course}</span>
                  </div>
                  <div className="preview-field">
                    <span className="preview-label">Year</span>
                    <span className="preview-value">{profileData.year}</span>
                  </div>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="preview-completion">
                <h5 className="preview-section-title">Profile Completion</h5>
                <div className="preview-progress-container">
                  <div className="preview-progress-bar">
                    <div 
                      className="preview-progress-fill" 
                      style={{ width: `${calculateProfileCompletion()}%` }}
                    ></div>
                  </div>
                  <span className="preview-progress-text">{calculateProfileCompletion()}% Complete</span>
                </div>
                
                {/* Completion Tips */}
                {calculateProfileCompletion() < 100 && (
                  <div className="preview-tips">
                    <p className="preview-tip-title">💡 Complete your profile:</p>
                    <ul className="preview-tip-list">
                      {!profileData.profileImage && <li>Add a profile picture</li>}
                      {profileData.course === "Not specified" && <li>Specify your course</li>}
                      {profileData.year === "Not specified" && <li>Select your year of study</li>}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="preview-actions">
                <button className="preview-edit-btn" onClick={closePreview}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Continue Editing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;