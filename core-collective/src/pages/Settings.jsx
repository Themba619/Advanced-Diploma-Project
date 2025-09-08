import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../styles/SettingsStyles/Settings.css";
import { FaBell, FaPalette, FaShieldAlt, FaUserCog } from "react-icons/fa";

const Settings = () => {
  const navigate = useNavigate();

  // State for user data
  const [userData, setUserData] = useState({
    fullName: "",
    email: ""
  });
  const [userLoading, setUserLoading] = useState(true);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

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

        const user = await response.json();
        setUserData({
          fullName: user.fullName || "",
          email: user.email || ""
        });

      } catch (err) {
        console.error("Failed to fetch user data:", err);
        // If there's an error, try to decode the token as fallback
        try {
          const decoded = jwtDecode(token);
          setUserData({
            fullName: decoded.fullName || "Unknown User",
            email: decoded.email || ""
          });
        } catch (decodeErr) {
          console.error("Failed to decode token:", decodeErr);
          navigate("/login");
        }
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <div className="settings-bg">
      <div className="settings-header">
        <FaUserCog className="settings-header-icon" />
        <div>
          <h2 className="settings-title">Settings</h2>
          <div className="settings-subtitle">Manage your account and preferences</div>
        </div>
      </div>

      <form className="settings-form">
        {/* Profile */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon"><FaUserCog /></span>
            <span className="settings-card-title">Profile</span>
          </div>
          <div className="settings-card-desc">Update your personal information and profile details</div>
          
          {userLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              Loading profile information...
            </div>
          ) : (
            <div className="settings-profile-row">
              <div>
                <label className="settings-label">Full Name</label>
                <input 
                  className="settings-input" 
                  type="text" 
                  value={userData.fullName} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>
              <div>
                <label className="settings-label">Email Address</label>
                <input 
                  className="settings-input" 
                  type="email" 
                  value={userData.email} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Notifications */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon"><FaBell /></span>
            <span className="settings-card-title">Notifications</span>
          </div>
          <div className="settings-card-desc">Control how you receive notifications and updates</div>
          <div className="settings-row">
            <div>
              <div className="settings-label-bold">Email Notifications</div>
              <div className="settings-desc">Receive notifications about updates and activities</div>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={() => setEmailNotifications((v) => !v)}
              />
              <span className="settings-slider"></span>
            </label>
          </div>
        </section>

        {/* Appearance */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon"><FaPalette /></span>
            <span className="settings-card-title">Appearance</span>
          </div>
          <div className="settings-card-desc">Customize the look and feel of your interface</div>
          <div className="settings-row">
            <div>
              <div className="settings-label-bold">Dark Mode</div>
              <div className="settings-desc">Switch between light and dark themes</div>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode((v) => !v)}
              />
              <span className="settings-slider"></span>
            </label>
          </div>
        </section>

        {/* Security */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon"><FaShieldAlt /></span>
            <span className="settings-card-title">Security</span>
          </div>
          <div className="settings-card-desc">Manage your account security and privacy settings</div>
          <div className="settings-row">
            <div>
              <div className="settings-label-bold">Two-Factor Authentication</div>
              <div className="settings-desc">Add an extra layer of security to your account</div>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={() => setTwoFactor((v) => !v)}
              />
              <span className="settings-slider"></span>
            </label>
          </div>
          <hr className="settings-divider" />
          {/* <div className="settings-actions">
            <button type="button" className="settings-btn settings-btn-outline">Change Password</button>
            <button type="button" className="settings-btn settings-btn-outline">Update Password</button>
          </div> */}
        </section>

        {/* Save Changes Button */}
        <div className="settings-save-row">
          <button type="button" className="settings-btn settings-btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  );
}

export default Settings